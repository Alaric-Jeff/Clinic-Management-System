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
export async function getAllUnsettledBills(
  fastify: FastifyInstance
) {
  try {
    const unsettledBills = await fastify.prisma.medicalBill.findMany({
      where: {
        OR: [
          { paymentStatus: 'unpaid' },
          { paymentStatus: 'partially_paid' },
        ],
      },
      select: {
        id: true,
        medicalDocumentationId: true,
        totalAmount: true,
        amountPaid: true,
        balance: true,
        paymentStatus: true,
        createdByName: true,
        createdAt: true,
        updatedAt: true,
        
        medicalDocumentation: {
          select: {
            id: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                middleName: true,
                mobileNumber: true
              }
            }
          }
        },
  
        paymentResolution: {
          select: {
            id: true,
            status: true,
            dueDate: true,
            agreedPaymentPlan: true
          }
        }
      },
      orderBy: [
        { paymentStatus: 'asc' },
        { createdAt: 'desc' }  
      ]
    });

    fastify.log.info(
      { count: unsettledBills.length },
      'Retrieved unsettled medical bills'
    );

    return {
      success: true,
      message: 'Unsettled bills retrieved successfully',
      data: unsettledBills.map(bill => ({
        id: bill.id,
        medicalDocumentationId: bill.medicalDocumentationId,
        
        patientId: bill.medicalDocumentation.patient.id,
        patientName: `${bill.medicalDocumentation.patient.firstName} ${bill.medicalDocumentation.patient.lastName}`,
        patientFullName: [
          bill.medicalDocumentation.patient.firstName,
          bill.medicalDocumentation.patient.middleName,
          bill.medicalDocumentation.patient.lastName
        ].filter(Boolean).join(' '),
        patientMobileNumber: bill.medicalDocumentation.patient.mobileNumber,
        
        // Bill details
        totalAmount: bill.totalAmount,
        amountPaid: bill.amountPaid,
        balance: bill.balance,
        paymentStatus: bill.paymentStatus,
        
        // Payment resolution info (if exists)
        hasPaymentArrangement: !!bill.paymentResolution,
        paymentResolutionStatus: bill.paymentResolution?.status || null,
        dueDate: bill.paymentResolution?.dueDate?.toISOString() || null,
        agreedPaymentPlan: bill.paymentResolution?.agreedPaymentPlan || null,
        
        // Audit
        createdByName: bill.createdByName,
        createdAt: bill.createdAt.toISOString(),
        updatedAt: bill.updatedAt.toISOString()
      }))
    };

  } catch (err: unknown) {
    fastify.log.error(
      { error: err },
      'Failed to retrieve unsettled bills'
    );
    throw err;
  }
}