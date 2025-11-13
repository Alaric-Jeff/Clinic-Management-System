import type { FastifyInstance } from "fastify";

export async function logoutAccountService(
    fastify: FastifyInstance,
    body: {id: string} //user's id
){

    const {
        id
    } = body;

    try{
        const account = await fastify.prisma.sessions.findUnique({
            where: {
                userId: id
            }
        })

        if(!account) {
            throw new Error("No account found with id")
        }

        await fastify.prisma.sessions.delete({
            where: {
                userId: id
            }
        })

        return {
            success: true
        }

    }catch(err: unknown){
        throw err;
    }
}