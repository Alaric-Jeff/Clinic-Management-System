import type { FastifyInstance } from "fastify";

export async function searchPatientService(
  fastify: FastifyInstance,
  body: { searchBody: string }
) {
  let { searchBody } = body;

  try {
    searchBody = searchBody.trim().replace(/\s+/g, " ");

    const terms = searchBody.split(" ");

    const searchResult = await fastify.prisma.patient.findMany({
      where: {
        AND: terms.map((term) => ({
          OR: [
            { firstName: { contains: term, mode: "insensitive" } },
            { lastName: { contains: term, mode: "insensitive" } },
            { middleName: { contains: term, mode: "insensitive" } },
          ],
        })),
        isArchived: false
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
      },
    });

    if (!searchResult || searchResult.length === 0) {
      fastify.log.info("No patient was found");
      throw new Error("Not found");
    }

    fastify.log.info(`Search returned ${searchResult.length} result(s).`);
    return searchResult;
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(
        `An error occurred while searching patients: ${err.message}`
      );
    } else {
      fastify.log.error(
        `An unknown error occurred while searching patients: ${String(err)}`
      );
    }
    throw err;
  }
}
