import { type FastifyInstance } from "fastify";
import { type createAccountType } from "../../type-schemas/create-account-t.schema.js";
import bcrypt from 'bcrypt'

export async function createAccountService(
    fastify: FastifyInstance, 
    body: createAccountType
): Promise<{
    id: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    email: string;
}>{
    const {
        firstName,
        lastName,
        middleName,
        email,
        password
    } = body;

    fastify.log.debug({ email }, 'Starting account creation process');

    try {
        fastify.log.debug({ email }, 'Checking if account already exists');
        
        const isExisting = await fastify.prisma.account.findUnique({
            where: {
                email
            },
            select: {
                email: true
            }
        });

        if(isExisting){
            fastify.log.warn({ email }, 'Account creation attempted with existing email');
            throw new Error("Account already exists");
        }

        fastify.log.debug({ email }, 'No existing account found, creating new account');
        
        const account = await fastify.prisma.account.create({
            data: {
                firstName,
                lastName,
                middleName: middleName ?? null,
                email,
                password: await bcrypt.hash(password, 10)
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                middleName: true,
                email: true
            }
        });

        fastify.log.info({ 
            accountId: account.id, 
            email: account.email,
            firstName: account.firstName
        }, 'Account created successfully');

        return account;

    } catch(err: unknown) {
        if (err instanceof Error) {
            fastify.log.error({ 
                err, 
                email,
                errorMessage: err.message 
            }, 'Account creation failed');
        } else {
            fastify.log.error({ 
                err, 
                email 
            }, 'Account creation failed with unknown error');
        }
        throw err;
    }
}