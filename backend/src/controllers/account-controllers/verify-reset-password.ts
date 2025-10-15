import type { FastifyRequest, FastifyReply } from "fastify";

export async function requestPasswordReset(
    request: FastifyRequest<{Body: {email: string}}>,
    reply: FastifyReply
){
    const { email } = request.body;
    const smtpUser = process.env.SMTP_USER;

    if (!smtpUser) {
        return reply.status(500).send({
            success: false,
            message: "Server misconfiguration. Please contact support.",
        });
    }

    try {
        // 1. Find user
        const user = await request.server.prisma.account.findUnique({
            where: { email }, 
            select: { id: true, firstName: true, email: true }
        });

        if (!user) {
            // Generic message for security
            return reply.send({
                success: true,
                message: "If an account with this email exists, a verification email has been sent.",
            });
        }

        // 2. Generate simple verification token (expires in 15 minutes)
        const verificationToken = request.server.jwt.sign(
            {
                userId: user.id,
                purpose: "password_reset_verification",
                email: user.email,
            },
            { expiresIn: "15m" }
        );

        const verificationLink = `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/v1/account/confirm-password-reset?token=${verificationToken}`;

        // 3. Send verification email
        const emailPayload = {
            from: smtpUser,
            to: email,
            subject: "Confirm Password Reset - Clinic Management System",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc2626;">Confirm Password Reset</h2>
                    <p>Hello ${user.firstName},</p>
                    <p>We received a request to reset your password. Please confirm this action by clicking the button below:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" 
                           style="display: inline-block; padding: 12px 24px; background: #dc2626; 
                                  color: white; text-decoration: none; border-radius: 6px;
                                  font-size: 16px; font-weight: bold;">
                            Confirm Password Reset
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        If you didn't request this reset, please ignore this email.<br>
                        This link will expire in 15 minutes.
                    </p>
                </div>
            `,
        };

        // Non-blocking email
        request.server.mailer.sendMail(emailPayload)
            .then(() => {
                request.server.log.info(
                    { userId: user.id },
                    "Password reset verification email sent"
                );
            })
            .catch((mailErr) => {
                request.server.log.warn(
                    { userId: user.id, err: mailErr.message },
                    "Verification email delivery failed"
                );
            });

        return reply.send({
            success: true,
            message: "If an account with this email exists, a verification email has been sent.",
        });

    } catch (err: unknown) {
        request.server.log.error(
            { err, email },
            "Password reset request failed"
        );
        return reply.status(500).send({
            success: false,
            message: "Failed to process reset request. Please try again later.",
        });
    }
}