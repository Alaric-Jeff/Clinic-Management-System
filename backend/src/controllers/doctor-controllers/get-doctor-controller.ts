import type {
    FastifyRequest,
    FastifyReply
} from 'fastify'

import { getDoctorService } from '../../services/doctor-services/get-doctors-service.js';

export async function getDoctorController(
    request: FastifyRequest,
    reply: FastifyReply
){
    try{
        const doctors = await getDoctorService(request.server);
        return reply.code(200).send({
            success: true,
            message: "Fetched all doctors",
            data: doctors
        })
    }catch(err: unknown){
        throw request.server.httpErrors.internalServerError();
    }
}