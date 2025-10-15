import type { FastifyInstance } from "fastify";

import { requireRole } from "../hooks/authorization.js";
import { Role } from "@prisma/client";
import { createMedicalBillController } from "../controllers/medical-bill-controller.ts/create-medical-bill-controller.js";
import { getUnsettledBillsController } from "../controllers/medical-bill-controller.ts/get-unsettled-bills-controller.js";
import {
    createMedicalBillSchema,
    createMedicalBillResponseSchema,
    getUnsettledBillsResponseSchema
} from '../type-schemas/medical-bills-schema.js'

export async function medicalBillRoutes(
    fastify: FastifyInstance
){
    // Create medical bill
    fastify.route({
        method: 'POST',
        url: '/create-medical-bill',
        schema: {
            body: createMedicalBillSchema,
            response: {
                201: createMedicalBillResponseSchema
            }
        }, preHandler: requireRole([Role.admin, Role.encoder]),
        handler: createMedicalBillController
    });

    // Get unsettled bills with patient information
    fastify.route({
        method: 'GET',
        url: '/get-unsettled-bills',
        schema: {
            response: {
                200: getUnsettledBillsResponseSchema
            }
        }, preHandler: requireRole([Role.admin, Role.encoder]),
        handler: getUnsettledBillsController
    });
}