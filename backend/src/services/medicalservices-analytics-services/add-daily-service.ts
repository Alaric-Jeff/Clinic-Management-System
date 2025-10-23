import type { FastifyInstance } from "fastify";
import type { addDailyServiceAnalyticsType } from "../../type-schemas/service-analytics-schema/add-daily-service-analytics.js";

/**
 * Service: Add or Update Daily Service Analytics
 * ----------------------------------------------------
 * - Upserts analytics record for a single service within a given day
 * - Called automatically when updating daily sales analytics
 * - Ensures each service has one analytics record per day
 *
 * @param fastify Fastify instance with Prisma client
 * @param body addDailyServiceAnalyticsType — the analytics payload for a service
 * @returns Success status and message
 */
export async function addDailyServiceAnalytics(
  fastify: FastifyInstance,
  body: addDailyServiceAnalyticsType
) {
  const {
    dailyAnalyticsId,
    serviceId,
    serviceName,
    serviceCategory,
    totalRevenue,
    quantitySold,
    averagePrice,
  } = body;

  try {
    // 🧩 Upsert (insert or update) per-service analytics for the given day
    await fastify.prisma.serviceDailyAnalytics.upsert({
      where: {
        dailyAnalyticsId_serviceName: {
          dailyAnalyticsId,
          serviceName,
        },
      },
      update: {
        totalRevenue,
        quantitySold,
        averagePrice,
        serviceCategory,
        serviceId,
      },
      create: {
        dailyAnalyticsId,
        serviceId,
        serviceName,
        serviceCategory,
        totalRevenue,
        quantitySold,
        averagePrice,
      },
    });

    fastify.log.info(
      `✅ Service analytics updated for "${serviceName}" (Category: ${serviceCategory})`
    );

  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(
        `❌ Failed to update service analytics for ${serviceName}: ${err.message}`
      );
    }
    throw err;
  }
}
