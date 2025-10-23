import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { type addPaymentHistoryParameterType } from "../../type-schemas/analytics-schemas/add-payment-schema.js";

export async function addPaymentHistory(
  fastify: FastifyInstance,
  body: addPaymentHistoryParameterType,
  prismaOverride?: PrismaClient
) {
  const prisma = prismaOverride ?? fastify.prisma;
  const {
    medicalBillId,
    amountPaid,
    paymentMethod,
    notes,
    recordedByName,
    recordedByRole,
  } = body;

  try {
    const payment = await prisma.paymentHistory.create({
      data: {
        medicalBillId,
        amountPaid,
        paymentMethod,
        notes,
        recordedByName,
        recordedByRole,
      },
    });

    return payment;
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(`Error creating payment history: ${err.message}`);
    }
    throw err;
  }
}
