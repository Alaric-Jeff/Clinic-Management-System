import type { FastifyInstance } from "fastify";
import type { UpdateDailyAnalyticsType } from "../../type-schemas/analytics-schemas/update-daily-analytics-schema.js";

/**
 * Incremental Daily Analytics Updater
 * - Creates today's record if not existing
 * - Increments numeric values when called repeatedly throughout the day
 */
export async function updateDailyAnalytics(
  fastify: FastifyInstance,
  body: UpdateDailyAnalyticsType
) {
  const {
    date,
    totalRevenue = 0,
    totalBills = 0,
    totalServices = 0,
    paidBills = 0,
    unpaidBills = 0,
    partiallyPaidBills = 0,
    averageBillAmount = 0,
  } = body;

  try {
    // Check if today already has a record
    const existing = await fastify.prisma.dailySalesAnalytics.findUnique({
      where: { date },
    });

    if (!existing) {
      // 🆕 Create new entry for the day
      await fastify.prisma.dailySalesAnalytics.create({
        data: {
          date,
          totalRevenue,
          totalBills,
          totalServices,
          paidBills,
          unpaidBills,
          partiallyPaidBills,
          averageBillAmount,
        },
      });
    } else {
      // 🔁 Increment existing values
      await fastify.prisma.dailySalesAnalytics.update({
        where: { date },
        data: {
          totalRevenue: { increment: totalRevenue },
          totalBills: { increment: totalBills },
          totalServices: { increment: totalServices },
          paidBills: { increment: paidBills },
          unpaidBills: { increment: unpaidBills },
          partiallyPaidBills: { increment: partiallyPaidBills },
          // averageBillAmount — recompute it incrementally
          averageBillAmount:
            totalBills > 0
              ? ((existing.averageBillAmount * existing.totalBills) + (averageBillAmount * totalBills)) /
                (existing.totalBills + totalBills)
              : existing.averageBillAmount,
        },
      });
    }

    return { success: true, message: "Daily analytics updated successfully" };
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(`Error updating daily analytics: ${err.message}`);
    }
    throw err;
  }
}
