import type {
    FastifyRequest,
    FastifyReply
} from 'fastify';

import type { 
    createMedicalDocumentationType,
    createMedicalDocumentationResponseType 
} from '../../type-schemas/medical-document-schemas.js';
import { createMedicalDocumentation } from '../../services/medical-documentation/create-medical-documentation.js';
import type { Role } from '@prisma/client';

export async function createMedicalDocumentationController(
    request: FastifyRequest<{Body: createMedicalDocumentationType}>,
    reply: FastifyReply
): Promise<createMedicalDocumentationResponseType> {

    const {
        patientId,
        admittedById,
        assessment,
        diagnosis,
        treatment,
        prescription
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

        // Call service with complete data
        const documentation = await createMedicalDocumentation(request.server, {
            patientId,
            admittedById,
            assessment,
            diagnosis,
            treatment,
            prescription,
            createdById: userId,
            createdByName: name,
            createdByRole: role
        });

        // Return successful response
        return reply.code(201).send(documentation);

    } catch (err: unknown) {
        // Handle known errors
        if (err instanceof Error) {
            request.server.log.error(
                { 
                    error: err.message, 
                    patientId,
                    userId: request.currentUser?.id 
                },
                'Error creating medical documentation'
            );

            // Validation errors
            if (err.message.includes('At least one field')) {
                throw request.server.httpErrors.badRequest(err.message);
            }

            // Patient archived
            if (err.message.includes('archived patient')) {
                throw request.server.httpErrors.conflict(err.message);
            }

            // Patient not found
            if (err.message === 'Patient not found') {
                throw request.server.httpErrors.notFound(err.message);
            }

            // Doctor not found
            if (err.message === 'Admitted doctor not found') {
                throw request.server.httpErrors.notFound(err.message);
            }

            // Invalid reference (Prisma foreign key error)
            if (err.message.includes('Invalid reference')) {
                throw request.server.httpErrors.badRequest(err.message);
            }
        }

        // Log unexpected errors
        request.server.log.error(
            { 
                error: err,
                patientId,
                operation: 'createMedicalDocumentation'
            },
            'Unexpected error creating medical documentation'
        );

        // Generic internal server error
        throw request.server.httpErrors.internalServerError(
            'Failed to create medical documentation'
        );
    }
}