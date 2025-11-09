import type { FastifyRequest, FastifyReply } from "fastify";

import { getUnpaidService } from "../../services/medical-bills-services/get-unpaid-service.js";

import type {
  getTOtalMedicalBillsType,
  getMedicalBillsPaginatedType,
} from "../../type-schemas/medical-bills/get-total-medical-bills-schemas.js";

export async function getUnpaidMedicalController(
    request: FastifyRequest<{Querystring: getTOtalMedicalBillsType}>,
    reply: FastifyReply
): Promise<getMedicalBillsPaginatedType>{
    try{

        const result = await getUnpaidService(request.server, request.query);

        return reply.code(200).send(result)

    }catch(err: unknown){
        throw request.server.httpErrors.internalServerError("An error occured in fetching unpaid medical bills");
    }
}