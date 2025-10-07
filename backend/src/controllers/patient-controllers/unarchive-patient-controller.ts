import type {
    FastifyRequest, FastifyReply
} from 'fastify'
import { unarchivePatientService } from '../../services/patient-services/unarchive-patient-service.js'
import type { patientIdType } from '../../type-schemas/patient-schemas.js'

export async function unarchivePatientController(
    request: FastifyRequest<{Body: patientIdType}>,
    reply: FastifyReply
) {
    const {
        id
    } = request.body;
    try{
        const result = await unarchivePatientService(request.server, {id})

        return reply.code(200).send({
            success: true, 
            message: "Successfuly changes the status of patient"
        })

    }catch(err: unknown){
        if(err instanceof Error){
            request.server.log.error({
                error: err,
                message: err.message
            }, "Failed to unarchive the patient");

                if(err.message === "Patient not found") {
                request.server.log.warn(
                    { patientId: id, error: err },
                    "Patient not found during archival"
                );
                return reply.code(404).send({
                    success: false,
                    message: "Patient not found"
                });
            }

        }else{
           request.log.error({
            err 
           }, "Unknown Error occured");
        }

        

        throw request.server.httpErrors.internalServerError();
    }
}