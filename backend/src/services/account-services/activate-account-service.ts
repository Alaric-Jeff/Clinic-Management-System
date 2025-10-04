import type { FastifyInstance } from "fastify";

/**
 * Service: Activates a user account
 * 
 * Responsibilities:
 *  - Verifies account exists
 *  - Updates account status to 'activated' in database
 *  - Handles idempotent operations (already activated)
 * 
 * @param fastify - Fastify instance for database access
 * @param body - Contains account ID to activate
 * @returns boolean - Success status
 */
export async function activateAccountService(
  fastify: FastifyInstance, 
  body: { id: string }
): Promise<boolean> {
  const { id } = body;
  
  try {
    // Step 1: Verify account exists
    const account = await fastify.prisma.account.findUnique({
      where: { id }
    });

    if (!account) {
      fastify.log.warn({ accountId: id }, "Activation attempted for non-existent account");
      throw new Error("Account not found");
    }

    // Step 2: Check if already activated (idempotent)
    if (account.status === "activated") {
      fastify.log.info({ accountId: id }, "Account already activated - idempotent operation");
      return true; // Still consider it successful
    }

    // Step 3: Update account status in database
    await fastify.prisma.account.update({
      where: { id },
      data: { 
        status: "activated",
        updatedAt: new Date()
      }
    });

    fastify.log.info(
      { accountId: id, previousStatus: account.status },
      "Account successfully activated"
    );

    return true;

  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(
        { err: err.message, accountId: id },
        "Account activation service failed"
      );
      throw err; // Re-throw for controller to handle
    } else {
      fastify.log.error(
        { err, accountId: id },
        "Account activation failed with unknown error"
      );
      throw new Error("Unexpected error during account activation");
    }
  }
}