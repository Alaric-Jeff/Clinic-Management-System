import { type FastifyRequest, type FastifyReply } from "fastify";
import type { patchPatientType } from "../../type-schemas/patient-schemas.js";
import { patchPatientService } from "../../services/patient-services/patch-patient-service.js";
export async function patchPatientController(
    request: FastifyRequest<{Body: patchPatientType}>,
    reply: FastifyReply
){

    const {
        id,
        firstName,
        lastName,
        middleName, birthDate,
        gender,
        csdIdOrPwdId,
        mobileNumber,
        residentialAddress
    } = request.body


    try{
        const user = request.currentUser;
        if(!user || !user.name || !user.role){
            request.log.debug('unauthorized, we got no current user found')
            throw request.server.httpErrors.unauthorized();
        }

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
        })

        return reply.code(201).send({
            success: true,
            message: "Successfully updated patient",
            data: {
                updatedPatient
            }
        })

    }catch(err: unknown){
        throw request.server.httpErrors.internalServerError();
    }
}