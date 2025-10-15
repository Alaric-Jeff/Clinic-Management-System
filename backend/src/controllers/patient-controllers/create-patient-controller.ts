import type {
    FastifyRequest, FastifyReply
} from 'fastify'
import type { createPatientType } from '../../type-schemas/patient-schemas.js'
import { createPatientService } from '../../services/patient-services/create-patient-service.js';
import { Role } from '@prisma/client';

export async function createPatientController(
    request: FastifyRequest<{Body: createPatientType}>,
    reply: FastifyReply
): Promise<void> {
    const {
        firstName,
        lastName,
        middleName,
        birthDate,
        gender,
        csdIdOrPwdId,
        mobileNumber,
        residentialAddress, registerDate
    } = request.body;

    const user = request.currentUser;

    if (!user || !user.name || !user.role) {
        throw request.server.httpErrors.unauthorized('Authentication required with valid user details');
    }

    const { name: userName, role: userRole } = user;

    request.server.log.debug(`user's name: ${userName}, role: ${userRole}`);

    try {
        const patientPreview = await createPatientService(
            request.server, 
            {
                firstName,
                lastName,
                middleName,
                birthDate,
                gender,
                csdIdOrPwdId,
                mobileNumber,
                residentialAddress,
                registerDate,
                createdByName: userName,
                createdByRole: userRole as Role,
                updatedByName: userName,
                updatedByRole: userRole as Role
            }
        );

        return reply.code(201).send({
            success: true,
            data: patientPreview,
            message: 'Patient created successfully'
        });

    } catch (err: unknown) {

        
        if (err instanceof Error) {
            return reply.code(500).send({
                success: false,
                error: err.message,
                message: 'Failed to create patient'
            });
        }

        return reply.code(500).send({
            success: false,
            message: 'An unexpected error occurred while creating patient'
        });
    }
}