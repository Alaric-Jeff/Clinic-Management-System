import type { FastifyInstance } from "fastify";
import type { createMedicalServiceFull } from "../../type-schemas/services-schemas.js";


/**
 * Service: to create medical services
 * 
 * @param fastify 
 * @param body - contains name, category, and price
 * @returns - the created product
 */

export async function createMedicalServices(fastify: FastifyInstance, body: createMedicalServiceFull){

    const {
        name,
        category,
        price,
        createdByName,
        createdByRole
    } = body;


    try{
        // we will check if there's an existing medical service with the same name
        const medicalService = await fastify.prisma.service.findUnique({
            where: {
                name
            }
        })   
        // name is a unique field, therefore we can return with an error 401
        if(medicalService){
            throw new Error("Service already exists");
        }

        // we can now return the created product with necessary fields.
        return await fastify.prisma.service.create({
            data: {
                name,
                category,
                price,
                createdByName,
                createdByRole
            }, select: {
                id: true,
                name: true,
                price: true,
                createdAt: true
            }
        })


    }catch(err: unknown){
        throw err;
    }
}
