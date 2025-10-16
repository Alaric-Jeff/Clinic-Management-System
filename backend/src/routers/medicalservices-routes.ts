import type { FastifyInstance } from "fastify";
import {
    createMedicalServiceSchema,
    createMedicalServiceSuccessResponse,
    medicalServiceId,
    deleteServiceResponse,
    getAllMedicalServicesResponse,
    updateMedicalServiceSchema,
    updateMedicalServiceResponse
    
} from '../type-schemas/services-schemas.js'


import { createMedicalServiceController } from "../controllers/medical-services-controllers/create-medicalservice-controller.js";
import { deleteMedicalServiceController } from "../controllers/medical-services-controllers/delete-medicalservice-controller.js";
import { getAllMedicalServiceController } from "../controllers/medical-services-controllers/get-all-medicalservice-controller.js";
import { patchMedicalServiceController } from "../controllers/medical-services-controllers/patch-medicalservice-controller.js";
import { requireRole } from "../hooks/authorization.js";
import { Role } from "@prisma/client";

export async function medicalServiceRoutes(fastify: FastifyInstance){
    //create medical service
    fastify.route({
        method: 'POST',
        url: '/create-medical-service',
        schema: {
            body: createMedicalServiceSchema,
            response: {
                200: createMedicalServiceSuccessResponse
            }
        }, preHandler: requireRole([Role.admin]),
        handler: createMedicalServiceController
    })

    //delete medical service
    fastify.route({
        method: 'DELETE',
        url: '/delete-medical-service/:id',
        schema: {
            params: medicalServiceId,
            response: {
                200: deleteServiceResponse
            }
        }, preHandler: requireRole([Role.admin]),
        handler: deleteMedicalServiceController
    })

    //get all medical services
    fastify.route({
        method: 'GET',
        url: '/get-all-medical-services',
        schema: {
            response: {
                200: getAllMedicalServicesResponse
            }
        }, preHandler: requireRole([Role.admin]),
        handler: getAllMedicalServiceController
    })    


    fastify.route({
        method: 'PATCH',
        url: '/patch-medical-services',
        schema: {
            body: updateMedicalServiceSchema,
            response: {
                200: updateMedicalServiceResponse
            }
        }, preHandler: requireRole([Role.admin]),
        handler: patchMedicalServiceController
    })    

}

