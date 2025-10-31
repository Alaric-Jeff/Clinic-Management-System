import type { FastifyInstance } from "fastify";


export async function getAuditLogs(
    fastify: FastifyInstance
){
    try{
        const audits = await fastify.prisma.documentAuditLog.findMany();
        return audits;
        
    }catch(err: unknown){
        throw err;
    }
}