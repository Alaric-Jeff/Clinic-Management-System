import { type FastifyRequest, type FastifyReply } from "fastify";
import { createMedicalServices } from "../../services/medical-services/create-medicalservice.js";
import type { createMedicalServiceType } from "../../type-schemas/services-schemas.js";
import type { Role } from "@prisma/client";
export async function createMedicalServiceController(
    request: FastifyRequest<{Body: createMedicalServiceType}>,
    reply: FastifyReply
){

    const {
        name,
        category,
        price
    } = request.body;

    try{

        const user = request.currentUser;
        request.log.debug(`current user: ${user?.name}, with role: ${user?.role}`)

        if(!user){
            throw request.server.httpErrors.unauthorized();
        }

        let userName: string = user.name;
        let userRole: Role = user.role;

        const createdService = await createMedicalServices(request.server, {
            name,
            category,
            price,
            createdByName: userName,
            createdByRole: userRole
        });

        return reply.code(201).send({
            success: true,
            message: "Succesfully created service",
            data: {
                createdService
            }
        })

    }catch(err: unknown){
        if(err instanceof Error){
            request.log.error({
                error: err,
                message: err.message
            }, "Error occured in creating medical service")

            if(err.message == "Service already exists"){
                throw request.server.httpErrors.conflict();
            }

        }else{
            request.log.error({
                error: err
            }, "Error occured in creating medical service")
        }

        throw request.server.httpErrors.internalServerError();
    }
}