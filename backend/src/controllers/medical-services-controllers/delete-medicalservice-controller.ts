import { type FastifyRequest, type FastifyReply } from "fastify";
import { deleteMedicalService } from "../../services/medical-services/delete-medicalservice.js";

export async function deleteMedicalServiceController(
    request: FastifyRequest<{Body: {id: string}}>,
    reply: FastifyReply
){
    const {
        id
    } = request.body;
    
    try{
        await deleteMedicalService(request.server, {id});

        return reply.code(200).send({
            success: true,
            message: "Successfully deleted medical service"
        })

    }catch(err: unknown){
        if(err instanceof Error){

            

            if(err.message == "Service doesn't exist"){
                throw request.server.httpErrors.notFound();
            }
        }else{

        }
        throw request.server.httpErrors.internalServerError();
    }
}