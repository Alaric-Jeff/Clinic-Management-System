// routes/index.ts
import type { FastifyInstance } from "fastify";
import { accountRoutes } from "./account-routes.js";
import { patientRoutes } from "./patient-routes.js";
import { medicalServiceRoutes } from "./medicalservices-routes.js";
import { medicalBillRoutes } from "./medical-bill-routes.js";
import { medicalDocumentationRoutes } from "./medical-documentation-routes.js";
import { doctorRoutes } from "./doctor-routes.js";

const routeInit = async (fastify: FastifyInstance) => {
    // Add a root route to verify server is working
    fastify.get('/', async () => {
        return { message: 'Server is running!' }
    });

    // Add health check
    fastify.get('/health', async () => {
        return { status: 'OK', timestamp: new Date().toISOString() }
    });

    fastify.register(accountRoutes, { prefix: "/api/v1/account" });
    fastify.register(patientRoutes, {prefix: "/api/v1/patient"});
    fastify.register(medicalServiceRoutes, {prefix: "/api/v1/service"})
    fastify.register(medicalBillRoutes, {prefix: "/api/v1/bills"});
    fastify.register(medicalDocumentationRoutes, {prefix: "/api/v1/document"})
    fastify.register(doctorRoutes, {prefix: "/api/v1/doctors"})
};

export default routeInit;