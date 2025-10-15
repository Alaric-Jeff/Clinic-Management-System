import type { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from 'bcrypt';

export async function sendNewPassword(
    request: FastifyRequest<{Body: {email: string}}>,
    reply: FastifyReply
){
    const {
        email
    } = request.body;
    
    try {
        const user = await request.server.prisma.account.findUnique({
            where: {
               email 
            }, 
            select: {
                id: true,
                firstName: true,
                lastName: true
            }
        });

        if(!user) {
            throw request.server.httpErrors.notFound("Email with account not found");
        }

        const specialChars = "!@#$%^&*";
        const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
        const rawPassword = `${user.firstName.slice(0, 2)}${user.lastName.slice(-2)}${user.id.slice(-3)}${randomSpecial}`;
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        await request.server.prisma.account.update({
            where: {
                email
            }, 
            data: {
                password: hashedPassword
            }
        });

        await request.server.mailer.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "Your New Password",
            text: `Your new password is: ${rawPassword}`
        });

        return reply.send({ 
            message: "New password has been sent to your email",
            success: true 
        });

    } catch(err: unknown) {
        request.server.log.error(err);
        return reply.internalServerError("Failed to reset password");
    }
}