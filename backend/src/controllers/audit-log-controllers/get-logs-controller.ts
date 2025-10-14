import { getAuditLogs } from "../../audit-logs/get-audit-logs.js";
import type { FastifyRequest, FastifyReply } from "fastify";

export async function getLogsController(
    request: FastifyRequest,
    reply: FastifyReply
){
    try{
        const auditLogs = await getAuditLogs(request.server);

        return reply.code(200).send({
            success: true,
            message: "Succesfully got the logs",
            data: auditLogs
        })
    }catch(err: unknown){
        if(err instanceof Error){
            request.server.log.error({
                error: err,
                message: err.message
            }, 'Error occured in getting logs')
        }else{
            request.server.log.error({
                error: err
            }, "Unknown error occured in getting the logs")
        }
        throw request.server.httpErrors.internalServerError();
    }
}