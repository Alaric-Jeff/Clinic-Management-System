import type { FastifyInstance } from "fastify";
import type { Role, ServiceCategory, PaymentStatus } from "@prisma/client";
import { addPaymentHistory } from "../sales-analytics-services/add-paymenthistory-service.js";
import { updateDailyAnalytics } from "../sales-analytics-services/update-daily-analytics.js";

/**
 * @function createMedicalBillWithServices
 * @description
 * Creates a new medical bill linked to a patient's documentation with proper fee calculation.
 * If bill creation fails, the associated medical documentation is automatically deleted.
 * Supports consultation-only bills (no services) and bills with services.
 *
 * CALCULATION FORMULA:
 * ────────────────────
 * Services Subtotal:  Σ(service.price × quantity)  [0 if no services]
 * Services Discount:  Services Subtotal × (discountRate / 100)
 *                     - 20% if isSeniorPwdDiscountApplied
 *                     - Custom % if discountRate provided
 * Services Total:     Services Subtotal - Services Discount
 * Consultation Fee:   250 (default) or 350 (follow-up) — NOT discounted
 * ────────────────────────────────────────────────────────
 * TOTAL BILL:         Services Total + Consultation Fee
 *
 * Key Points:
 * - Supports consultation-only bills (empty services array)
 * - Discounts apply ONLY to services, NOT to consultation fee
 * - Consultation fee is always added at full price
 * - Senior/PWD discount (20%) and custom discounts are mutually exclusive
 * - If both are provided, Senior/PWD takes precedence
 * - If bill creation fails, documentation is deleted to prevent orphaned records
 *
 * @param {FastifyInstance} fastify - Fastify instance with Prisma and logger
 * @param {Object} body - Request payload matching createMedicalBillType
 * @param {string} medicalDocumentationId - Optional pre-created documentation ID for rollback
 *
 * @returns {Promise<{ success: boolean, message: string, data: any }>}
 */
export async function createMedicalBillWithServices(
  fastify: FastifyInstance,
  body: {
    medicalDocumentationId: string;
    services: { serviceId: string; quantity: number }[];
    notes?: string | null;
    initialPaymentAmount?: number;
    consultationFee?: number | null;
    paymentMethod?: string | null;
    createdByName: string;
    createdByRole: Role | string;
    isSeniorPwdDiscountApplied?: boolean;
    discountRate?: number;
  }
) {
  const {
    medicalDocumentationId,
    services,
    notes,
    initialPaymentAmount,
    consultationFee: inputConsultationFee,
    paymentMethod,
    createdByName,
    createdByRole,
    isSeniorPwdDiscountApplied = false,
    discountRate = 0,
  } = body;

  // ✅ Normalize consultation fee: 250 or 350, default to 250
  const normalizeConsultationFee = (fee: number | null | undefined): number => {
    const VALID_FEES = [250, 350];
    if (fee === null || fee === undefined) return 250;
    return VALID_FEES.includes(fee) ? fee : 250;
  };
  const effectiveConsultationFee = normalizeConsultationFee(inputConsultationFee);

  fastify.log.info(
    `[createMedicalBillWithServices] Start: docId=${medicalDocumentationId}, consultationFee=${effectiveConsultationFee}, seniorPwdDiscount=${isSeniorPwdDiscountApplied}, discountRate=${discountRate}%`
  );

  try {
    // ✅ Validate services array structure (allow empty for consultation-only bills)
    if (!Array.isArray(services)) {
      throw new Error("Services must be an array (can be empty for consultation-only bills).");
    }

    // ✅ Fetch medical documentation and verify patient data
    const documentation = await fastify.prisma.medicalDocumentation.findUnique({
      where: { id: medicalDocumentationId },
      include: { patient: true },
    });

    if (!documentation) throw new Error("Medical documentation not found");
    if (documentation.status === "draft") throw new Error("Cannot create bill for draft documentation.");

    const patient = documentation.patient;

    // ✅ Validate Senior/PWD discount eligibility (EARLY VALIDATION)
    if (isSeniorPwdDiscountApplied && !patient.csdIdOrPwdId) {
      throw new Error("Cannot apply senior/PWD discount — no valid ID on record.");
    }

    // 🧮 STEP 1: Calculate services subtotal
    let servicesSubtotal = 0;
    const billedServicesData: {
      serviceId: string;
      serviceName: string;
      serviceCategory: ServiceCategory;
      servicePriceAtTime: number;
      quantity: number;
      subtotal: number;
    }[] = [];

    // Check if this is a consultation-only bill
    const isConsultationOnly = services.length === 0;

    if (isConsultationOnly) {
      fastify.log.info("[Calculation] Creating consultation-only bill (no services)");
    } else {
      // Process services
      for (const item of services) {
        const qty = Number(item.quantity ?? 1);
        if (!item.serviceId) throw new Error("Each service must include serviceId");
        if (!Number.isFinite(qty) || qty <= 0) throw new Error("Service quantity must be positive");

        const service = await fastify.prisma.service.findUnique({
          where: { id: item.serviceId },
          select: { id: true, name: true, category: true, price: true, isActivated: true, isAvailable: true },
        });

        if (!service) throw new Error(`Service not found: ${item.serviceId}`);
        if (!service.isActivated) throw new Error(`Service is deactivated: ${service.name}`);
        if (!service.isAvailable) throw new Error(`Service is not available: ${service.name}`);

        const subtotal = Number((service.price * qty).toFixed(2));
        servicesSubtotal += subtotal;

        billedServicesData.push({
          serviceId: service.id,
          serviceName: service.name,
          serviceCategory: service.category as ServiceCategory,
          servicePriceAtTime: service.price,
          quantity: qty,
          subtotal,
        });
      }
    }

    fastify.log.debug(`[Calculation] Services Subtotal: ₱${servicesSubtotal.toFixed(2)}`);

    // 💰 STEP 2: Calculate discount (applies ONLY to services, NOT consultation fee)
    const validDiscountRate = Math.max(0, Math.min(100, discountRate));
    let discountAmount = 0;
    let effectiveDiscountRate = 0;
    let discountType = "none";

    // Only apply discounts if there are services
    if (servicesSubtotal > 0) {
      if (isSeniorPwdDiscountApplied) {
        // 20% Senior/PWD discount applied to services only
        discountAmount = Number((servicesSubtotal * 0.2).toFixed(2));
        effectiveDiscountRate = 20;
        discountType = "senior_pwd";
        fastify.log.debug(`[Calculation] Senior/PWD Discount (20%): -₱${discountAmount.toFixed(2)}`);
      } else if (validDiscountRate > 0) {
        // Custom discount applied to services only
        discountAmount = Number((servicesSubtotal * (validDiscountRate / 100)).toFixed(2));
        effectiveDiscountRate = validDiscountRate;
        discountType = "custom";
        fastify.log.debug(`[Calculation] Custom Discount (${validDiscountRate}%): -₱${discountAmount.toFixed(2)}`);
      }
    } else if (isSeniorPwdDiscountApplied || validDiscountRate > 0) {
      fastify.log.warn("[Calculation] Discount requested but no services to apply it to (consultation-only bill)");
    }

    // STEP 3: Calculate services total after discount
    const servicesTotal = Number((servicesSubtotal - discountAmount).toFixed(2));
    fastify.log.debug(`[Calculation] Services Total (after discount): ₱${servicesTotal.toFixed(2)}`);

    // STEP 4: Add consultation fee (NOT affected by discounts)
    const totalAmount = Number((servicesTotal + effectiveConsultationFee).toFixed(2));
    fastify.log.debug(`[Calculation] Consultation Fee (no discount): +₱${effectiveConsultationFee.toFixed(2)}`);
    fastify.log.debug(`[Calculation] ═══════════════════════════════`);
    fastify.log.debug(`[Calculation] TOTAL BILL: ₱${totalAmount.toFixed(2)}`);

    // ✅ Validate initial payment
    if (initialPaymentAmount && initialPaymentAmount > totalAmount) {
      throw new Error(`Initial payment (₱${initialPaymentAmount}) exceeds total (₱${totalAmount})`);
    }

    const effectivePaymentMethod = paymentMethod ?? "cash";

    // ⚙️ Transaction: create bill, add services, handle payments, and log audit
    const result = await fastify.prisma.$transaction(async (prisma) => {
      fastify.log.debug("[Transaction] Creating medical bill...");

      const medicalBill = await prisma.medicalBill.create({
        data: {
          medicalDocumentationId,
          consultationFee: effectiveConsultationFee,
          isSeniorPwdDiscountApplied,
          discountRate: effectiveDiscountRate,
          totalAmount,
          amountPaid: 0,
          balance: totalAmount,
          paymentStatus: "unpaid",
          createdByName,
          createdByRole: createdByRole as Role,
          ...(notes && { notes }),
        },
      });

      fastify.log.debug(`[Transaction] Bill created: ${medicalBill.id}`);

      // Only create billed services if there are any
      if (billedServicesData.length > 0) {
        await prisma.billedService.createMany({
          data: billedServicesData.map((s) => ({
            medicalBillId: medicalBill.id,
            ...s,
          })),
        });
        fastify.log.debug(`[Transaction] Added ${billedServicesData.length} billed services`);
      } else {
        fastify.log.debug("[Transaction] No services to add (consultation-only bill)");
      }

      // Handle initial payment
      if (initialPaymentAmount && initialPaymentAmount > 0) {
        await addPaymentHistory(
          fastify,
          {
            medicalBillId: medicalBill.id,
            amountPaid: Number(initialPaymentAmount.toFixed(2)),
            paymentMethod: effectivePaymentMethod,
            notes: "Initial payment at billing",
            recordedByName: createdByName,
            recordedByRole: createdByRole as Role,
          },
          prisma as any
        );
        fastify.log.debug(`[Transaction] Initial payment recorded: ₱${initialPaymentAmount.toFixed(2)}`);
      }

      // Recalculate payment status based on payment history
      const payments = await prisma.paymentHistory.findMany({
        where: { medicalBillId: medicalBill.id },
        select: { amountPaid: true },
      });

      const amountPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
      const balance = Number((totalAmount - amountPaid).toFixed(2));

      const paymentStatus: PaymentStatus =
        amountPaid === 0 ? "unpaid" : amountPaid >= totalAmount ? "paid" : "partially_paid";

      const updatedBill = await prisma.medicalBill.update({
        where: { id: medicalBill.id },
        data: { amountPaid, balance, paymentStatus },
        include: { billedServices: true },
      });

      fastify.log.debug(`[Transaction] Updated bill payment status: ${paymentStatus}`);

      // Create comprehensive audit log
      await prisma.billAuditLog.create({
        data: {
          medicalBillId: medicalBill.id,
          action: "created",
          fieldsChanged: "totalAmount,amountPaid,balance,paymentStatus,discountRate,isSeniorPwdDiscountApplied,consultationFee",
          newData: JSON.stringify({
            isConsultationOnly,
            consultationFee: effectiveConsultationFee,
            servicesSubtotal,
            discountType,
            discountRate: effectiveDiscountRate,
            discountAmount,
            servicesTotal,
            totalAmount,
            amountPaid,
            balance,
            paymentStatus,
            isSeniorPwdDiscountApplied,
          }),
          changedByName: createdByName,
          changedByRole: createdByRole as Role,
        },
      });

      fastify.log.info(`[Transaction] Audit log created for bill ${medicalBill.id}`);

      return {
        updatedBill,
        amountPaid,
        balance,
        paymentStatus,
        billedServicesCount: billedServicesData.length,
        isConsultationOnly,
      };
    });

    // 🧾 Update analytics
    const today = new Date();
    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    fastify.log.debug("[Analytics] Updating daily analytics...");

    await updateDailyAnalytics(fastify, dateOnly.toISOString());

    fastify.log.info(`[Analytics] Daily analytics updated for ${dateOnly.toISOString()}`);

    return {
      success: true,
      message: result.isConsultationOnly 
        ? "Consultation-only bill created successfully" 
        : "Medical bill created successfully",
      data: {
        ...result.updatedBill,
        billedServicesCount: result.billedServicesCount,
        isConsultationOnly: result.isConsultationOnly,
      },
    };
  } catch (err: any) {
    fastify.log.error({ err, operation: "createMedicalBillWithServices" });

    // 🗑️ CLEANUP: Delete medical documentation if bill creation failed
    fastify.log.warn(
      `[Cleanup] Bill creation failed for documentation ${medicalDocumentationId}. Attempting to delete orphaned documentation...`
    );

    try {
      await deleteMedicalDocumentationIfFailed(fastify, { id: medicalDocumentationId });
      fastify.log.info(`[Cleanup] Successfully deleted orphaned documentation ${medicalDocumentationId}`);
    } catch (deleteErr: any) {
      fastify.log.error({
        err: deleteErr,
        docId: medicalDocumentationId,
        operation: "deleteMedicalDocumentationIfFailed",
      }, "Failed to delete orphaned documentation during cleanup");
    }

    // Re-throw the original error with better message
    if (err.code === "P2025") throw new Error("Referenced record not found");
    if (err.code === "P2003") throw new Error("Invalid reference: Medical documentation or service not found");
    if (err.code === "P2002") throw new Error("Duplicate medical bill for this documentation");

    throw err;
  }
}

/**
 * @function deleteMedicalDocumentationIfFailed
 * @description
 * Utility function to delete a medical documentation record.
 * Used for cleanup when bill creation fails to prevent orphaned records.
 *
 * @param {FastifyInstance} fastify - Fastify instance with Prisma
 * @param {Object} body - Request payload
 * @param {string} body.id - Medical documentation ID to delete
 *
 * @throws {Error} If documentation not found or deletion fails
 */
export async function deleteMedicalDocumentationIfFailed(
  fastify: FastifyInstance,
  body: { id: string }
) {
  const { id } = body;

  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new Error("Invalid documentation ID provided for deletion");
  }

  try {
    fastify.log.debug(`[deleteMedicalDocumentationIfFailed] Attempting to delete documentation: ${id}`);

    const deletedDoc = await fastify.prisma.medicalDocumentation.delete({
      where: { id },
    });

    fastify.log.info(`[deleteMedicalDocumentationIfFailed] Successfully deleted documentation: ${id}`);
    return { success: true, deleted: deletedDoc };
  } catch (err: any) {
    // Handle specific Prisma errors
    if (err.code === "P2025") {
      fastify.log.warn(`[deleteMedicalDocumentationIfFailed] Documentation not found: ${id}`);
      throw new Error(`Medical documentation ${id} not found for deletion`);
    }

    fastify.log.error({
      err,
      docId: id,
      operation: "deleteMedicalDocumentationIfFailed",
    });

    throw err;
  }
}