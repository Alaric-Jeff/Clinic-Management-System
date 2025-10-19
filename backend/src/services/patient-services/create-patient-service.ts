import type { FastifyInstance } from "fastify";
import type { createPatientServiceType } from "../../type-schemas/patient-schemas.js";

/**
 * Service Type: Extended patient creation type with audit fields
 * 
 * Combines client-provided patient data with server-generated audit information
 * to fulfill all Prisma Patient model requirements.
 */


/**
 * Service: Creates a new patient record with complete audit trail
 * 
 * Responsibilities:
 *  - Persists patient demographic and contact information
 *  - Includes comprehensive audit trail (who created and when)
 *  - Handles optional field normalization (null conversion)
 *  - Manages database constraints and validation errors
 * 
 * Audit Trail Features:
 *  - createdByName/updatedByName: Human-readable staff identification
 *  - createdByRole/updatedByRole: Role-based authorization context
 *  - Automatic timestamping via Prisma @default(now())
 * 
 * @param fastify - Fastify instance for database and logging
 * @param body - Combined patient data and audit information
 * @returns The created patient record
 * @throws {Error} When database constraints are violated or connection fails
 */
export async function createPatientService(
  fastify: FastifyInstance,
  body: createPatientServiceType
) {

  const {
    firstName,
    lastName,
    middleName,
    birthDate,
    gender,
    csdIdOrPwdId,
    mobileNumber,
    residentialAddress,
    registerDate,
    createdByName,
    createdByRole,
    updatedByName,
    updatedByRole
  } = body;

  // Log service invocation for audit trail and monitoring
  fastify.log.debug(
    { 
      operation: 'createPatientService',
      patientName: `${firstName} ${lastName}`,
      createdBy: createdByName
    },
    "Initiating patient creation process"
  );

  try {
    /**
     * Database Operation: Patient Creation
     * 
     * Handles optional field conversion (undefined → null) to maintain
     * database consistency while preserving Prisma's exactOptionalPropertyTypes safety.
     * 
     * All optional fields are explicitly converted using nullish coalescing (?? null)
     * to ensure compatibility with exactOptionalPropertyTypes: true
     */

    const patient = await fastify.prisma.patient.create({
      data: {
        firstName,
        lastName,
        middleName: middleName ?? null,
        birthDate: new Date(birthDate),
        gender,
        csdIdOrPwdId: csdIdOrPwdId ?? null,
        mobileNumber,
        residentialAddress: residentialAddress ?? null,
        registeredAt: registerDate ? new Date(registerDate) : new Date(Date.now()),
        createdByName,
        createdByRole,
        updatedByName: updatedByName ?? null,
        updatedByRole: updatedByRole ?? null
      }, 
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        createdAt: true 
      }
    });
    
    fastify.log.info(
      { 
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        createdBy: createdByName,
        operation: 'createPatientService'
      },
      "Patient record created successfully with complete audit trail"
    );

  // ✅ Fire-and-forget but with better error handling
    fastify.prisma.patientAuditLog.create({
      data: {
        patientId: patient.id,
        action: 'created',
        fieldsChanged: 'firstName,lastName,middleName,birthDate,gender,csdIdOrPwdId,mobileNumber,residentialAddress',
        previousData: null,
        newData: JSON.stringify({
          firstName: patient.firstName,
          lastName: patient.lastName,
          middleName: patient.middleName,
          birthDate: birthDate,
          gender: gender,
          csdIdOrPwdId,
          mobileNumber,
          residentialAddress
        }),
        changedByName: createdByName,
        changedByRole: createdByRole
      }
    }).catch((err) => {
      fastify.log.error({ error: err, patientId: patient.id }, 'Failed to create audit log');
    });
    
    return patient;

  } catch (err: unknown) {
    /**
     * Error Handling: Database and Validation Failures
     * 
     * Distinguishes between constraint violations, connection issues,
     * and unexpected system errors for appropriate handling.
     */
    if (err instanceof Error) {
      // Enhanced error logging with patient context
      fastify.log.error(
        { 
          err: err.message,
          patientName: `${firstName} ${lastName}`,
          createdBy: createdByName,
          operation: 'createPatientService',
          errorType: 'DatabaseError',
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        },
        "Patient creation service failed - database error occurred"
      );
      if (err.message.includes('Unique constraint') || err.message.includes('constraint')) {
        throw new Error('Patient data violates database constraints. Possible duplicate entry.');
      }
      
      if (err.message.includes('Connection') || err.message.includes('timeout')) {
        throw new Error('Database connection failed. Please try again.');
      }
      throw new Error(`Failed to create patient record: ${err.message}`);

    } else {
      fastify.log.error(
        { 
          err,
          patientName: `${firstName} ${lastName}`,
          createdBy: createdByName,
          operation: 'createPatientService',
          errorType: 'UnknownError'
        },
        "Patient creation service failed - unknown error type encountered"
      );
      throw new Error('Unexpected system error during patient creation');
    }
  }
}