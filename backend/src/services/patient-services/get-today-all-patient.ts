import type { FastifyInstance } from "fastify";

/**
 * Service: Retrieves all patients created today
 * Note that this shi is for dashboard
 * 
 * Responsibilities:
 *  - Fetches patients created on the current date
 *  - Handles date filtering correctly for PostgreSQL
 *  - Returns minimal patient data for listing
 * 
 * @param fastify - Fastify instance for database access
 * @returns Array of patient objects with basic info
 */
export async function getTodayAllPatientService(fastify: FastifyInstance) {
    // Get start and end of today
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    try {
        fastify.log.debug(
            { startOfToday, endOfToday },
            "Fetching patients created today"
        );

        const patients = await fastify.prisma.patient.findMany({
            where: {
                createdAt: {
                    gte: startOfToday, 
                    lt: endOfToday     
                }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                middleName: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc' 
            }
        });

        fastify.log.info(
            { patientCount: patients.length, date: startOfToday.toISOString().split('T')[0] },
            "Successfully retrieved today's patients"
        );

        return patients;

    } catch (err: unknown) {
        if (err instanceof Error) {
            fastify.log.error(
                { 
                    err: err.message, 
                    operation: 'getTodayAllPatientService',
                    dateRange: { startOfToday, endOfToday }
                },
                "Failed to retrieve today's patients from database"
            );
        } else {
            fastify.log.error(
                { 
                    err, 
                    operation: 'getTodayAllPatientService',
                    dateRange: { startOfToday, endOfToday }
                },
                "Failed to retrieve today's patients with unknown error type"
            );
        }
        throw err;
    }
}