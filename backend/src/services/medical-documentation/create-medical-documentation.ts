import type { FastifyInstance } from "fastify";
import type { medicalDocumentationServiceInputType } from "../../type-schemas/medical-document-schemas.js";

export async function createMedicalDocumentation(
    fastify: FastifyInstance,
    body: medicalDocumentationServiceInputType
) {
    const {
        patientId,
        admittedById,
        assessment,
        diagnosis,
        treatment,
        prescription,
        createdById,
        createdByName,
        createdByRole
    } = body;

    try {
        if (!assessment && !diagnosis && !treatment && !prescription) {
            throw new Error(
                'At least one field (assessment, diagnosis, treatment, or prescription) must be provided'
            );
        }
        const patient = await fastify.prisma.patient.findUnique({
            where: { id: patientId },
            select: { 
                id: true, 
                isArchived: true,
                firstName: true,
                lastName: true
            }
        });

        if (!patient) {
            throw new Error('Patient not found');
        }
        
        if (patient.isArchived) {
            throw new Error(
                "Cannot create documentation for archived patient"
            );
        }

        let admittedByName: string | null = null;

        if (admittedById) {
            const doctor = await fastify.prisma.doctors.findUnique({
                where: { id: admittedById },
                select: {
                    firstName: true,
                    lastName: true,
                    middleInitial: true
                }
            });

            if (doctor) {
                admittedByName = `Dr. ${doctor.firstName} ${doctor.lastName}${doctor.middleInitial ? ` ${doctor.middleInitial}.` : ''}`;
            } else {
                throw new Error('Admitted doctor not found');
            }
        }

        // Create documentation
        const createdDocument = await fastify.prisma.medicalDocumentation.create({
            data: {
                patientId,
                admittedById,
                assessment,
                diagnosis,
                treatment,
                prescription,
                createdById,
                createdByName,
                createdByRole,
                admittedByName
            },
            select: {
                id: true,
                patientId: true,
                createdAt: true,
                status: true,
                createdByName: true,
                createdByRole: true,
                admittedByName: true,
                assessment: true,
                diagnosis: true,
                treatment: true,
                prescription: true
            }
        });

        // Create audit log for documentation creation
        await fastify.prisma.documentAuditLog.create({
            data: {
                medicalDocumentationId: createdDocument.id,
                action: 'created',
                fieldsChanged: 'initial_creation',
                newData: JSON.stringify({
                    assessment,
                    diagnosis,
                    treatment,
                    prescription
                }),
                changedByName: createdByName,
                changedByRole: createdByRole
            }
        });

        fastify.log.info(
            { 
                documentationId: createdDocument.id,
                patientId: createdDocument.patientId,
                patientName: `${patient.firstName} ${patient.lastName}`,
                createdBy: createdDocument.createdByName
            },
            "Medical documentation created successfully"
        );

        return {
            success: true,
            message: "Medical documentation created successfully",
            data: {
                ...createdDocument,
                createdAt: createdDocument.createdAt.toISOString()
            }
        };

    } catch (err: unknown) {
        // Handle Prisma errors
        if (err && typeof err === 'object' && 'code' in err) {
            const prismaError = err as { code: string };
            
            if (prismaError.code === 'P2003') {
                throw new Error('Invalid reference: Patient or doctor ID not found');
            }
            
            if (prismaError.code === 'P2025') {
                throw new Error('Referenced record not found');
            }
        }

        if (err instanceof Error) {
            fastify.log.error(
                { 
                    error: err.message,
                    patientId,
                    createdById,
                    operation: 'createMedicalDocumentation'
                },
                "Failed to create medical documentation"
            );
        } else {
            fastify.log.error(
                { 
                    err,
                    patientId,
                    createdById,
                    operation: 'createMedicalDocumentation'
                },
                "Failed to create medical documentation with unknown error"
            );
        }
        
        throw err;
    }
}