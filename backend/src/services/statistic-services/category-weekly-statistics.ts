// import type { FastifyInstance } from "fastify";
// import type { ServiceCategory } from "@prisma/client";

// /**
//  * 📊 Returns N-days aggregated statistics grouped by service category.
//  * 
//  * Each category shows total revenue, total quantity sold, average price,
//  * top-performing service, and growth rate compared to the first half of the period.
//  *
//  * @param fastify Fastify instance (with Prisma)
//  * @param days Number of days to analyze (default: 7)
//  */
// export async function getCategoryWeeklyStatistic(
//   fastify: FastifyInstance,
//   days = 7
// ) {
//   if (days < 1 || days > 365)
//     throw new Error("Days must be between 1 and 365");

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   const startDate = new Date(today);
//   startDate.setDate(today.getDate() - (days - 1));

//   try {
//     const records = await fastify.prisma.serviceDailyAnalytics.findMany({
//       where: { dailyAnalytics: { date: { gte: startDate, lte: today } } },
//       include: { dailyAnalytics: true },
//       orderBy: [{ serviceCategory: "asc" }, { dailyAnalytics: { date: "asc" } }],
//     });

//     if (!records.length) {
//       fastify.log.warn("No analytics found for the given date range.");
//       return {
//         period: { startDate, endDate: today, days },
//         summary: [],
//         totalRevenue: 0,
//         totalQuantitySold: 0,
//       };
//     }

//     // Group by category
//     const groupedByCategory = new Map<ServiceCategory, typeof records>();
//     for (const record of records) {
//       const cat = record.serviceCategory ?? ("OTHER" as ServiceCategory);
//       if (!groupedByCategory.has(cat)) groupedByCategory.set(cat, []);
//       groupedByCategory.get(cat)!.push(record);
//     }

//     // Compute category-level stats
//     const summary = Array.from(groupedByCategory.entries()).map(([category, recs]) => {
//       const totalRevenue = recs.reduce((sum, r) => sum + r.totalRevenue, 0);
//       const totalQty = recs.reduce((sum, r) => sum + r.quantitySold, 0);
//       const avgPrice = totalQty > 0 ? totalRevenue / totalQty : 0;

//       // Find top service in this category
//       const serviceMap = new Map<string, number>();
//       for (const r of recs)
//         serviceMap.set(r.serviceName, (serviceMap.get(r.serviceName) ?? 0) + r.totalRevenue);

//       const topService = Array.from(serviceMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No data";

//       // Simple growth check: first half vs second half of period
//       const mid = Math.floor(recs.length / 2);
//       const firstHalf = recs.slice(0, mid).reduce((s, r) => s + r.totalRevenue, 0);
//       const secondHalf = recs.slice(mid).reduce((s, r) => s + r.totalRevenue, 0);
//       const growthRate = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

//       const trend: "increasing" | "decreasing" | "stable" =
//         growthRate > 5 ? "increasing" : growthRate < -5 ? "decreasing" : "stable";

//       return {
//         serviceCategory: category,
//         totalRevenue: Math.round(totalRevenue * 100) / 100,
//         totalQuantitySold: totalQty,
//         averagePrice: Math.round(avgPrice * 100) / 100,
//         topService,
//         growthRate: Math.round(growthRate * 100) / 100,
//         trend,
//       };
//     });

//     // Compute total across all categories
//     const totalRevenue = summary.reduce((sum, c) => sum + c.totalRevenue, 0);
//     const totalQuantitySold = summary.reduce((sum, c) => sum + c.totalQuantitySold, 0);

//     fastify.log.info(
//       { days, totalCategories: summary.length, totalRevenue },
//       "Category statistics computed successfully"
//     );

//     return {
//       period: {
//         days,
//         startDate: startDate.toISOString().split("T")[0],
//         endDate: today.toISOString().split("T")[0],
//       },
//       summary,
//       totalRevenue,
//       totalQuantitySold,
//     };
//   } catch (err) {
//     fastify.log.error({ err }, "Failed to compute category statistics");
//     throw new Error("Unable to fetch category statistics");
//   }
// }
