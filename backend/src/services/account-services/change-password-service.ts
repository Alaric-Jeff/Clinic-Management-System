/**
 * Service: Update password for activated accounts
 * 
 * Validates the user's current password before allowing a new password change.
 * Uses account ID (from JWT token) instead of email to avoid requiring re-input.
 * 
 * Validation Order:
 *  1. Account exists
 *  2. Account is activated
 *  3. Current password matches
 *  4. Hash new password
 *  5. Update in database
 * 
 * @param fastify - Fastify instance for database and logging
 * @param body - Object containing id, currentPassword, and newPassword
 * @returns boolean indicating successful password change
 * @throws {Error} When validation fails or account not found
 */
import type { FastifyInstance } from "fastify";
import bcrypt from 'bcrypt'
import { AccountStatus } from "@prisma/client";

export async function changePasswordService(
    fastify: FastifyInstance,
    body: { id: string; currentPassword: string; newPassword: string }
) {
    const { id, currentPassword, newPassword } = body;

    try {
        const account = await fastify.prisma.account.findUnique({
            where: { id },
            select: {
                password: true,
                status: true,
                email: true 
            }
        });

        if (!account) {
            throw new Error("Account does not exist");
        }

        if (account.status !== AccountStatus.activated) {
            throw new Error("Account must be activated to change password");
        }
        const isMatched = await bcrypt.compare(currentPassword, account.password);

        if (!isMatched) {
            throw new Error("Current password is incorrect");
        }

        const isNewPasswordSameAsCurrent = await bcrypt.compare(newPassword, account.password);
        if (isNewPasswordSameAsCurrent) {
            throw new Error("New password cannot be the same as current password");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await fastify.prisma.account.update({
            where: { id },
            data: { password: hashedPassword }
        });

        fastify.log.info(
            { 
                accountId: id,
                email: account.email,
                operation: 'changePassword'
            },
            'Password changed successfully'
        );

        return true;
    } catch (err: unknown) {
        if (err instanceof Error) {
            fastify.log.error(
                { 
                    error: err.message,
                    accountId: id,
                    operation: 'changePassword'
                },
                'Failed to change password'
            );
        } else {
            fastify.log.error(
                { 
                    error: err,
                    accountId: id,
                    operation: 'changePassword'
                },
                'Unexpected error changing password'
            );
        }
        
        throw err;
    }
}