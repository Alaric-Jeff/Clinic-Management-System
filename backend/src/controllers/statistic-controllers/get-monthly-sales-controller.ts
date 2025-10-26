import type {
    FastifyRequest,
    FastifyReply
} from 'fastify'
import { getSalesMonthly } from '../../services/statistic-services/get-sales-monthly-service.js';
export async function getMonthlySalesController(
    request: FastifyRequest,
    reply: FastifyReply
){
    try{
        const result = await getSalesMonthly(request.server);

        reply.code(200).send({
            message: "Succesfully get the monthly sales",
            data: result
        })
    }catch(err: unknown){
        throw request.server.httpErrors.internalServerError("An error occured while getting the monthly sales")
    }
}