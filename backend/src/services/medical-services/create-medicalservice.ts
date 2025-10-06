import type { FastifyInstance } from "fastify";
import type { createMedicalServiceType } from "../../type-schemas/services-schemas.js";

/**
 * 
 * @param fastify 
 * @param body {name, category, price}
 */

export async function createMedicalServices(fastify: FastifyInstance, body: createMedicalServiceType){

    const {
        name,
        category,
        price
    } = body;

    try{
        const medicalService = await fastify.prisma.service.findUnique({
            where: {
                name
            }
        })
        

        if(medicalService){
            throw new Error("Service already exists");
        }

        return await fastify.prisma.service.create({
            data: {
                name,
                category,
                price
            }, select: {
                id: true,
                name: true,
                price: true,
                createdAt: true
            }
        })


    }catch(err: unknown){
        if(err instanceof Error){

        }else{

        }
        throw err;
    }

}
