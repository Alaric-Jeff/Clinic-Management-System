import type{ FastifyInstance } from "fastify";
import { loginSchema, loginSuccessSchema, createAccountSuccessfulResponse, createAccountSchema } from "../type-schemas/accounts-schemas.js";
import { accountLoginController } from "../controllers/account-controllers/account-login-controller.js";
import { createAccountController } from "../controllers/account-controllers/account-create-controller.js";

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

    //creating account
    fastify.route({
        method: 'POST',
        url: '/create-account',
        schema: {
            body: createAccountSchema, 
            response: {
                200: createAccountSuccessfulResponse
            }
        }, 
        handler: createAccountController
    })
};