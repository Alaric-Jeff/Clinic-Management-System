import type { FastifyInstance } from "fastify";

import type {
    AuditLogIdType
} from '../../../type-schemas/audit-log-schema.js'

export async function deleteAuditLogService(
    fastify: FastifyInstance,
    body: AuditLogIdType
){

    const {
        id
    } = body;

    try{
        const auditLog = await fastify.prisma.documentAuditLog.findUnique({
            where: {
                id
            }, select: {
                id: true
            }
        })

        if(!auditLog){
            throw new Error("No audit log found");
        }

        const result = await fastify.prisma.documentAuditLog.delete({
            where: {
                id
            }, select: {
                id: true
            }
        })

        if(!result){
            throw new Error("Failed to delete audit log");
        }

        return;

    }catch(err: unknown){
        fastify.log.error("Deleting the audit log failed");
        throw err;
    }
}