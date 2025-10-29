import type {
    FastifyRequest,
    FastifyReply
} from 'fastify'
import { getWeeklyDocumentations } from '../../services/medical-documentation/get-weekly-count.js'

export async function getWeeklyDocumentationsCount(
    request: FastifyRequest,
    reply: FastifyReply
){
    try{
        const result = await getWeeklyDocumentations(request.server);

        reply.code(200).send({
            message: "Successfully fetched the weekly documentations",
            data: result
        });

    }catch(err: unknown){
        throw request.server.httpErrors.internalServerError("An error occured while fetching weekly reports count for analytics");
    }
}
