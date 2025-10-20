import type { FastifyInstance } from "fastify";
import { Type, type Static } from "@fastify/type-provider-typebox";

export const getPatientBasedOnDateSchema = Type.Object({
  year: Type.Optional(Type.Integer({ minimum: 1900, maximum: 2100 })),
  month: Type.Optional(Type.Integer({ minimum: 1, maximum: 12 })),
  week: Type.Optional(Type.Integer({ minimum: 1, maximum: 5 })),
  date: Type.Optional(Type.String({ pattern: "^\\d{2}/\\d{2}/\\d{4}$" })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 500, default: 100 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
});

export type getPatientBasedOnDateType = Static<typeof getPatientBasedOnDateSchema>;

/**
 * Fetch patients by date range granularity:
 * - month + year → all patients registered that month
 * - week + month + year → week within that month
 * - exact date → that specific day (dd/mm/yyyy)
 *
 * Returns paginated results, sorted by registeredAt descending.
 */
export async function getPatientsByDate(
  fastify: FastifyInstance,
  query: getPatientBasedOnDateType
) {
  try {
    // Validate that one of the three patterns is provided
    const hasDate = query.date !== undefined;
    const hasWeek = query.week !== undefined;
    const hasMonth = query.month !== undefined;
    const hasYear = query.year !== undefined;

    if (hasDate && (hasWeek || hasMonth || hasYear)) {
      throw new Error("Provide either (date) OR (month+year) OR (week+month+year), not a combination");
    }

    if (hasWeek || hasMonth) {
      if (!hasYear) {
        throw new Error("year is required when using month or week");
      }
      if (hasWeek && !hasMonth) {
        throw new Error("month is required when using week");
      }
    }

    if (!hasDate && !hasMonth && !hasYear) {
      throw new Error("Provide either (date) OR (month+year) OR (week+month+year)");
    }

    let startDate: Date;
    let endDate: Date;

    if (query.date) {
      const [dayStr, monthStr, yearStr] = query.date.split("/") as [string, string, string];
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10);
      const year = parseInt(yearStr, 10);

      const testDate = new Date(Date.UTC(year, month - 1, day));
      if (testDate.getUTCMonth() !== month - 1 || testDate.getUTCDate() !== day) {
        throw new Error("Invalid date");
      }

      startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));

    } else if (query.week && query.month && query.year) {
      const { week, month, year } = query;

      const startDay = (week - 1) * 7 + 1;
      const endDay = startDay + 7; 

      startDate = new Date(Date.UTC(year, month - 1, startDay, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month - 1, endDay, 0, 0, 0, 0));

    } else if (query.month && query.year) {
      const { month, year } = query;

      startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    } else {
      throw new Error("Invalid query parameters");
    }

    const limit = query.limit ?? 100;
    const offset = query.offset ?? 0;

    const [patients, total] = await Promise.all([
      fastify.prisma.patient.findMany({
        where: {
          registeredAt: {
            gte: startDate,
            lt: endDate,
          },
          isArchived: false,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          registeredAt: true,
        },
        orderBy: { registeredAt: "desc" },
        take: limit,
        skip: offset,
      }),
      fastify.prisma.patient.count({
        where: {
          registeredAt: {
            gte: startDate,
            lt: endDate,
          },
          isArchived: false,
        },
      }),
    ]);

    return {
      data: patients,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Failed to fetch patients: ${err.message}`);
    }
    throw err;
  }
}