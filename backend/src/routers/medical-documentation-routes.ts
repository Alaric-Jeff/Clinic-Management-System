import type { FastifyInstance } from "fastify";

import { requireRole } from "../hooks/authorization.js";
import { createMedicalDocumentationController } from "../controllers/medical-documentation/create-documentation-controller.js";
import { getMedicalDocumentationController } from "../controllers/medical-documentation/get-medical-documentation-controller.js";
import { updateMedicalDocumentationController } from "../controllers/medical-documentation/update-documentation-controller.js";
import {
    createMedicalDocumentationSchema,
    createMedicalDocumentationResponseSchema,
    updateMedicalDocumentationBodySchema,
    updateMedicalDocumentationParamsSchema,
    updateMedicalDocumentationResponseSchema,
    getMedicalDocumentationParamsSchema,
    getMedicalDocumentationResponseSchema
} from '../type-schemas/medical-document-schemas.js'
import { Role } from "@prisma/client";

export async function medicalDocumentationRoutes(
    fastify: FastifyInstance
){
    fastify.route({
        method: 'POST',
        url: "/create-medical-documentation",
        schema: {
            body: createMedicalDocumentationSchema,
            response: {
                200: createMedicalDocumentationResponseSchema
            }
        }, preHandler: requireRole([Role.admin, Role.encoder]),
        handler: createMedicalDocumentationController
    })

    fastify.route({
        method: 'POST',
        url: '/update-medical-documentation/:id',
        schema: {
            params: updateMedicalDocumentationParamsSchema,
            body: updateMedicalDocumentationBodySchema,
            response: {
                200: updateMedicalDocumentationResponseSchema
            }
        }, preHandler: requireRole([Role.admin, Role.encoder]),
        handler: updateMedicalDocumentationController
    })

    fastify.route({
        method: 'GET',
        url: '/medical-documentation/:id',
        schema: {
            params: getMedicalDocumentationParamsSchema,
            response: {
                200: getMedicalDocumentationResponseSchema
            }
        },
        preHandler: requireRole([Role.admin, Role.encoder]),
        handler: getMedicalDocumentationController
    });

}