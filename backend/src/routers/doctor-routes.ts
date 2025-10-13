import type { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { requireRole } from "../hooks/authorization.js";
import { createDoctorController } from "../controllers/doctor-controllers/create-doctor-controller.js";
import {
    createDoctorSchema,
    createDoctorResponseSchema
} from '../type-schemas/doctor-schemas.js'

export async function doctorRoutes(
    fastify:  FastifyInstance
){
    fastify.route({
        method: 'POST',
        url: '/create-doctor',
        schema: {
            body: createDoctorSchema,
            response: {
                200: createDoctorResponseSchema
            }
        }, preHandler: requireRole([Role.admin, Role.encoder]),
        handler: createDoctorController
    })
}