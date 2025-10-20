import type {
  FastifyRequest,
  FastifyReply
} from 'fastify';

import type {
  getTotalPatientsParamsType,
  totalPatientPaginatedResponseType
} from '../../type-schemas/patients/get-total-paginated-schema.js';

import { getTotalPatients } from '../../services/patient-services/get-total-patients.js';

export async function getTotalPatientController(
  request: FastifyRequest<{ Querystring: getTotalPatientsParamsType }>,
  reply: FastifyReply
): Promise<totalPatientPaginatedResponseType> {

  const { limit, cursor } = request.query;

  try {

    const queryData: { limit: number; cursor?: string } = { limit };
    if (cursor) queryData.cursor = cursor;

    const result = await getTotalPatients(request.server, queryData);

    return reply.code(200).send(result);

  } catch (err: unknown) {
    if (err instanceof Error) {
      request.server.log.error(
        {
          error: err.message,
          limit,
          cursor,
          operation: 'getTotalPatients'
        },
        'Error retrieving paginated patients'
      );

      if (err.message === 'Invalid cursor format') {
        throw request.server.httpErrors.badRequest(err.message);
      }
    }

    request.server.log.error(
      {
        error: err,
        operation: 'getTotalPatients'
      },
      'Unexpected error retrieving paginated patients'
    );

    throw request.server.httpErrors.internalServerError(
      'Failed to retrieve patients'
    );
  }
}
