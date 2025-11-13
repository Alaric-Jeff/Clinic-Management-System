import type { FastifyInstance } from "fastify";
import type { loginType } from "../../type-schemas/accounts-schemas.js"
import bcrypt from 'bcrypt'

export async function loginAccount(
    fastify: FastifyInstance,
    body: loginType
): Promise<{ id: string; role: string, firstName: string, lastName: string }> {
  const { email, password } = body;

  fastify.log.debug(`Starting login process with these payloads: email ${email}`);

  try {
    // Check for a matching email
    fastify.log.debug(`We're looking for existing account with the same email`);
    const account = await fastify.prisma.account.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        password: true,
        role: true
      }
    });

    // If no email found then return with not found
    if (!account) {
      fastify.log.error(`Account is not found for email: ${email}`);
      throw new Error("Invalid email or password");
    }

    fastify.log.info(`Account found, id: ${account.id}`);

    // They can't login without verifying their email
    if (account.status === "pending" || account.status === "deactivated") {
      fastify.log.error(`Their account is not activated`);
      throw new Error("Account must be activated to log in");
    }

    fastify.log.info(`The logger's account is activated`);

    // Now we check if the password is matching
    const isMatch = await bcrypt.compare(password, account.password);

    // We return it like this if not
    if (!isMatch) {
      fastify.log.error(`The password does not match`);
      throw new Error("Invalid email or password");
    }

    // We will only return these as payload to make it light but useful
    return {
      id: account.id,
      role: account.role,
      firstName: account.firstName,
      lastName: account.lastName
    };

  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error({
        err,
        message: err.message
      }, `Logging in account failed`);
    } else {
      fastify.log.error({ err }, `Logging in account failed with unknown error`);
    }
    throw err;
  }
}