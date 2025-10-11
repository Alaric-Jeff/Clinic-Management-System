import type { FastifyRequest, FastifyReply } from "fastify";
import type { createDoctorType, createDoctorResponseType } from "../../type-schemas/doctor-schemas.js";
import { createDoctorService } from "../../services/doctor-services/create-doctor-service.js";
export async function createDoctorController(
    request: FastifyRequest<{Body: createDoctorType}>,
    reply: FastifyReply
){
    const {
        firstName,
        lastName,
        middleInitial
    } = request.body;

    try{
        request.server.log.debug("Creating Doctor in Controller");
        const result = await createDoctorService(request.server, {
            firstName,
            lastName,
            middleInitial
        });

        return reply.code(201).send({
            success: true,
            message: "Successfully created new doctor",
            data: result
        })

    }catch(err: unknown){
        if(err instanceof Error){
            request.server.log.error({
                error: err,
                message: err.message
            }, `Failed to create doctor in controller`);
        }else{
            request.server.log.error({
                error: err
            }, `Unknown reason occured in controller`);
        }
        throw request.server.httpErrors.internalServerError();
    }
}