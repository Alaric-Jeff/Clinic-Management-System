import type { FastifyRequest, FastifyReply } from "fastify";

export async function accountLogoutController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        // Clear the JWT cookie
        reply.clearCookie("token", {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        return reply.send({
            success: true,
            message: "Logged out successfully"
        });

    } catch (err: unknown) {
        request.server.log.error(
            { err },
            "Logout failed"
        );
        
        // Even if there's an error, we should still clear the cookie
        reply.clearCookie("token", {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        return reply.send({
            success: true,
            message: "Logged out successfully"
        });
    }
}
