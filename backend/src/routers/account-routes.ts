import type{ FastifyInstance } from "fastify";
import { 
  loginSchema, 
  loginSuccessSchema, 
  createAccountSuccessfulResponse, 
  createAccountSchema,
  passwordResetRequestSchema,
  passwordResetRequestResponse,
  passwordResetConfirmResponse
} from "../type-schemas/accounts-schemas.js";
import { accountLoginController } from "../controllers/account-controllers/account-login-controller.js";
import { createAccountController } from "../controllers/account-controllers/account-create-controller.js";
import { accountVerifyController } from "../controllers/account-controllers/account-verify-controller.js";
import { requestPasswordReset } from "../controllers/account-controllers/verify-reset-password.js";
import { confirmPasswordReset } from "../controllers/account-controllers/confirm-password-reset.js";

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

    // Create account route
    fastify.route({
        method: 'POST',
        url: '/create-account',
        schema: {
            body: createAccountSchema, 
            response: {
                201: createAccountSuccessfulResponse
            }
        }, 
        handler: createAccountController
    });

    //verify-account
    fastify.route({
        method: 'GET',
        url: '/activate',
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    token: { type: 'string' }
                },
                required: ['token']
            }
        },
        handler: accountVerifyController
    });

    // Password reset request (Step 1: Send verification email)
    fastify.route({
        method: 'POST',
        url: '/request-password-reset',
        schema: {
            body: passwordResetRequestSchema,
            response: {
                200: passwordResetRequestResponse
            }
        },
        handler: requestPasswordReset
    });

    // Password reset confirmation (Step 2: Confirm and reset password)
    fastify.route({
        method: 'GET',
        url: '/confirm-password-reset',
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    token: { type: 'string' }
                },
                required: ['token']
            },
            response: {
                200: passwordResetConfirmResponse
            }
        },
        handler: confirmPasswordReset
    });
};