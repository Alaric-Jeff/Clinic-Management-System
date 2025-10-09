import type { FastifyInstance } from "fastify";

import { requireRole } from "../hooks/authorization.js";
import { createMedicalDocumentationController } from "../controllers/medical-documentation/create-documentation-controller.js";
import {
    createMedicalDocumentationSchema,
    createMedicalDocumentationResponseSchema
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
}