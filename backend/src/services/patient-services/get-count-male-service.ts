import type { FastifyInstance } from "fastify";

export async function getMalePatientCountService(
    fastify: FastifyInstance
){
    try{
        const count = await fastify.prisma.patient.count({
            where: {
                gender: 'male'
            }
        })
        return count;
    }catch(err: unknown){
        throw err;
    }
}