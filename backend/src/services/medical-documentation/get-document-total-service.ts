import type { FastifyInstance } from "fastify";

export async function getDocumentTotalCount(
    fastify: FastifyInstance
){
    try{
        const count = await fastify.prisma.medicalDocumentation.count()
        return count;
    }catch(err: unknown){
        throw err;
    }
}