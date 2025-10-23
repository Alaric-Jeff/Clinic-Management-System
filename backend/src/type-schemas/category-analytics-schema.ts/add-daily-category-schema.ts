import { ServiceCategory } from "@prisma/client";
import { Type, type Static } from "@sinclair/typebox";

export const addDailyCategorySchema = Type.Object({
    dailyAnalyticsId: Type.String(),
    category: Type.Enum(ServiceCategory),
    totalRevenue: Type.Number({ minimum: 0, default: 0 }),
    totalServices: Type.Number({ minimum: 0, default: 0 }),
    quantitySold: Type.Number({ minimum: 0, default: 0 }),
   
})

export type addDailyCategoryType = Static<typeof addDailyCategorySchema>;