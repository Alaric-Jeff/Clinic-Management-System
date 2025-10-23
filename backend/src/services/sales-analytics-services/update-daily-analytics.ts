import type { FastifyInstance } from "fastify";
import { addDailyServiceAnalytics } from "../medicalservices-analytics-services/add-daily-service.js";
import { addDailyCategoryAnalytics } from "../category-analytics-services/add-category-analytics.js";

/**
 * Derived Daily Analytics Updater
 * ---------------------------------------
 * - Rebuilds daily metrics from source data
 * - Uses medicalBill, billedServices, and paymentHistory as source of truth
 * - Automatically updates related service & category analytics
 *
 * @param fastify Fastify instance with Prisma and logger
 * @param payload Either a date string (to rebuild from DB) or computed metrics
 * @returns {Promise<{success: boolean, message: string}>}
 */
type DailyAnalyticsPayload =
  | string
  | {
      date: string;
      totalRevenue: number;
      totalServices?: number;
      paidBills?: number;
      unpaidBills?: number;
      partiallyPaidBills?: number;
      averageBillAmount?: number;
      totalBills?: number;
    };

export async function updateDailyAnalytics(
  fastify: FastifyInstance,
  payload: DailyAnalyticsPayload
) {
  try {
    // If caller passed a string, rebuild analytics from database
    if (typeof payload === "string") {
      const date = payload;
      const start = new Date(date);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      fastify.log.info(`📅 Recomputing analytics for date: ${date}`);

      // 🧾 Fetch all medical bills for that day (with billed services)
      const bills = await fastify.prisma.medicalBill.findMany({
        where: {
          createdAt: {
            gte: start,
            lt: end,
          },
        },
        include: {
          billedServices: true,
        },
      });

      fastify.log.info(`🧾 Found ${bills.length} bills for ${date}`);

      // 💰 Aggregate all payments for that day
      const payments = await fastify.prisma.paymentHistory.aggregate({
        _sum: { amountPaid: true },
        where: {
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      });

      const totalRevenue = payments._sum.amountPaid ?? 0;
      const totalBills = bills.length;
      const paidBills = bills.filter((b) => b.amountPaid >= b.totalAmount).length;
      const partiallyPaidBills = bills.filter(
        (b) => b.amountPaid > 0 && b.amountPaid < b.totalAmount
      ).length;
      const unpaidBills = bills.filter((b) => b.amountPaid === 0).length;

      const averageBillAmount =
        totalBills > 0
          ? bills.reduce((sum, b) => sum + b.totalAmount, 0) / totalBills
          : 0;

      // 🗓️ Upsert daily sales analytics
      const dailyAnalytics = await fastify.prisma.dailySalesAnalytics.upsert({
        where: { date },
        update: {
          totalRevenue,
          totalBills,
          paidBills,
          partiallyPaidBills,
          unpaidBills,
          averageBillAmount,
        },
        create: {
          date,
          totalRevenue,
          totalBills,
          paidBills,
          partiallyPaidBills,
          unpaidBills,
          averageBillAmount,
        },
      });

      fastify.log.info(`✅ DailySalesAnalytics upserted for ${date}`);

      // 🧩 Compute Service & Category Analytics
      const serviceMap = new Map<
        string,
        {
          serviceId: string | null;
          serviceName: string;
          serviceCategory: string;
          totalRevenue: number;
          quantitySold: number;
        }
      >();

      for (const bill of bills) {
        for (const s of bill.billedServices) {
          const key = s.serviceId ?? s.serviceName;
          const existing = serviceMap.get(key) ?? {
            serviceId: s.serviceId,
            serviceName: s.serviceName,
            serviceCategory: s.serviceCategory,
            totalRevenue: 0,
            quantitySold: 0,
          };

          existing.totalRevenue += s.subtotal;
          existing.quantitySold += s.quantity;
          serviceMap.set(key, existing);
        }
      }

      fastify.log.info(`📊 Processed ${serviceMap.size} distinct services`);

      // 💼 Add/update Service Daily Analytics
      for (const [, s] of serviceMap) {
        await addDailyServiceAnalytics(fastify, {
          dailyAnalyticsId: dailyAnalytics.id,
          serviceId: s.serviceId,
          serviceName: s.serviceName,
          serviceCategory: s.serviceCategory as any,
          totalRevenue: s.totalRevenue,
          quantitySold: s.quantitySold,
          averagePrice:
            s.quantitySold > 0 ? s.totalRevenue / s.quantitySold : 0,
        });
      }

      // 🗂️ Build Category Analytics
      const categoryMap = new Map<
        string,
        { totalRevenue: number; quantitySold: number; totalServices: number }
      >();

      for (const [, s] of serviceMap) {
        const cat = s.serviceCategory;
        const existing = categoryMap.get(cat) ?? {
          totalRevenue: 0,
          quantitySold: 0,
          totalServices: 0,
        };
        existing.totalRevenue += s.totalRevenue;
        existing.quantitySold += s.quantitySold;
        existing.totalServices += 1;
        categoryMap.set(cat, existing);
      }

      fastify.log.info(`📈 Processed ${categoryMap.size} categories`);

      for (const [category, c] of categoryMap) {
        await addDailyCategoryAnalytics(fastify, {
          dailyAnalyticsId: dailyAnalytics.id,
          category: category as any,
          totalRevenue: c.totalRevenue,
          totalServices: c.totalServices,
          quantitySold: c.quantitySold,
        });
      }

      fastify.log.info(`✅ Completed service & category analytics for ${date}`);

      return { success: true, message: `Analytics updated for ${date}` };
    }

    // If caller passed an object with custom values
    const p = payload;
    const date = p.date;

    await fastify.prisma.dailySalesAnalytics.upsert({
      where: { date },
      update: {
        totalRevenue: p.totalRevenue,
        totalBills: p.totalBills ?? 0,
        paidBills: p.paidBills ?? 0,
        partiallyPaidBills: p.partiallyPaidBills ?? 0,
        unpaidBills: p.unpaidBills ?? 0,
        averageBillAmount: p.averageBillAmount ?? 0,
      },
      create: {
        date,
        totalRevenue: p.totalRevenue,
        totalBills: p.totalBills ?? 0,
        paidBills: p.paidBills ?? 0,
        partiallyPaidBills: p.partiallyPaidBills ?? 0,
        unpaidBills: p.unpaidBills ?? 0,
        averageBillAmount: p.averageBillAmount ?? 0,
      },
    });

    fastify.log.info(`✅ Daily analytics upserted for ${date} from payload`);
    return { success: true, message: `Analytics upserted for ${date}` };
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(`❌ Failed to update daily analytics: ${err.message}`);
    }
    throw err;
  }
}
