import type { FastifyInstance } from "fastify";
import type { searchServiceType } from "../../../type-schemas/search-engine-schemas/search-service-schema.js";

export async function searchMedicalService(
  fastify: FastifyInstance,
  body: searchServiceType
) {
  const { searchServiceBody } = body;

  try {
    const result = await fastify.prisma.service.findMany({
      where: {
        name: {
          contains: searchServiceBody,
          mode: "insensitive",
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
      },
      orderBy: { name: "asc" },
      take: 10,
    });

    return result;
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(
        `Error occurred while searching for medical services: ${err.message}`
      );
    }
    throw err;
  }
}
