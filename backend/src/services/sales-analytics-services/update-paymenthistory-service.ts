import type { FastifyInstance } from "fastify";
import type { updatePaymentHistoryType } from "../../type-schemas/analytics-schemas/update-payment-history-schema.js";

export async function updatePaymentHistory(
  fastify: FastifyInstance,
  body: updatePaymentHistoryType
) {
  const {
    medicalBillId,
    amountPaid,
    paymentMethod,
    notes
  } = body;

  const data: Record<string, any> = {};

  if (amountPaid !== undefined) data.amountPaid = amountPaid;
  if (paymentMethod !== undefined) data.paymentMethod = paymentMethod;
  if (notes !== undefined) data.notes = notes;

  try {

    if (Object.keys(data).length === 0) {
      throw new Error("No fields provided for update.");
    }

    const existingRecord = await fastify.prisma.paymentHistory.findFirst({
      where: { medicalBillId },
    });

    if (!existingRecord) {
      throw new Error("Payment history record not found for the provided medicalBillId.");
    }

    const updated = await fastify.prisma.paymentHistory.updateMany({
      where: { medicalBillId },
      data,
    });

    if (updated.count === 0) {
      throw new Error("Failed to update payment history — no matching records found.");
    }

    fastify.log.info({
      operation: "updatePaymentHistory",
      medicalBillId,
      updatedFields: Object.keys(data),
    }, "Payment history updated successfully");

    return {
      success: true,
      message: "Payment history updated successfully",
      updatedFields: data,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error({
        operation: "updatePaymentHistory",
        error: err.message,
        stack: err.stack,
      }, "Error updating payment history");
    }
    throw err;
  }
}
