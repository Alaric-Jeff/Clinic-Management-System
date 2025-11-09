import type { FastifyRequest, FastifyReply } from "fastify";
import type { createPatientType } from "../../type-schemas/patient-schemas.js";
import { createPatientService } from "../../services/patient-services/create-patient-service.js";
import { Role } from "@prisma/client";

export async function createPatientController(
  request: FastifyRequest<{ Body: createPatientType }>,
  reply: FastifyReply
): Promise<void> {
  const {
    firstName,
    lastName,
    middleName,
    birthDate,
    gender,
    csdIdOrPwdId,
    mobileNumber,
    residentialAddress,
    registerDate
  } = request.body;

  const user = request.currentUser;

  if (!user || !user.name || !user.role) {
    throw request.server.httpErrors.unauthorized(
      "Authentication required with valid user details"
    );
  }

  const { name: userName, role: userRole } = user;
  request.server.log.debug(`user's name: ${userName}, role: ${userRole}`);

  // === DATE VALIDATIONS ===
  try {
    const today = new Date();
    const birth = new Date(birthDate);
    const register = registerDate ? new Date(registerDate) : null;

    // birthDate cannot be in the future
    if (birth > today) {
      return reply.code(400).send({
        success: false,
        message: "Birth date cannot be in the future"
      });
    }

    // birthDate cannot make age > 120
    const age = today.getFullYear() - birth.getFullYear();
    const hasHadBirthdayThisYear =
      today.getMonth() > birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
    const actualAge = hasHadBirthdayThisYear ? age : age - 1;

    if (actualAge > 120) {
      return reply.code(400).send({
        success: false,
        message: "Birth date cannot make age greater than 120 years"
      });
    }

    // registerDate (if provided) must be between 2015 and today
    if (register) {
      const minDate = new Date("2015-01-01");

      if (register < minDate || register > today) {
        return reply.code(400).send({
          success: false,
          message: "Register date must be between 2015 and today"
        });
      }
    }

    // === CONTINUE CREATION ===
    const patientPreview = await createPatientService(request.server, {
      firstName,
      lastName,
      middleName,
      birthDate,
      gender,
      csdIdOrPwdId,
      mobileNumber,
      residentialAddress,
      registerDate,
      createdByName: userName,
      createdByRole: userRole as Role,
      updatedByName: userName,
      updatedByRole: userRole as Role
    });

    return reply.code(201).send({
      success: true,
      data: patientPreview,
      message: "Patient created successfully"
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return reply.code(500).send({
        success: false,
        error: err.message,
        message: "Failed to create patient"
      });
    }

    return reply.code(500).send({
      success: false,
      message: "An unexpected error occurred while creating patient"
    });
  }
}
