import type { FastifyRequest, FastifyReply } from "fastify";
import { getAllMedicalBills } from "../../services/medical-bills-services/get-all-medical-bill.js";
import type {
  getTOtalMedicalBillsType,
  getMedicalBillsPaginatedType,
} from "../../type-schemas/medical-bills/get-total-medical-bills-schemas.js";

export async function getTotalMedicalBillController(
  request: FastifyRequest<{ Querystring: getTOtalMedicalBillsType }>,
  reply: FastifyReply
): Promise<getMedicalBillsPaginatedType> {
  try {
    const result = await getAllMedicalBills(request.server, request.query);

    return reply.code(200).send(result);
  } catch (err: unknown) {
    request.server.log.error(
      { err },
      "An error occurred in getTotalMedicalBillController"
    );
    throw request.server.httpErrors.internalServerError(
      "An error occurred while fetching total medical bills"
    );
  }
}
