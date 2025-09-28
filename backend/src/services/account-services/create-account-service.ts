import { type FastifyInstance } from "fastify";
import { type createAccountType } from "../../type-schemas/create-account-t.schema.js";
import bcrypt from 'bcrypt'

export async function createAccountService(
    fastify: FastifyInstance, 
    body: createAccountType
): Promise<boolean>{
    const {
        firstName,
        lastName,
        middleName,
        email,
        password
    } = body;

    try{

        const isExisting = await fastify.prisma.account.findUnique({
            where: {
                email
            }, select: {
                email: true
            }
        });

        if(isExisting){
            throw new Error("Account already exists");
        }

        const account = await fastify.prisma.account.create({
            data: {
                firstName,
                lastName,
                middleName: middleName ?? null,
                email,
                password: await bcrypt.hash(password, 10)
            }
        })

        return true;

    } catch(err: unknown) {
        throw err;
    }
}