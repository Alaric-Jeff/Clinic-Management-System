import type { FastifyInstance } from "fastify";
import { requireRole } from "../hooks/authorization.js";
import { deleteAuditLogController } from "../controllers/audit-log-controllers/delete-log-controller.js";
import { getCompleteLogController } from "../controllers/audit-log-controllers/get-complete-logs.js";
import { Role } from "@prisma/client";
import {
    auditLogIdSchema,
    getAuditLogsResponseSchema
} from '../type-schemas/audit-log-schema.js'

import {getAllAuditLogsResponse} from '../type-schemas/audit-logs/get-allaudit-log-schema.js'

export async function auditLogRoutes(fastify: FastifyInstance){
    fastify.route({
        method: 'DELETE',
        url: '/delete-auditlog/:id',
        schema: {
            params: auditLogIdSchema
        }, preHandler: requireRole([Role.admin]),
        handler: deleteAuditLogController
    })

    fastify.route({
        method: 'GET',
        url: '/get-auditlog',
        schema: {
            response: {
                200: getAuditLogsResponseSchema
            }
        }, preHandler: requireRole([Role.admin]),
        handler: deleteAuditLogController
    })

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
}