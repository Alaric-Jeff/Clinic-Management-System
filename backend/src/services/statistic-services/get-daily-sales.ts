import type { FastifyInstance } from "fastify";
import { startOfDay } from "date-fns";

/**
 *  Service: Get today's total revenue
 *
 * Returns:
 *   { totalRevenue: 254000 }
 */
export async function getDailySales(fastify: FastifyInstance) {
  try {
    const today = startOfDay(new Date());

    const record = await fastify.prisma.dailySalesAnalytics.findUnique({
      where: { date: today },
      select: { totalRevenue: true },
    });

    return { totalRevenue: record?.totalRevenue ?? 0 };
  } catch (err: unknown) {
    fastify.log.error(`Error fetching daily sales: ${err}`);
    throw err;
  }
}
