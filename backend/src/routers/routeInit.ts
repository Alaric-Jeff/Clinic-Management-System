// routes/index.ts
import type { FastifyInstance } from "fastify";
import { accountRoutes } from "./account-routes.js";
import { patientRoutes } from "./patient-routes.js";

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
    fastify.register(patientRoutes, {prefix: "api/v1/patient"})
};

export default routeInit;