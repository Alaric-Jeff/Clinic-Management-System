// services/create-medical-bills-service.ts
import type { FastifyInstance } from "fastify";
import type { Prisma, Role, ServiceCategory, PaymentStatus } from "@prisma/client";

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
  } = body;

  try {
    // Basic validation
    if (!Array.isArray(services) || services.length === 0) {
      throw new Error("At least one service must be provided.");
    }

    // Verify documentation exists
    const documentation = await fastify.prisma.medicalDocumentation.findUnique({
      where: { id: medicalDocumentationId },
      select: { id: true, status: true, patientId: true },
    });
    if (!documentation) throw new Error("Medical documentation not found");
    if (documentation.status === "draft") {
      throw new Error("Cannot create bill for draft documentation. Please complete the documentation first.");
    }

    // Check existing bill
    const existing = await fastify.prisma.medicalBill.findUnique({
      where: { medicalDocumentationId },
    });
    if (existing) throw new Error("Medical bill already exists for this documentation");

    // --- build billed services payload (WITHOUT medicalBillId) ---
    type BilledServicePayload = {
      serviceId?: string | null;
      serviceName: string;
      serviceCategory: ServiceCategory;
      servicePriceAtTime: number;
      quantity: number;
      subtotal: number;
    };

    const billedServicesData: BilledServicePayload[] = [];
    let totalAmount = 0;

    for (const item of services) {
      if (!item || !item.serviceId) throw new Error("Each service must include serviceId");
      const qty = Number(item.quantity ?? 1);
      if (!Number.isFinite(qty) || qty <= 0) throw new Error("Service quantity must be a positive number");

      const service = await fastify.prisma.service.findUnique({
        where: { id: item.serviceId },
        select: { id: true, name: true, category: true, price: true, isActivated: true, isAvailable: true },
      });

      if (!service) throw new Error(`Service not found: ${item.serviceId}`);
      if (!service.isActivated) throw new Error(`Service is deactivated: ${service.name}`);
      if (!service.isAvailable) throw new Error(`Service is not available: ${service.name}`);

      const price = Number(service.price ?? 0);
      const subtotalRaw = price * qty;
      const subtotal = Math.round(subtotalRaw * 100) / 100;
      totalAmount += subtotal;

      billedServicesData.push({
        serviceId: service.id,
        serviceName: service.name,
        serviceCategory: service.category as ServiceCategory,
        servicePriceAtTime: price,
        quantity: qty,
        subtotal,
      });
    }

    totalAmount = Math.round(totalAmount * 100) / 100;

    if (initialPaymentAmount !== undefined && initialPaymentAmount > totalAmount) {
      throw new Error(`Initial payment (${initialPaymentAmount}) cannot exceed total bill amount (${totalAmount})`);
    }

    // --- transaction: create bill, create billedServices (with medicalBillId), create initial payment, compute and persist amounts ---
    const result = await fastify.prisma.$transaction(async (prisma) => {
      const medicalBill = await prisma.medicalBill.create({
        data: {
          medicalDocumentationId,
          totalAmount,
          createdByName,
          createdByRole: createdByRole as Role,
          ...(notes !== undefined && { notes }),
        },
      });

      const createManyData: Prisma.BilledServiceCreateManyInput[] = billedServicesData.map((s) => ({
        medicalBillId: medicalBill.id,
        serviceId: s.serviceId ?? null,
        serviceName: s.serviceName,
        serviceCategory: s.serviceCategory,
        servicePriceAtTime: s.servicePriceAtTime,
        quantity: s.quantity,
        subtotal: s.subtotal,
        createdAt: new Date(), // optional, Prisma will use default; you can omit
      }));

      await prisma.billedService.createMany({
        data: createManyData,
      });

      // initial payment
      if (initialPaymentAmount && initialPaymentAmount > 0) {
        await prisma.paymentHistory.create({
          data: {
            medicalBillId: medicalBill.id,
            amountPaid: Math.round(Number(initialPaymentAmount) * 100) / 100,
            paymentMethod: paymentMethod ?? "cash",
            notes: "Initial payment at billing",
            recordedByName: createdByName,
            recordedByRole: createdByRole as Role,
          },
        });
      }

      // compute payments from PaymentHistory
      const paymentHistory = await prisma.paymentHistory.findMany({
        where: { medicalBillId: medicalBill.id },
        select: { amountPaid: true },
      });
      const amountPaidRaw = paymentHistory.reduce((s, p) => s + Number(p.amountPaid ?? 0), 0);
      const amountPaid = Math.round(amountPaidRaw * 100) / 100;
      const balance = Math.round((totalAmount - amountPaid) * 100) / 100;
      const paymentStatusStr = amountPaid === 0 ? "unpaid" : amountPaid >= totalAmount ? "paid" : "partially_paid";
      const paymentStatus = paymentStatusStr as PaymentStatus;

      const updatedBill = await prisma.medicalBill.update({
        where: { id: medicalBill.id },
        data: {
          amountPaid,
          balance,
          paymentStatus,
        },
        include: {
          billedServices: true,
        },
      });

      return {
        medicalBill: updatedBill,
        billedServicesCount: billedServicesData.length,
        amountPaid,
        balance,
        paymentStatus,
      };
    });

    fastify.log.info(
      {
        medicalBillId: result.medicalBill.id,
        documentationId: medicalDocumentationId,
        patientId: documentation.patientId,
        totalAmount,
        amountPaid: result.amountPaid,
        balance: result.balance,
        paymentStatus: result.paymentStatus,
        servicesCount: result.billedServicesCount,
        createdBy: createdByName,
      },
      "Medical bill created successfully with services"
    );

    return {
      success: true,
      message: "Medical bill created successfully",
      data: {
        id: result.medicalBill.id,
        medicalDocumentationId: result.medicalBill.medicalDocumentationId,
        totalAmount: result.medicalBill.totalAmount,
        amountPaid: result.medicalBill.amountPaid,
        balance: result.medicalBill.balance,
        paymentStatus: result.medicalBill.paymentStatus,
        billedServicesCount: result.billedServicesCount,
        createdByName: result.medicalBill.createdByName,
        createdByRole: result.medicalBill.createdByRole,
        notes: result.medicalBill.notes,
        createdAt: result.medicalBill.createdAt.toISOString(),
        updatedAt: result.medicalBill.updatedAt.toISOString(),
      },
    };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err) {
      const e = err as { code: string };
      if (e.code === "P2025") throw new Error("Referenced record not found");
      if (e.code === "P2003") throw new Error("Invalid reference: Medical documentation or service not found");
      if (e.code === "P2002") throw new Error("Medical bill already exists for this documentation");
    }

    fastify.log.error(
      {
        error: err instanceof Error ? err.message : err,
        medicalDocumentationId,
        operation: "createMedicalBillWithServices",
      },
      "Failed to create medical bill"
    );

    throw err;
  }
}
