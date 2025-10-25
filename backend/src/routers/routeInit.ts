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
import { Role } from "@prisma/client";
import { auditLogRoutes } from "./auditLogs.js";

const routeInit = async (fastify: FastifyInstance) => {
    fastify.get('/', async () => {
        return { message: 'Server is running!' }
    });

    fastify.get(
    "/api/v1/validate",
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

    fastify.register(accountRoutes, { prefix: "/api/v1/account" });
    fastify.register(patientRoutes, {prefix: "/api/v1/patient"});
    fastify.register(medicalServiceRoutes, {prefix: "/api/v1/service"});
    fastify.register(medicalBillRoutes, {prefix: "/api/v1/bills"});
    fastify.register(medicalDocumentationRoutes, {prefix: "/api/v1/document"});
    fastify.register(doctorRoutes, {prefix: "/api/v1/doctors"});
    fastify.register(auditLogRoutes, {prefix: "/api/v1/logs"})
    fastify.register(statisticRoutes, {prefix: "/api/v1/statistics"})
};

export default routeInit;