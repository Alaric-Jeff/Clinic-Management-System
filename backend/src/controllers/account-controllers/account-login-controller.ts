import type { FastifyRequest, FastifyReply } from "fastify";
import type { loginType } from "../../type-schemas/accounts.-schemas.js"
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
    return reply.status(200).send({
      success: true,
      message: 'Login successful',
      data: {
        id: result.id,
        role: result.role
      }
    });

  } catch (err: unknown) {
    // Handle specific error types
    if (err instanceof Error) {
      request.server.log.error({ err, email }, 'Login controller failed');
      
      switch (err.message) {
        case 'Invalid email or password':
          return reply.status(401).send({
            success: false,
            message: 'Invalid email or password'
          });
        
        case 'Account must be activated to log in':
          return reply.status(403).send({
            success: false,
            message: 'Account must be activated to log in'
          });
        
        default:
          return reply.status(500).send({
            success: false,
            message: 'Internal server error'
          });
      }
    }
    
    request.server.log.error({ err, email }, 'Login controller failed with unknown error');
    return reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
}