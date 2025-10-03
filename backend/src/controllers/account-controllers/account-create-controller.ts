import type { FastifyReply, FastifyRequest } from "fastify";
import type { createAccountType } from "../../type-schemas/accounts-schemas.js";
import { createAccountService } from "../../services/account-services/create-account-service.js";

/**
 * Controller: Handles new account creation
 * 
 * Responsibilities:
 *  - Creates a new account in the database
 *  - Generates an activation token (JWT)
 *  - Sends activation email with link (non-blocking)
 *  - Logs important events for monitoring
 *  - Returns immediate response without waiting for email delivery
 * 
 * Performance Optimization:
 *  - Email sending is non-blocking to prevent event loop blocking
 *  - User receives instant feedback while email processes in background
 *  - Graceful degradation: email failures don't impact account creation
 */
export async function createAccountController(
  request: FastifyRequest<{ Body: createAccountType }>,
  reply: FastifyReply
) {
  const { firstName, lastName, middleName, email, password } = request.body;

  // Track request timing for performance monitoring
  const requestStartTime = Date.now();

  // Environment configuration validation
  const appUrl = process.env.APP_URL;
  const smtpUser = process.env.SMTP_USER;
  if (!appUrl || !smtpUser) {
    request.server.log.error(
      { missingVars: { APP_URL: !appUrl, SMTP_USER: !smtpUser } },
      "Critical environment variables missing"
    );
    return reply.status(500).send({
      success: false,
      message: "Server misconfiguration. Please contact support.",
    });
  }

  try {
    /**
     * Step 1: Account Creation
     * ------------------------
     * Creates user account in database with 'pending' status
     * This is the core business operation that must succeed
     */
    const accountStartTime = Date.now();
    const result = await createAccountService(request.server, {
      firstName,
      lastName,
      middleName: middleName ?? null,
      email,
      password,
    });
    const accountCreationTime = Date.now() - accountStartTime;

    request.server.log.info(
      { 
        userId: result.id, 
        email,
        duration: `${accountCreationTime}ms` 
      },
      "Account successfully created in database"
    );

    /**
     * Step 2: Activation Token Generation
     * -----------------------------------
     * Creates JWT token for account activation
     * Token contains user ID, purpose, and expiration
     */
    const tokenStartTime = Date.now();
    const activationToken = request.server.jwt.sign(
      {
        userId: result.id,
        purpose: "activation",
        email: result.email,
      },
      { expiresIn: "24h" }
    );
    const tokenGenerationTime = Date.now() - tokenStartTime;

    const activationLink = `${appUrl}/api/v1/account/activate?token=${activationToken}`;

    /**
     * Step 3: Non-blocking Email Delivery
     * -----------------------------------
     * Sends activation email without blocking the response
     * Email success/failure is logged but doesn't affect user experience
     * User can request a new activation email if needed
     */
    const emailPayload = {
      from: smtpUser,
      to: email,
      subject: "Activate Your Account - Clinic Management System",
      text: `Hello ${firstName},

Your account has been created successfully. Please activate your account using the link below:

${activationLink}

This activation link will expire in 24 hours.
If you didn't create this account, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to Clinic Management System!</h2>
          <p>Hello ${firstName},</p>
          <p>Your account has been created successfully. Please activate your account by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationLink}" 
               style="display: inline-block; padding: 12px 24px; background: #2563eb; 
                      color: white; text-decoration: none; border-radius: 6px;
                      font-size: 16px; font-weight: bold;">
              Activate My Account
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Or copy this link in your browser:<br>
            <a href="${activationLink}">${activationLink}</a>
          </p>
          
          <p style="color: #999; font-size: 12px;">
            This activation link will expire in 24 hours.<br>
            If you didn't create this account, please ignore this email.
          </p>
        </div>
      `,
    };

    // Fire and forget - don't await the email sending
    request.server.mailer.sendMail(emailPayload)
      .then(() => {
        const maskedEmail = email.replace(/(.{2}).+(@.+)/, "$1***$2");
        request.server.log.info(
          { 
            userId: result.id, 
            email: maskedEmail,
            emailType: 'activation'
          },
          "Activation email delivered successfully"
        );
      })
      .catch((mailErr) => {
        const maskedEmail = email.replace(/(.{2}).+(@.+)/, "$1***$2");
        request.server.log.warn(
          { 
            userId: result.id, 
            email: maskedEmail, 
            err: mailErr.message,
            emailType: 'activation'
          },
          "Background email delivery failed - user can request resend"
        );
      });

    /**
     * Step 4: Immediate Response
     * --------------------------
     * Respond to client without waiting for email delivery
     * This reduces response time from ~2.6s to ~100ms
     */
    const totalRequestTime = Date.now() - requestStartTime;
    
    request.server.log.info(
      { 
        userId: result.id,
        email,
        timings: {
          accountCreation: `${accountCreationTime}ms`,
          tokenGeneration: `${tokenGenerationTime}ms`, 
          totalRequest: `${totalRequestTime}ms`
        }
      },
      "Account creation request completed successfully"
    );

    return reply.status(201).send({
      success: true,
      message: "Account created successfully. Please check your email to activate your account.",
      data: {
        id: result.id,
        firstName: result.firstName,
        lastName: result.lastName,
        middleName: result.middleName,
        email: result.email,
      },
    });

  } catch (err: unknown) {
    /**
     * Error Handling
     * --------------
     * Log detailed error context for debugging
     * Return generic message to client for security
     */
    const totalRequestTime = Date.now() - requestStartTime;
    
    if (err instanceof Error) {
      request.server.log.error(
        { 
          err: err.message, 
          email,
          duration: `${totalRequestTime}ms`,
          stack: err.stack 
        },
        "Account creation failed with known error"
      );

      // Business logic errors (duplicate email, etc.)
      if (err.message.includes('already exists')) {
        return reply.status(409).send({
          success: false,
          message: "An account with this email already exists.",
        });
      }
    } else {
      request.server.log.error(
        { 
          err, 
          email,
          duration: `${totalRequestTime}ms` 
        },
        "Account creation failed with unknown error type"
      );
    }

    // Generic error response (security best practice)
    return reply.status(500).send({
      success: false,
      message: "Failed to create account. Please try again later.",
    });
  }
}