// routes/index.ts
import type { FastifyInstance } from "fastify";
import { accountRoutes } from "./account-routes.js";
import { patientRoutes } from "./patient-routes.js";
import { medicalServiceRoutes } from "./medicalservices-routes.js";
import { medicalBillRoutes } from "./medical-bill-routes.js";
import { medicalDocumentationRoutes } from "./medical-documentation-routes.js";
import { doctorRoutes } from "./doctor-routes.js";
import { statisticRoutes } from "./statistic-routes.js";
import { requireRole } from "../hooks/authorization.js";
import { searchEngineRoutes } from "./search-engine-routes.js";
import { manualArchiveRoute } from "./cron-routes.js";
import { Role } from "@prisma/client";
import { auditLogRoutes } from "./auditLogs.js";

const PREFIX = "/api/v1";

const routeInit = async (fastify: FastifyInstance) => {
    fastify.get('/', async () => {
        return { message: 'Server is running!' }
    });

    fastify.get(
    `${PREFIX}/validate`,
    {
      preHandler: requireRole([Role.admin, Role.encoder]), 
    },
    async (req, reply) => {
      return {
        user: req.currentUser,
        message: "Token valid",
      };
    }
  );

    fastify.get('/health', async () => {
        return { status: 'OK', timestamp: new Date().toISOString() }
    });

    fastify.register(accountRoutes,              { prefix: `${PREFIX}/account` });
    fastify.register(patientRoutes,              { prefix: `${PREFIX}/patient` });
    fastify.register(medicalServiceRoutes,       { prefix: `${PREFIX}/service` });
    fastify.register(medicalBillRoutes,          { prefix: `${PREFIX}/bills` });
    fastify.register(medicalDocumentationRoutes, { prefix: `${PREFIX}/document` });
    fastify.register(doctorRoutes,               { prefix: `${PREFIX}/doctors` });
    fastify.register(auditLogRoutes,             { prefix: `${PREFIX}/logs` });
    fastify.register(statisticRoutes,            { prefix: `${PREFIX}/statistics` });
    fastify.register(searchEngineRoutes,         { prefix: `${PREFIX}/search` });
    fastify.register(manualArchiveRoute,         { prefix: `${PREFIX}/cron` });
};

export default routeInit;