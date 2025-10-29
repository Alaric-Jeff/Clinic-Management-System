// import type { FastifyInstance } from "fastify";
// import type { ServiceCategory } from "@prisma/client";

// /** ───────────────────────────────
//  *  Utility Helpers
//  * ─────────────────────────────── */
// const round2 = (n: number) => Math.round(n * 100) / 100;
// const formatDate = (d: Date): string => d.toISOString().split("T")[0] ?? "";
// const dayName = (d: Date): string => d.toLocaleDateString("en-US", { weekday: "long" });

// /** ───────────────────────────────
//  * Interfaces
//  * ─────────────────────────────── */
// export interface DailyServicePerformance {
//   date: string;
//   dayName: string;
//   serviceName: string;
//   serviceCategory: ServiceCategory;
//   totalRevenue: number;
//   quantitySold: number;
//   averagePrice: number;
// }

// export interface ServiceSummary {
//   serviceName: string;
//   serviceCategory: ServiceCategory;
//   totalRevenue: number;
//   totalQuantitySold: number;
//   averagePrice: number;
//   highestRevenueDay: string;
//   lowestRevenueDay: string;
//   growthRate: number;
//   trend: "increasing" | "decreasing" | "stable";
// }

// export interface WeeklyServicesStatistics {
//   period: {
//     days: number;
//     startDate: string;
//     endDate: string;
//   };
//   summary: {
//     totalServices: number;
//     totalRevenue: number;
//     totalQuantitySold: number;
//     averageRevenue: number;
//     topPerformingService: string;
//     bottomPerformingService: string;
//     mostPopularCategory: ServiceCategory;
//   };
//   servicePerformance: ServiceSummary[];
//   dailyData: DailyServicePerformance[];
// }

// export interface ServiceComparisonData {
//   currentPeriod: WeeklyServicesStatistics;
//   previousPeriod: WeeklyServicesStatistics;
//   comparison: {
//     revenueChange: number;
//     quantityChange: number;
//     servicesChange: number;
//     averageRevenueChange: number;
//     improvingServices: string[];
//     decliningServices: string[];
//     newServices: string[];
//     discontinuedServices: string[];
//   };
// }

// /** ───────────────────────────────
//  *  Core: Build Period Statistics
//  * ─────────────────────────────── */
// function buildPeriodStatistics(
//   analyticsData: Array<{
//     serviceName: string;
//     serviceCategory: ServiceCategory;
//     totalRevenue: number;
//     quantitySold: number;
//     averagePrice: number;
//     dailyAnalytics: { date: Date };
//   }>,
//   days: number,
//   startDate: Date,
//   endDate: Date
// ): WeeklyServicesStatistics {
//   // Transform raw data
//   const dailyData: DailyServicePerformance[] = analyticsData.map((r) => ({
//     date: formatDate(r.dailyAnalytics.date),
//     dayName: dayName(r.dailyAnalytics.date),
//     serviceName: r.serviceName,
//     serviceCategory: r.serviceCategory,
//     totalRevenue: round2(r.totalRevenue),
//     quantitySold: r.quantitySold,
//     averagePrice: round2(r.averagePrice),
//   }));

//   // Group by service
//   const grouped = new Map<string, DailyServicePerformance[]>();
//   for (const record of dailyData) {
//     if (!grouped.has(record.serviceName)) grouped.set(record.serviceName, []);
//     grouped.get(record.serviceName)!.push(record);
//   }

//   // Compute summaries per service
//   const servicePerformance = Array.from(grouped.entries()).map(([name, daysData]) => {
//     const totalRevenue = daysData.reduce((s, d) => s + d.totalRevenue, 0);
//     const totalQty = daysData.reduce((s, d) => s + d.quantitySold, 0);
//     const avgPrice = totalQty > 0 ? totalRevenue / totalQty : 0;

//     const sortedDays = [...daysData].sort((a, b) => b.totalRevenue - a.totalRevenue);
//     const high = sortedDays[0];
//     const low = sortedDays.at(-1);

//     const mid = Math.floor(daysData.length / 2);
//     const firstHalf = daysData.slice(0, mid).reduce((s, d) => s + d.totalRevenue, 0);
//     const secondHalf = daysData.slice(mid).reduce((s, d) => s + d.totalRevenue, 0);
//     const growthRate = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

//     const trend: "increasing" | "decreasing" | "stable" =
//       growthRate > 5 ? "increasing" : growthRate < -5 ? "decreasing" : "stable";

//     return {
//       serviceName: name,
//       serviceCategory: daysData[0]?.serviceCategory ?? ("OTHER" as ServiceCategory),
//       totalRevenue: round2(totalRevenue),
//       totalQuantitySold: totalQty,
//       averagePrice: round2(avgPrice),
//       highestRevenueDay: high ? `${high.dayName} (${high.date})` : "No data",
//       lowestRevenueDay: low ? `${low.dayName} (${low.date})` : "No data",
//       growthRate: round2(growthRate),
//       trend,
//     };
//   });

//   // Overall summary
//   const totalRevenue = servicePerformance.reduce((s, r) => s + r.totalRevenue, 0);
//   const totalQty = servicePerformance.reduce((s, r) => s + r.totalQuantitySold, 0);
//   const averageRevenue = totalRevenue / days;

//   const sortedServices = [...servicePerformance].sort((a, b) => b.totalRevenue - a.totalRevenue);
//   const categoryTotals = new Map<ServiceCategory, number>();
//   for (const s of servicePerformance)
//     categoryTotals.set(s.serviceCategory, (categoryTotals.get(s.serviceCategory) ?? 0) + s.totalRevenue);

//   const mostPopularCategory =
//     Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
//     ("OTHER" as ServiceCategory);

//   const topService = sortedServices[0];
//   const bottomService = sortedServices.at(-1);

//   return {
//     period: {
//       days,
//       startDate: formatDate(startDate),
//       endDate: formatDate(endDate),
//     },
//     summary: {
//       totalServices: servicePerformance.length,
//       totalRevenue: round2(totalRevenue),
//       totalQuantitySold: totalQty,
//       averageRevenue: round2(averageRevenue),
//       topPerformingService: topService ? topService.serviceName : "No services sold",
//       bottomPerformingService: bottomService ? bottomService.serviceName : "No services sold",
//       mostPopularCategory,
//     },
//     servicePerformance: sortedServices,
//     dailyData,
//   };
// }

// /** ───────────────────────────────
//  * Main Function: getServicesWeeklyStatistic
//  * ─────────────────────────────── */
// /**
//  * Returns aggregated service performance statistics for a rolling period.
//  * @param fastify Fastify instance (with Prisma)
//  * @param days Number of days to analyze (default 7)
//  */
// export async function getServicesWeeklyStatistic(
//   fastify: FastifyInstance,
//   days = 7
// ): Promise<WeeklyServicesStatistics> {
//   if (days < 1 || days > 365) throw new Error("Days must be between 1–365");

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   const start = new Date(today);
//   start.setDate(today.getDate() - (days - 1));

//   try {
//     const records = await fastify.prisma.serviceDailyAnalytics.findMany({
//       where: { dailyAnalytics: { date: { gte: start, lte: today } } },
//       include: { dailyAnalytics: true },
//       orderBy: [{ dailyAnalytics: { date: "asc" } }, { serviceName: "asc" }],
//     });

//     const stats = buildPeriodStatistics(records, days, start, today);
//     fastify.log.info(
//       {
//         days,
//         totalServices: stats.summary.totalServices,
//         totalRevenue: stats.summary.totalRevenue,
//       },
//       "Service statistics computed successfully"
//     );

//     return stats;
//   } catch (err) {
//     fastify.log.error({ err }, "Failed to fetch service analytics");
//     throw new Error("Unable to fetch service statistics");
//   }
// }

// /** ───────────────────────────────
//  * 📊 Comparison Function
//  * ─────────────────────────────── */
// export async function compareServicesPerformance(
//   fastify: FastifyInstance,
//   days = 7
// ): Promise<ServiceComparisonData> {
//   if (days < 1 || days > 365) throw new Error("Days must be between 1–365");

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   const currentStart = new Date(today);
//   currentStart.setDate(today.getDate() - (days - 1));

//   const prevEnd = new Date(currentStart);
//   prevEnd.setDate(currentStart.getDate() - 1);

//   const prevStart = new Date(prevEnd);
//   prevStart.setDate(prevEnd.getDate() - (days - 1));

//   try {
//     const [currentRecords, prevRecords] = await Promise.all([
//       fastify.prisma.serviceDailyAnalytics.findMany({
//         where: { dailyAnalytics: { date: { gte: currentStart, lte: today } } },
//         include: { dailyAnalytics: true },
//       }),
//       fastify.prisma.serviceDailyAnalytics.findMany({
//         where: { dailyAnalytics: { date: { gte: prevStart, lte: prevEnd } } },
//         include: { dailyAnalytics: true },
//       }),
//     ]);

//     const current = buildPeriodStatistics(currentRecords, days, currentStart, today);
//     const previous = buildPeriodStatistics(prevRecords, days, prevStart, prevEnd);

//     const percentChange = (curr: number, prev: number): number => {
//       if (prev > 0) return ((curr - prev) / prev) * 100;
//       if (curr > 0) return 100;
//       return 0;
//     };

//     const revenueChange = percentChange(current.summary.totalRevenue, previous.summary.totalRevenue);
//     const quantityChange = percentChange(current.summary.totalQuantitySold, previous.summary.totalQuantitySold);
//     const avgRevenueChange = percentChange(current.summary.averageRevenue, previous.summary.averageRevenue);

//     const currNames = new Set(current.servicePerformance.map((s) => s.serviceName));
//     const prevNames = new Set(previous.servicePerformance.map((s) => s.serviceName));
//     const prevRevenue = new Map(previous.servicePerformance.map((s) => [s.serviceName, s.totalRevenue]));

//     const improving: string[] = [];
//     const declining: string[] = [];

//     for (const s of current.servicePerformance) {
//       const prevRev = prevRevenue.get(s.serviceName) ?? 0;
//       const change = percentChange(s.totalRevenue, prevRev);
//       if (change > 5) improving.push(s.serviceName);
//       else if (change < -5) declining.push(s.serviceName);
//     }

//     const newServices = [...currNames].filter((n) => !prevNames.has(n));
//     const discontinued = [...prevNames].filter((n) => !currNames.has(n));

//     return {
//       currentPeriod: current,
//       previousPeriod: previous,
//       comparison: {
//         revenueChange: round2(revenueChange),
//         quantityChange: round2(quantityChange),
//         servicesChange: current.summary.totalServices - previous.summary.totalServices,
//         averageRevenueChange: round2(avgRevenueChange),
//         improvingServices: improving,
//         decliningServices: declining,
//         newServices,
//         discontinuedServices: discontinued,
//       },
//     };
//   } catch (err) {
//     fastify.log.error({ err }, "Failed to compare service performance");
//     throw new Error("Unable to compare service performance");
//   }
// }

// /** ───────────────────────────────
//  *  Utility: Top N Services
//  * ─────────────────────────────── */
// export async function getTopPerformingServices(
//   fastify: FastifyInstance,
//   days = 7,
//   topN = 5
// ): Promise<ServiceSummary[]> {
//   if (days < 1 || days > 365) throw new Error("Days must be between 1–365");
//   if (topN < 1 || topN > 100) throw new Error("TopN must be between 1–100");

//   const stats = await getServicesWeeklyStatistic(fastify, days);
//   return stats.servicePerformance.slice(0, topN);
// }
