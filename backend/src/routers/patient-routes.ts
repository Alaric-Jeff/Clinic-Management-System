import type { FastifyInstance } from "fastify";
import { requireRole } from '../hooks/authorization.js';
import { createPatientController } from "../controllers/patient-controllers/create-patient-controller.js";
import { getTodayPatientController } from "../controllers/patient-controllers/get-today-patient-controller.js";
import { getTotalPatientCountsController } from "../controllers/patient-controllers/get-total-counts-controller.js";
import { archivePatientController } from '../controllers/patient-controllers/archive-patient-controller.js';
import { patchPatientController } from "../controllers/patient-controllers/patch-patient-controller.js";
import { getAllArchivedPatientController } from "../controllers/patient-controllers/get-all-archived-patient.js";
import { getOnePatientController } from "../controllers/patient-controllers/get-one-patient-controller.js";
import { getTotalPatientController } from "../controllers/patient-controllers/get-total-patient-controller.js";
import { getMaleCountController } from "../controllers/patient-controllers/get-male-count-controller.js";
import { getFemaleCountController } from "../controllers/patient-controllers/get-female-count-controller.js";
import { addNoteController } from "../controllers/patient-controllers/add-note-controller.js";
import { getAgeRatioController } from "../controllers/patient-controllers/get-patient-ratio.js";
import { Role } from "@prisma/client";
import {
    createPatientSchema,
    createPatientSuccessResponse,
    getTodayPatientSchemaResponse,
    patientIdSchema,
    patchPatientSchema,
    getTotalPatientsCountResponse,
    patchPatientSuccessResponse,
    getOnePatientResponseSchema,
} from '../type-schemas/patient-schemas.js';
import { unarchivePatientController } from "../controllers/patient-controllers/unarchive-patient-controller.js";

import  {
    getTotalPatientsParams,
    totalPatientPaginatedResponseSchema
} from '../type-schemas/patients/get-total-paginated-schema.js'

import { addNoteSchema } from "../type-schemas/patients/add-note-schema.js";

import { Type } from "@sinclair/typebox";

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

    fastify.route({
        method: 'GET',
        url: '/get-age-ratio',
        preHandler: requireRole([Role.admin, Role.encoder]),
        handler: getAgeRatioController
    })

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

    /**s
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


    fastify.route({
        method: 'POST',
        url: '/add-note',
        schema: {
            body: addNoteSchema
        }, preHandler: requireRole([Role.admin, Role.encoder]),
        handler: addNoteController
    })

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

        /**
     * Get the selected patient information, and his previewed documentations.
     * Access: Admin, Encoder
     */
    fastify.route({
        method: 'GET',
        url: "/get-one-patient/:id",
        schema: {
            params: patientIdSchema,
            response: {
                200: getOnePatientResponseSchema
            }
        }, preHandler: requireRole([Role.admin, Role.encoder]),
        handler: getOnePatientController
    })

    fastify.route({
        method: 'GET',
        url: "/get-female-count",
        schema: {
            response: {
                200: Type.Integer()
            }
        }, preHandler: requireRole([Role.admin, Role.encoder]),
        handler: getFemaleCountController,
    })

    fastify.route({
        method: 'GET',
        url: "/get-male-count",
        schema: {
            response: {
                200: Type.Integer()
            }
        }, preHandler: requireRole([Role.admin, Role.encoder]),
        handler: getMaleCountController,
    })

    fastify.route({
        method: 'GET',
        url: '/get-total-patients',
        schema: {
            description: 'Get paginated list of patients with cursor-based pagination',
            tags: ['Patients'],
            querystring: getTotalPatientsParams,
            response: {
                200: totalPatientPaginatedResponseSchema
            }
        },
        preHandler: requireRole([Role.admin, Role.encoder]),
        handler: getTotalPatientController
    })
    //example:

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
 * 4. GET ONE PATIENT (/get-one-patient/:id)
 *    URL: GET /api/v1/patients/get-one-patient/cmggmseni0001t0qkbho4k9xb
 *    Optional Query: ?limit=10
 * 
 *    Response:
 *    {
 *      "success": true,
 *      "message": "Patient retrieved successfully",
 *      "data": {
 *        "id": "cmggmseni0001t0qkbho4k9xb",
 *        "firstName": "Juan",
 *        "lastName": "Dela Cruz",
 *        "middleName": "Santos",
 *        "birthDate": "1978-05-15T00:00:00.000Z",
 *        "age": 47,
 *        "gender": "male",
 *        "csdIdOrPwdId": "CSD123456",
 *        "mobileNumber": "+639171234567",
 *        "residentialAddress": "123 Rizal St, Manila",
 *        "isArchived": false,
 *        "createdByName": "Maria Santos",
 *        "createdByRole": "encoder",
 *        "updatedByName": "Juan Garcia",
 *        "updatedByRole": "admin",
 *        "createdAt": "2025-10-07T14:04:23.191Z",
 *        "updatedAt": "2025-10-08T10:30:15.456Z",
 *        "medicalDocumentations": [
 *          {
 *            "id": "doc_abc123",
 *            "status": "complete",
 *            "createdAt": "2025-10-08T09:00:00.000Z",
 *            "updatedAt": "2025-10-08T09:30:00.000Z",
 *            "createdByName": "Dr. Maria Santos",
 *            "admittedByName": "Dr. Jose Rizal"
 *          },
 *          {
 *            "id": "doc_def456",
 *            "status": "draft",
 *            "createdAt": "2025-10-07T15:00:00.000Z",
 *            "updatedAt": "2025-10-07T15:00:00.000Z",
 *            "createdByName": "Nurse Anna Cruz",
 *            "admittedByName": null
 *          }
 *        ]
 *      }
 *    }
 * 
 *    Notes:
 *    - Returns up to 20 most recent medical documentations by default
 *    - Use ?limit=N query parameter to change number of documentations returned (max 100)
 *    - Documentation previews exclude heavy text fields (assessment, diagnosis, treatment, prescription)
 *    - Click on individual documentation to fetch full details via separate endpoint
 *    - Age is calculated automatically from birthDate
 *    - All dates are ISO 8601 formatted strings
 * 
 * 5. GET RESPONSES
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