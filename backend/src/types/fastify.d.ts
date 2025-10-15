import 'fastify'
import { PrismaClient } from '@prisma/client'  
import type nodemailer from "nodemailer";
import type { JWT } from '@fastify/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient,
    mailer: nodemailer.Transporter,
    jwt: JWT,
    httpErrors: {
      badRequest: (message?: string) => Error;
      unauthorized: (message?: string) => Error;
      forbidden: (message?: string) => Error;
      notFound: (message?: string) => Error;
      internalServerError: (message?: string) => Error;
    }
  }
}