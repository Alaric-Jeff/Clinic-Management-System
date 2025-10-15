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

export async function getUnsettledBills(
    fastify: FastifyInstance
){
    try{
        fastify.log.debug("Starting to fetch the unsettled bills from medical bills");
        const result = await fastify.prisma.medicalBill.findMany({
            where: {
                OR: [
                    { paymentStatus: 'partially_paid' },
                    { paymentStatus: 'unpaid' }
                ]
            },
            include: {
                medicalDocumentation: {
                    include: {
                        patient: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                middleName: true,
                                mobileNumber: true,
                                birthDate: true,
                                gender: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        return result;
    } catch(err: unknown) {
        throw err;
    }
}