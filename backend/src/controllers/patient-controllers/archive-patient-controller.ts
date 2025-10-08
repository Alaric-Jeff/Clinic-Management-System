import type {
    FastifyRequest, FastifyReply
} from 'fastify'
import { archivePatientService } from '../../services/patient-services/archive-patient-service.js';
import type { patientIdType } from '../../type-schemas/patient-schemas.js'


export async function archivePatientController(
    request: FastifyRequest<{Body: patientIdType}>,
    reply: FastifyReply
) {
    const { id } = request.body;
    
    try {
        const result = await archivePatientService(request.server, {id})

        return reply.code(200).send({
            success: true, 
            message: "Successfully changed the status of patient"
        })

    } catch(err: unknown) {
        if(err instanceof Error){
            // Handle "Patient not found" as 404, not 500
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
            
            // Log other errors
            request.server.log.error({
                error: err,
                message: err.message
            }, "Failed to archive the patient");
        } else {
            request.server.log.error({
                err 
            }, "Unknown Error occurred in archiving the patient");
        }
        
        throw request.server.httpErrors.internalServerError();
    }
}
            
