import type { FastifyInstance } from "fastify";

export async function getFemalePatientCountService(
    fastify: FastifyInstance
){
   try{
        const count = await fastify.prisma.patient.count({
            where: {
                gender: 'female'
            }
        })
        return count;
    }catch(err: unknown){
        throw err;
    }
}