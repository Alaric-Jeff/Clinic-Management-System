import type{ FastifyInstance } from "fastify";
import { loginSchema, loginSuccessSchema } from "../type-schemas/accounts-schemas.js";
import { accountLoginController } from "../controllers/account-controllers/account-login-controller.js";

export async function accountRoutes(fastify: FastifyInstance){
    // Health check for account routes
    fastify.get('/health', async (request, reply) => {
        return { 
            status: 'OK', 
            service: 'account-routes',
            timestamp: new Date().toISOString()
        }
    });

    // Login route
    fastify.route({
        method: 'POST',
        url: '/login',
        schema: {
            body: loginSchema, 
            response: {
                200: loginSuccessSchema
            }
        },
        handler: accountLoginController
    });


};