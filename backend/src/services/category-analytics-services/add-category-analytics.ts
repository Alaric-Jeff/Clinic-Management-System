import type { FastifyInstance } from "fastify";
import type { addDailyCategoryType } from "../../type-schemas/category-analytics-schema.ts/add-daily-category-schema.js";

/**
 * 
 */

export async function addDailyCategoryAnalytics(
  fastify: FastifyInstance,
  body: addDailyCategoryType
) {
  const { dailyAnalyticsId, category, totalRevenue, totalServices, quantitySold } = body;

  try {
    await fastify.prisma.categoryDailyAnalytics.upsert({
      where: {
        dailyAnalyticsId_category: {
          dailyAnalyticsId,
          category,
        },
      },
      update: {
        totalRevenue,
        totalServices,
        quantitySold,
      },
      create: {
        dailyAnalyticsId,
        category,
        totalRevenue,
        totalServices,
        quantitySold,
      },
    });

    fastify.log.info(` Category analytics updated for ${category}`);
    return { success: true, message: `Category analytics updated for ${category}` };
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(` Failed to update category analytics for ${category}: ${err.message}`);
    }
    throw err;
  }
}
