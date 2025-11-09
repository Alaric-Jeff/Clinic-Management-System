import type { FastifyInstance } from "fastify";
import type { getTOtalMedicalBillsType } from "../../type-schemas/medical-bills/get-total-medical-bills-schemas.js";

export async function getPartiallyPaid(
  fastify: FastifyInstance,
  body: getTOtalMedicalBillsType
) {
  const { limit, cursor, direction = "next" } = body;

  try {
    let cursorObj: any = undefined;

    if (cursor) {
      const [createdAtStr, id] = cursor.split("|");
      if (!createdAtStr || !id) {
        throw new Error("Invalid cursor format");
      }

      cursorObj = {
        createdAt: new Date(createdAtStr),
        id,
      };
    }

    const findManyArgs: any = {
        where: {
            paymentStatus: 'partially_paid'
        },
      select: {
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

        medicalDocumentation: {
          select: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                middleName: true,
                csdIdOrPwdId: true,
              },
            },
          },
        },
        billedServices: {
          select: {
            id: true,
            serviceName: true,
            serviceCategory: true,
            servicePriceAtTime: true,
            quantity: true,
            subtotal: true,
          },
        },
      },
      take: direction === "next" ? limit + 1 : -(limit + 1),
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
    };

    if (cursorObj) {
      findManyArgs.cursor = cursorObj;
      findManyArgs.skip = 1;
    }

    let bills = await fastify.prisma.medicalBill.findMany(findManyArgs);

    // Reverse order if fetching "previous"
    if (direction === "prev") {
      bills = bills.reverse();
    }

    const hasNextPage = direction === "next" ? bills.length > limit : !!cursor;
    const hasPreviousPage = direction === "prev" ? bills.length > limit : !!cursor;

    if (bills.length > limit) {
      if (direction === "next") bills.pop();
      else bills.shift();
    }

    const firstBill = bills[0];
    const lastBill = bills[bills.length - 1];

    const startCursor = firstBill
      ? `${firstBill.createdAt.toISOString()}|${firstBill.id}`
      : null;
    const endCursor = lastBill
      ? `${lastBill.createdAt.toISOString()}|${lastBill.id}`
      : null;

    return {
      success: true,
      message: "Medical bills retrieved successfully",
      data: bills.map((bill) => ({
        ...bill,
        createdAt: bill.createdAt.toISOString(),
        updatedAt: bill.updatedAt.toISOString(),
      })),
      meta: {
        hasNextPage,
        hasPreviousPage,
        startCursor,
        endCursor,
        limit,
      },
    };
  } catch (err: unknown) {
    fastify.log.error(
      { error: err, operation: "getAllMedicalBills" },
      "Failed to retrieve paginated medical bills"
    );
    throw err;
  }
}
