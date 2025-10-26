import type { FastifyRequest, FastifyReply } from "fastify";
import { ageRatioService } from "../../services/patient-services/age-ratio-service.js";

export async function getAgeRatioController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const result = await ageRatioService(request.server); 

    reply.code(200).send({
      success: true,
      message: "Successfully retrieved age ratio",
      data: result.data, 
    });
  } catch (err: unknown) {
    request.server.log.error(err);
    throw request.server.httpErrors.internalServerError("An error occurred");
  }
}
