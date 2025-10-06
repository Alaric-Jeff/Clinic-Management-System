import type { FastifyInstance } from "fastify";
import { requireRole } from '../hooks/authorization.js';
import { createPatientController } from "../controllers/patient-controllers/create-patient-controller.js";
import { Role } from "@prisma/client";
import {
    createPatientSchema,
    createPatientSuccessResponse
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
}