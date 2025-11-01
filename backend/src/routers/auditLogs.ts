import type { FastifyInstance } from "fastify";
import { requireRole } from "../hooks/authorization.js";
import {batchDeleteAuditLogController} from '../controllers/audit-log-controllers/delete-audit-log-controller.js'
import { getCompleteLogController } from "../controllers/audit-log-controllers/get-complete-logs.js";
import { Role } from "@prisma/client";
import {
    auditLogIdSchema
} from '../type-schemas/audit-log-schema.js'

import {deleteAuditLogsBodySchema, deleteAuditLogsResponseSchema} from '../type-schemas/audit-logs/delete-batch-id-schema.js'
import {getAllAuditLogsResponse} from '../type-schemas/audit-logs/get-allaudit-log-schema.js'

export async function auditLogRoutes(fastify: FastifyInstance){

    fastify.route({
        method: 'GET',
        url: '/get-complete-logs',
        schema: {
            response: {
                200: getAllAuditLogsResponse
            }
        }, preHandler: requireRole([Role.admin]),
        handler: getCompleteLogController
    })

    fastify.route({
        method: 'POST',
        url: '/delete-audit-logs',
        schema: {
            body: deleteAuditLogsBodySchema,
            response: {
                200: deleteAuditLogsResponseSchema
            }
        }, preHandler: requireRole([Role.admin]),
        handler: batchDeleteAuditLogController
    })

}