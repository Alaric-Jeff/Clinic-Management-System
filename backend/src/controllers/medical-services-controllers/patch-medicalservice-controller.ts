import type { FastifyRequest, FastifyReply } from 'fastify';
import type { updateMedicalServiceType } from '../../type-schemas/services-schemas.js';
import { updateMedicalService } from '../../services/medical-services/update-medicalservice.js';

export async function patchMedicalServiceController(
  request: FastifyRequest<{ Body: updateMedicalServiceType }>,
  reply: FastifyReply
) {
  try {
    const updatedService = await updateMedicalService(request.server, request.body);

    return reply.code(200).send({
      success: true,
      message: 'Medical service updated successfully',
      data: {
        name: updatedService.name,
        category: updatedService.category,
        price: updatedService.price,
        createdByName: updatedService.createdByName,
        createdAt: updatedService.createdAt
      }
    });
  } catch (err: unknown) {
    request.log.error({ err }, 'Failed to update medical service');
    return reply.internalServerError('Failed to update medical service');
  }
}