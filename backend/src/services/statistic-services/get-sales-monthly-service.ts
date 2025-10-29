import type { FastifyInstance } from "fastify";
import { startOfMonth, endOfMonth, subMonths, addMonths, format } from "date-fns";
import * as ss from "simple-statistics";

/**
 * Get monthly revenue with comparison and forecasting
 * Returns: current/last month revenue, percentage change, and next month prediction
 */
export async function getSalesMonthly(fastify: FastifyInstance) {
  try {
    const now = new Date();
    
    // Current month date range
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    // Last month date range
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Fetch current month revenue
    const currentMonthData = await fastify.prisma.dailySalesAnalytics.aggregate({
      _sum: {
        totalRevenue: true,
      },
      where: {
        date: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
    });

    // Fetch last month revenue
    const lastMonthData = await fastify.prisma.dailySalesAnalytics.aggregate({
      _sum: {
        totalRevenue: true,
      },
      where: {
        date: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });

    const currentRevenue = currentMonthData._sum.totalRevenue ?? 0;
    const lastRevenue = lastMonthData._sum.totalRevenue ?? 0;

    // Calculate percentage change
    let percentageChange = 0;
    if (lastRevenue > 0) {
      percentageChange = ((currentRevenue - lastRevenue) / lastRevenue) * 100;
    }

    // ===== FORECASTING WITH LINEAR REGRESSION =====
    
    // Fetch last 6 months of data for better prediction accuracy
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));
    
    const historicalData = await fastify.prisma.dailySalesAnalytics.groupBy({
      by: ['date'],
      _sum: {
        totalRevenue: true,
      },
      where: {
        date: {
          gte: sixMonthsAgo,
          lte: currentMonthEnd,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group by month and sum revenue
    const monthlyRevenues = new Map<string, number>();
    
    historicalData.forEach(day => {
      const monthKey = format(day.date, 'yyyy-MM');
      const revenue = day._sum.totalRevenue ?? 0;
      monthlyRevenues.set(
        monthKey, 
        (monthlyRevenues.get(monthKey) ?? 0) + revenue
      );
    });

    // Convert to array of [monthIndex, revenue] for regression
    const dataPoints: [number, number][] = Array.from(monthlyRevenues.entries())
      .map(([monthKey, revenue], index) => [index, revenue]);

    // Initialize forecast variables
    let nextMonthPrediction = 0;
    let confidenceScore = 0;
    let trend: "increasing" | "decreasing" | "stable" = "stable";

    // Only calculate if we have at least 3 months of data
    if (dataPoints.length >= 3) {
      // Calculate linear regression
      const regressionLine = ss.linearRegression(dataPoints);
      const regressionFn = ss.linearRegressionLine(regressionLine);
      const rSquared = ss.rSquared(dataPoints, regressionFn);
      
      // Predict next month (monthIndex = dataPoints.length)
      nextMonthPrediction = regressionFn(dataPoints.length);
      
      // Ensure prediction is not negative
      nextMonthPrediction = Math.max(0, nextMonthPrediction);
      
      // Calculate confidence score (0-100 based on R²)
      // R² ranges from 0 to 1, where 1 = perfect fit
      confidenceScore = parseFloat((rSquared * 100).toFixed(2));
      
      // Determine trend based on slope
      const slope = regressionLine.m;
      if (slope > 100) { // Revenue increasing by more than 100 per month
        trend = "increasing";
      } else if (slope < -100) { // Revenue decreasing by more than 100 per month
        trend = "decreasing";
      } else {
        trend = "stable";
      }
    }

    return {
        // Current metrics
        currentMonthRevenue: currentRevenue,
        lastMonthRevenue: lastRevenue,
        percentageChange: parseFloat(percentageChange.toFixed(2)),
        isPositive: percentageChange >= 0,
        
        // Forecasting metrics
        forecast: {
          nextMonthPrediction: parseFloat(nextMonthPrediction.toFixed(2)),
          confidenceScore: confidenceScore,
          trend: trend,
          dataPointsUsed: dataPoints.length,
          nextMonthName: format(addMonths(now, 1), 'MMMM yyyy'),
        },
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(`Error occurred in getting monthly sales: ${err.message}`);
    }
    throw err;
  }
}