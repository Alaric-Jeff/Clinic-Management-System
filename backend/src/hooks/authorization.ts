// hooks/authorization.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { Role } from "@prisma/client";

/**
 * Authorization Middleware Factory
 * 
 * OBJECTIVES:
 * 1. ROLE-BASED ACCESS CONTROL (RBAC)
 *    - Restrict route access based on user roles (admin, encoder)
 *    - Prevent unauthorized operations (e.g., encoders creating services)
 *    - Enforce least privilege principle
 * 
 * 2. SECURE AUTHENTICATION VALIDATION
 *    - Verify JWT tokens from HttpOnly cookies (XSS protection)
 *    - Validate token signature, expiration, and integrity
 *    - Automatic cleanup of invalid/expired sessions
 * 
 * 3. AUDIT TRAIL & MONITORING
 *    - Log authorization attempts (success/failure)
 *    - Track user actions with identity context
 *    - Monitor role-based access patterns
 * 
 * 4. REQUEST CONTEXT ENRICHMENT
 *    - Attach authenticated user data to requests
 *    - Enable audit trails in downstream handlers
 *    - Provide user context for business logic
 * 
 * PROCESS FLOW:
 * 1. Token Extraction → 2. JWT Verification → 3. Role Validation → 4. Context Attachment
 * 
 * SECURITY FEATURES:
 * - HttpOnly cookies prevent XSS token theft
 * - Automatic token expiration enforcement
 * - Role-based permission granularity
 * - Comprehensive error handling and logging
 * 
 * @param allowedRoles - Array of Role enum values permitted to access the route
 * @returns Fastify preHandler hook that enforces role-based authorization
 */
export function requireRole(allowedRoles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { cookies, url, method } = request;
    
    try {
      /**
       * PHASE 1: TOKEN EXTRACTION & VALIDATION
       * 
       * Objective: Secure retrieval of authentication token
       * Process:
       *   - Extract JWT from HttpOnly cookie (secure against XSS)
       *   - Validate token existence before processing
       *   - Log missing token attempts for security monitoring
       */
      const token = cookies.token;
      if (!token) {
        request.server.log.warn(
          { route: url, method, reason: 'missing_token' },
          "Authorization failed - no token in cookies"
        );
        throw request.server.httpErrors.unauthorized('Authentication required');
      }

      /**
       * PHASE 2: JWT VERIFICATION & PAYLOAD EXTRACTION
       * 
       * Objective: Cryptographically verify token authenticity
       * Process:
       *   - Verify JWT signature against server secret
       *   - Validate token expiration (automatic via fastify-jwt)
       *   - Extract typed payload with user identity and role
       *   - Handles: signature validation, expiration, tampering detection
       * 
       * FIX: Use request.jwt.verify() instead of request.jwtVerify(token)
       * The jwtVerify method uses the Authorization header by default,
       * so we need to use jwt.verify() to manually verify the cookie token
       */
      const userPayload = request.server.jwt.verify<{
        id: string;
        role: Role;
        name: string;
      }>(token);

      /**
       * PHASE 3: ROLE-BASED AUTHORIZATION CHECK
       * 
       * Objective: Enforce role-based access control policies
       * Process:
       *   - Compare user's role against allowed roles for route
       *   - Implement principle of least privilege
       *   - Log permission denial for security auditing
       *   - Provide clear error messaging for UX
       */
      if (!allowedRoles.includes(userPayload.role)) {
        request.server.log.warn(
          { 
            userId: userPayload.id, 
            userRole: userPayload.role, 
            allowedRoles, 
            route: url,
            reason: 'insufficient_permissions'
          },
          "Authorization failed - role not allowed"
        );
        throw request.server.httpErrors.forbidden('Insufficient permissions');
      }

      /**
       * PHASE 4: REQUEST CONTEXT ENRICHMENT
       * 
       * Objective: Propagate user identity to downstream handlers
       * Process:
       *   - Attach authenticated user data to request object
       *   - Enable audit trails in controllers and services
       *   - Provide user context for business logic decisions
       */
      request.currentUser = {
        id: userPayload.id,
        role: userPayload.role,
        name: userPayload.name
      };

      // Log successful authorization for monitoring and audit
      request.server.log.debug(
        { userId: userPayload.id, role: userPayload.role, route: url },
        "Authorization successful"
      );

    } catch (err: any) {
      /**
       * ERROR HANDLING & SECURITY CLEANUP
       * 
       * Objectives: Graceful failure and security maintenance
       * Process:
       *   - Clear invalid/expired cookies to force re-authentication
       *   - Distinguish between client and server errors
       *   - Maintain security by not leaking internal details
       *   - Log errors for security incident investigation
       */
      
      // Clear invalid cookies to maintain session hygiene
      if (err.message?.includes('expired') || err.message?.includes('invalid')) {
        reply.clearCookie('token');
      }
      
      // Preserve HTTP error semantics for client handling
      if (err.statusCode && err.statusCode >= 400) {
        throw err;
      }
      
      // Log and wrap unexpected errors for security
      request.server.log.error(
        { err: err.message, route: url, reason: 'jwt_verification_failed' },
        "JWT verification failed"
      );
      throw request.server.httpErrors.unauthorized('Authentication failed');
    }
  };
}

/**
 * Fastify Type Extension
 * 
 * Enhances TypeScript support for request.currentUser property
 * Provides type safety for user context in all route handlers
 * Enables auto-completion and compile-time validation
 */
declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: {
      id: string;
      role: Role;
      name: string;
    }
  }
}