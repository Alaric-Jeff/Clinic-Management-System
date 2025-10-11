import type { FastifyInstance } from "fastify";
import type { createDoctorType } from "../../type-schemas/doctor-schemas.js";

export async function createDoctorService(
    fastify: FastifyInstance,
    body: createDoctorType
){
    const{
        firstName,
        lastName,
        middleInitial
    } = body;

    try{
        const createdDoctor = await fastify.prisma.doctors.create({
            data: {
                firstName,
                lastName,
                middleInitial
            }, select:{ 
                firstName: true,
                lastName: true,
                middleInitial: true
            }
        })

        fastify.log.info("Successfully created doctor in service");
        return createdDoctor;
    }catch(err: unknown){
        fastify.log.warn("Failed to create doctor");
        throw err;
    }
}