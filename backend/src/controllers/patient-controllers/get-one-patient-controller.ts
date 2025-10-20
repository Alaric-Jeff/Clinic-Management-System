
import type { FastifyRequest, FastifyReply } from "fastify";

import { getOnePatientService } from "../../services/patient-services/get-patient-service.js";
export async function getOnePatientController(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;

    try {
        const patient = await getOnePatientService(request.server, { 
            id,
            limit: 20 
        });

        return reply.code(200).send({
            success: true,
            message: 'Patient retrieved successfully',
            data: patient
        });
        
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'Patient not found') {
            throw request.server.httpErrors.notFound('Patient not found');
        }

        request.server.log.error(
            { error: err, patientId: id },
            'Error retrieving patient'
        );

        throw request.server.httpErrors.internalServerError(
            'Failed to retrieve patient'
        );
    }
}