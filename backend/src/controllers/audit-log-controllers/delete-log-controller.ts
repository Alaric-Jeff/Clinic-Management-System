import type { FastifyRequest, FastifyReply } from "fastify";
import { deleteAuditLogService } from "../../services/audit-logs/audit-logs-extension/delete-audit-log.js";
import type { AuditLogIdType } from "../../type-schemas/audit-log-schema.js";

export async function deleteAuditLogController(
    request: FastifyRequest<{Params: AuditLogIdType}>,
    reply: FastifyReply
){
    const { id } = request.params;

    try {
        await deleteAuditLogService(request.server, {id});

        reply.code(200).send({
            success: true,
            message: "Successfully deleted audit log"
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            const errorMessage = err.message;
            
            switch (errorMessage) {
                case "No audit log found":
                    throw request.server.httpErrors.notFound("Audit log not found");
                
                case "Failed to delete audit log":
                    throw request.server.httpErrors.internalServerError("Failed to delete audit log");
                
                default:
                    request.server.log.error(`Unexpected error in deleteAuditLogController: ${errorMessage}`);
                    throw request.server.httpErrors.internalServerError("An unexpected error occurred");
            }
        } else {
            request.server.log.error(`Unknown error type in deleteAuditLogController: ${err}`);
            throw request.server.httpErrors.internalServerError("An unknown error occurred");
        }
    }
}