import type { FastifyInstance } from "fastify";

/**
 * Retrieves a single medical documentation record with its associated one-to-one medical bill.
 * 
 * @param {FastifyInstance} fastify - The Fastify server instance with Prisma client
 * @param {Object} body - Request body parameters
 * @param {string} body.id - The unique identifier of the medical documentation
 * 
 * @returns {Promise<Object|null>} A promise that resolves to an object containing:
 *   - id: string - Medical documentation ID
 *   - patientId: string - Associated patient ID
 *   - createdById: string - Account ID of documentation creator
 *   - admittedById: string|null - Doctor ID who admitted the patient
 *   - createdByName: string - Name of the creator
 *   - createdByRole: "admin"|"encoder" - Role of the creator
 *   - admittedByName: string|null - Name of admitting doctor
 *   - lastUpdatedByName: string|null - Name of last updater
 *   - lastUpdatedByRole: "admin"|"encoder"|null - Role of last updater
 *   - assessment: string|null - Patient assessment notes
 *   - diagnosis: string|null - Medical diagnosis
 *   - treatment: string|null - Treatment plan
 *   - prescription: string|null - Medication prescription
 *   - status: "complete"|"incomplete"|"draft" - Documentation status
 *   - createdAt: Date - Documentation creation timestamp
 *   - updatedAt: Date - Last update timestamp
 *   - patient: Patient object with id, firstName, lastName, middleName
 *   - medicalBill: MedicalBill object or null containing id, totalAmount, amountPaid, balance, paymentStatus
 *   Returns null if no documentation found with the given ID
 * 
 * @throws {Error} Throws error if database query fails
 * 
 * @example
 * // Success response
 * {
 *   id: "clk7x9z3k0001x9q1a2b3c4d5",
 *   patientId: "clk7x8w2j0001x9q1a2b3c4d5",
 *   createdById: "clk7x7v1i0001x9q1a2b3c4d5",
 *   admittedById: "clk7x6u0h0001x9q1a2b3c4d5",
 *   createdByName: "Maria Santos",
 *   createdByRole: "encoder",
 *   admittedByName: "Dr. Juan Dela Cruz",
 *   lastUpdatedByName: "Maria Santos",
 *   lastUpdatedByRole: "encoder",
 *   assessment: "Patient presents with hypertension and elevated glucose levels",
 *   diagnosis: "Type 2 Diabetes Mellitus, Hypertension",
 *   treatment: "Prescribed antidiabetic medications and lifestyle modifications",
 *   prescription: "Metformin 500mg twice daily, Lisinopril 10mg once daily",
 *   status: "complete",
 *   createdAt: "2024-10-15T10:30:00.000Z",
 *   updatedAt: "2024-10-16T14:45:00.000Z",
 *   patient: {
 *     id: "clk7x8w2j0001x9q1a2b3c4d5",
 *     firstName: "John",
 *     lastName: "Doe",
 *     middleName: "Michael"
 *   },
 *   medicalBill: {
 *     id: "clk7xa4l9m0001x9q1a2b3c4d5",
 *     totalAmount: 5500.00,
 *     amountPaid: 2500.00,
 *     balance: 3000.00,
 *     paymentStatus: "partially_paid",
 *     billedServices: [
 *       {
 *         id: "clk7xb5p2n0001x9q1a2b3c4d5",
 *         serviceName: "Complete Blood Count",
 *         serviceCategory: "hematology",
 *         servicePriceAtTime: 2500.00,
 *         quantity: 1,
 *         subtotal: 2500.00,
 *         createdAt: "2024-10-15T10:30:00.000Z"
 *       },
 *       {
 *         id: "clk7xb6q3o0001x9q1a2b3c4d5",
 *         serviceName: "Blood Glucose Test",
 *         serviceCategory: "clinical_chemistry",
 *         servicePriceAtTime: 1500.00,
 *         quantity: 2,
 *         subtotal: 3000.00,
 *         createdAt: "2024-10-15T10:30:00.000Z"
 *       }
 *     ]
 *   }
 * }
 * 
 * @example
 * // Not found response
 * null
 */
export async function getMedicalDocumentation(
  fastify: FastifyInstance,
  body: { id: string }
) {
  const { id } = body;

  try {
    const documentResult = await fastify.prisma.medicalDocumentation.findUnique({
      where: {
        id
      },
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
        updatedAt: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true
          }
        },
        medicalBill: {
          select: {
            id: true,
            totalAmount: true,
            amountPaid: true,
            balance: true,
            paymentStatus: true,
            billedServices: {
              select: {
                id: true,
                serviceName: true,
                serviceCategory: true,
                servicePriceAtTime: true,
                quantity: true,
                subtotal: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    return documentResult;
  } catch (err: unknown) {
    console.error("Error fetching medical documentation:", err);
    throw err;
  }
}