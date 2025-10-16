import type { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { requireRole } from "../hooks/authorization.js";
import { createDoctorController } from "../controllers/doctor-controllers/create-doctor-controller.js";
import { getDoctorController } from "../controllers/doctor-controllers/get-doctor-controller.js";
import {
    createDoctorSchema,
    createDoctorResponseSchema,
    getAllDoctorResponseSchema
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

    fastify.route({
        method: 'GET',
        url: '/get-doctors',
        schema: {
            response: {
                200: getAllDoctorResponseSchema
            }
        }, preHandler: requireRole([Role.admin, Role.encoder]),
        handler: getDoctorController
    })
    
}