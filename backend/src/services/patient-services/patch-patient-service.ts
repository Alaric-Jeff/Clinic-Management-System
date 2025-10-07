import type { FastifyInstance } from "fastify";
import type {
    patchPatientServiceType
} from '../../type-schemas/patient-schemas.js'


/**
 * 
 * @description - update non-null fields
 * 
 * @param fastify 
 * @param body 
 * @returns 
 */

export async function patchPatientService(fastify: FastifyInstance, body: patchPatientServiceType){

    const {
        id,
        firstName,
        lastName,
        middleName,
        birthDate,
        gender,
        csdIdOrPwdId,
        mobileNumber,
        residentialAddress,
        updatedByName,
        updatedByRole
    } = body;

    try{
        const updateData = {
            ...(firstName !== null && { firstName }),
            ...(lastName !== null && { lastName }),
            ...(middleName !== null && { middleName }),
            ...(birthDate !== null && { birthDate: new Date(birthDate) }),
            ...(gender !== null && { gender }),
            ...(csdIdOrPwdId !== null && { csdIdOrPwdId }),
            ...(mobileNumber !== null && { mobileNumber }),
            ...(residentialAddress !== null && { residentialAddress }),
            updatedByName,
            updatedByRole,
        };

        const updatedPatient = await fastify.prisma.patient.update({
            where: { id },
            data: updateData,
        });

        return {
            success: true,
            message: 'Patient updated successfully',
            data: updatedPatient
        };

    }catch(err: unknown){
        if (err && typeof err === 'object' && 'code' in err) {
            const prismaError = err as { code: string };
            
            if (prismaError.code === 'P2025') {
                throw new Error('Patient not found');
            }
        }
        
        throw err;
    }
}