import type { FastifyInstance } from "fastify";

export async function deleteAccountService(
    fastify: FastifyInstance,
    body: {id: string}
){
    const {
        id
    } = body;

    try{
        const account = await fastify.prisma.account.findUnique({
            where: {
                id
            }
        })

        if(!account){
            throw new Error("No account found");
        }

        await fastify.prisma.account.delete({
            where: {
                id
            }
        })

        return true;

    }catch(err: unknown){
        throw err;
    }
}