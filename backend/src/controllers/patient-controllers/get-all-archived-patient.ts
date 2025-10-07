import { type FastifyRequest, type FastifyReply } from "fastify";
import { getAllArchivedPatientsService } from "../../services/patient-services/get-all-archived-patient-service.js";

export async function getAllArchivedPatientController(
    request: FastifyRequest,
    reply: FastifyReply
){
    try{
        const patients = await getAllArchivedPatientsService(request.server);

        reply.code(200).send({
            success: true,
            message: "Successfuly fetched archived patients",
            data: patients
        })

    }catch(err: unknown){
        if(err instanceof Error){
            request.log.error({
                err: err,
                message: err.message
            }, 'Get All Controller failed')
        }else{
            request.log.error({
                error: err
            }, 'Unknown error occured in fetching archived patients');
        }
        throw request.server.httpErrors.internalServerError();
    }
}

