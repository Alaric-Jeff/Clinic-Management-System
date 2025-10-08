import type {FastifyInstance} from 'fastify'

export async function getAllMedicalServices(fastify: FastifyInstance){

    try{

        const medicalServices = await fastify.prisma.service.findMany({
            select: {
                id: true,
                name: true,
                category: true,
                price: true,
                createdByName: true,
                createdAt: true
            }
        })

        return medicalServices;
    }catch(err: unknown){
        throw err;
    }
}