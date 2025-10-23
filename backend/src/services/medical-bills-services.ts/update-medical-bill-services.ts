import type { FastifyInstance } from "fastify";
import type { Role, ServiceCategory, PaymentStatus } from "@prisma/client";
import { updateDailyAnalytics } from "../sales-analytics-services/update-daily-analytics.js";
import { updatePaymentHistory } from "../sales-analytics-services/update-paymenthistory-service.js";

/**
 * Service: Update Medical Bill with Services
 *
 * Updates a medical bill including adding/removing/modifying services and discount settings.
 * Handles recalculation of totals, payment status, comprehensive audit logging,
 * and updates to daily analytics and payment history.
 *
 * Operations Supported:
 * - Add new services to bill
 * - Remove existing services from bill
 * - Update quantities of existing services
 * - Change discount settings (senior/PWD or manual)
 * - Update notes
 * - Update daily sales analytics
 * - Update payment history when payment details change
 *
 * @param fastify - Fastify instance with Prisma client
 * @param body - Request payload with update details
 * @returns Updated bill with changes summary
 * @throws {Error} Validation or business logic errors
 */
export async function updateMedicalBillWithServices(
  fastify: FastifyInstance,
  body: {
    medicalBillId: string;
    servicesToAdd?: { serviceId: string; quantity: number }[];
    servicesToRemove?: string[];
    servicesToUpdate?: { billedServiceId: string; quantity: number }[];
    isSeniorPwdDiscountApplied?: boolean;
    discountRate?: number;
    notes?: string | null;
    updatedByName: string;
    updatedByRole: Role | string;
    // Optional payment update fields
    amountPaid?: number;
    paymentMethod?: string;
    paymentNotes?: string;
  }
) {
  const {
    medicalBillId,
    servicesToAdd = [],
    servicesToRemove = [],
    servicesToUpdate = [],
    isSeniorPwdDiscountApplied,
    discountRate,
    notes,
    updatedByName,
    updatedByRole,
    amountPaid: newAmountPaid,
    paymentMethod,
    paymentNotes,
  } = body;

  try {
    // 1. Fetch existing bill with all relations
    const existingBill = await fastify.prisma.medicalBill.findUnique({
      where: { id: medicalBillId },
      include: {
        billedServices: true,
        medicalDocumentation: {
          include: { patient: true },
        },
        paymentHistory: true,
      },
    });

    if (!existingBill) {
      throw new Error("Medical bill not found");
    }

    const patient = existingBill.medicalDocumentation.patient;

    // Store original state for audit and analytics
    const originalState = {
      isSeniorPwdDiscountApplied: existingBill.isSeniorPwdDiscountApplied,
      discountRate: existingBill.discountRate,
      totalAmount: existingBill.totalAmount,
      notes: existingBill.notes,
      servicesCount: existingBill.billedServices.length,
      paymentStatus: existingBill.paymentStatus,
      amountPaid: existingBill.amountPaid,
    };

    // 2. Validate discount changes
    const newIsSeniorPwd = isSeniorPwdDiscountApplied ?? existingBill.isSeniorPwdDiscountApplied;
    if (newIsSeniorPwd && !patient.csdIdOrPwdId) {
      throw new Error(
        "Cannot apply senior/PWD discount — patient has no valid senior/PWD ID on record"
      );
    }

    // 3. Start transaction
    const result = await fastify.prisma.$transaction(async (prisma) => {
      const changesLog = {
        servicesAdded: 0,
        servicesRemoved: 0,
        servicesUpdated: 0,
        discountChanged: false,
        notesChanged: false,
        paymentUpdated: false,
        statusChanged: false,
      };

      // --- REMOVE SERVICES ---
      if (servicesToRemove.length > 0) {
        // Get services before deletion for audit
        const servicesToDelete = await prisma.billedService.findMany({
          where: {
            id: { in: servicesToRemove },
            medicalBillId,
          },
        });

        if (servicesToDelete.length !== servicesToRemove.length) {
          throw new Error("One or more billed services not found or don't belong to this bill");
        }

        // Create audit logs for each removed service
        for (const service of servicesToDelete) {
          await prisma.billedServiceAuditLog.create({
            data: {
              billedServiceId: service.id,
              medicalBillId,
              action: "removed",
              fieldsChanged: "deleted",
              previousData: JSON.stringify(service),
              newData: null,
              changedByName: updatedByName,
              changedByRole: updatedByRole as Role,
            },
          });
        }

        // Delete services
        await prisma.billedService.deleteMany({
          where: { id: { in: servicesToRemove } },
        });

        changesLog.servicesRemoved = servicesToDelete.length;
      }

      // --- UPDATE SERVICE QUANTITIES ---
      if (servicesToUpdate.length > 0) {
        for (const update of servicesToUpdate) {
          const existingService = await prisma.billedService.findUnique({
            where: { id: update.billedServiceId },
          });

          if (!existingService) {
            throw new Error(`Billed service not found: ${update.billedServiceId}`);
          }

          if (existingService.medicalBillId !== medicalBillId) {
            throw new Error(`Service ${update.billedServiceId} does not belong to this bill`);
          }

          const qty = Number(update.quantity);
          if (!Number.isFinite(qty) || qty <= 0) {
            throw new Error("Service quantity must be a positive number");
          }

          // Calculate new subtotal
          const newSubtotal = Number((existingService.servicePriceAtTime * qty).toFixed(2));

          // Update service
          const updatedService = await prisma.billedService.update({
            where: { id: update.billedServiceId },
            data: {
              quantity: qty,
              subtotal: newSubtotal,
            },
          });

          // Create audit log
          await prisma.billedServiceAuditLog.create({
            data: {
              billedServiceId: update.billedServiceId,
              medicalBillId,
              action: "quantity_updated",
              fieldsChanged: "quantity,subtotal",
              previousData: JSON.stringify({
                quantity: existingService.quantity,
                subtotal: existingService.subtotal,
              }),
              newData: JSON.stringify({
                quantity: updatedService.quantity,
                subtotal: updatedService.subtotal,
              }),
              changedByName: updatedByName,
              changedByRole: updatedByRole as Role,
            },
          });

          changesLog.servicesUpdated++;
        }
      }

      // --- ADD NEW SERVICES ---
      type BilledServicePayload = {
        serviceId?: string | null;
        serviceName: string;
        serviceCategory: ServiceCategory;
        servicePriceAtTime: number;
        quantity: number;
        subtotal: number;
      };

      const newServicesData: BilledServicePayload[] = [];

      if (servicesToAdd.length > 0) {
        for (const item of servicesToAdd) {
          if (!item?.serviceId) {
            throw new Error("Each service must include serviceId");
          }

          const qty = Number(item.quantity ?? 1);
          if (!Number.isFinite(qty) || qty <= 0) {
            throw new Error("Service quantity must be a positive number");
          }

          const service = await prisma.service.findUnique({
            where: { id: item.serviceId },
            select: {
              id: true,
              name: true,
              category: true,
              price: true,
              isActivated: true,
              isAvailable: true,
            },
          });

          if (!service) {
            throw new Error(`Service not found: ${item.serviceId}`);
          }
          if (!service.isActivated) {
            throw new Error(`Service is deactivated: ${service.name}`);
          }
          if (!service.isAvailable) {
            throw new Error(`Service is not available: ${service.name}`);
          }

          const subtotal = Number((service.price * qty).toFixed(2));

          newServicesData.push({
            serviceId: service.id,
            serviceName: service.name,
            serviceCategory: service.category as ServiceCategory,
            servicePriceAtTime: service.price,
            quantity: qty,
            subtotal,
          });
        }

        // Create new services
        const createdServices = await prisma.billedService.createManyAndReturn({
          data: newServicesData.map((s) => ({
            medicalBillId,
            ...s,
          })),
        });

        // Create audit logs for added services
        for (const service of createdServices) {
          await prisma.billedServiceAuditLog.create({
            data: {
              billedServiceId: service.id,
              medicalBillId,
              action: "added",
              fieldsChanged: "serviceName,quantity,subtotal",
              previousData: null,
              newData: JSON.stringify(service),
              changedByName: updatedByName,
              changedByRole: updatedByRole as Role,
            },
          });
        }

        changesLog.servicesAdded = createdServices.length;
      }

      // --- RECALCULATE TOTALS ---
      // Fetch all current services after add/remove/update
      const currentServices = await prisma.billedService.findMany({
        where: { medicalBillId },
      });

      const servicesTotal = currentServices.reduce((sum, s) => sum + s.subtotal, 0);

      // Determine discount
      const BASE_CONSULTATION_FEE = 250;
      const newDiscountRate = discountRate ?? existingBill.discountRate;
      const validDiscountRate = Math.max(0, Math.min(100, newDiscountRate));

      let discountAmount = 0;
      let effectiveDiscountRate = 0;

      if (newIsSeniorPwd) {
        discountAmount = servicesTotal * 0.2; // 20% for senior/PWD
        effectiveDiscountRate = 20;
      } else if (validDiscountRate > 0) {
        discountAmount = servicesTotal * (validDiscountRate / 100);
        effectiveDiscountRate = validDiscountRate;
      }

      // Formula: ((services total - discount) + consultation fee)
      const newTotalAmount = Number(
        ((servicesTotal - discountAmount) + BASE_CONSULTATION_FEE).toFixed(2)
      );

      // Get current payments
      const payments = await prisma.paymentHistory.findMany({
        where: { medicalBillId },
        select: { amountPaid: true },
      });
      const totalAmountPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
      
      // Use new payment amount if provided, otherwise use existing
      const finalAmountPaid = newAmountPaid !== undefined ? newAmountPaid : totalAmountPaid;
      const balance = Number((newTotalAmount - finalAmountPaid).toFixed(2));

      const previousPaymentStatus = originalState.paymentStatus;
      const paymentStatus: PaymentStatus =
        finalAmountPaid === 0
          ? "unpaid"
          : finalAmountPaid >= newTotalAmount
          ? "paid"
          : "partially_paid";

      // Track changes
      changesLog.discountChanged =
        newIsSeniorPwd !== originalState.isSeniorPwdDiscountApplied ||
        effectiveDiscountRate !== originalState.discountRate;
      changesLog.notesChanged = notes !== undefined && notes !== originalState.notes;
      changesLog.paymentUpdated = newAmountPaid !== undefined;
      changesLog.statusChanged = previousPaymentStatus !== paymentStatus;

      // --- UPDATE BILL ---
      const updatedBill = await prisma.medicalBill.update({
        where: { id: medicalBillId },
        data: {
          isSeniorPwdDiscountApplied: newIsSeniorPwd,
          discountRate: effectiveDiscountRate,
          totalAmount: newTotalAmount,
          amountPaid: finalAmountPaid,
          balance,
          paymentStatus,
          lastUpdatedByName: updatedByName,
          lastUpdatedByRole: updatedByRole as Role,
          ...(notes !== undefined && { notes }),
        },
        include: {
          billedServices: true,
        },
      });

      // --- UPDATE PAYMENT HISTORY (if payment was made) ---
      if (newAmountPaid !== undefined) {
        try {
          await updatePaymentHistory(fastify, {
            medicalBillId,
            amountPaid: newAmountPaid,
            ...(paymentMethod && { paymentMethod }),
            ...(paymentNotes && { notes: paymentNotes }),
          });
        } catch (paymentHistoryError) {
          // If payment history doesn't exist yet, create it
          if (paymentHistoryError instanceof Error && 
              paymentHistoryError.message.includes("not found")) {
            // Build data object carefully to avoid undefined values
            const paymentHistoryData: any = {
              medicalBillId,
              amountPaid: newAmountPaid,
              recordedByName: updatedByName,
              recordedByRole: updatedByRole as Role,
            };
            
            // Only add optional fields if they have actual values
            if (paymentMethod) {
              paymentHistoryData.paymentMethod = paymentMethod;
            }
            if (paymentNotes) {
              paymentHistoryData.notes = paymentNotes;
            }
            
            await prisma.paymentHistory.create({
              data: paymentHistoryData,
            });
          } else {
            throw paymentHistoryError;
          }
        }
      }

      // --- CREATE BILL AUDIT LOG ---
      const fieldsChanged: string[] = [];
      const previousData: any = {};
      const newData: any = {};

      if (changesLog.servicesAdded > 0 || changesLog.servicesRemoved > 0 || changesLog.servicesUpdated > 0) {
        fieldsChanged.push("billedServices");
        previousData.servicesCount = originalState.servicesCount;
        newData.servicesCount = updatedBill.billedServices.length;
      }

      if (changesLog.discountChanged) {
        fieldsChanged.push("isSeniorPwdDiscountApplied", "discountRate");
        previousData.isSeniorPwdDiscountApplied = originalState.isSeniorPwdDiscountApplied;
        previousData.discountRate = originalState.discountRate;
        newData.isSeniorPwdDiscountApplied = updatedBill.isSeniorPwdDiscountApplied;
        newData.discountRate = updatedBill.discountRate;
      }

      if (originalState.totalAmount !== newTotalAmount) {
        fieldsChanged.push("totalAmount", "balance", "paymentStatus");
        previousData.totalAmount = originalState.totalAmount;
        newData.totalAmount = newTotalAmount;
      }

      if (changesLog.paymentUpdated) {
        fieldsChanged.push("amountPaid");
        previousData.amountPaid = originalState.amountPaid;
        newData.amountPaid = finalAmountPaid;
      }

      if (changesLog.notesChanged) {
        fieldsChanged.push("notes");
        previousData.notes = originalState.notes;
        newData.notes = notes;
      }

      await prisma.billAuditLog.create({
        data: {
          medicalBillId,
          action: changesLog.paymentUpdated ? "payment_recorded" : "updated",
          fieldsChanged: fieldsChanged.join(","),
          previousData: JSON.stringify({
            ...previousData,
            servicesTotal: originalState.servicesCount > 0 ? existingBill.billedServices.reduce((sum, s) => sum + s.subtotal, 0) : 0,
          }),
          newData: JSON.stringify({
            ...newData,
            servicesTotal,
            discountAmount,
            consultationFee: BASE_CONSULTATION_FEE,
            balance,
            paymentStatus,
          }),
          changedByName: updatedByName,
          changedByRole: updatedByRole as Role,
        },
      });

      return {
        updatedBill,
        changesLog,
        billedServicesCount: currentServices.length,
        previousPaymentStatus,
        newPaymentStatus: paymentStatus,
        revenueChange: newTotalAmount - originalState.totalAmount,
      };
    });

    // --- UPDATE DAILY ANALYTICS (after successful transaction) ---
    try {
      const billDate = existingBill.createdAt.toISOString();
      
      // Calculate changes in analytics metrics
      const revenueChange = result.revenueChange;
      const servicesChange = result.changesLog.servicesAdded - result.changesLog.servicesRemoved;
      
      // Calculate payment status changes for analytics
      let paidBillsChange = 0;
      let unpaidBillsChange = 0;
      let partiallyPaidBillsChange = 0;

      if (result.previousPaymentStatus !== result.newPaymentStatus) {
        // Decrement old status
        if (result.previousPaymentStatus === "paid") paidBillsChange -= 1;
        else if (result.previousPaymentStatus === "unpaid") unpaidBillsChange -= 1;
        else if (result.previousPaymentStatus === "partially_paid") partiallyPaidBillsChange -= 1;

        // Increment new status
        if (result.newPaymentStatus === "paid") paidBillsChange += 1;
        else if (result.newPaymentStatus === "unpaid") unpaidBillsChange += 1;
        else if (result.newPaymentStatus === "partially_paid") partiallyPaidBillsChange += 1;
      }

      await updateDailyAnalytics(fastify, {
        date: billDate,
        totalRevenue: revenueChange,
        totalServices: servicesChange,
        paidBills: paidBillsChange,
        unpaidBills: unpaidBillsChange,
        partiallyPaidBills: partiallyPaidBillsChange,
        averageBillAmount: result.updatedBill.totalAmount,
        totalBills: 0, // No change in total bill count (not creating/deleting)
      });

      fastify.log.info(
        {
          operation: "updateDailyAnalytics",
          billId: medicalBillId,
          revenueChange,
          servicesChange,
          statusChange: `${result.previousPaymentStatus} -> ${result.newPaymentStatus}`,
        },
        "Daily analytics updated successfully"
      );
    } catch (analyticsError) {
      // Log error but don't fail the entire operation
      fastify.log.error(
        {
          operation: "updateDailyAnalytics",
          error: analyticsError instanceof Error ? analyticsError.message : "Unknown error",
          billId: medicalBillId,
        },
        "Failed to update daily analytics (non-critical)"
      );
    }

    // Log success
    fastify.log.info(
      {
        billId: medicalBillId,
        totalAmount: result.updatedBill.totalAmount,
        balance: result.updatedBill.balance,
        paymentStatus: result.updatedBill.paymentStatus,
        changes: result.changesLog,
        updatedBy: updatedByName,
      },
      "Medical bill updated successfully"
    );

    return {
      success: true,
      message: "Medical bill updated successfully",
      data: result.updatedBill,
      billedServicesCount: result.billedServicesCount,
      changes: result.changesLog,
    };
  } catch (err: any) {
    if (err.code === "P2025") {
      throw new Error("Referenced record not found");
    }
    if (err.code === "P2003") {
      throw new Error("Invalid reference: Service or bill not found");
    }

    fastify.log.error(
      {
        error: err.message,
        stack: err.stack,
        operation: "updateMedicalBillWithServices",
        medicalBillId,
      },
      "Failed to update medical bill"
    );
    throw err;
  }
}