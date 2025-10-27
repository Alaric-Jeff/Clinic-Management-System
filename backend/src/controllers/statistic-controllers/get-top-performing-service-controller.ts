import type { FastifyRequest, FastifyReply } from 'fastify';
import { getTopPerformingServices } from '../../services/statistic-services/get-service-performance-services.js';

export async function getTopPerformingServicesController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const result = await getTopPerformingServices(request.server);

    reply.code(200).send({
      message: "Successfully retrieved top performing services",
      data: result,
    });
  } catch (err: unknown) {
    throw request.server.httpErrors.internalServerError(
      "An error occurred while getting top performing services"
    );
  }
}