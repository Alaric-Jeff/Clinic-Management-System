import type { FastifyInstance } from "fastify";
import type { Role, ServiceCategory, PaymentStatus } from "@prisma/client";
import { addPaymentHistory } from "../sales-analytics-services/add-paymenthistory-service.js";
import { updateDailyAnalytics } from "../sales-analytics-services/update-daily-analytics.js";

/**
 * @function createMedicalBillWithServices
 * @description
 * Creates a new medical bill linked to a patient's documentation, calculates totals,
 * applies discounts, optionally logs initial payment, and updates analytics.
 *
 * The core billing logic runs inside a Prisma transaction to ensure data consistency.
 *
 * @param {FastifyInstance} fastify - Fastify instance with Prisma and logger
 * @param {Object} body - Request payload
 * @param {string} body.medicalDocumentationId - ID of the related medical documentation
 * @param {Array<{serviceId: string, quantity: number}>} body.services - List of services with quantities
 * @param {string | null} [body.notes] - Optional notes
 * @param {number} [body.initialPaymentAmount] - Optional initial payment amount
 * @param {string | null} [body.paymentMethod] - Payment method (default: "cash")
 * @param {string} body.createdByName - User's name creating the bill
 * @param {Role | string} body.createdByRole - User's role creating the bill
 * @param {boolean} [body.isSeniorPwdDiscountApplied=false] - Whether a senior/PWD discount is applied
 * @param {number} [body.discountRate=0] - Custom discount rate (if any)
 *
 * @returns {Promise<{ success: boolean, message: string, data: any }>}
 * - Returns the created and updated bill details with computed totals
 */
export async function createMedicalBillWithServices(
  fastify: FastifyInstance,
  body: {
    medicalDocumentationId: string;
    services: { serviceId: string; quantity: number }[];
    notes?: string | null;
    initialPaymentAmount?: number;
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
    paymentMethod,
    createdByName,
    createdByRole,
    isSeniorPwdDiscountApplied = false,
    discountRate = 0,
  } = body;

  fastify.log.info(`[createMedicalBillWithServices] Start process for documentation ID: ${medicalDocumentationId}`);

  try {
    if (!Array.isArray(services) || services.length === 0) {
      throw new Error("At least one service must be provided.");
    }

    // ✅ Fetch medical documentation and verify patient data
    const documentation = await fastify.prisma.medicalDocumentation.findUnique({
      where: { id: medicalDocumentationId },
      include: { patient: true },
    });

    if (!documentation) throw new Error("Medical documentation not found");
    if (documentation.status === "draft") throw new Error("Cannot create bill for draft documentation.");

    const patient = documentation.patient;

    if (isSeniorPwdDiscountApplied && !patient.csdIdOrPwdId) {
      throw new Error("Cannot apply senior/PWD discount — no valid ID on record.");
    }

    // 🧮 Prepare service line items
    let servicesTotal = 0;
    const billedServicesData: { serviceId: string; serviceName: string; serviceCategory: ServiceCategory; servicePriceAtTime: number; quantity: number; subtotal: number; }[] = [];

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
      servicesTotal += subtotal;

      billedServicesData.push({
        serviceId: service.id,
        serviceName: service.name,
        serviceCategory: service.category as ServiceCategory,
        servicePriceAtTime: service.price,
        quantity: qty,
        subtotal,
      });
    }

    // 💰 Base fee + discount calculation
    const BASE_CONSULTATION_FEE = 250;
    const validDiscountRate = Math.max(0, Math.min(100, discountRate));
    let discountAmount = 0;
    let effectiveDiscountRate = 0;

    if (isSeniorPwdDiscountApplied) {
      discountAmount = servicesTotal * 0.2;
      effectiveDiscountRate = 20;
    } else if (validDiscountRate > 0) {
      discountAmount = servicesTotal * (validDiscountRate / 100);
      effectiveDiscountRate = validDiscountRate;
    }

    const totalAmount = Number(((servicesTotal - discountAmount) + BASE_CONSULTATION_FEE).toFixed(2));

    if (initialPaymentAmount && initialPaymentAmount > totalAmount) {
      throw new Error(`Initial payment (${initialPaymentAmount}) exceeds total (${totalAmount})`);
    }

    const effectivePaymentMethod = paymentMethod ?? "cash";

    // ⚙️ Transaction: create bill, add services, handle payments, and log audit
    const result = await fastify.prisma.$transaction(async (prisma) => {
      fastify.log.debug("[Transaction] Creating medical bill...");

      const medicalBill = await prisma.medicalBill.create({
        data: {
          medicalDocumentationId,
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

      await prisma.billedService.createMany({
        data: billedServicesData.map((s) => ({
          medicalBillId: medicalBill.id,
          ...s,
        })),
      });

      fastify.log.debug(`[Transaction] Added ${billedServicesData.length} billed services.`);

      // Initial payment (if any)
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
          prisma as any // pass transaction-safe Prisma instance
        );
        fastify.log.debug("[Transaction] Initial payment recorded in payment history.");
      }

      // Recalculate total payment and update bill
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

      // Audit log
      await prisma.billAuditLog.create({
        data: {
          medicalBillId: medicalBill.id,
          action: "created",
          fieldsChanged:
            "totalAmount,amountPaid,balance,paymentStatus,discountRate,isSeniorPwdDiscountApplied",
          newData: JSON.stringify({
            totalAmount,
            amountPaid,
            balance,
            paymentStatus,
            discountRate: effectiveDiscountRate,
            isSeniorPwdDiscountApplied,
            servicesTotal,
            discountAmount,
            consultationFee: BASE_CONSULTATION_FEE,
          }),
          changedByName: createdByName,
          changedByRole: createdByRole as Role,
        },
      });

      fastify.log.info(`[Transaction] Bill audit log created for ${medicalBill.id}`);

      return { updatedBill, amountPaid, balance, paymentStatus, billedServicesCount: billedServicesData.length };
    });

    // 🧾 Post-transaction: update analytics (derived, not incremental)
    const today = new Date();
    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    fastify.log.debug("[Analytics] Updating daily analytics after bill creation...");

    await updateDailyAnalytics(fastify, dateOnly.toISOString());

    fastify.log.info(`[Analytics] Daily analytics successfully updated for ${dateOnly.toISOString()}`);

    return {
      success: true,
      message: "Medical bill created successfully",
      data: {
        ...result.updatedBill,
        billedServicesCount: result.billedServicesCount,
      },
    };
  } catch (err: any) {
    fastify.log.error({ err, operation: "createMedicalBillWithServices" });

    if (err.code === "P2025") throw new Error("Referenced record not found");
    if (err.code === "P2003") throw new Error("Invalid reference: Medical documentation or service not found");
    if (err.code === "P2002") throw new Error("Duplicate medical bill for this documentation");

    throw err;
  }
}
