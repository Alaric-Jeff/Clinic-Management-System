import type { FastifyRequest, FastifyReply } from "fastify";
import { activateAccountService } from "../../services/account-services/activate-account-service.js";

/**
 * Controller: Handles account activation via email token
 * 
 * Responsibilities:
 *  - Extracts and verifies JWT activation token
 *  - Decodes token to get user ID and purpose
 *  - Calls service to activate account
 *  - Handles token expiration and validation errors
 *  - Redirects user to appropriate frontend pages
 */
export async function accountVerifyController(
    request: FastifyRequest<{Querystring: {token: string}}>,
    reply: FastifyReply
){
    const { token } = request.query;

    try {
        // Step 1: Verify and decode JWT token with type assertion
        const decoded = await request.server.jwt.verify<{
            userId: string;
            purpose: string;
            email: string;
        }>(token);
        
        // Step 2: Validate token purpose
        if (decoded.purpose !== 'activation') {
            request.server.log.warn(
                { token, purpose: decoded.purpose }, 
                "Invalid token purpose for activation"
            );
            return reply.redirect(`${process.env.FRONTEND_URL}/activation-error?reason=invalid_token`);
        }

        // Step 3: Extract user ID from token payload
        const userId = decoded.userId;
        if (!userId) {
            request.server.log.warn(
                { token, decoded }, 
                "Token missing user ID"
            );
            return reply.redirect(`${process.env.FRONTEND_URL}/activation-error?reason=invalid_payload`);
        }

        request.server.log.debug(
            { userId, email: decoded.email },
            "JWT token validated successfully"
        );

        // Step 4: Activate the account
        const success = await activateAccountService(request.server, { id: userId });

        if (success) {
            request.server.log.info(
                { userId, email: decoded.email },
                "Account activated successfully via email verification"
            );
            
            return reply.redirect(`${process.env.FRONTEND_URL}/activation-success`);
        } else {
            throw new Error("Account activation service returned false");
        }

    } catch (err: unknown) {
        // Handle specific JWT errors
        //I'll need to extend this error for wrong authentications or tampered jwts
        if (err instanceof Error) {
            request.server.log.error(
                { err: err.message, token }, 
                "Account activation failed"
            );

            if (err.message.includes('jwt expired')) {
                return reply.redirect(`${process.env.FRONTEND_URL}/activation-error?reason=expired`);
            }
            
            if (err.message.includes('jwt malformed') || err.message.includes('invalid signature')) {
                return reply.redirect(`${process.env.FRONTEND_URL}/activation-error?reason=invalid`);
            }
            
            if (err.message.includes('Account not found')) {
                return reply.redirect(`${process.env.FRONTEND_URL}/activation-error?reason=not_found`);
            }
        }

        // Generic error fallback
        request.server.log.error(
            { err, token }, 
            "Unknown error during account activation"
        );
        return reply.redirect(`${process.env.FRONTEND_URL}/activation-error?reason=unknown`);
    }
};