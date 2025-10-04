import type {FastifyInstance} from 'fastify'
import type { createPatientType } from '../../type-schemas/patient-schemas.js'

export async function createPatientService(
    fastify: FastifyInstance,
    body: createPatientType
){

    const {
        firstName,
        lastName,
        middleName,
        birthDate,
        csdIdOrPwdId,
        mobileNumber,
        residentialAddress,
        createdById,
        updatedById
    } = body;

    try{
        const patient = await fastify.prisma.patient.create({
            data: {
                firstName,
                lastName,
                middleName,
                birthDate,
                csdIdOrPwdId,
                mobileNumber,
                residentialAddress,
                createdById,
                updatedById
            }, select: {
                id: true,
                firstName: true,
                lastName: true,
                middleName: true, //note that this could be null, but I could just handle it in the client-side
                csdIdOrPwdId: true,
                mobileNumber: true,
                residentialAddress: true,
                createdById: true,
                updatedById: true
            }
        })

        return patient;

    }catch(err: unknown){
        if(err instanceof Error){
            
        }else{

        }
        throw err;
    }
};