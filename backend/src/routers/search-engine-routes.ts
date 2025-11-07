import type { FastifyInstance } from "fastify";

import { searchPatientController } from "../controllers/search-engine-controller/search-patient-controller.js";
import { searchPatientWeekController } from "../controllers/search-engine-controller/search-patient-week-controller.js";
import { searchPatientMonthController } from "../controllers/search-engine-controller/search-patient-month-controller.js";
import { searchPatientDayController } from "../controllers/search-engine-controller/get-this-day-patient-controller.js";
import { searchMedicalServiceController } from "../controllers/search-engine-controller/medical-services-search-controller/search-medical-service.controller.js";

import { searchServiceSchema, searchServiceEngineResponse } from "../type-schemas/search-engine-schemas/search-service-schema.js";
import { searchBodySchema, searchPatientEngineResponse } from "../type-schemas/search-engine-schemas/search-patient-schema.js";
import { getTotalPatientsParams, totalPatientPaginatedResponseSchema } from "../type-schemas/patients/get-total-paginated-schema.js";
import { requireRole } from "../hooks/authorization.js";
import { Role } from "@prisma/client";

export async function searchEngineRoutes(fastify: FastifyInstance) {
  fastify.route({
    method: "POST",
    url: "/search-patient",
    config: {
      rateLimit: {
        max: 20, 
        timeWindow: "1 minute", 
      },
    },
    schema: {
      body: searchBodySchema,
      response: { 200: searchPatientEngineResponse },
    },
    preHandler: requireRole([Role.admin, Role.encoder]),
    handler: searchPatientController,
  });

  fastify.route({
    method: "GET",
    url: "/search-week-patients",
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 minute",
      },
    },
    schema: {
      querystring: getTotalPatientsParams,
      response: { 200: totalPatientPaginatedResponseSchema },
    },
    preHandler: requireRole([Role.admin, Role.encoder]),
    handler: searchPatientWeekController,
  });

  fastify.route({
    method: "GET",
    url: "/search-month-patients",
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 minute",
      },
    },
    schema: {
      querystring: getTotalPatientsParams,
      response: { 200: totalPatientPaginatedResponseSchema },
    },
    preHandler: requireRole([Role.admin, Role.encoder]),
    handler: searchPatientMonthController,
  });

  fastify.route({
    method: "GET",
    url: "/search-today-patients",
    config: {
      rateLimit: {
        max: 15,
        timeWindow: "1 minute",
      },
    },
    schema: {
      querystring: getTotalPatientsParams,
      response: { 200: totalPatientPaginatedResponseSchema },
    },
    preHandler: requireRole([Role.admin, Role.encoder]),
    handler: searchPatientDayController,
  });

  fastify.route({
    method: "POST",
    url: "/search-medical-service",
    config: {
      rateLimit: {
        max: 15,
        timeWindow: "1 minute",
      },
    },
    schema: {
      body: searchServiceSchema,
      response: { 200: searchServiceEngineResponse },
    },
    preHandler: requireRole([Role.admin, Role.encoder]),
    handler: searchMedicalServiceController,
  });
}
