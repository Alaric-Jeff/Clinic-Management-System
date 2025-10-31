import type { FastifyInstance } from "fastify";
import { startOfMonth, endOfMonth } from "date-fns";
import type { getTotalPatientsParamsType } from "../../type-schemas/patients/get-total-paginated-schema.js";

export async function getThisMonthPatients(
  fastify: FastifyInstance,
  body: getTotalPatientsParamsType
) {
  const { limit, cursor, direction = "next" } = body;

  // Local timezone adjustment (for Manila +08:00)
  const now = new Date();
  const localNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 8 * 60 * 60 * 1000);

  const start = startOfMonth(localNow);
  const end = endOfMonth(localNow);

  // Convert local Manila time back to UTC for DB query
  const startUTC = new Date(start.getTime() - 8 * 60 * 60 * 1000);
  const endUTC = new Date(end.getTime() - 8 * 60 * 60 * 1000);

  try {
    let cursorObj: any = undefined;

    if (cursor) {
      const [createdAtStr, id] = cursor.split("|");
      if (!createdAtStr || !id) throw new Error("Invalid cursor format");

      cursorObj = {
        createdAt: new Date(createdAtStr),
        id,
      };
    }

    const findManyArgs: any = {
      where: {
        createdAt: {
          gte: startUTC,
          lte: endUTC,
        },
        isArchived: false
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        createdAt: true,
      },
      take: direction === "next" ? limit + 1 : -(limit + 1),
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
    };

    if (cursorObj) {
      findManyArgs.cursor = cursorObj;
      findManyArgs.skip = 1;
    }

    let patients = await fastify.prisma.patient.findMany(findManyArgs);

    if (direction === "prev") patients = patients.reverse();

    const hasNextPage = direction === "next" ? patients.length > limit : !!cursor;
    const hasPreviousPage = direction === "prev" ? patients.length > limit : !!cursor;

    if (patients.length > limit) {
      if (direction === "next") patients.pop();
      else patients.shift();
    }

    const firstPatient = patients[0];
    const lastPatient = patients[patients.length - 1];

    const startCursor = firstPatient
      ? `${firstPatient.createdAt.toISOString()}|${firstPatient.id}`
      : null;

    const endCursor = lastPatient
      ? `${lastPatient.createdAt.toISOString()}|${lastPatient.id}`
      : null;

    return {
      success: true,
      message: "This month's patients retrieved successfully",
      data: patients.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
      meta: {
        hasNextPage,
        hasPreviousPage,
        startCursor,
        endCursor,
        limit,
      },
    };
  } catch (err: unknown) {
    fastify.log.error(
      { error: err, operation: "getThisMonthPatients" },
      "Failed to retrieve this month's patients"
    );
    throw err;
  }
}
