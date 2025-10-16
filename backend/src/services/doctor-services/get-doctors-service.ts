import type { FastifyInstance } from "fastify";

export async function getDoctorService(
    fastify: FastifyInstance
){
    try{
        const doctors = await fastify.prisma.doctors.findMany();
        return doctors;
    }catch(err: unknown){
        throw err;
    }
}