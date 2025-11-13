import type { FastifyRequest, FastifyReply } from "fastify";
import {
  getPatientsByDate,
  type getPatientBasedOnDateType,
} from "../../services/patient-services/get-patient-date-registered.js";

/**
 * Controller for fetching patients based on date range criteria
 * 
 * Supports four query patterns:
 * 1. Specific date (dd/mm/yyyy)
 * 2. Year only (all patients in that year)
 * 3. Month + Year (all patients in that month)
 * 4. Week + Month + Year (specific week within a month)
 * 
 * @param request - Fastify request with body parameters
 * @param reply - Fastify reply object
 */
export async function getPatientBasedOnDateController(
  request: FastifyRequest<{ Body: getPatientBasedOnDateType }>,
  reply: FastifyReply
) {
  const { year, month, week, date, limit, offset } = request.body;

  try {
    // Build query params object with only defined values
    const queryParams: getPatientBasedOnDateType = {};

    if (year !== undefined) queryParams.year = year;
    if (month !== undefined) queryParams.month = month;
    if (week !== undefined) queryParams.week = week;
    if (date !== undefined) queryParams.date = date;
    if (limit !== undefined) queryParams.limit = limit;
    if (offset !== undefined) queryParams.offset = offset;

    // Log query for monitoring and debugging
    request.server.log.debug(
      { query: queryParams, requestId: request.id },
      "Fetching patients by date range"
    );

    const data = await getPatientsByDate(request.server, queryParams);

    // Log successful retrieval with metrics
    request.server.log.info(
      {
        requestId: request.id,
        totalResults: data.pagination.total,
        returnedResults: data.data.length,
        query: queryParams,
      },
      "Successfully fetched patients by date range"
    );

    return reply.code(200).send({
      message: "Successfully fetched patients by date range",
      data,
    });
  } catch (err: unknown) {
    // Handle validation errors from service layer
    if (err instanceof Error) {
      const errorMessage = err.message.toLowerCase();

      // Check if it's a validation error (user input error)
      if (
        errorMessage.includes("invalid") ||
        errorMessage.includes("required") ||
        errorMessage.includes("must provide") ||
        errorMessage.includes("cannot be combined") ||
        errorMessage.includes("does not exist") ||
        errorMessage.includes("exceeds")
      ) {
        request.server.log.warn(
          {
            requestId: request.id,
            body: request.body,
            error: err.message,
          },
          "Validation error in patient date query"
        );

        return reply.code(400).send({
          message: err.message,
          error: "ValidationError",
        });
      }

      // Database or other system errors
      request.server.log.error(
        {
          requestId: request.id,
          body: request.body,
          error: err.message,
          stack: err.stack,
        },
        "Error occurred while fetching patients by date range"
      );

      throw request.server.httpErrors.internalServerError(
        "An error occurred while fetching patients by date range"
      );
    }

    // Handle unknown errors
    request.server.log.error(
      {
        requestId: request.id,
        body: request.body,
        error: String(err),
      },
      "Unknown error occurred while fetching patients by date range"
    );

    throw request.server.httpErrors.internalServerError(
      "An unexpected error occurred while fetching patients by date range"
    );
  }
}