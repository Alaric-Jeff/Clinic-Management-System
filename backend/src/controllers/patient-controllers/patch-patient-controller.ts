import { type FastifyRequest, type FastifyReply } from "fastify";
import type { patchPatientType } from "../../type-schemas/patient-schemas.js";
import { patchPatientService } from "../../services/patient-services/patch-patient-service.js";

export async function patchPatientController(
  request: FastifyRequest<{ Body: patchPatientType }>,
  reply: FastifyReply
) {
  const {
    id,
    firstName,
    lastName,
    middleName,
    birthDate,
    gender,
    csdIdOrPwdId,
    mobileNumber,
    residentialAddress
  } = request.body;

  try {
    const user = request.currentUser;
    if (!user || !user.name || !user.role) {
      request.log.debug("unauthorized, we got no current user found");
      throw request.server.httpErrors.unauthorized();
    }

    // === BIRTHDATE VALIDATION (if provided) ===
    if (birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);

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
    }

    // === UPDATE PATIENT ===
    const updatedPatient = await patchPatientService(request.server, {
      id,
      firstName,
      lastName,
      middleName,
      birthDate,
      gender,
      csdIdOrPwdId,
      mobileNumber,
      residentialAddress,
      updatedByName: user.name,
      updatedByRole: user.role
    });

    return reply.code(201).send({
      success: true,
      message: "Successfully updated patient",
      data: { updatedPatient }
    });
  } catch (err: unknown) {
    throw request.server.httpErrors.internalServerError();
  }
}
