import type { FastifyInstance } from "fastify";

export async function getAccountsService(
    fastify: FastifyInstance
){
    try{
        const result = await fastify.prisma.account.findMany({
            where: {
                role: 'encoder'
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                middleName: true,
                role: true,
                email: true,
                status: true,
                createdAt: true
            }
        });
        return result;
    }catch(err: unknown){
        throw err;
    }
};