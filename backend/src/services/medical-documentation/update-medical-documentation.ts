import type { FastifyInstance } from "fastify";
import type { updateMedicalDocumentationServiceInputType } from "../../type-schemas/medical-document-schemas.js";

/**
 * Service: Updates medical documentation with full audit trail
 * 
 * Responsibilities:
 *  - Updates specified fields in medical documentation
 *  - Validates that at least one clinical field remains filled
 *  - Tracks all changes in DocumentAuditLog
 *  - Updates doctor information if admittedById changes
 *  - Maintains data integrity and audit compliance
 * 
 * Validation Rules:
 *  - At least one field (assessment, diagnosis, treatment, prescription) must be filled after update
 *  - Creates audit log entry for all changes
 *  - Verifies document exists before updating
 *  - Validates doctor exists if admittedById is changed
 * 
 * @param fastify - Fastify instance for database and logging
 * @param body - Update data with auth fields
 * @returns Updated documentation with audit trail
 * @throws {Error} When validation fails or document not found
 */
export async function updateMedicalDocumentation(
    fastify: FastifyInstance,
    body: updateMedicalDocumentationServiceInputType
) {
    const {
        id,
        assessment,
        diagnosis,
        treatment,
        prescription,
        status,
        admittedById,
        lastUpdatedByName,
        lastUpdatedByRole
    } = body;

    try {
        // Fetch original document for audit log and validation
        const originalDoc = await fastify.prisma.medicalDocumentation.findUnique({
            where: { id },
            select: {
                id: true,
                patientId: true,
                createdById: true,
                admittedById: true,
                createdByName: true,
                createdByRole: true,
                admittedByName: true,
                lastUpdatedByName: true,
                lastUpdatedByRole: true,
                assessment: true,
                diagnosis: true,
                treatment: true,
                prescription: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!originalDoc) {
            throw new Error('Medical documentation not found');
        }

        // Build update data object
        const updateData: any = {
            lastUpdatedByName,
            lastUpdatedByRole
        };

        // Track changes for audit log
        const changedFields: string[] = [];
        const previousData: any = {};
        const newData: any = {};

        // Check each field for changes
        if (assessment !== undefined && assessment !== originalDoc.assessment) {
            updateData.assessment = assessment;
            changedFields.push('assessment');
            previousData.assessment = originalDoc.assessment;
            newData.assessment = assessment;
        }

        if (diagnosis !== undefined && diagnosis !== originalDoc.diagnosis) {
            updateData.diagnosis = diagnosis;
            changedFields.push('diagnosis');
            previousData.diagnosis = originalDoc.diagnosis;
            newData.diagnosis = diagnosis;
        }

        if (treatment !== undefined && treatment !== originalDoc.treatment) {
            updateData.treatment = treatment;
            changedFields.push('treatment');
            previousData.treatment = originalDoc.treatment;
            newData.treatment = treatment;
        }

        if (prescription !== undefined && prescription !== originalDoc.prescription) {
            updateData.prescription = prescription;
            changedFields.push('prescription');
            previousData.prescription = originalDoc.prescription;
            newData.prescription = prescription;
        }

        if (status !== undefined && status !== originalDoc.status) {
            updateData.status = status;
            changedFields.push('status');
            previousData.status = originalDoc.status;
            newData.status = status;
        }

        // Handle doctor change
        if (admittedById !== undefined && admittedById !== originalDoc.admittedById) {
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
                
                if (!doctor) {
                    throw new Error('Admitted doctor not found');
                }
                
                admittedByName = `Dr. ${doctor.firstName} ${doctor.lastName}${doctor.middleInitial ? ` ${doctor.middleInitial}.` : ''}`;
            }
            
            updateData.admittedById = admittedById;
            updateData.admittedByName = admittedByName;
            changedFields.push('admittedBy');
            previousData.admittedBy = originalDoc.admittedByName;
            newData.admittedBy = admittedByName;
        }

        // Validation: at least one clinical field must remain filled
        const finalAssessment = updateData.assessment !== undefined ? updateData.assessment : originalDoc.assessment;
        const finalDiagnosis = updateData.diagnosis !== undefined ? updateData.diagnosis : originalDoc.diagnosis;
        const finalTreatment = updateData.treatment !== undefined ? updateData.treatment : originalDoc.treatment;
        const finalPrescription = updateData.prescription !== undefined ? updateData.prescription : originalDoc.prescription;

        if (!finalAssessment && !finalDiagnosis && !finalTreatment && !finalPrescription) {
            throw new Error(
                'At least one field (assessment, diagnosis, treatment, or prescription) must be filled'
            );
        }

        // Check if there are actually any changes
        if (changedFields.length === 0) {
            fastify.log.info(
                { documentationId: id },
                'No changes detected in medical documentation update'
            );
            
            // Return original document (no update needed)
            return {
                success: true,
                message: 'No changes detected',
                data: {
                    ...originalDoc,
                    createdAt: originalDoc.createdAt.toISOString(),
                    updatedAt: originalDoc.updatedAt.toISOString()
                }
            };
        }

        // Update documentation
        const updatedDoc = await fastify.prisma.medicalDocumentation.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                patientId: true,
                createdById: true,
                admittedById: true,
                createdByName: true,
                createdByRole: true,
                admittedByName: true,
                lastUpdatedByName: true,
                lastUpdatedByRole: true,
                assessment: true,
                diagnosis: true,
                treatment: true,
                prescription: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        });

        // Create audit log for changes
        await fastify.prisma.documentAuditLog.create({
            data: {
                medicalDocumentationId: id,
                action: 'updated',
                fieldsChanged: changedFields.join(','),
                previousData: JSON.stringify(previousData),
                newData: JSON.stringify(newData),
                changedByName: lastUpdatedByName,
                changedByRole: lastUpdatedByRole
            }
        });

        fastify.log.info(
            {
                documentationId: id,
                changedFields,
                updatedBy: lastUpdatedByName
            },
            'Medical documentation updated successfully'
        );

        return {
            success: true,
            message: 'Medical documentation updated successfully',
            data: {
                ...updatedDoc,
                createdAt: updatedDoc.createdAt.toISOString(),
                updatedAt: updatedDoc.updatedAt.toISOString()
            }
        };

    } catch (err: unknown) {
        // Handle Prisma errors
        if (err && typeof err === 'object' && 'code' in err) {
            const prismaError = err as { code: string };
            
            if (prismaError.code === 'P2025') {
                throw new Error('Medical documentation not found');
            }
            
            if (prismaError.code === 'P2003') {
                throw new Error('Invalid reference: Doctor not found');
            }
        }

        if (err instanceof Error) {
            fastify.log.error(
                { 
                    error: err.message, 
                    documentationId: id,
                    operation: 'updateMedicalDocumentation'
                },
                'Failed to update medical documentation'
            );
        } else {
            fastify.log.error(
                { 
                    error: err, 
                    documentationId: id,
                    operation: 'updateMedicalDocumentation'
                },
                'Failed to update medical documentation with unknown error'
            );
        }
        
        throw err;
    }
}