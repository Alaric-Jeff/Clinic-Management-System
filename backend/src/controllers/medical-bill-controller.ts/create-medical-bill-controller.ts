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
 * Calculates payment status and balance from PaymentHistory.
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

    // Log bill creation request
    request.server.log.info(
      {
        medicalDocumentationId,
        servicesCount: services.length,
        createdBy: name,
        userRole: role,
        hasInitialPayment: initialPaymentAmount ? true : false,
        paymentMethod,
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
    };

    // Add optional fields if they have values
    if (initialPaymentAmount !== undefined) {
      serviceInput.initialPaymentAmount = initialPaymentAmount;
    }
    if (paymentMethod !== undefined) {
      serviceInput.paymentMethod = paymentMethod;
    }
    if (isSeniorPwdDiscountApplied !== undefined) {
      serviceInput.isSeniorPwdDiscountApplied = isSeniorPwdDiscountApplied;
    }
    if (discountRate !== undefined) {
      serviceInput.discountRate = discountRate;
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

      // Senior/PWD discount without valid ID - NEW ERROR
      if (err.message.includes("Cannot apply senior/PWD discount")) {
        throw request.server.httpErrors.badRequest(err.message);
      }

      // Payment exceeds total
      if (err.message.includes("cannot exceed total bill amount")) {
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

      // Bill already exists
      if (err.message === "Medical bill already exists for this documentation") {
        throw request.server.httpErrors.conflict(err.message);
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

      // Invalid reference (Prisma foreign key error)
      if (err.message.includes("Invalid reference:")) {
        throw request.server.httpErrors.badRequest(err.message);
      }

      // Referenced record not found
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