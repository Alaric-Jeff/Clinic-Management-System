import type { FastifyInstance } from "fastify";

/**
 * Service: Retrieves all archived patients for dashboard preview
 * 
 * Responsibilities:
 *  - Fetches minimal patient data for archived patients list
 *  - Optimized for dashboard display with essential info only
 *  - Handles database errors gracefully
 * 
 * Use Cases:
 *  - Archived patients quick view
 *  - Dashboard archived count and list
 *  - Patient restoration candidate selection
 * 
 * @param fastify - Fastify instance for database access
 * @returns Array of archived patient objects with minimal data
 * @throws {Error} When database operation fails
 */
export async function getAllArchivedPatientsService(
    fastify: FastifyInstance
) {
    try {
        fastify.log.debug(
            { operation: 'getAllArchivedPatientsService' },
            "Fetching archived patients for dashboard preview"
        );

        const archivedPatients = await fastify.prisma.patient.findMany({
            where: {
                isArchived: true
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                middleName: true,
                archivedAt: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc' 
            }
        });

        fastify.log.info(
            { 
                archivedCount: archivedPatients.length,
                operation: 'getAllArchivedPatientsService'
            },
            "Successfully retrieved archived patients for dashboard"
        );

        return archivedPatients;

    } catch (err: unknown) {
        if (err instanceof Error) {
            fastify.log.error(
                { 
                    err: err.message, 
                    operation: 'getAllArchivedPatientsService',
                    errorType: 'DatabaseError'
                },
                "Failed to retrieve archived patients from database"
            );
        } else {
            fastify.log.error(
                { 
                    err, 
                    operation: 'getAllArchivedPatientsService',
                    errorType: 'UnknownError'
                },
                "Failed to retrieve archived patients with unknown error type"
            );
        }
        throw err;
    }
}