import type { FastifyInstance } from "fastify";
import { startOfMonth, endOfMonth, subMonths, addMonths, format } from "date-fns";
import * as ss from "simple-statistics";

interface ServicePerformance {
  serviceName: string;
  serviceCategory: string;
  totalRevenue: number;
  totalQuantity: number;
  averagePrice: number;
  rank: number;
}

interface ForecastedService {
  serviceName: string;
  serviceCategory: string;
  predictedRevenue: number;
  confidenceScore: number;
  trend: "increasing" | "decreasing" | "stable";
  historicalAverage: number;
}

export async function getTopPerformingServices(fastify: FastifyInstance) {
  try {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    // ===== PART 1: Get Current Month's Top 10 Services by Revenue =====
    
    // Step 1: Get daily analytics IDs for current month
    const currentMonthDailyAnalytics = await fastify.prisma.dailySalesAnalytics.findMany({
      where: {
        date: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
      select: { id: true },
    });

    const currentMonthIds = currentMonthDailyAnalytics.map(d => d.id);

    // Step 2: Query service analytics using IDs (avoids ambiguous column error)
    const currentMonthServices = await fastify.prisma.serviceDailyAnalytics.groupBy({
      by: ['serviceName', 'serviceCategory'],
      _sum: {
        totalRevenue: true,
        quantitySold: true,
      },
      _avg: {
        averagePrice: true,
      },
      where: {
        dailyAnalyticsId: {
          in: currentMonthIds,
        },
      },
    });

    // Transform and rank by revenue
    const currentTopServices: ServicePerformance[] = currentMonthServices
      .map((service) => ({
        serviceName: service.serviceName,
        serviceCategory: service.serviceCategory,
        totalRevenue: service._sum.totalRevenue ?? 0,
        totalQuantity: service._sum.quantitySold ?? 0,
        averagePrice: service._avg.averagePrice ?? 0,
        rank: 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)
      .map((service, index) => ({
        ...service,
        rank: index + 1,
      }));

    // ===== PART 2: Forecast Next Month's Top Performers =====
    
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));

    // Step 1: Get historical daily analytics with dates
    const historicalDailyAnalytics = await fastify.prisma.dailySalesAnalytics.findMany({
      where: {
        date: {
          gte: sixMonthsAgo,
          lte: currentMonthEnd,
        },
      },
      select: {
        id: true,
        date: true,
      },
    });

    const historicalIds = historicalDailyAnalytics.map(d => d.id);
    const idToDateMap = new Map(historicalDailyAnalytics.map(d => [d.id, d.date]));

    // Step 2: Query service analytics with historical IDs
    const historicalData = await fastify.prisma.serviceDailyAnalytics.groupBy({
      by: ['serviceName', 'serviceCategory'],
      _sum: {
        totalRevenue: true,
      },
      where: {
        dailyAnalyticsId: {
          in: historicalIds,
        },
      },
    });

    const serviceMonthlyData = await fastify.prisma.serviceDailyAnalytics.findMany({
      where: {
        dailyAnalyticsId: {
          in: historicalIds,
        },
      },
      select: {
        serviceName: true,
        serviceCategory: true,
        totalRevenue: true,
        dailyAnalyticsId: true,
      },
    });

    const serviceMonthlyRevenue = new Map<string, Map<string, number>>();

    serviceMonthlyData.forEach((record) => {
      const serviceName = record.serviceName;
      const date = idToDateMap.get(record.dailyAnalyticsId);
      
      if (!date) return; // Skip if date not found
      
      const monthKey = format(date, 'yyyy-MM');
      const revenue = record.totalRevenue;

      if (!serviceMonthlyRevenue.has(serviceName)) {
        serviceMonthlyRevenue.set(serviceName, new Map());
      }

      const monthlyMap = serviceMonthlyRevenue.get(serviceName)!;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + revenue);
    });

    const forecastedServices: ForecastedService[] = [];

    serviceMonthlyRevenue.forEach((monthlyData, serviceName) => {
      const dataPoints: [number, number][] = Array.from(monthlyData.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([_, revenue], index) => [index, revenue]);

      if (dataPoints.length >= 3) {
        const regressionLine = ss.linearRegression(dataPoints);
        const regressionFn = ss.linearRegressionLine(regressionLine);
        const rSquared = ss.rSquared(dataPoints, regressionFn);
        const predictedRevenue = regressionFn(dataPoints.length);
        const safePrediction = Math.max(0, predictedRevenue);
        const confidenceScore = parseFloat((rSquared * 100).toFixed(2));
        const historicalAverage = dataPoints.reduce((sum, [_, rev]) => sum + rev, 0) / dataPoints.length;

        const slope = regressionLine.m;
        let trend: "increasing" | "decreasing" | "stable" = "stable";
        const trendThreshold = historicalAverage * 0.05;
        
        if (slope > trendThreshold) {
          trend = "increasing";
        } else if (slope < -trendThreshold) {
          trend = "decreasing";
        }

        const serviceInfo = historicalData.find(s => s.serviceName === serviceName);
        const category = serviceInfo?.serviceCategory ?? 'others';

        forecastedServices.push({
          serviceName,
          serviceCategory: category,
          predictedRevenue: parseFloat(safePrediction.toFixed(2)),
          confidenceScore,
          trend,
          historicalAverage: parseFloat(historicalAverage.toFixed(2)),
        });
      }
    });

    const topForecastedServices = forecastedServices
      .sort((a, b) => b.predictedRevenue - a.predictedRevenue)
      .slice(0, 10);

    return {
      currentMonth: {
        monthName: format(now, 'MMMM yyyy'),
        topServices: currentTopServices,
        totalServicesAnalyzed: currentMonthServices.length,
      },
      forecast: {
        nextMonthName: format(addMonths(now, 1), 'MMMM yyyy'),
        topPredictedServices: topForecastedServices,
        totalServicesForecasted: forecastedServices.length,
        note: confidenceNote(topForecastedServices),
      },
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(`An error occurred in getTopPerformingServices: ${err.message}`);
    }
    throw err;
  }
}

function confidenceNote(services: ForecastedService[]): string {
  if (services.length === 0) {
    return "Insufficient data for forecasting. Need at least 3 months of service history.";
  }

  const avgConfidence = services.reduce((sum, s) => sum + s.confidenceScore, 0) / services.length;

  if (avgConfidence >= 80) {
    return "High confidence forecasts - historical data shows consistent patterns.";
  } else if (avgConfidence >= 60) {
    return "Moderate confidence forecasts - some variability in historical data.";
  } else {
    return "Low confidence forecasts - high variability in historical data. Use with caution.";
  }
}