import { Type, type Static } from "@sinclair/typebox";

export const updateDailyAnalyticsSchema = Type.Object({
  date: Type.String({ format: "date-time" }),

  totalRevenue: Type.Optional(Type.Number({ minimum: 0 })),
  totalBills: Type.Optional(Type.Number({ minimum: 0 })),
  totalServices: Type.Optional(Type.Number({ minimum: 0 })),
  paidBills: Type.Optional(Type.Number({ minimum: 0 })),
  unpaidBills: Type.Optional(Type.Number({ minimum: 0 })),
  partiallyPaidBills: Type.Optional(Type.Number({ minimum: 0 })),
  averageBillAmount: Type.Optional(Type.Number({ minimum: 0 }))
});

export type UpdateDailyAnalyticsType = Static<typeof updateDailyAnalyticsSchema>;
