import type { FastifyRequest, FastifyReply } from "fastify";
import type {
  updateMedicalBillType,
  updateMedicalBillResponseType,
  updateMedicalBillServiceInputType,
} from "../../type-schemas/medical-bills-schema.js";
import { updateMedicalBillWithServices } from "../../services/medical-bills-services/update-medical-bill-services.js";
import type { Role } from "@prisma/client";

/**
 * Controller: Update Medical Bill with Services
 *
 * Handles HTTP request/response for updating a medical bill.
 * Supports adding/removing/updating services and changing discount settings.
 * All changes are audited in BillAuditLog and BilledServiceAuditLog.
 *
 * @param request - Fastify request with update data in body
 * @param reply - Fastify reply object
 * @returns Updated bill with changes summary (200 OK)
 * @throws {Error} HTTP errors from fastify.httpErrors
 */
export async function updateMedicalBillController(
  request: FastifyRequest<{
    Body: updateMedicalBillType;
  }>,
  reply: FastifyReply
): Promise<updateMedicalBillResponseType> {
  const {
    medicalBillId,
    servicesToAdd,
    servicesToRemove,
    servicesToUpdate,
    isSeniorPwdDiscountApplied,
    discountRate,
    notes,
  } = request.body;

  try {
    // Get authenticated user
    const user = request.currentUser;

    if (!user) {
      throw request.server.httpErrors.unauthorized("Authentication required");
    }

    const name: string = user.name;
    const role: Role = user.role as Role;

    // Log update request
    request.server.log.info(
      {
        medicalBillId,
        servicesToAddCount: servicesToAdd?.length ?? 0,
        servicesToRemoveCount: servicesToRemove?.length ?? 0,
        servicesToUpdateCount: servicesToUpdate?.length ?? 0,
        updatedBy: name,
        userRole: role,
        hasDiscountChange: isSeniorPwdDiscountApplied !== undefined || discountRate !== undefined,
      },
      "Medical bill update requested"
    );

    // Build service input
    const serviceInput: updateMedicalBillServiceInputType = {
      medicalBillId,
      updatedByName: name,
      updatedByRole: role,
    };

    // Add optional fields
    if (servicesToAdd !== undefined) serviceInput.servicesToAdd = servicesToAdd;
    if (servicesToRemove !== undefined) serviceInput.servicesToRemove = servicesToRemove;
    if (servicesToUpdate !== undefined) serviceInput.servicesToUpdate = servicesToUpdate;
    if (isSeniorPwdDiscountApplied !== undefined) serviceInput.isSeniorPwdDiscountApplied = isSeniorPwdDiscountApplied;
    if (discountRate !== undefined) serviceInput.discountRate = discountRate;
    if (notes !== undefined) serviceInput.notes = notes;

    const result = await updateMedicalBillWithServices(request.server, serviceInput);

    // Return successful response
    return reply.code(200).send(result);
  } catch (err: unknown) {
    if (err instanceof Error) {
      request.server.log.error(
        {
          error: err.message,
          medicalBillId,
          userId: request.currentUser?.id,
        },
        "Error updating medical bill"
      );

      // Medical bill not found
      if (err.message === "Medical bill not found") {
        throw request.server.httpErrors.notFound(err.message);
      }

      // Senior/PWD discount without valid ID
      if (err.message.includes("Cannot apply senior/PWD discount")) {
        throw request.server.httpErrors.badRequest(err.message);
      }

      // Service not found
      if (err.message.includes("Service not found:")) {
        throw request.server.httpErrors.notFound(err.message);
      }

      // Billed service not found
      if (err.message.includes("Billed service not found:")) {
        throw request.server.httpErrors.notFound(err.message);
      }

      // Service doesn't belong to bill
      if (err.message.includes("does not belong to this bill")) {
        throw request.server.httpErrors.badRequest(err.message);
      }

      // Service is deactivated
      if (err.message.includes("Service is deactivated:")) {
        throw request.server.httpErrors.badRequest(err.message);
      }

      // Service is not available
      if (err.message.includes("Service is not available:")) {
        throw request.server.httpErrors.badRequest(err.message);
      }

      // Invalid quantity
      if (err.message.includes("quantity must be a positive number")) {
        throw request.server.httpErrors.badRequest(err.message);
      }

      // Invalid reference
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
          medicalBillId,
          operation: "updateMedicalBill",
        },
        "Unhandled service error"
      );

      throw request.server.httpErrors.internalServerError(err.message);
    }

    // Non-Error thrown objects
    request.server.log.error(
      {
        error: err,
        medicalBillId,
        operation: "updateMedicalBill",
      },
      "Unexpected error updating medical bill"
    );

    throw request.server.httpErrors.internalServerError("Failed to update medical bill");
  }
}