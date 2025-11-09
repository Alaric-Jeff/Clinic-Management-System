import { PaymentStatus } from "@prisma/client";
import type { FastifyInstance } from "fastify";

/**
 * Service: Get all unsettled medical bills
 * 
 * Retrieves all bills with unpaid or partially_paid status.
 * Includes patient information for display in unsettled bills table.
 * 
 * @param fastify - Fastify instance
 * @returns List of unsettled bills with patient details
 */

// In your getUnsettledBills service, update the select to include billedServices:
export async function getUnsettledBills(fastify: FastifyInstance) {
    try {
        fastify.log.debug("Starting to fetch the unsettled bills from medical bills");
        const result = await fastify.prisma.medicalBill.findMany({
            select: {
                // Medical bill fields
                id: true,
                totalAmount: true,
                amountPaid: true,
                balance: true,
                paymentStatus: true,
                isSeniorPwdDiscountApplied: true,
                discountRate: true,
                consultationFee: true,
                notes: true,
                createdAt: true,
                updatedAt: true,
                
                // Related medical documentation and patient
                medicalDocumentation: {
                    select: {
                        patient: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                middleName: true,
                                csdIdOrPwdId: true,  
                            }
                        }
                    }
                },
                // Add billed services
                billedServices: {
                    select: {
                        id: true,
                        serviceName: true,
                        serviceCategory: true,
                        servicePriceAtTime: true,
                        quantity: true,
                        subtotal: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        return result;
    } catch(err: unknown) {
        fastify.log.error("Error fetching unsettled bills:");
        throw err;
    }
}