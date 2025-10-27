import type {
    FastifyRequest,
    FastifyReply
} from 'fastify'

import { getDailySales } from '../../services/statistic-services/get-daily-sales.js'

export async function getDailySalesController(
    request: FastifyRequest,
    reply: FastifyReply
){
    try{
        const result = await getDailySales(request.server);

        reply.code(200).send({
            message: "Successfully fetched today's revenue",
            data: result
        })

    }catch(err: unknown){
        throw request.server.httpErrors.internalServerError("An error occured while fetching daily sales");
    }
}