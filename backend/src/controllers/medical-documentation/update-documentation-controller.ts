import type { FastifyRequest, FastifyReply } from 'fastify';
import type { 
    updateMedicalDocumentationBodyType,
    updateMedicalDocumentationParamsType,
    updateMedicalDocumentationResponseType 
} from '../../type-schemas/medical-document-schemas.js';
import { updateMedicalDocumentation } from '../../services/medical-documentation/update-medical-documentation.js';
import type { Role } from '@prisma/client';

/**
 * Controller: Update medical documentation
 * 
 * Handles HTTP request/response for updating medical documentation.
 * Extracts auth data from JWT and combines with request body for service call.
 * 
 * @param request - Fastify request with documentation updates in body and id in params
 * @param reply - Fastify reply object
 * @returns Updated documentation with audit trail
 */
export async function updateMedicalDocumentationController(
    request: FastifyRequest<{
        Params: updateMedicalDocumentationParamsType;
        Body: updateMedicalDocumentationBodyType;
    }>,
    reply: FastifyReply
): Promise<updateMedicalDocumentationResponseType> {

    const { id } = request.params;
    const {
        assessment,
        diagnosis,
        treatment,
        prescription,
        status,
        admittedById
    } = request.body;

    try {
        // Get authenticated user
        const user = request.currentUser;

        if (!user) {
            throw request.server.httpErrors.unauthorized('Authentication required');
        }

        const userId: string = user.id; // Assuming user has id field
        const name: string = user.name;
        const role: Role = user.role;

        // Log update request
        request.server.log.info(
            {
                documentationId: id,
                updatedBy: name,
                userRole: role,
                fieldsToUpdate: Object.keys(request.body)
            },
            'Medical documentation update requested'
        );

        // Build service input, filtering out undefined values
        const serviceInput: any = {
            id,
            lastUpdatedByName: name,
            lastUpdatedByRole: role
        };

        if (assessment !== undefined) serviceInput.assessment = assessment;
        if (diagnosis !== undefined) serviceInput.diagnosis = diagnosis;
        if (treatment !== undefined) serviceInput.treatment = treatment;
        if (prescription !== undefined) serviceInput.prescription = prescription;
        if (status !== undefined) serviceInput.status = status;
        if (admittedById !== undefined) serviceInput.admittedById = admittedById;

        // Call service with complete data
        const result = await updateMedicalDocumentation(request.server, serviceInput);

        // Return successful response
        return reply.code(200).send(result);

    } catch (err: unknown) {
        if (err instanceof Error) {
            request.server.log.error(
                { 
                    error: err.message, 
                    documentationId: id,
                    userId: request.currentUser?.id 
                },
                'Error updating medical documentation'
            );

            if (err.message.includes('At least one field')) {
                throw request.server.httpErrors.badRequest(err.message);
            }

            if (err.message === 'Medical documentation not found') {
                throw request.server.httpErrors.notFound(err.message);
            }

            if (err.message === 'Admitted doctor not found') {
                throw request.server.httpErrors.notFound(err.message);
            }

            if (err.message.includes('Invalid reference')) {
                throw request.server.httpErrors.badRequest(err.message);
            }
        }

        request.server.log.error(
            { 
                error: err,
                documentationId: id,
                operation: 'updateMedicalDocumentation'
            },
            'Unexpected error updating medical documentation'
        );

        // Generic internal server error
        throw request.server.httpErrors.internalServerError(
            'Failed to update medical documentation'
        );
    }
}