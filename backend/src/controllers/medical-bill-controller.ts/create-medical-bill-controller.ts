import type { FastifyRequest, FastifyReply } from "fastify";
import type {
  createMedicalBillType,
  createMedicalBillResponseType,
  createMedicalBillServiceInputType
} from "../../type-schemas/medical-bills-schema.js";
import { createMedicalBillWithServices } from "../../services/medical-bills-services.ts/create-medical-bills-service.js";
import type { Role } from "@prisma/client";

/**
 * Controller: Create Medical Bill with Services
 *
 * Handles HTTP request/response for creating a medical bill with associated services.
 * Extracts auth data from JWT and combines with request body for service call.
 * Creates bill and all services in a single atomic transaction.
 *
 * CALCULATION:
 * - Services Subtotal = Σ(service.price × quantity)
 * - Discount applies ONLY to services:
 *   - 20% if isSeniorPwdDiscountApplied (requires valid csdIdOrPwdId)
 *   - Custom % if discountRate provided (0-100)
 * - Services Total = Services Subtotal - Discount
 * - Consultation Fee = 250 (default) or 350 (follow-up) — NOT discounted
 * - TOTAL BILL = Services Total + Consultation Fee
 *
 * @param request - Fastify request with bill data in body
 * @param reply - Fastify reply object
 * @returns Created bill with dynamic payment fields (201 Created)
 * @throws {Error} HTTP errors from fastify.httpErrors
 */
export async function createMedicalBillController(
  request: FastifyRequest<{
    Body: createMedicalBillType;
  }>,
  reply: FastifyReply
): Promise<createMedicalBillResponseType> {
  const {
    medicalDocumentationId,
    services,
    notes,
    initialPaymentAmount,
    consultationFee: inputConsultationFee,
    paymentMethod,
    isSeniorPwdDiscountApplied,
    discountRate
  } = request.body;

  try {
    // Get authenticated user
    const user = request.currentUser;

    if (!user) {
      throw request.server.httpErrors.unauthorized(
        "Authentication required"
      );
    }

    const name: string = user.name;
    const role: Role = user.role as Role;

    // Normalize consultation fee - only 250 or 350 are valid
    const normalizeConsultationFee = (fee: number | null | undefined): number | null => {
      const VALID_FEES = [250, 350];
      if (fee === null || fee === undefined) return null;
      return VALID_FEES.includes(fee) ? fee : null;
    };
    const effectiveConsultationFee = normalizeConsultationFee(inputConsultationFee);

    // Log bill creation request
    request.server.log.info(
      {
        medicalDocumentationId,
        servicesCount: services.length,
        createdBy: name,
        userRole: role,
        consultationFee: effectiveConsultationFee ?? "default (250)",
        hasInitialPayment: initialPaymentAmount ? true : false,
        paymentMethod: paymentMethod ?? "default (cash)",
        isSeniorPwdDiscountApplied: isSeniorPwdDiscountApplied ?? false,
        discountRate: discountRate ?? 0
      },
      "Medical bill creation requested"
    );

    // Build service input
    const serviceInput: createMedicalBillServiceInputType = {
      medicalDocumentationId,
      services,
      notes: notes ?? null,
      createdByName: name,
      createdByRole: role,
      isSeniorPwdDiscountApplied: isSeniorPwdDiscountApplied ?? false,
      discountRate: discountRate ?? 0,
    };

    // Add optional fields only if they have values
    if (initialPaymentAmount !== undefined && initialPaymentAmount !== null) {
      serviceInput.initialPaymentAmount = initialPaymentAmount;
    }
    
    if (paymentMethod !== undefined && paymentMethod !== null) {
      serviceInput.paymentMethod = paymentMethod;
    }
    
    // Only pass consultationFee if it's a valid value (250 or 350)
    // Service will normalize null/undefined to 250
    if (effectiveConsultationFee !== null) {
      serviceInput.consultationFee = effectiveConsultationFee;
    }

    const result = await createMedicalBillWithServices(request.server, serviceInput);

    // Return successful response with 201 Created
    return reply.code(201).send(result);
    
  } catch (err: unknown) {
    // Handle known errors with appropriate HTTP status codes
    if (err instanceof Error) {
      request.server.log.error(
        {
          error: err.message,
          medicalDocumentationId,
          servicesCount: services.length,
          userId: request.currentUser?.id
        },
        "Error creating medical bill"
      );

      // Senior/PWD discount without valid ID
      if (err.message.includes("Cannot apply senior/PWD discount")) {
        throw request.server.httpErrors.badRequest(err.message);
      }

      // Payment exceeds total
      if (err.message.includes("Initial payment") && err.message.includes("exceeds total")) {
        throw request.server.httpErrors.badRequest(err.message);
      }

      // Medical documentation not found
      if (err.message === "Medical documentation not found") {
        throw request.server.httpErrors.notFound(err.message);
      }

      // Documentation is still draft
      if (err.message.includes("Cannot create bill for draft documentation")) {
        throw request.server.httpErrors.badRequest(err.message);
      }

      // Services validation
      if (err.message === "At least one service must be provided.") {
        throw request.server.httpErrors.badRequest(err.message);
      }

      // Service not found
      if (err.message.includes("Service not found:")) {
        throw request.server.httpErrors.notFound(err.message);
      }

      // Service is deactivated
      if (err.message.includes("Service is deactivated:")) {
        throw request.server.httpErrors.badRequest(err.message);
      }

      // Service is not available
      if (err.message.includes("Service is not available:")) {
        throw request.server.httpErrors.badRequest(err.message);
      }

      // Service quantity validation
      if (err.message.includes("Service quantity must be positive")) {
        throw request.server.httpErrors.badRequest(err.message);
      }

      // Service ID missing
      if (err.message.includes("Each service must include serviceId")) {
        throw request.server.httpErrors.badRequest(err.message);
      }

      // Invalid reference (Prisma foreign key error)
      if (err.message.includes("Invalid reference:")) {
        throw request.server.httpErrors.badRequest(err.message);
      }

      // Referenced record not found (Prisma P2025)
      if (err.message === "Referenced record not found") {
        throw request.server.httpErrors.notFound(err.message);
      }

      // Unhandled service error
      request.server.log.error(
        {
          error: err.message,
          medicalDocumentationId,
          operation: "createMedicalBill"
        },
        "Unhandled service error"
      );

      throw request.server.httpErrors.internalServerError(err.message);
    }

    // Non-Error thrown objects
    request.server.log.error(
      {
        error: err,
        medicalDocumentationId,
        operation: "createMedicalBill"
      },
      "Unexpected error creating medical bill"
    );

    throw request.server.httpErrors.internalServerError(
      "Failed to create medical bill"
    );
  }
}