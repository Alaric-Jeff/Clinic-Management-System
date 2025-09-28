import type { FastifyInstance } from "fastify";
import { accountRoutes } from "./account-routes.js";

const routeInit = async (fastify: FastifyInstance) => {
    fastify.register(accountRoutes, { prefix: "/api/v1/account" })
};

export default routeInit;