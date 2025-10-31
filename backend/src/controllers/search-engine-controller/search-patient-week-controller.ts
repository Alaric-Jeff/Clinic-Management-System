import {
    type FastifyRequest,
    type FastifyReply
} from 'fastify'

import type {getTotalPatientsParamsType} from '../../type-schemas/patients/get-total-paginated-schema.js'
import { getThisWeekPatient } from '../../services/search-engine-services/get-this-week-patients.js';

export async function searchPatientWeekController(
    request: FastifyRequest<{Querystring: getTotalPatientsParamsType}>,
    reply: FastifyReply
){

    const {
        limit,
        cursor,
        direction
    } = request.query;

    try{
        const params: { limit: number; cursor?: string; direction?: "next" | "prev" } = { limit };
        if (cursor !== undefined) params.cursor = cursor;
        if (direction !== undefined) params.direction = direction;
        
        const result = await getThisWeekPatient(request.server, params);
        reply.code(200).send({
            success: result.success,
            message: result.message,
            data: result.data, 
            meta: {
                hasNextPage: result.meta.hasNextPage,
                hasPreviousPage: result.meta.hasPreviousPage,
                startCursor: result.meta.startCursor,
                endCursor: result.meta.endCursor,
                limit: result.meta.limit
            }
        });

    }catch(err: unknown){

        if(err instanceof Error){
            request.server.log.error(`An error occured in searching for patients this week, error: ${err.message} `)
        }

        throw request.server.httpErrors.internalServerError("An error occurred in searching patients this week");
    }
}