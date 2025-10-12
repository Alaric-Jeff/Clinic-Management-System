import type { FastifyInstance } from "fastify";

import { requireRole } from "../hooks/authorization.js";
import { Role } from "@prisma/client";
import { createMedicalBillController } from "../controllers/medical-bill-controller.ts/create-medical-bill-controller.js";
import {
    createMedicalBillResponseSchema,
    createMedicalBillSchema,
    
} from '../type-schemas/medical-bills-schema.js'

export async function medicalBillRoutes(
    fastify: FastifyInstance
){
    fastify.route({
        method: 'POST',
        url: '/create-medical-bill',
        schema: {
            body: createMedicalBillSchema,
            response: {
                200: createMedicalBillResponseSchema
            }
        }, preHandler: requireRole([Role.admin, Role.encoder]),
        handler: createMedicalBillController
    })
}