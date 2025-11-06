import type {
    FastifyRequest, FastifyReply
} from 'fastify'

import { findExistingNameService } from '../../services/patient-services/find-existing-name-service.js';

export async function findExistingNameController(
    request: FastifyRequest<{Body: {
        firstName: string | null,
        lastName: string | null,
        middleName: string | null
    }}>,
    reply: FastifyReply
){

    const {
        firstName,
        lastName,
        middleName
    } = request.body;

    try{
        const result = await findExistingNameService(request.server, {firstName, lastName, middleName})

        reply.code(200).send({
            message: "Successfully fetched a duplicate check",
            result: result
        })
        
    }catch(err: unknown){
        throw request.server.httpErrors.internalServerError("An error occured while finding name");
    }
}