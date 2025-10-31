import type { FastifyInstance } from "fastify";
import { startOfWeek, endOfWeek, addHours } from "date-fns";
import type { getTotalPatientsParamsType } from "../../type-schemas/patients/get-total-paginated-schema.js";

export async function getThisWeekPatient(
  fastify: FastifyInstance,
  body: getTotalPatientsParamsType
) {
  const { cursor, limit, direction = "next" } = body;

  // ✅ Force consistent timezone (Asia/Manila = UTC+8)
  const now = new Date();
  const start = addHours(startOfWeek(now, { weekStartsOn: 1 }), -8); // convert Manila start → UTC
  const end = addHours(endOfWeek(now, { weekStartsOn: 1 }), -8);     // convert Manila end → UTC

  fastify.log.info(`startOfWeek (UTC): ${start}`);
  fastify.log.info(`endOfWeek (UTC): ${end}`);

  try {
    let cursorObj: any = undefined;

    if (cursor) {
      const [createdAtStr, id] = cursor.split("|");
      if (!createdAtStr || !id) {
        throw new Error("Invalid cursor format");
      }

      cursorObj = {
        createdAt: new Date(createdAtStr),
        id,
      };
    }

    const findManyArgs: any = {
      where: {
        createdAt: {
          gte: start,
          lte: end,
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
      message: "This week's patients retrieved successfully",
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
      { error: err, operation: "getThisWeekPatient" },
      "Failed to retrieve this week's patients"
    );
    throw err;
  }
}
