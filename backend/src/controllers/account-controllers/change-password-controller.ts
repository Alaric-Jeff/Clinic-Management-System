import type {
    FastifyRequest,
    FastifyReply
} from 'fastify'

import type { changePasswordType } from '../../type-schemas/accounts/change-password-schema.js'
import { changePasswordService } from '../../services/account-services/change-password-service.js'

export async function changePasswordController(
    request: FastifyRequest<{Body: changePasswordType}>,
    reply: FastifyReply
){
    const {
        currentPassword,
        newPassword
    } = request.body;

    const currentUser = request.currentUser;

    let id: string = '';

    if(!currentUser || currentUser.id === '' || !currentUser.id){
        throw request.server.httpErrors.unauthorized("Unauthorized access");
    }
    id = currentUser.id;
    try{
        await changePasswordService(request.server, {id, currentPassword, newPassword});

        reply.code(200).send({
            success: true
        })

    }catch(err: unknown){
        if(err instanceof Error){
            if(err.message === "Account does not exist"){
                return request.server.httpErrors.notFound("Account not found");
            }

            if(err.message === "Account must be activated to change password"){ 
                return request.server.httpErrors.unauthorized("Account must be activated");
            }

            if(err.message === "Current password is incorrect"){
                return request.server.httpErrors.badRequest("Password is not correct");
            }

            if(err.message === "New password cannot be the same as current password"){
                return request.server.httpErrors.badRequest("New password cannot be the same as current password");
            }

        }
        request.log.error(err);
        return request.server.httpErrors.internalServerError("An error occurred in changing the password");
    }

}