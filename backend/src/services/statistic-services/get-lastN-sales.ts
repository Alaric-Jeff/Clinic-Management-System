import type { FastifyInstance } from "fastify";

/**
 * Daily Revenue Data for Chart Display
 */
export interface DailyRevenueData {
  date: string; // YYYY-MM-DD format
  dayName: string; // "Monday", "Tuesday", etc.
  totalRevenue: number;
  totalBills: number;
  totalServices: number;
  paidBills: number;
  unpaidBills: number;
  partiallyPaidBills: number;
  averageBillAmount: number;
}

/**
 * Weekly Statistics Summary
 */
export interface WeeklySalesStatistics {
  summary: {
    totalRevenue: number;
    totalBills: number;
    totalServices: number;
    averageRevenue: number;
    highestRevenueDay: string;
    lowestRevenueDay: string;
  };
  dailyData: DailyRevenueData[];
}

/**
 * Service: Get Sales Weekly Statistics (Rolling 7 Days)
 * 
 * Returns revenue data for the last 7 days (today + past 6 days)
 * Perfect for line charts showing daily revenue trends.
 * 
 * Example: If today is Friday Oct 24, returns data for:
 * - Sat Oct 18
 * - Sun Oct 19
 * - Mon Oct 20
 * - Tue Oct 21
 * - Wed Oct 22
 * - Thu Oct 23
 * - Fri Oct 24 (today)
 * 
 * @param fastify - Fastify instance with Prisma client
 * @returns Daily revenue data for the past 7 days
 */
export async function getSalesWeeklyStatistic(
  fastify: FastifyInstance
): Promise<WeeklySalesStatistics> {
  fastify.log.debug("Starting getSalesWeeklyStatistic (rolling 7 days)");

  try {
    // Calculate date range: today and past 6 days = 7 days total
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // 6 days ago + today = 7 days

    fastify.log.debug({
      startDate: sevenDaysAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    }, "Fetching 7-day rolling window data");

    // Fetch data from DailySalesAnalytics
    const analyticsData = await fastify.prisma.dailySalesAnalytics.findMany({
      where: {
        date: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Create a map of existing data
    const dataMap = new Map(
      analyticsData.map((record) => [
        record.date.toISOString().split("T")[0],
        record,
      ])
    );

    // Build complete 7-day array (fill missing days with zeros)
    const dailyData: DailyRevenueData[] = [];
    const currentDate = new Date(sevenDaysAgo);

    for (let i = 0; i < 7; i++) {
      const dateKey = currentDate.toISOString().split("T")[0] ?? "";
      const dayName = currentDate.toLocaleDateString("en-US", { weekday: "long" });
      const record = dataMap.get(dateKey);

      dailyData.push({
        date: dateKey,
        dayName: dayName,
        totalRevenue: record ? Number(record.totalRevenue.toFixed(2)) : 0,
        totalBills: record?.totalBills ?? 0,
        totalServices: record?.totalServices ?? 0,
        paidBills: record?.paidBills ?? 0,
        unpaidBills: record?.unpaidBills ?? 0,
        partiallyPaidBills: record?.partiallyPaidBills ?? 0,
        averageBillAmount: record ? Number(record.averageBillAmount.toFixed(2)) : 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate summary statistics
    const totalRevenue = dailyData.reduce((sum, day) => sum + day.totalRevenue, 0);
    const totalBills = dailyData.reduce((sum, day) => sum + day.totalBills, 0);
    const totalServices = dailyData.reduce((sum, day) => sum + day.totalServices, 0);
    const averageRevenue = totalRevenue / 7;

    // Find highest and lowest revenue days (with fallback for empty data)
    const sortedByRevenue = [...dailyData].sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Fallback values for empty dataset
    const hasData = totalRevenue > 0 || totalBills > 0;

    const first = sortedByRevenue[0];
    const last = sortedByRevenue[sortedByRevenue.length - 1];

    const highestRevenueDayStr = hasData && first
      ? `${first.dayName} (${first.date})`
      : "No data available";

    const lowestRevenueDayStr = hasData && last
      ? `${last.dayName} (${last.date})`
      : "No data available";

    const result: WeeklySalesStatistics = {
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalBills,
        totalServices,
        averageRevenue: Number(averageRevenue.toFixed(2)),
        highestRevenueDay: highestRevenueDayStr,
        lowestRevenueDay: lowestRevenueDayStr,
      },
      dailyData,
    };

    fastify.log.info({
      totalRevenue: result.summary.totalRevenue,
      averageRevenue: result.summary.averageRevenue,
      daysWithData: dailyData.filter(d => d.totalRevenue > 0).length,
    }, "Weekly sales statistics (rolling 7 days) calculated successfully");

    return result;
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error({
        error: err.message,
        stack: err.stack,
        operation: "getSalesWeeklyStatistic",
      }, "Failed to get weekly sales statistics");
    }
    throw err;
  }
}

/**
 * Helper: Get Sales Statistics for Last N Days
 * 
 * Flexible version that allows any number of days
 * 
 * @param fastify - Fastify instance
 * @param days - Number of days to look back (default: 7)
 * @returns Daily revenue data
 */
export async function getSalesLastNDays(
  fastify: FastifyInstance,
  days: number = 7
): Promise<WeeklySalesStatistics> {
  fastify.log.debug({ days }, "Fetching sales data for last N days");

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (days - 1));

    fastify.log.debug({
      startDate: startDate.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
      days,
    }, "Date range calculated");

    const analyticsData = await fastify.prisma.dailySalesAnalytics.findMany({
      where: {
        date: {
          gte: startDate,
          lte: today,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    const dataMap = new Map(
      analyticsData.map((record) => [
        record.date.toISOString().split("T")[0],
        record,
      ])
    );

    const dailyData: DailyRevenueData[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < days; i++) {
      const dateKey = currentDate.toISOString().split("T")[0] ?? "";
      const dayName = currentDate.toLocaleDateString("en-US", { weekday: "long" });
      const record = dataMap.get(dateKey);

      dailyData.push({
        date: dateKey,
        dayName: dayName,
        totalRevenue: record ? Number(record.totalRevenue.toFixed(2)) : 0,
        totalBills: record?.totalBills ?? 0,
        totalServices: record?.totalServices ?? 0,
        paidBills: record?.paidBills ?? 0,
        unpaidBills: record?.unpaidBills ?? 0,
        partiallyPaidBills: record?.partiallyPaidBills ?? 0,
        averageBillAmount: record ? Number(record.averageBillAmount.toFixed(2)) : 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const totalRevenue = dailyData.reduce((sum, day) => sum + day.totalRevenue, 0);
    const totalBills = dailyData.reduce((sum, day) => sum + day.totalBills, 0);
    const totalServices = dailyData.reduce((sum, day) => sum + day.totalServices, 0);
    const averageRevenue = totalRevenue / days;

    const sortedByRevenue = [...dailyData].sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Fallback values for empty dataset
    const hasData = totalRevenue > 0 || totalBills > 0;

    const first = sortedByRevenue[0];
    const last = sortedByRevenue[sortedByRevenue.length - 1];

    const highestRevenueDayStr = hasData && first
      ? `${first.dayName} (${first.date})`
      : "No data available";

    const lowestRevenueDayStr = hasData && last
      ? `${last.dayName} (${last.date})`
      : "No data available";

    return {
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalBills,
        totalServices,
        averageRevenue: Number(averageRevenue.toFixed(2)),
        highestRevenueDay: highestRevenueDayStr,
        lowestRevenueDay: lowestRevenueDayStr,
      },
      dailyData,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error({
        error: err.message,
        stack: err.stack,
        operation: "getSalesLastNDays",
        days,
      }, "Failed to get sales data for last N days");
    }
    throw err;
  }
}