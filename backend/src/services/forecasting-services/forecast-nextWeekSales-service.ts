import type { FastifyInstance } from "fastify";
import ss from "simple-statistics";

/**
 * Service: Predict next week's revenue trend
 * 
 * Uses historical data from aggregated `dailySalesAnalytics`
 * to forecast whether next week's revenue will increase,
 * decrease, or remain stable.
 */
export async function forecastNextWeekSalesService(fastify: FastifyInstance) {
  try {
    // 1️⃣ Fetch all available daily sales analytics
    const history = await fastify.prisma.dailySalesAnalytics.findMany({
      orderBy: { date: "asc" },
      select: { date: true, totalRevenue: true },
    });

    if (history.length < 7) {
      fastify.log.warn("Not enough historical data for forecasting (min 7 days)");
      return {
        message: "Insufficient data for forecast. Need at least 7 days of records.",
        predictedTrend: "unknown",
      };
    }

    // 2️⃣ Prepare time-series data (X = day index, Y = totalRevenue)
    const points = history.map((record, i) => [i, record.totalRevenue]);

    // 3️⃣ Train linear regression model
    const regression = ss.linearRegression(points);
    const line = ss.linearRegressionLine(regression);

    // 4️⃣ Predict next 7 days
    const lastIndex = points.length - 1;
    const next7Days = Array.from({ length: 7 }, (_, i) => lastIndex + i + 1);
    const predictions = next7Days.map((x) => line(x));

    // 5️⃣ Compute totals and averages
    const currentWeek = history.slice(-7).map((r) => r.totalRevenue);
    const currentWeekAvg = ss.mean(currentWeek);
    const predictedWeekAvg = ss.mean(predictions);

    // 6️⃣ Determine trend & percent change
    const percentChange =
      ((predictedWeekAvg - currentWeekAvg) / currentWeekAvg) * 100;

    const predictedTrend =
      percentChange > 5
        ? "increasing"
        : percentChange < -5
        ? "decreasing"
        : "stable";

    fastify.log.info({
      totalDataPoints: history.length,
      currentWeekAvg,
      predictedWeekAvg,
      percentChange,
      trend: predictedTrend,
    }, "Forecast computed successfully");

    // 7️⃣ Return result
    return {
      totalDataPoints: history.length,
      currentWeekAvg: Number(currentWeekAvg.toFixed(2)),
      predictedWeekAvg: Number(predictedWeekAvg.toFixed(2)),
      percentChange: Number(percentChange.toFixed(2)),
      predictedTrend,
      next7DaysForecast: predictions.map((rev, i) => ({
        dayOffset: i + 1,
        predictedRevenue: Number(rev.toFixed(2)),
      })),
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error({
        error: err.message,
        stack: err.stack,
        operation: "forecastNextWeekSalesService",
      }, "Forecast computation failed");
    }
    throw err;
  }
}
