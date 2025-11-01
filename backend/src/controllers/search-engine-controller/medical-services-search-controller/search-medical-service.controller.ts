import type {
  FastifyRequest,
  FastifyReply,
} from 'fastify';

import type { searchServiceType } from '../../../type-schemas/search-engine-schemas/search-service-schema.js';
import { searchMedicalService } from '../../../services/search-engine-services/medical-services-searches/search-medical-service.js';

export async function searchMedicalServiceController(
    request: FastifyRequest<{Body: searchServiceType}>,
    reply: FastifyReply
){
    const {
        searchServiceBody
    } = request.body;

    try{
        const result = await searchMedicalService(request.server, {searchServiceBody})
        reply.code(200).send({
            message: "Successfully retrieved services",
            result: result
        })
    }catch(err: unknown){

        if(err instanceof Error){
            request.server.log.error(`An error occured in searching medical service, error: ${err.message}`)
        }

        throw request.server.httpErrors.internalServerError("An error occured while searching medical service")
    }
}