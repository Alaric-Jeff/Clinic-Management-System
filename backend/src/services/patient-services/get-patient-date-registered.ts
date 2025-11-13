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
 * Validates that the provided date string represents a valid calendar date
 * @param dateStr Date string in dd/mm/yyyy format
 * @returns true if valid, false otherwise
 */
function isValidDate(dateStr: string): boolean {
  const parts = dateStr.split("/");
  if (parts.length !== 3) {
    return false;
  }
  const [dayStr, monthStr, yearStr] = parts as [string, string, string];
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);

  // Check basic range validity
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  // Validate against actual calendar date
  const testDate = new Date(Date.UTC(year, month - 1, day));
  return (
    testDate.getUTCFullYear() === year &&
    testDate.getUTCMonth() === month - 1 &&
    testDate.getUTCDate() === day
  );
}

/**
 * Validates week number is valid for the given month/year combination
 * @param week Week number (1-5)
 * @param month Month (1-12)
 * @param year Year
 * @returns true if valid, false otherwise
 */
function isValidWeekForMonth(week: number, month: number, year: number): boolean {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startDay = (week - 1) * 7 + 1;
  return startDay <= daysInMonth;
}

/**
 * Fetch patients by date range granularity:
 * - date → specific day (dd/mm/yyyy)
 * - year only → entire year
 * - month + year → all patients created that month
 * - week + month + year → specific week within that month (weeks start on day 1)
 *
 * Returns paginated results, sorted by createdAt descending.
 */
export async function getPatientsByDate(
  fastify: FastifyInstance,
  query: getPatientBasedOnDateType
) {
  try {
    const hasDate = query.date !== undefined;
    const hasWeek = query.week !== undefined;
    const hasMonth = query.month !== undefined;
    const hasYear = query.year !== undefined;

    // Validate query pattern - date cannot be combined with other params
    if (hasDate) {
      if (hasWeek || hasMonth || hasYear) {
        throw new Error(
          "Invalid query: 'date' cannot be combined with year, month, or week parameters"
        );
      }
    } else if (hasWeek) {
      // Week requires both month and year
      if (!hasMonth || !hasYear) {
        throw new Error(
          "Invalid query: 'week' requires both 'month' and 'year' parameters"
        );
      }
    } else if (hasMonth) {
      // Month requires year
      if (!hasYear) {
        throw new Error("Invalid query: 'month' requires 'year' parameter");
      }
    } else if (!hasYear) {
      // At least year must be provided if no other params
      throw new Error(
        "Invalid query: Must provide at least one date parameter (date, year, month+year, or week+month+year)"
      );
    }

    let startDate: Date;
    let endDate: Date;

    if (hasDate && query.date) {
      // Pattern 1: Exact date (dd/mm/yyyy)
      if (!isValidDate(query.date)) {
        throw new Error(`Invalid date: '${query.date}' is not a valid calendar date`);
      }

      const [dayStr, monthStr, yearStr] = query.date.split("/") as [
        string,
        string,
        string
      ];
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10);
      const year = parseInt(yearStr, 10);

      startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
    } else if (
      hasWeek &&
      hasMonth &&
      hasYear &&
      query.week &&
      query.month &&
      query.year
    ) {
      // Pattern 2: Week + Month + Year
      const { week, month, year } = query;

      // Validate week is valid for the given month
      if (!isValidWeekForMonth(week, month, year)) {
        throw new Error(
          `Invalid week: Week ${week} does not exist in ${year}-${String(month).padStart(2, "0")}`
        );
      }

      const startDay = (week - 1) * 7 + 1;
      const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const endDay = Math.min(startDay + 7, lastDayOfMonth + 1);

      startDate = new Date(Date.UTC(year, month - 1, startDay, 0, 0, 0, 0));

      // If endDay exceeds the month, cap at next month's start
      if (endDay > lastDayOfMonth) {
        endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      } else {
        endDate = new Date(Date.UTC(year, month - 1, endDay, 0, 0, 0, 0));
      }
    } else if (hasMonth && hasYear && query.month && query.year) {
      // Pattern 3: Month + Year (entire month)
      const { month, year } = query;

      startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    } else if (hasYear && !hasMonth && query.year) {
      // Pattern 4: Year only (entire year)
      const { year } = query;

      startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
    } else {
      // Should never reach here due to validation above
      throw new Error("Invalid query parameters");
    }

    const limit = query.limit ?? 100;
    const offset = query.offset ?? 0;

    const [patients, total] = await Promise.all([
      fastify.prisma.patient.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
          isArchived: false,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      fastify.prisma.patient.count({
        where: {
          createdAt: {
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
    // Log the error for debugging (use proper logger in production)
    fastify.log.error(
      { err, query },
      "Failed to fetch patients by date"
    );

    if (err instanceof Error) {
      throw new Error(`Failed to fetch patients: ${err.message}`);
    }
    throw err;
  }
}