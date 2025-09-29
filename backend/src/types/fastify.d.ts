  import 'fastify'
  import { PrismaClient } from '@prisma/client'  
  import type nodemailer from "nodemailer";

  declare module 'fastify' {
    interface FastifyInstance {
      prisma: PrismaClient,
      mailer: nodemailer.Transporter
    }
  }