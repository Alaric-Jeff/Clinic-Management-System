import type { FastifyInstance } from "fastify";

import { searchPatientController } from "../controllers/search-engine-controller/search-patient-controller.js";
import { searchPatientWeekController } from "../controllers/search-engine-controller/search-patient-week-controller.js";
import { searchPatientMonthController } from "../controllers/search-engine-controller/search-patient-month-controller.js";
import { searchPatientDayController } from "../controllers/search-engine-controller/get-this-day-patient-controller.js";

import { searchBodySchema, searchPatientEngineResponse } from "../type-schemas/search-engine-schemas/search-patient-schema.js";
import {getTotalPatientsParams, totalPatientPaginatedResponseSchema} from '../type-schemas/patients/get-total-paginated-schema.js'
import { requireRole } from "../hooks/authorization.js";
import { Role } from "@prisma/client";

export async function searchEngineRoutes(
    fastify: FastifyInstance
){
    fastify.route({
        method: "POST",
        url: '/search-patient',
        schema: {
            body: searchBodySchema,
            response: {
                200: searchPatientEngineResponse
            }
        }, preHandler: requireRole([Role.admin, Role.encoder]),
        handler: searchPatientController
    })

    fastify.route({
        method: 'GET',
        url: '/search-week-patients',
        schema: {
            querystring: getTotalPatientsParams,
            response: {
                200: totalPatientPaginatedResponseSchema
            }
        }, preHandler: requireRole([Role.admin, Role.encoder]),
        handler: searchPatientWeekController
    })

    fastify.route({
        method: 'GET',
        url: '/search-month-patients',
        schema: {
            querystring: getTotalPatientsParams,
            response: {
                200: totalPatientPaginatedResponseSchema
            }
        }, preHandler: requireRole([Role.admin, Role.encoder]),
        handler: searchPatientMonthController
    })

    fastify.route({
        method: 'GET',
        url: '/search-today-patients',
        schema: {
            querystring: getTotalPatientsParams,
            response: {
                200: totalPatientPaginatedResponseSchema
            }
        }, preHandler: requireRole([Role.admin, Role.encoder]),
        handler: searchPatientDayController
    })

}