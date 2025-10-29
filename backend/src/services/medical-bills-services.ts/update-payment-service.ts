import type { FastifyInstance } from "fastify";
import { PaymentStatus } from "@prisma/client";
import type { SettleBillType } from '../../type-schemas/payment/update-payment-schema.js';
import { updateDailyAnalytics } from '../sales-analytics-services/update-daily-analytics.js';

export async function updatePaymentService(
    fastify: FastifyInstance,
    body: SettleBillType
) {
    const {
        medicalBillId,
        paymentAmount,
        paymentMethod,
        notes,
        updatedByName,
        updatedByRole
    } = body;

    try {
        // Use transaction for atomic operations
        const result = await fastify.prisma.$transaction(async (tx) => {
            // 1. Get and lock the medical bill
            const medicalBill = await tx.medicalBill.findUnique({
                where: { id: medicalBillId },
                select: {
                    id: true,
                    paymentStatus: true,
                    amountPaid: true,
                    totalAmount: true,
                    balance: true,
                    createdAt: true
                }
            });

            if (!medicalBill) {
                throw new Error("Medical bill with id doesn't exist");
            }

            if (medicalBill.paymentStatus === "paid") {
                throw new Error("Idempotent, the payment status is already fully paid");
            }

            // 2. Calculate new values with proper floating point handling
            const newAmountPaid = medicalBill.amountPaid + paymentAmount;
            const newBalance = Math.max(0, medicalBill.totalAmount - newAmountPaid);
            
            // Use tolerance for floating point comparisons
            const isFullyPaid = newBalance <= 0.01;
            const newPaymentStatus = isFullyPaid ? PaymentStatus.paid : PaymentStatus.partially_paid;

            // 3. Update medical bill
            const updatedBill = await tx.medicalBill.update({
                where: { id: medicalBillId },
                data: {
                    amountPaid: newAmountPaid,
                    balance: newBalance,
                    paymentStatus: newPaymentStatus,
                    lastUpdatedByName: updatedByName,
                    lastUpdatedByRole: updatedByRole
                }
            });

            // 4. Create payment history record
            const paymentHistory = await tx.paymentHistory.create({
                data: {
                    medicalBillId: medicalBillId,
                    amountPaid: paymentAmount,
                    paymentMethod: paymentMethod,
                    notes: notes || null,
                    recordedByName: updatedByName,
                    recordedByRole: updatedByRole
                }
            });

            // 5. Create bill audit log
            await tx.billAuditLog.create({
                data: {
                    medicalBillId: medicalBillId,
                    action: "payment_recorded",
                    fieldsChanged: "amountPaid,balance,paymentStatus",
                    previousData: JSON.stringify({
                        amountPaid: medicalBill.amountPaid,
                        balance: medicalBill.balance,
                        paymentStatus: medicalBill.paymentStatus
                    }),
                    newData: JSON.stringify({
                        amountPaid: newAmountPaid,
                        balance: newBalance,
                        paymentStatus: newPaymentStatus
                    }),
                    changedByName: updatedByName,
                    changedByRole: updatedByRole
                }
            });

            return {
                medicalBill: updatedBill,
                paymentHistory: paymentHistory
            };
        });

        // 6. Update analytics OUTSIDE the transaction for performance
        // Create a proper Date object for the analytics
        const paymentDate = new Date();
        
        // Try calling updateDailyAnalytics with a Date object instead of string
        const analyticsDate = new Date(
            paymentDate.getFullYear(),
            paymentDate.getMonth(),
            paymentDate.getDate()
        );
        
        // This will recalculate the entire day's analytics from source data
        // pass ISO string so it matches DailyAnalyticsPayload (string path)
        await updateDailyAnalytics(fastify, analyticsDate.toISOString());
        
        fastify.log.info("Successfully updated payment");
        return result;

    } catch (err: unknown) {
        if(err instanceof Error){
            fastify.log.error(`Error updating payment: ${err.message}`);
            fastify.log.error(`Stack: ${err.stack}`);
        } else {
            fastify.log.error(`Unknown Error in updating payment: ${err}`);
        }
        throw err;
    }
}