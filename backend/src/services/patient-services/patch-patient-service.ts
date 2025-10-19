import type { FastifyInstance } from "fastify";
import type { patchPatientServiceType } from '../../type-schemas/patient-schemas.js'
import type { Role } from '@prisma/client'

/**
 * @description - Get the previous patient data for comparison
 */
async function getPreviousPatientData(fastify: FastifyInstance, patientId: string) {
    return await fastify.prisma.patient.findUnique({
        where: { id: patientId },
        select: {
            firstName: true,
            lastName: true,
            middleName: true,
            birthDate: true,
            gender: true,
            csdIdOrPwdId: true,
            mobileNumber: true,
            residentialAddress: true,
        }
    });
}

/**
 * @description - Determine which fields were actually changed
 */
function getChangedFields(previousData: any, newData: any): { fields: string[], previousValues: Record<string, any>, newValues: Record<string, any> } {
    const changedFields: string[] = [];
    const previousValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    // Only check fields that are present in newData (fields being updated)
    Object.keys(newData).forEach(field => {
        const prev = previousData[field];
        const newVal = newData[field];

        // Normalize dates for comparison
        const prevNormalized = prev instanceof Date ? prev.toISOString() : prev;
        const newNormalized = newVal instanceof Date ? newVal.toISOString() : newVal;

        if (prevNormalized !== newNormalized) {
            changedFields.push(field);
            previousValues[field] = prev;
            newValues[field] = newVal;
        }
    });

    return { fields: changedFields, previousValues, newValues };
}

/**
 * @description - Create an audit log entry
 */
async function createAuditLog(
    fastify: FastifyInstance,
    patientId: string,
    action: string,
    changedFields: string[],
    previousData: Record<string, any>,
    newData: Record<string, any>,
    changedByName: string,
    changedByRole: Role
) {
    await fastify.prisma.patientAuditLog.create({
        data: {
            patientId,
            action,
            fieldsChanged: changedFields.join(','),
            previousData: changedFields.length > 0 ? JSON.stringify(previousData) : null,
            newData: changedFields.length > 0 ? JSON.stringify(newData) : null,
            changedByName,
            changedByRole,
        }
    });
}

/**
 * @description - update non-null fields and create audit log
 *
 * @param fastify
 * @param body
 * @returns
 */
export async function patchPatientService(fastify: FastifyInstance, body: patchPatientServiceType) {
    const {
        id,
        firstName,
        lastName,
        middleName,
        birthDate,
        gender,
        csdIdOrPwdId,
        mobileNumber,
        residentialAddress,
        updatedByName,
        updatedByRole
    } = body;

    try {
        // Get previous patient data
        const previousPatient = await getPreviousPatientData(fastify, id);

        if (!previousPatient) {
            throw new Error('Patient not found');
        }

        // Build update data (only non-null fields)
        const updateData = {
            ...(firstName !== null && { firstName }),
            ...(lastName !== null && { lastName }),
            ...(middleName !== null && { middleName }),
            ...(birthDate !== null && { birthDate: new Date(birthDate) }),
            ...(gender !== null && { gender }),
            ...(csdIdOrPwdId !== null && { csdIdOrPwdId }),
            ...(mobileNumber !== null && { mobileNumber }),
            ...(residentialAddress !== null && { residentialAddress }),
        };

        // Determine which fields changed
        const { fields: changedFields, previousValues, newValues } = getChangedFields(
            previousPatient,
            updateData
        );

        // Update patient
        const updatedPatient = await fastify.prisma.patient.update({
            where: { id },
            data: updateData,
        });

        // Create audit log only if fields actually changed
        if (changedFields.length > 0) {
            await createAuditLog(
                fastify,
                id,
                'updated',
                changedFields,
                previousValues,
                newValues,
                updatedByName,
                updatedByRole as Role
            );
        }

        return {
            success: true,
            message: 'Patient updated successfully',
            data: updatedPatient,
            auditInfo: {
                fieldsChanged: changedFields,
                recordedInAuditLog: changedFields.length > 0
            }
        };

    } catch (err: unknown) {
        if (err && typeof err === 'object' && 'code' in err) {
            const prismaError = err as { code: string };

            if (prismaError.code === 'P2025') {
                throw new Error('Patient not found');
            }
        }

        throw err;
    }
}

/**
 * @description - Retrieve patient audit logs
 */
export async function getPatientAuditLogs(fastify: FastifyInstance, patientId: string) {
    return await fastify.prisma.patientAuditLog.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' }
    });
}

/**
 * @description - Retrieve audit log by id for detailed view
 */
export async function getAuditLogDetail(fastify: FastifyInstance, auditLogId: string) {
    const log = await fastify.prisma.patientAuditLog.findUnique({
        where: { id: auditLogId }
    });

    if (!log) {
        throw new Error('Audit log not found');
    }

    return {
        ...log,
        previousDataParsed: log.previousData ? JSON.parse(log.previousData) : null,
        newDataParsed: log.newData ? JSON.parse(log.newData) : null,
    };
}