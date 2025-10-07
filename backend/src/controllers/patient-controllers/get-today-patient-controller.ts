import { type FastifyRequest, type FastifyReply, fastify } from "fastify";
import { getTodayAllPatientService } from "../../services/patient-services/get-today-all-patient.js";

export async function getTodayPatientController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const todayPatients = await getTodayAllPatientService(request.server);
        
        return reply.send({
            success: true,
            data: todayPatients,
            message: "Today's patients retrieved successfully"
        });
        
    } catch (err: unknown) {

        if(err instanceof Error){
            request.server.log.error({
                error: err,
                message: err.message
            }, "Failed to fetch today's patients")
        }else{
            request.server.log.error({
                error: err
            }, "Unknown error occured");
        }

        throw request.server.httpErrors.internalServerError();
    }
}