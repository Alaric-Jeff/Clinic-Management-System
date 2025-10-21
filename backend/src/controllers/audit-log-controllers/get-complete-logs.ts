import type {
    FastifyRequest,
    FastifyReply
} from 'fastify'

import { getAllAuditLogs } from '../../services/audit-logs/get-all-audit-service.js'

export async function getCompleteLogController(
    request: FastifyRequest,
    reply: FastifyReply
){
    try{
        const result = await getAllAuditLogs(request.server);

        reply.code(200).send(result);
    }catch(err: unknown){
        throw request.server.httpErrors.internalServerError("An error occured while fetching logs");
    }
}

