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

        const user = request.currentUser;

        if(!user) return request.server.httpErrors.unauthorized("User not found")

        await archivePatientService(request.server, {id, name: user.name, role: user.role})

        return reply.code(200).send({
            success: true, 
            message: "Successfully changed the status of patient"
        })

    } catch(err: unknown) {
        if(err instanceof Error){
            if(err.message === "Patient not found") {
                request.server.log.warn(
                    { patientId: id, error: err },
                    "Patient not found during archival"
                );
                return request.server.httpErrors.notFound("Account not found.");
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
            
