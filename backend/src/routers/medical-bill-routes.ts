import type { FastifyInstance } from "fastify";

import { requireRole } from "../hooks/authorization.js";
import { Role } from "@prisma/client";
import { createMedicalBillController } from "../controllers/medical-bill-controller.ts/create-medical-bill-controller.js";
import { getUnsettledBillsController } from "../controllers/medical-bill-controller.ts/get-unsettled-bills-controller.js";
import { updateMedicalBillController } from "../controllers/medical-bill-controller.ts/update-medical-bill-controller.js";
import { updatePaymentController } from "../controllers/medical-bill-controller.ts/update-payment-controller.js";
import { getUnpaidMedicalController } from "../controllers/medical-bill-controller.ts/get-unpaid-medical-bill-controller.js";
import { getPartiallyPaidMedicalController } from "../controllers/medical-bill-controller.ts/get-partially-paid-controller.js";
import { getTotalMedicalBillsParams } from "../type-schemas/medical-bills/get-total-medical-bills-schemas.js";
import {
    createMedicalBillSchema,
    createMedicalBillResponseSchema,
    updateMedicalBillSchema,
    
} from '../type-schemas/medical-bills-schema.js'

import { settleBillRequestSchema } from "../type-schemas/payment/update-payment-schema.js";

import {
    updateMedicalBillResponseSchema
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

    fastify.route({
        method: 'PATCH',
        url: '/update-medical-bill',
        schema: {
            body: updateMedicalBillSchema,
            response: {
                200: updateMedicalBillResponseSchema
            }
        }, 
        preHandler: requireRole([Role.admin, Role.encoder]),
        handler: updateMedicalBillController
    })

    fastify.route({
        method: 'GET',
        url: '/get-unsettled-bills',
        preHandler: requireRole([Role.admin, Role.encoder]),
        handler: getUnsettledBillsController
    });

    fastify.route({
        method: 'POST',
        url: '/update-payment',
        schema: {
            body: settleBillRequestSchema
        }, preHandler: requireRole([Role.admin, Role.encoder]),
        handler: updatePaymentController
    })

    fastify.route({
        method: 'GET',
        url: '/get-unpaid-bills',
        schema: {
            querystring: getTotalMedicalBillsParams
        },preHandler: requireRole([Role.admin, Role.encoder]),
        handler: getUnpaidMedicalController
    })

    fastify.route({
        method: 'GET',
        url: '/get-partially-paid-bills',
        schema: {
            querystring: getTotalMedicalBillsParams
        },preHandler: requireRole([Role.admin, Role.encoder]),
        handler: getUnpaidMedicalController
    })
}