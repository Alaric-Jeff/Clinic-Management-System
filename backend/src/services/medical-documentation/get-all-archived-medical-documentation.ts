import type { FastifyInstance } from "fastify";


/**Service: This is for fetching all archived medical documentations to be displayed in archived documents section.
 * 
 * @param fastify 
 */

export async function getAllArchivedMedicalDocumentationService(
    fastify: FastifyInstance
){
    try{
        const archivedDocuments = await fastify.prisma.medicalDocumentation.findMany({
            where: {
                isArchived: true
            }, select: {
                id: true,
                admittedByName: true,
                createdAt: true,
                lastUpdatedByName: true,
                patient: {
                    select: {
                        firstName: true,
                        lastName: true,
                        middleName: true
                    }
                }
            }
        })
        return archivedDocuments
    }catch(err: unknown){
        if(err instanceof Error){
            fastify.log.error(`Error occured at getting archived documentation in services: ${err.message}`)
        }
        throw err;
    }
}