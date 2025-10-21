import type {
    FastifyRequest,
    FastifyReply
} from 'fastify'

import { getMalePatientCountService } from '../../services/patient-services/get-count-male-service.js';

export async function getMaleCountController(
    request: FastifyRequest,
    reply: FastifyReply
){
    try{
        const count = await getMalePatientCountService(request.server);

        reply.code(200).send(count)

    }catch(err: unknown){
        throw request.server.httpErrors.internalServerError("An error occured while getting the male patient count");
    }
}