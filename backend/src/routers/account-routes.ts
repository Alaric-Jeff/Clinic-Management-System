import type { FastifyInstance } from "fastify";
import { Type } from "@fastify/type-provider-typebox";

import {
  loginSchema,
  loginSuccessSchema,
  createAccountSuccessfulResponse,
  createAccountSchema,
  passwordResetRequestSchema,
  passwordResetRequestResponse,
  passwordResetConfirmResponse,
  getAccountResponse,
  accountIdSchema,
  deleteResponse,
} from "../type-schemas/accounts-schemas.js";

import { changedPasswordBodySchema } from "../type-schemas/accounts/change-password-schema.js";

import { accountLoginController } from "../controllers/account-controllers/account-login-controller.js";
import { createAccountController } from "../controllers/account-controllers/account-create-controller.js";
import { accountVerifyController } from "../controllers/account-controllers/account-verify-controller.js";
import { accountLogoutController } from "../controllers/account-controllers/account-logout-controller.js";
import { requestPasswordReset } from "../controllers/account-controllers/verify-reset-password.js";
import { confirmPasswordReset } from "../controllers/account-controllers/confirm-password-reset.js";
import { getAccountsController } from "../controllers/account-controllers/get-account-controller.js";
import { deleteAccountController } from "../controllers/account-controllers/delete-account-controller.js";
import { changePasswordController } from "../controllers/account-controllers/change-password-controller.js";
import { requireRole } from "../hooks/authorization.js";
import { Role } from "@prisma/client";

export async function accountRoutes(fastify: FastifyInstance) {
  // 🩺 Health check route
  fastify.get("/health", async () => ({
    status: "OK",
    service: "account-routes",
    timestamp: new Date().toISOString(),
  }));

  // 🔐 Login route (rate limited)
  fastify.route({
    method: "POST",
    url: "/login",
    config: {
      rateLimit: {
        max: 5, // 5 attempts
        timeWindow: "1 minute", // per minute
      },
    },
    schema: {
      body: loginSchema,
      response: { 200: loginSuccessSchema },
    },
    handler: accountLoginController,
  });

  // 🚪 Logout route (no limit needed)
  fastify.route({
    method: "POST",
    url: "/logout",
    schema: {
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
    handler: accountLogoutController,
  });

  // 🧑‍💼 Create account (rate limited to avoid spam)
  fastify.route({
    method: "POST",
    url: "/create-account",
    config: {
      rateLimit: {
        max: 10, // 10 per 10 minutes
        timeWindow: "10 minutes",
      },
    },
    schema: {
      body: createAccountSchema,
      response: { 201: createAccountSuccessfulResponse },
    },
    preHandler: requireRole([Role.admin, Role.encoder]),
    handler: createAccountController,
  });

  // ❌ Delete account
  fastify.route({
    method: "DELETE",
    url: "/delete-account",
    schema: {
      body: accountIdSchema,
      response: { 200: deleteResponse },
    },
    preHandler: requireRole([Role.admin]),
    handler: deleteAccountController,
  });

  // ✅ Account verification
  fastify.route({
    method: "GET",
    url: "/activate",
    schema: {
      querystring: {
        type: "object",
        properties: { token: { type: "string" } },
        required: ["token"],
      },
    },
    handler: accountVerifyController,
  });

  // 🔁 Password reset (Step 1: request)
  fastify.route({
    method: "POST",
    url: "/request-password-reset",
    config: {
      rateLimit: {
        max: 3, // only 3 requests per 10 minutes
        timeWindow: "10 minutes",
      },
    },
    schema: {
      body: passwordResetRequestSchema,
      response: { 200: passwordResetRequestResponse },
    },
    handler: requestPasswordReset,
  });

  // 🔁 Password reset (Step 2: confirm)
  fastify.route({
    method: "GET",
    url: "/confirm-password-reset",
    schema: {
      querystring: {
        type: "object",
        properties: { token: { type: "string" } },
        required: ["token"],
      },
      response: { 200: passwordResetConfirmResponse },
    },
    handler: confirmPasswordReset,
  });

  // 👥 Get accounts (admin or encoder)
  fastify.route({
    method: "GET",
    url: "/get-accounts",
    schema: { response: { 200: getAccountResponse } },
    preHandler: requireRole([Role.admin, Role.encoder]),
    handler: getAccountsController,
  });

  // 🔑 Change password
  fastify.route({
    method: "PUT",
    url: "/change-password",
    schema: {
      body: changedPasswordBodySchema,
      response: { 200: Type.Boolean() },
    },
    preHandler: requireRole([Role.admin, Role.encoder]),
    handler: changePasswordController,
  });
}
