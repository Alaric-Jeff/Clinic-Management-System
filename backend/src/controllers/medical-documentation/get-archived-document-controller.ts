import type {
    FastifyRequest,
    FastifyReply
} from 'fastify';
import { getAllArchivedMedicalDocumentationService } from '../../services/medical-documentation/get-all-archived-medical-documentation.js';

export async function getArchivedDocumentController(
    request: FastifyRequest,
    reply: FastifyReply
){
    try{
        const result = await getAllArchivedMedicalDocumentationService(request.server);

        reply.code(200).send({
            message: "Successfully fetched archived documents",
            data: result
        })
        
    }catch(err: unknown){
        if(err instanceof Error){
            request.server.log.error(`An error occured in fetching archived documents, error: ${err.message}`)
        }else{
            request.server.log.error(`An unknown error occure, full error: ${err}`)
        }
        throw request.server.httpErrors.internalServerError("Error occured in fetching archived documents")
    }
}