import type { FastifyInstance } from "fastify";
import { requireRole } from '../hooks/authorization.js';
import { createPatientController } from "../controllers/patient-controllers/create-patient-controller.js";
import { getTodayPatientController } from "../controllers/patient-controllers/get-today-patient-controller.js";
import { getTotalPatientCountsController } from "../controllers/patient-controllers/get-total-counts-controller.js";
import { archivePatientController } from '../controllers/patient-controllers/archive-patient-controller.js';
import { patchPatientController } from "../controllers/patient-controllers/patch-patient-controller.js";
import { getAllArchivedPatientController } from "../controllers/patient-controllers/get-all-archived-patient.js";
import { Role } from "@prisma/client";
import {
    createPatientSchema,
    createPatientSuccessResponse,
    getTodayPatientSchemaResponse,
    patientIdSchema,
    patchPatientSchema,
    getTotalPatientsCountResponse,
    patchPatientSuccessResponse
} from '../type-schemas/patient-schemas.js';
import { unarchivePatientController } from "../controllers/patient-controllers/unarchive-patient-controller.js";

export async function patientRoutes(fastify: FastifyInstance) {
    /**
     * Create a new patient record
     * Access: Admin, Encoder
     */
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

    /**
     * Get all patients created today (unarchived only)
     * Access: Admin, Encoder
     */
    fastify.route({
        method: 'GET',
        url: '/get-today-patients',
        schema: {
            response: {
                200: getTodayPatientSchemaResponse
            }
        },
        preHandler: requireRole([Role.admin, Role.encoder]),
        handler: getTodayPatientController
    });

    /**
     * Get total count of all patients
     * Access: Admin, Encoder
     */
    fastify.route({
        method: 'GET',
        url: '/get-total-patients-count',
        schema: {
            response: {
                200: getTotalPatientsCountResponse
            }
        },
        preHandler: requireRole([Role.admin, Role.encoder]),
        handler: getTotalPatientCountsController
    });

    /**
     * Archive a patient (soft delete)
     * Access: Admin, Encoder
     */
    fastify.route({
        method: 'POST',
        url: '/archive-patient',
        schema: {
            body: patientIdSchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        preHandler: requireRole([Role.admin, Role.encoder]),
        handler: archivePatientController
    });

    /**
     * Unarchive a patient
     * Access: Admin, Encoder
     */
    fastify.route({
        method: 'POST',
        url: '/unarchive-patient',
        schema: {
            body: patientIdSchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        preHandler: requireRole([Role.admin, Role.encoder]),
        handler: unarchivePatientController
    });

    /**
     * Partially update patient information
     * Access: Admin, Encoder
     */
    fastify.route({
        method: 'PATCH', 
        url: '/patch-patient',
        schema: {
            body: patchPatientSchema,
            response: {
                200: patchPatientSuccessResponse
            }
        },
        preHandler: requireRole([Role.admin, Role.encoder]),
        handler: patchPatientController
    });

    /**
     * Get all archived patients
     * Access: Admin, Encoder
     */
    fastify.route({
        method: 'GET',
        url: '/get-archived-patients',
        schema: {
            response: {
                200: getTodayPatientSchemaResponse
            }
        },
        preHandler: requireRole([Role.admin, Role.encoder]),
        handler: getAllArchivedPatientController
    });
}

/**
 * EXAMPLE JSON PAYLOADS
 * 
 * 1. CREATE PATIENT (/create-patient)
 *    Request:
 *    {
 *      "firstName": "John",
 *      "lastName": "Doe",
 *      "middleName": "Michael",
 *      "birthDate": "1990-05-15T00:00:00.000Z",
 *      "gender": "male",
 *      "csdIdOrPwdId": "CSD123456",
 *      "mobileNumber": "+1234567890",
 *      "residentialAddress": "123 Main Street, City, State 12345"
 *    }
 * 
 *    Alternative with null values:
 *    {
 *      "firstName": "Jane",
 *      "lastName": "Smith",
 *      "middleName": null,
 *      "birthDate": "1985-12-20T00:00:00.000Z",
 *      "gender": "female",
 *      "csdIdOrPwdId": null,
 *      "mobileNumber": null,
 *      "residentialAddress": null
 *    }
 * 
 *    Minimal required:
 *    {
 *      "firstName": "Robert",
 *      "lastName": "Johnson",
 *      "middleName": null,
 *      "birthDate": "1978-03-10T00:00:00.000Z",
 *      "gender": "male",
 *      "csdIdOrPwdId": null,
 *      "mobileNumber": null,
 *      "residentialAddress": null
 *    }
 * 
 * 2. ARCHIVE/UNARCHIVE PATIENT (/archive-patient, /unarchive-patient)
 *    Request:
 *    {
 *      "id": "cmggmseni0001t0qkbho4k9xb"
 *    }
 * 
 * 3. PATCH PATIENT (/patch-patient)
 *    Update name and phone:
 *    {
 *      "id": "cmggmseni0001t0qkbho4k9xb",
 *      "firstName": "Jonathan",
 *      "lastName": null,
 *      "middleName": null,
 *      "birthDate": null,
 *      "gender": null,
 *      "csdIdOrPwdId": null,
 *      "mobileNumber": "+1-555-0123",
 *      "residentialAddress": null
 *    }
 * 
 *    Update address only:
 *    {
 *      "id": "cmggmsvlz0002t0qk9m6drbjv",
 *      "firstName": null,
 *      "lastName": null,
 *      "middleName": null,
 *      "birthDate": null,
 *      "gender": null,
 *      "csdIdOrPwdId": null,
 *      "mobileNumber": null,
 *      "residentialAddress": "789 Pine Street, New City, State 54321"
 *    }
 * 
 *    Update multiple fields:
 *    {
 *      "id": "cmggmt0y40003t0qksr0utoij",
 *      "firstName": "Jim",
 *      "lastName": "Wilson",
 *      "middleName": "Robert",
 *      "birthDate": "1978-03-10",
 *      "gender": "male",
 *      "csdIdOrPwdId": "PWD999888",
 *      "mobileNumber": null,
 *      "residentialAddress": "456 Updated Avenue, Townsville"
 *    }
 * 
 * 4. GET RESPONSES
 *    Today's Patients Response:
 *    {
 *      "success": true,
 *      "message": "Today's patients retrieved successfully",
 *      "data": [
 *        {
 *          "id": "cmggmseni0001t0qkbho4k9xb",
 *          "firstName": "John",
 *          "lastName": "Doe",
 *          "middleName": "Michael",
 *          "createdAt": "2025-10-07T14:04:23.191Z"
 *        }
 *      ]
 *    }
 * 
 *    Total Count Response:
 *    {
 *      "success": true,
 *      "message": "Successfully got total number of patients",
 *      "data": {
 *        "count": 3
 *      }
 *    }
 * 
 *    Archive/Unarchive Response:
 *    {
 *      "success": true,
 *      "message": "Patient archived successfully"
 *    }
 */