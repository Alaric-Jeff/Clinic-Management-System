import type { FastifyRequest, FastifyReply } from "fastify";
import type { loginType } from "../../type-schemas/accounts.-schemas.js";
import { loginAccount } from "../../services/account-services/login-account-service.js";

export async function accountLoginController(
  request: FastifyRequest<{ Body: loginType }>,
  reply: FastifyReply
) {
  const { email, password } = request.body;

  try {
    // Authenticate user and get JWT payload
    const result = await loginAccount(request.server, { email, password });
    
    // Sign JWT token
    const token = request.server.jwt.sign(result);
    
    // Set HTTP-only cookie
    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    // Return success response
    return reply.send({
      success: true,
      message: 'Login successful',
      data: {
        id: result.id,
        role: result.role
      }
    });

  } catch (err: unknown) {
    // Handle specific error types using fastify-sensible
    if (err instanceof Error) {
      request.server.log.error({ err, email }, 'Login controller failed');
      
      switch (err.message) {
        case 'Invalid email or password':
          throw request.server.httpErrors.unauthorized('Invalid email or password');
        
        case 'Account must be activated to log in':
          throw request.server.httpErrors.forbidden('Account must be activated to log in');
        
        default:
          throw request.server.httpErrors.internalServerError('Internal server error');
      }
    }

    // Handle unknown errors
    request.server.log.error({ err, email }, 'Login controller failed with unknown error');
    throw request.server.httpErrors.internalServerError('Internal server error');
  }
}