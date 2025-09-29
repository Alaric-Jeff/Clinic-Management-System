// plugins/mailer.ts
import fp from "fastify-plugin";
import nodemailer from "nodemailer"
import type { FastifyPluginAsync } from "fastify";

/**
 * Nodemailer Plugin
 *
 * Provides `fastify.mailer` for sending emails.
 * Configure with SMTP in production, or use ethereal/email sandbox in dev.
 */
const mailerPlugin: FastifyPluginAsync = fp(async (fastify) => {
  // Configure transport
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify connection on startup (good for production monitoring)
  try {
    await transporter.verify();
    fastify.log.info("📧 Mailer connected successfully");
  } catch (err) {
    fastify.log.error({ err }, "❌ Failed to connect mailer");
  }

  // Decorate Fastify instance
  fastify.decorate("mailer", transporter);
});

export default mailerPlugin;