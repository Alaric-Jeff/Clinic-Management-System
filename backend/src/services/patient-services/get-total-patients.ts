import type { FastifyInstance } from "fastify";
import type { getTotalPatientsParamsType } from "../../type-schemas/patients/get-total-paginated-schema.js"

export async function getTotalPatients(
  fastify: FastifyInstance,
  body: getTotalPatientsParamsType
) {
  const { limit, cursor, direction = "next" } = body;

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

    // If going "prev", reverse results to maintain correct chronological order
    if (direction === "prev") {
      patients = patients.reverse();
    }

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
      message: "Patients retrieved successfully",
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
      { error: err, operation: "getTotalPatients" },
      "Failed to retrieve paginated patients"
    );
    throw err;
  }
}
