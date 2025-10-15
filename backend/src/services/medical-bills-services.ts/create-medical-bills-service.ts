import type { FastifyInstance } from "fastify";
import type { createMedicalBillServiceInputType } from "../../type-schemas/medical-bills-schema.js";
import type { Prisma } from "@prisma/client";

/**
 * Service: Create Medical Bill with Services
 * 
 * Responsibilities:
 *  - Creates a medical bill linked to medical documentation
 *  - Adds multiple services to the bill in a single transaction
 *  - Snapshots service details (name, category, price) at time of billing
 *  - Calculates total amounts automatically
 *  - Handles immediate payment if status is 'paid'
 *  - Ensures data integrity with database transaction
 * 
 * Validation Rules:
 *  - Medical documentation must exist and not be draft
 *  - Bill cannot already exist for the documentation (one-to-one relationship)
 *  - All services must exist and be available
 *  - At least one service must be provided
 * 
 * Payment Handling:
 *  - If paymentStatus is 'paid', automatically sets amountPaid to totalAmount
 *  - Creates PaymentHistory entry for immediate payments
 *  - Calculates balance automatically (totalAmount - amountPaid)
 * 
 * @param fastify - Fastify instance for database and logging
 * @param body - Bill creation data with services array and auth fields
 * @returns Created bill with service count and payment details
 * @throws {Error} When validation fails or documentation not found
 */
export async function createMedicalBillWithServices(
    fastify: FastifyInstance,
    body: createMedicalBillServiceInputType
) {
    const { medicalDocumentationId, services, notes, paymentStatus, paymentMethod, createdByName, createdByRole } = body;

    try {
        // 1. Verify medical documentation exists and get its status
        const documentation = await fastify.prisma.medicalDocumentation.findUnique({
            where: { id: medicalDocumentationId },
            select: { 
                id: true, 
                status: true,
                patientId: true
            }
        });

        if (!documentation) {
            throw new Error('Medical documentation not found');
        }

        // Optional: Only allow billing for complete documentation
        // Comment out if you want to allow billing for drafts
        if (documentation.status === 'draft') {
            throw new Error('Cannot create bill for draft documentation. Please complete the documentation first.');
        }

        // 2. Check if bill already exists (one-to-one relationship)
        const existingBill = await fastify.prisma.medicalBill.findUnique({
            where: { medicalDocumentationId }
        });

        if (existingBill) {
            throw new Error('Medical bill already exists for this documentation');
        }

        // 3. Fetch and validate all services, calculate totals
        let totalAmount = 0;
        const billedServicesData: Prisma.BilledServiceCreateManyInput[] = [];

        for (const item of services) {
            const service = await fastify.prisma.service.findUnique({
                where: { id: item.serviceId },
                select: {
                    id: true,
                    name: true,
                    category: true,
                    price: true,
                    isActivated: true,
                    isAvailable: true
                }
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

            const subtotal = service.price * item.quantity;
            totalAmount += subtotal;

            billedServicesData.push({
                serviceId: service.id,
                serviceName: service.name,
                serviceCategory: service.category,
                servicePriceAtTime: service.price, // Snapshot price at billing time
                quantity: item.quantity,
                subtotal: subtotal,
                medicalBillId: '' // Will be set in transaction
            });
        }

        // 4. Determine payment amounts based on status
        const amountPaid = paymentStatus === 'paid' ? totalAmount : 0;
        const balance = totalAmount - amountPaid;

        // 5. Create bill, billed services, and payment history in a transaction
        const result = await fastify.prisma.$transaction(async (prisma) => {
            // Create the medical bill
            const medicalBill = await prisma.medicalBill.create({
                data: {
                    medicalDocumentationId,
                    totalAmount,
                    amountPaid,
                    balance,
                    paymentStatus,
                    createdByName,
                    createdByRole,
                    ...(notes !== undefined && { notes }) // Only include notes if provided
                }
            });

            // Create all billed services
            const billedServices = await prisma.billedService.createMany({
                data: billedServicesData.map(service => ({
                    ...service,
                    medicalBillId: medicalBill.id
                }))
            });

            // If paid immediately, create payment history entry
            if (paymentStatus === 'paid') {
                await prisma.paymentHistory.create({
                    data: {
                        medicalBillId: medicalBill.id,
                        amountPaid: totalAmount,
                        paymentMethod: paymentMethod ?? 'cash',
                        notes: 'Full payment at billing',
                        recordedByName: createdByName,
                        recordedByRole: createdByRole
                    }
                });
            }

            return {
                medicalBill,
                billedServicesCount: billedServices.count
            };
        });

        fastify.log.info(
            {
                medicalBillId: result.medicalBill.id,
                documentationId: medicalDocumentationId,
                patientId: documentation.patientId,
                totalAmount,
                amountPaid,
                balance,
                paymentStatus,
                servicesCount: result.billedServicesCount,
                createdBy: createdByName
            },
            'Medical bill created successfully with services'
        );

        return {
            success: true,
            message: 'Medical bill created successfully',
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
                updatedAt: result.medicalBill.updatedAt.toISOString()
            }
        };

    } catch (err: unknown) {
        // Handle Prisma errors
        if (err && typeof err === 'object' && 'code' in err) {
            const prismaError = err as { code: string };
            
            if (prismaError.code === 'P2025') {
                throw new Error('Referenced record not found');
            }
            
            if (prismaError.code === 'P2003') {
                throw new Error('Invalid reference: Medical documentation or service not found');
            }
            
            if (prismaError.code === 'P2002') {
                throw new Error('Medical bill already exists for this documentation');
            }
        }

        if (err instanceof Error) {
            fastify.log.error(
                { 
                    error: err.message, 
                    medicalDocumentationId,
                    servicesCount: services.length,
                    operation: 'createMedicalBillWithServices'
                },
                'Failed to create medical bill'
            );
        } else {
            fastify.log.error(
                { 
                    error: err, 
                    medicalDocumentationId,
                    operation: 'createMedicalBillWithServices'
                },
                'Failed to create medical bill with unknown error'
            );
        }
        
        throw err;
    }
}