import type { FastifyInstance } from "fastify";

/**
 * Service: Retrieves a single patient with lightweight medical documentation preview
 * 
 * Responsibilities:
 *  - Fetches comprehensive patient details for profile view
 *  - Includes minimal medical documentation data for table preview (excludes heavy text fields)
 *  - Provides staff attribution for audit trail
 *  - Handles patient not found and database errors gracefully
 * 
 * Performance Optimizations:
 *  - Limits medical documentation to most recent records (configurable)
 *  - Excludes large text fields (assessment, diagnosis, treatment, prescription)
 *  - Uses selective field loading to minimize data transfer
 *  - Orders by most recent first for better UX
 * 
 * @param fastify - Fastify instance for database and logging
 * @param body - Object containing patient ID and optional limit
 * @returns Patient object with basic info and documentation preview
 * @throws {Error} When patient is not found or database operation fails
 */
export async function getOnePatientService(
  fastify: FastifyInstance, 
  body: { id: string; limit?: number } // ✅ Make limit configurable
) {
  const { id, limit = 50 } = body; 

  fastify.log.debug(
    { patientId: id, limit, operation: 'getOnePatientService' },
    "Starting patient retrieval service"
  );

  try {
    const patient = await fastify.prisma.patient.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        birthDate: true,
        gender: true,
        csdIdOrPwdId: true,
        mobileNumber: true,
        residentialAddress: true,
        isArchived: true, 
        registeredAt: true,
        notes: true,
        
        // Audit trail
        createdByName: true,
        createdByRole: true,
        updatedByName: true,
        updatedByRole: true,
        createdAt: true,
        updatedAt: true,
        
        // Medical documentation preview
        medicalDocumentations: {
          where: {
            isArchived: false
          },
          select: {
            id: true,
            status: true, 
            createdAt: true,
            updatedAt: true,
            createdByName: true, 
            admittedByName: true, 
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: limit
        }
      }
    });

    if (!patient) {
      fastify.log.warn(
        { patientId: id, operation: 'getOnePatientService' },
        "Patient not found in database - possibly deleted or invalid ID"
      );
      throw new Error("Patient not found");
    }

    // ✅ Add calculated age for UI convenience
    const age = calculateAge(patient.birthDate);

    fastify.log.info(
      { 
        patientId: id, 
        patientName: `${patient.firstName} ${patient.lastName}`,
        age,
        isArchived: patient.isArchived,
        totalDocs: patient.medicalDocumentations.length,
        operation: 'getOnePatientService'
      },
      "Patient profile retrieved successfully"
    );

    return {
      ...patient,
      age, // ✅ Include calculated age
      birthDate: patient.birthDate.toISOString(), // ✅ Serialize date
      createdAt: patient.createdAt.toISOString(),
      updatedAt: patient.updatedAt.toISOString(),
      medicalDocumentations: patient.medicalDocumentations.map(doc => ({
        ...doc,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString()
      }))
    };

  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(
        { 
          error: err.message, 
          patientId: id, 
          operation: 'getOnePatientService',
          errorType: 'KnownError'
        },
        "Failed to retrieve patient details"
      );
    } else {
      fastify.log.error(
        { 
          err, 
          patientId: id, 
          operation: 'getOnePatientService',
          errorType: 'UnknownError'
        },
        "Failed to retrieve patient details - unknown error"
      );
    }
    
    throw err;
  }
}

// ✅ Helper function to calculate age
function calculateAge(birthDate: Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}