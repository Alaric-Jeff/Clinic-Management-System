import { Type } from '@sinclair/typebox';

export const DailyRevenueData = Type.Object({
  date: Type.String({ format: 'date' }), // YYYY-MM-DD format
  dayName: Type.String(), // e.g., "Monday", "Tuesday"
  totalRevenue: Type.Number(),
  totalBills: Type.Number(),
  totalServices: Type.Number(),
  paidBills: Type.Number(),
  unpaidBills: Type.Number(),
  partiallyPaidBills: Type.Number(),
  averageBillAmount: Type.Number(),
});

export const WeeklySalesStatistics = Type.Object({
  summary: Type.Object({
    totalRevenue: Type.Number(),
    totalBills: Type.Number(),
    totalServices: Type.Number(),
    averageRevenue: Type.Number(),
    highestRevenueDay: Type.String(),
    lowestRevenueDay: Type.String(),
  }),
  dailyData: Type.Array(DailyRevenueData),
});