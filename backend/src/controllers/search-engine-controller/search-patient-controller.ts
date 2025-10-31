import type {
    FastifyRequest,
    FastifyReply
} from 'fastify'

import type {searchBodyType} from '../../type-schemas/search-engine-schemas/search-patient-schema.js'
import { searchPatientService } from '../../services/search-engine-services/search-patient-service.js';
export async function searchPatientController(
    request: FastifyRequest<{Body: searchBodyType}>,
    reply: FastifyReply
){

    const {
        searchBody
    } = request.body;

    try{

        const result = await searchPatientService(request.server, {searchBody});

        reply.code(200).send({
            message: "Successfully found a result",
            result: result
        })

    }catch(err: unknown){

        if(err instanceof Error){
            if(err.message === "Not found"){
                throw request.server.httpErrors.notFound("No patient was found");
            }
        }

        throw request.server.httpErrors.internalServerError("An error occured in searching patient");
    }
}