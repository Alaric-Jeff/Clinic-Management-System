import type { FastifyRequest, FastifyReply } from "fastify";
import { getAccountsService } from "../../services/account-services/get-accounts-service.js";
export async function getAccountsController(
    request: FastifyRequest,
    reply: FastifyReply
){
    try{
        const result = await getAccountsService(request.server);
        return reply.code(200).send({
            success: true,
            message: "Successfuly fetched accounts",
            data: result
        })
    }catch(err: unknown){
        throw request.server.httpErrors.internalServerError();
    }
};
