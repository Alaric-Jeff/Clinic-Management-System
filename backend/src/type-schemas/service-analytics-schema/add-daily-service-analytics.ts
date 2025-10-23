import { Type, type Static } from "@fastify/type-provider-typebox";
import { ServiceCategory } from "@prisma/client";

export const addDailyServiceAnalyticsSchema = Type.Object({
    dailyAnalyticsId: Type.String(),
    serviceId: Type.Union([Type.String(), Type.Null()]), //in case where service might deleted
    serviceName: Type.String(),
    serviceCategory: Type.Enum(ServiceCategory),
    totalRevenue: Type.Number({ minimum: 0, default: 0 }),
    quantitySold: Type.Number({ minimum: 0, default: 0 }),
    averagePrice: Type.Number({ minimum: 0, default: 0 }),// In case price changed during the day
})

export type addDailyServiceAnalyticsType = Static<typeof addDailyServiceAnalyticsSchema>;