import type { FastifyInstance } from "fastify";
import { requireRole } from "../hooks/authorization.js";
import { getLastNSalesController } from "../controllers/statistic-controllers/get-lastN-sales-controller.js";
import { Role } from "@prisma/client";

import {
    WeeklySalesStatistics
} from '../type-schemas/analytics-schemas/get-lastN-sales-schemas.js'

export async function statisticRoutes(
    fastify: FastifyInstance
){
    fastify.route({
        method: 'GET',
        url: '/get-lastN-sales',
        schema: {
            response: {
                200: WeeklySalesStatistics
            }
        }, preHandler: requireRole([Role.admin, Role.encoder]),
        handler: getLastNSalesController
    })
}