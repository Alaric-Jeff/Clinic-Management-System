import type { FastifyRequest, FastifyReply } from "fastify";
import { getTodayAllPatientService } from "../../services/patient-services/get-today-all-patient.js";
export async function getTodayPatientController(
    request: FastifyRequest,
    reply: FastifyReply
){
    try{
        const todayPatients = await getTodayAllPatientService(request.server);
        
    }catch(err: unknown){

    }
}