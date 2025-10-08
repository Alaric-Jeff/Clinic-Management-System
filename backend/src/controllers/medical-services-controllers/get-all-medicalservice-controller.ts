import type { FastifyRequest, FastifyReply } from "fastify";
import { getAllMedicalServices } from "../../services/medical-services/get-all-medicalservices.js";
export async function getAllMedicalServiceController(
    request: FastifyRequest,
    reply: FastifyReply
){
    try{
        const services = await getAllMedicalServices(request.server);

        return reply.code(200).send({
            success: true,
            message: "Succesfully fetched all services",
            data: services
        })
        
    }catch(err: unknown){
        if(err instanceof Error){
            request.log.error({
                error: err,
                message: err.message
            }, "Error occured in fetching all medical services")
        }else{
            request.log.error({
              error: err  
            }, "Unknown error occured in fetching all medical services");
        }
        throw request.server.httpErrors.internalServerError();
    }
};