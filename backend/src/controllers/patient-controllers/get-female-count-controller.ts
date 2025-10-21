import type {
    FastifyRequest,
    FastifyReply
} from 'fastify'

import { getFemalePatientCountService } from '../../services/patient-services/get-count-female-service.js'
import { request } from 'http'

export async function getFemaleCountController(
    request: FastifyRequest,
    reply: FastifyReply
){
    try{
        const count = await getFemalePatientCountService(request.server);

        reply.code(200).send(count)

    }catch(err: unknown){
        throw request.server.httpErrors.internalServerError("An error occured while getting the female patient count");
    }
}