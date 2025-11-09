import type { FastifyRequest, FastifyReply } from "fastify";

import { getPartiallyPaid } from "../../services/medical-bills-services/get-partially-paid-service.js";
import type {
  getTOtalMedicalBillsType,
  getMedicalBillsPaginatedType,
} from "../../type-schemas/medical-bills/get-total-medical-bills-schemas.js";

export async function getUnpaidMedicalController(
    request: FastifyRequest<{Querystring: getTOtalMedicalBillsType}>,
    reply: FastifyReply
): Promise<getMedicalBillsPaginatedType>{
    try{

        const result = await getPartiallyPaid(request.server, request.query);

        return reply.code(200).send(result)

    }catch(err: unknown){
        throw request.server.httpErrors.internalServerError("An error occured in fetching partially paid medical bills");
    }
}