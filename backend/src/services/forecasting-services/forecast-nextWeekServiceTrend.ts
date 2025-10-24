import type { FastifyInstance } from "fastify";
import ss from "simple-statistics";

/**
 * 🔮 Service Forecasting: Predict service revenue trends for the next week.
 *
 * Uses aggregated `serviceDailyAnalytics` data to estimate whether each service’s
 * revenue will likely increase, decrease, or stay stable next week based on
 * historical revenue patterns using linear regression.
 *
 * The prediction is purely data-driven — it does **not** account for seasonality,
 * holidays, or external events. However, these effects may still be implicitly
 * reflected in the historical data.
 *
 * ---
 * @param {FastifyInstance} fastify - Fastify instance (providing Prisma + logger)
 * @returns {Promise<{
 *   totalServicesAnalyzed: number;
 *   topIncreasing: ServiceForecastResult[];
 *   topDecreasing: ServiceForecastResult[];
 *   allServiceForecasts: ServiceForecastResult[];
 * }>} Forecast data for all services with trends and next-week projections.
 */

/**
 * Result type representing each service forecast outcome
 */
export interface ServiceForecastResult {
  serviceName: string;
  predictedTrend: "increasing" | "decreasing" | "stable";
  percentChange: number;
  currentWeekAvg: number;
  predictedWeekAvg: number;
  next7DaysForecast: { dayOffset: number; predictedRevenue: number }[];
}
export async function forecastNextWeekServiceTrend(
  fastify: FastifyInstance
) {
  try {
    // 1️⃣ Fetch historical service analytics
    const history = await fastify.prisma.serviceDailyAnalytics.findMany({
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, serviceName: true, totalRevenue: true },
    });

    if (!history.length) {
      fastify.log.warn("No service analytics data found.");
      return { message: "No service analytics data available." };
    }

    // 2️⃣ Group by serviceName
    const serviceMap: Record<string, { x: number; y: number }[]> = {};
    history.forEach((record) => {
      const x = record.createdAt.getTime(); // use timestamp for regression accuracy
      const arr = serviceMap[record.serviceName] ?? (serviceMap[record.serviceName] = []);
      arr.push({ x, y: record.totalRevenue });
    });

    const results: ServiceForecastResult[] = [];

    // 3️⃣ Analyze each service individually
    for (const [serviceName, points] of Object.entries(serviceMap)) {
      if (points.length < 7) continue; // skip if insufficient data

      // Sort by time to ensure regression consistency
      const sortedPoints = points.sort((a, b) => a.x - b.x);

      // Linear regression: revenue = m*x + b
      const regression = ss.linearRegression(sortedPoints.map(p => [p.x, p.y]));
      const line = ss.linearRegressionLine(regression);

  // Predict the next 7 days
  const lastPoint = sortedPoints.at(-1);
  if (!lastPoint) continue;
  const lastTimestamp = lastPoint.x;
  const oneDayMs = 24 * 60 * 60 * 1000;
  const next7Timestamps = Array.from({ length: 7 }, (_, i) => lastTimestamp + (i + 1) * oneDayMs);
  const predictions = next7Timestamps.map(t => line(t));

  // Calculate averages
  const currentWeek = sortedPoints.slice(-7).map(p => p.y);
  const currentWeekAvg = ss.mean(currentWeek) ?? 0;
  const predictedWeekAvg = ss.mean(predictions) ?? 0;
  const percentChange = currentWeekAvg > 0 ? ((predictedWeekAvg - currentWeekAvg) / currentWeekAvg) * 100 : predictedWeekAvg > 0 ? 100 : 0;

      // Determine trend
      const predictedTrend =
        percentChange > 5 ? "increasing" :
        percentChange < -5 ? "decreasing" : "stable";

      // Push result
      results.push({
        serviceName,
        predictedTrend,
        percentChange: Number(percentChange.toFixed(2)),
        currentWeekAvg: Number(currentWeekAvg.toFixed(2)),
        predictedWeekAvg: Number(predictedWeekAvg.toFixed(2)),
        next7DaysForecast: predictions.map((rev, i) => ({
          dayOffset: i + 1,
          predictedRevenue: Number(rev.toFixed(2)),
        })),
      });
    }

    // 4️⃣ Sort & summarize
    const sorted = results.sort((a, b) => b.percentChange - a.percentChange);
    const topIncreasing = sorted.slice(0, 3);
    const topDecreasing = sorted.slice(-3).reverse();

    // Log for debugging
    fastify.log.info({
      totalServicesAnalyzed: results.length,
      topIncreasing,
      topDecreasing,
    }, "✅ Service forecast computed successfully");

    return {
      totalServicesAnalyzed: results.length,
      topIncreasing,
      topDecreasing,
      allServiceForecasts: results,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error({
        error: err.message,
        stack: err.stack,
        operation: "forecastNextWeekServiceTrend",
      }, "❌ Service forecast failed");
    }
    throw err;
  }
}
