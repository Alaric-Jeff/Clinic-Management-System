    import type { FastifyInstance } from "fastify";
    import { requireRole } from '../hooks/authorization.js';
    import { createPatientController } from "../controllers/patient-controllers/create-patient-controller.js";
    import { getTodayPatientController } from "../controllers/patient-controllers/get-today-patient-controller.js";
    import { getTotalPatientCountsController } from "../controllers/patient-controllers/get-total-counts-controller.js";
    import { Role } from "@prisma/client";
    import {
        createPatientSchema,
        createPatientSuccessResponse,
        getTodayPatientSchemaResponse
    } from '../type-schemas/patient-schemas.js';

    export async function patientRoutes(fastify: FastifyInstance) {
        //create patient 
        fastify.route({
            method: 'POST',
            url: '/create-patient',
            schema: {
                body: createPatientSchema, 
                response: {
                    200: createPatientSuccessResponse
                }
            },
            preHandler: requireRole([Role.admin, Role.encoder]), 
            handler: createPatientController
        });
        // get today's unarchived patients
        fastify.route({
            method: 'GET',
            url: '/get-today-patients',
            schema: {
                response: getTodayPatientSchemaResponse
            }, preHandler: requireRole([Role.admin, Role.encoder]),
            handler: getTodayPatientController
        })

        fastify.route({
            method: 'GET',
            url: '/get-total-patients-count',
            schema: {
                response: {
                    200: {  // HTTP status code
                        type: 'object',
                        properties: {
                        count: { type: 'number' }
                    }
                }
            }
        },
        preHandler: requireRole([Role.admin, Role.encoder]),
        handler: getTotalPatientCountsController
    })

        
    }