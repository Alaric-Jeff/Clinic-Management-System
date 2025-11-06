import type { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from 'bcrypt';

export async function confirmPasswordReset(
    request: FastifyRequest<{Querystring: {token: string}}>,
    reply: FastifyReply
){
    const { token } = request.query;

    if (!token) {
        const frontendUrl = process.env.APP_URL || 'http://localhost:5173';
        const redirectUrl = `${frontendUrl}/login?error=${encodeURIComponent('Reset token is required')}`;
        return reply.redirect(redirectUrl);
    }

    try {
        // 1. Verify the JWT token
        const decoded = request.server.jwt.verify<{
            userId: string;
            purpose: string;
            email: string;
        }>(token);
        
        if (decoded.purpose !== "password_reset_verification") {
            const frontendUrl = process.env.APP_URL || 'http://localhost:5173';
            const redirectUrl = `${frontendUrl}/login?error=${encodeURIComponent('Invalid reset token')}`;
            return reply.redirect(redirectUrl);
        }

        // 2. Find the user
        const user = await request.server.prisma.account.findUnique({
            where: {
                id: decoded.userId
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
            }
        });

        if (!user) {
            const frontendUrl = process.env.APP_URL || 'http://localhost:5173';
            const redirectUrl = `${frontendUrl}/login?error=${encodeURIComponent('User not found')}`;
            return reply.redirect(redirectUrl);
        }

        // 3. Generate new password
        const specialChars = "!@#$%^&*";
        const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
        const rawPassword = `${user.firstName.slice(0, 2)}${user.lastName.slice(-2)}${user.id.slice(-3)}${randomSpecial}`;
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // 4. Update password in database
        await request.server.prisma.account.update({
            where: {
                id: user.id
            },
            data: {
                password: hashedPassword
            }
        });

        // 5. Send new password via email
        const emailPayload = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: "Your New Password - Clinic Management System",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc2626;">Password Reset Successful</h2>
                    <p>Hello ${user.firstName},</p>
                    <p>Your password has been successfully reset. Here are your new password credentials:</p>
                    
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>New Password:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${rawPassword}</code></p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        Please log in with these credentials and change your password to something more secure.<br>
                        For security reasons, we recommend changing this password immediately after logging in.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.APP_URL}/login" 
                           style="display: inline-block; padding: 12px 24px; background: #dc2626; 
                                  color: white; text-decoration: none; border-radius: 6px;
                                  font-size: 16px; font-weight: bold;">
                            Go to Login
                        </a>
                    </div>
                </div>
            `,
        };

        // Send email (non-blocking)
        request.server.mailer.sendMail(emailPayload)
            .then(() => {
                request.server.log.info(
                    { userId: user.id },
                    "New password sent via email"
                );
            })
            .catch((mailErr) => {
                request.server.log.error(
                    { userId: user.id, err: mailErr.message },
                    "Failed to send new password email"
                );
            });

        // Redirect to frontend with success message
        const frontendUrl = process.env.APP_URL || 'http://localhost:5173';
        const redirectUrl = `${frontendUrl}/success-reset?message=${encodeURIComponent('Password reset successful! Check your email for the new password.')}`;
        
        return reply.redirect(redirectUrl);

    } catch (err: unknown) {
        request.server.log.error(
            { err, token },
            "Password reset confirmation failed"
        );
        
        const frontendUrl = process.env.APP_URL || 'http://localhost:5173';
        
        if (err instanceof Error && err.message.includes('jwt expired')) {
            const redirectUrl = `${frontendUrl}/login?error=${encodeURIComponent('Reset link has expired. Please request a new password reset.')}`;
            return reply.redirect(redirectUrl);
        }

        const redirectUrl = `${frontendUrl}/login?error=${encodeURIComponent('Failed to reset password. Please try again later.')}`;
        return reply.redirect(redirectUrl);
    }
}
