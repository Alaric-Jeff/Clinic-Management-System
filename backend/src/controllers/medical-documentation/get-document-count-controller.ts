import type {
    FastifyRequest,
    FastifyReply
} from 'fastify'
import { getDocumentTotalCount } from '../../services/medical-documentation/get-document-total-service.js'

export async function getDocumentTotalCountController(
    request: FastifyRequest,
    reply: FastifyReply
){
    try{
        const count = await getDocumentTotalCount(request.server);
        reply.code(200).send({
            count: count
        })
    }catch(err: unknown){
        throw request.server.httpErrors.internalServerError("An error occured in fetching the count of documents")
    }
}