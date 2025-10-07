import type { FastifyRequest, FastifyReply } from "fastify";
import { getPatientTotalCountService } from "../../services/patient-services/get-total-counts-service.js";

export async function getTotalPatientCountsController(request: FastifyRequest, reply: FastifyReply){
    try{

        const count = await getPatientTotalCountService(request.server);

        reply.code(200).send({
            success: true,
            message: "Successfully got total number of patients",
            data: {
                count: count
            }  
        })

    }catch(err: unknown){
        if(err instanceof Error){
            request.server.log.error({
                error: err,
                message: err.message
            }, "Failed to fetch total patients count")
        }else{
            request.server.log.error({
                error: err
            }, "Unknown error occured");
        }
        throw request.server.httpErrors.internalServerError();
    }
}