import type { FastifyInstance } from "fastify";
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from "date-fns";

/**
 * 🧩 Get weekly medical documentation counts (Mon–Sun)
 *
 * Returns an array of objects:
 * [
 *   { day: 'Mon', count: 3 },
 *   { day: 'Tue', count: 7 },
 *   ...
 * ]
 *
 * Days beyond today (e.g., later in week) are returned with count = 0.
 */
export async function getWeeklyDocumentations(fastify: FastifyInstance) {
  try {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); 
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });     

    // Fetch all docs created this week
    const docs = await fastify.prisma.medicalDocumentation.findMany({
          where: {
            createdAt: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
          select: { createdAt: true },
        });

    // Count per day (Mon–Sun)
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const result = days.map((day) => {
      const dayName = format(day, "EEE"); // Mon, Tue, ...
      const count = docs.filter(
        (d) => format(d.createdAt, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
      ).length;
      return { day: dayName, count };
    });

    return result;
  } catch (err: unknown) {
    fastify.log.error(err);
    throw fastify.httpErrors.internalServerError("Failed to get weekly data");
  }
}
