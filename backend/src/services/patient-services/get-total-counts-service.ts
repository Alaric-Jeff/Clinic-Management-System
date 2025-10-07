import type { FastifyInstance } from "fastify";

export async function getPatientTotalCountService(fastify: FastifyInstance): Promise<number> {
    try {
        const totalCount = await fastify.prisma.patient.count();
        
        fastify.log.debug(
            { totalCount },
            "Successfully retrieved total patient count"
        );
        return totalCount;

    } catch (err: unknown) {
        if (err instanceof Error) {
            fastify.log.error(
                { err: err.message, operation: 'getPatientTotalCountService' },
                "Failed to retrieve total patient count from database"
            );
        } else {
            fastify.log.error(
                { err, operation: 'getPatientTotalCountService' },
                "Failed to retrieve total patient count with unknown error type"
            );
        }
        throw err;
    }
}