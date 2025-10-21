import type { FastifyInstance } from "fastify";
import type { Role, ServiceCategory, PaymentStatus } from "@prisma/client";
import { updateDailyAnalytics } from "../sales-analytics-services/update-daily-analytics.js";
import { addPaymentHistory } from "../sales-analytics-services/add-paymenthistory-service.js";

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

  try {
    if (!Array.isArray(services) || services.length === 0) {
      throw new Error("At least one service must be provided.");
    }

    const documentation = await fastify.prisma.medicalDocumentation.findUnique({
      where: { id: medicalDocumentationId },
      include: { patient: true },
    });

    if (!documentation) throw new Error("Medical documentation not found");
    if (documentation.status === "draft") {
      throw new Error("Cannot create bill for draft documentation. Please complete the documentation first.");
    }

    const patient = documentation.patient;

    if (isSeniorPwdDiscountApplied && !patient.csdIdOrPwdId) {
      throw new Error("Cannot apply senior/PWD discount — patient has no valid senior/PWD ID on record");
    }

    type BilledServicePayload = {
      serviceId?: string | null;
      serviceName: string;
      serviceCategory: ServiceCategory;
      servicePriceAtTime: number;
      quantity: number;
      subtotal: number;
    };

    const billedServicesData: BilledServicePayload[] = [];
    let servicesTotal = 0;

    for (const item of services) {
      if (!item?.serviceId) throw new Error("Each service must include serviceId");
      const qty = Number(item.quantity ?? 1);
      if (!Number.isFinite(qty) || qty <= 0) throw new Error("Service quantity must be a positive number");

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
      throw new Error(`Initial payment (${initialPaymentAmount}) cannot exceed total bill amount (${totalAmount})`);
    }

    // Define payment method with proper type
    const effectivePaymentMethod: string = paymentMethod ?? "cash";

    // ✅ Core transaction (atomic)
    const result = await fastify.prisma.$transaction(async (prisma) => {
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

      await prisma.billedService.createMany({
        data: billedServicesData.map((s) => ({
          medicalBillId: medicalBill.id,
          ...s,
        })),
      });

      // ✅ Record payment (if any)
      if (initialPaymentAmount && initialPaymentAmount > 0) {
        await prisma.paymentHistory.create({
          data: {
            medicalBillId: medicalBill.id,
            amountPaid: Number(initialPaymentAmount.toFixed(2)),
            paymentMethod: effectivePaymentMethod,
            notes: "Initial payment at billing",
            recordedByName: createdByName,
            recordedByRole: createdByRole as Role,
          },
        });
      }

      const payments = await prisma.paymentHistory.findMany({
        where: { medicalBillId: medicalBill.id },
        select: { amountPaid: true },
      });

      const amountPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
      const balance = Number((totalAmount - amountPaid).toFixed(2));

      const paymentStatus: PaymentStatus =
        amountPaid === 0 ? "unpaid" :
        amountPaid >= totalAmount ? "paid" : "partially_paid";

      const updatedBill = await prisma.medicalBill.update({
        where: { id: medicalBill.id },
        data: { amountPaid, balance, paymentStatus },
        include: { billedServices: true },
      });

      await prisma.billAuditLog.create({
        data: {
          medicalBillId: medicalBill.id,
          action: "created",
          fieldsChanged: "totalAmount,amountPaid,balance,paymentStatus,discountRate,isSeniorPwdDiscountApplied",
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

      return {
        updatedBill,
        amountPaid,
        balance,
        paymentStatus,
        billedServicesCount: billedServicesData.length,
      };
    });

    // ✅ Update analytics (safe to run outside since it's summary data)
    const todayDate: string = new Date().toISOString();
    await updateDailyAnalytics(fastify, {
      date: todayDate,
      totalRevenue: result.amountPaid,
      totalBills: 1,
      totalServices: result.billedServicesCount,
    });

    // ✅ Final response
    return {
      success: true,
      message: "Medical bill created successfully",
      data: {
        ...result.updatedBill,
        billedServicesCount: result.billedServicesCount,
      },
    };

  } catch (err: any) {
    if (err.code === "P2025") throw new Error("Referenced record not found");
    if (err.code === "P2003") throw new Error("Invalid reference: Medical documentation or service not found");
    if (err.code === "P2002") throw new Error("Medical bill already exists for this documentation");

    fastify.log.error({ error: err.message, stack: err.stack, operation: "createMedicalBillWithServices" }, "Failed to create medical bill");
    throw err;
  }
}