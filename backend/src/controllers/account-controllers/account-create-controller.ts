import type { FastifyReply, FastifyRequest } from "fastify";
import type { createAccountType } from "../../type-schemas/accounts-schemas.js";
import { createAccountService } from "../../services/account-services/create-account-service.js";

export async function createAccountController(
  request: FastifyRequest<{ Body: createAccountType }>,
  reply: FastifyReply
) {
  const { firstName, lastName, middleName, email, password } = request.body;

  const appUrl = process.env.APP_URL;
  const smtpUser = process.env.SMTP_USER;

  if (!appUrl || !smtpUser) {
    request.server.log.error("Missing APP_URL or SMTP_USER in environment variables");
    return reply.status(500).send({
      success: false,
      message: "Server misconfiguration. Please contact support.",
    });
  }

  try {
    const result = await createAccountService(request.server, {
      firstName,
      lastName,
      middleName,
      email,
      password,
    });

    const activationToken = await request.server.jwt.sign(
      {
        userId: result.id,
        purpose: "activation",
        email: result.email,
      },
      { expiresIn: "24h" }
    );

    const activationLink = `${appUrl}/api/v1/account/activate?token=${activationToken}`;

    await request.server.mailer.sendMail({
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
    });

    const maskedEmail = email.replace(/(.{2}).+(@.+)/, "$1***$2");
    request.server.log.info({ userId: result.id, email: maskedEmail }, "Activation email sent");

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
    request.server.log.error({ err }, "Error creating account");

    return reply.status(500).send({
      success: false,
      message: "Failed to create account. Please try again later.",
    });
  }
}
