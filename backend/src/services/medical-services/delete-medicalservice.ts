import type {FastifyInstance} from 'fastify'


export async function deleteMedicalService(
    fastify: FastifyInstance,
    body: { id: string }
){
    try{

        const {
            id
        } = body;
        // look up if service even exists
        const service = await fastify.prisma.service.findUnique({
            where: {
                id
            }
        })

        if(!service){
            fastify.log.error("Service with id doesn't exist");
            throw new Error("Service doesn't exist");
        }

        fastify.log.debug("Attempting to delete the service")
        await fastify.prisma.service.delete({
            where: {
                id
            }
        })

        return true;
    }catch(err: unknown){
        throw err;
    }
}