import type{ FastifyInstance } from "fastify";
import { loginSchema, loginSuccessSchema } from "../type-schemas/accounts.-schemas.js";
import { accountLoginController } from "../controllers/account-controllers/account-login-controller.js";
export async function accountRoutes(fastify: FastifyInstance){
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
    })
};