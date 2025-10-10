import type {FastifyInstance} from 'fastify'
import { ServiceCategory } from '@prisma/client'
export async function getMedicalServiceOnCategory(
    fastify: FastifyInstance,
    body: {category: ServiceCategory} 
){

    const {
        category
    } = body;

    try{
        const result = await fastify.prisma.service.findMany({
            where: {
                category
            }, select: {
                id: true,
                name: true,
                category: true,
                price: true,
                createdAt: true
            }
        });

        return result;
    }catch(err: unknown){
        throw err;
    }
}