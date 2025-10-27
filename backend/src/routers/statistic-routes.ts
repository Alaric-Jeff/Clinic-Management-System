import type { FastifyInstance } from "fastify";
import { requireRole } from "../hooks/authorization.js";
import { getLastNSalesController } from "../controllers/statistic-controllers/get-lastN-sales-controller.js";
import { getMonthlySalesController } from "../controllers/statistic-controllers/get-monthly-sales-controller.js";
import { getTopPerformingServicesController } from "../controllers/statistic-controllers/get-top-performing-service-controller.js";
import { getDailySalesController } from "../controllers/statistic-controllers/get-daily-sales.js";
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
    
    fastify.route({
        method: 'GET',
        url: '/get-top-performing-services',
        preHandler: requireRole([Role.admin]),
        handler: getTopPerformingServicesController
    });

    fastify.route({
        method: 'GET',
        url: '/get-monthly-sales',
        preHandler: requireRole([Role.admin]),
        handler: getMonthlySalesController
    })

    fastify.route({
        method: 'GET',
        url: '/get-daily-sales',
        preHandler:  requireRole([Role.admin]),
        handler: getDailySalesController
    })

}