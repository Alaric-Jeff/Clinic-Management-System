import type{ FastifyInstance } from "fastify";
import { loginSchema } from "../type-schemas/accounts.-schemas.js";
import { accountLoginController } from "../controllers/account-controllers/account-login-controller.js";
export async function accountRoutes(fastify: FastifyInstance){
    fastify.route({
        method: 'POST',
        url: '/account-login',
        schema: {
            body: loginSchema, 
            response: {
                
            }
        },
        handler: accountLoginController
    })
};