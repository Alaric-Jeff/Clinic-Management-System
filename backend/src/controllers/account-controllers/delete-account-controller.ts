import type {
    FastifyRequest,
    FastifyReply
} from 'fastify'

import { deleteAccountService } from '../../services/account-services/delete-account-service.js'

export async function deleteAccountController(
    request: FastifyRequest<{Body: {id: string}}>,
    reply: FastifyReply
){

    const {
        id
    } = request.body;

    try{
        const result = await deleteAccountService(request.server, {id});

       return reply.code(200).send({
        success: true
       })

    } catch(err: unknown){
        if(err instanceof Error){
            if(err.message == "Acount not found"){
                throw request.server.httpErrors.notFound("Account not found");
            }
        }
        throw request.server.httpErrors.internalServerError();
    }
}