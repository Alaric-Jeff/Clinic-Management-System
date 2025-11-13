/**
 * Account Login Controller
 * -------------------------
 * Handles authentication for user accounts. Validates credentials, issues JWT,
 * and sets a secure HTTP-only cookie for session management.
 *
 * Flow:
 *   1. Extract login credentials from request body.
 *   2. Call service layer (`loginAccount`) to authenticate.
 *   3. If authentication succeeds, issue JWT and set cookie.
 *   4. Return structured JSON response with user metadata.
 *   5. On failure, log the error and return standardized error responses
 *      using `@fastify/sensible`'s httpErrors helpers.
 *
 * Security Considerations:
 *   - Cookies are marked HttpOnly to prevent JS access (XSS safe).
 *   - `secure: true` in production ensures cookies are HTTPS-only.
 *   - JWT payload is signed server-side, minimizing tampering risks.
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import type { loginType } from "../../type-schemas/accounts-schemas.js";
import { loginAccount } from "../../services/account-services/login-account-service.js";

export async function accountLoginController(
  request: FastifyRequest<{ Body: loginType }>,
  reply: FastifyReply
) {
  // Destructure validated request body
  const { email, password } = request.body;

  try {
    /**
     * Authenticate user via service layer
     * -----------------------------------
     * This abstracts the DB call + credential validation.
     * On success, returns a payload (id, role, etc.) to embed in the JWT.
     */
    const result = await loginAccount(request.server, { email, password });

    /**
     * Issue JWT
     * ---------
     * Use reply.jwtSign (added by @fastify/jwt) to sign a token containing
     * essential user claims. Avoid embedding sensitive data here.
     */
    const token = await reply.jwtSign({
      id: result.id,
      role: result.role,
      name:  `${result.firstName} ${result.lastName}` 
    });
    /**
     * Set authentication cookie
     * -------------------------
     * Cookie carries the JWT to the client for subsequent requests.
     * - HttpOnly prevents JavaScript from accessing it.
     * - Secure ensures HTTPS only (in production).
     * - SameSite helps mitigate CSRF.  
     * - MaxAge keeps session time-limited.
     */
    reply.setCookie("token", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 45 * 60, // 45 minutes (in seconds, not ms)
    });

    /**
     * Respond with success payload
     * ----------------------------
     * Do not include sensitive info (like password hashes).
     * Return only minimal required metadata.
     */
    return reply.status(200).send({
      success: true,
      message: "Login successful",
      data: {
        id: result.id,
        role: result.role,
        name: `${result.firstName} ${result.lastName}`
      }
    });
  } catch (err: unknown) {
    /**
     * Error Handling
     * --------------
     * Standardized using @fastify/sensible's httpErrors helpers.
     * Logs include request context (email attempted).
     */
    if (err instanceof Error) {
      request.server.log.error({ err, email }, "Login controller failed");

      switch (err.message) {
        case "Invalid email or password":
          throw request.server.httpErrors.unauthorized("Invalid email or password");

        case "Account must be activated to log in":
          throw request.server.httpErrors.forbidden("Account must be activated to log in");

        default:
          throw request.server.httpErrors.internalServerError("Internal server error");
      }
    }

    // Handle unexpected non-Error rejections
    request.server.log.error({ err, email }, "Login controller failed with unknown error");
    throw request.server.httpErrors.internalServerError("Internal server error");
  }
}
