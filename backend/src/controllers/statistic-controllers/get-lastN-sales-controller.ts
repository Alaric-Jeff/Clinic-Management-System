import type {
    FastifyRequest,
    FastifyReply
} from 'fastify'
import { getSalesLastNDays } from '../../services/statistic-services/get-lastN-sales.js'

export async function getLastNSalesController(
    request: FastifyRequest,
    reply: FastifyReply
){
    try{
        const result = await getSalesLastNDays(request.server);

        reply.code(200).send({
            message: "Succesfully get the Ndays sales",
            result
        })
    }catch(err: unknown){
        throw request.server.httpErrors.internalServerError("An error occured while getting the lastN sales")
    }
}