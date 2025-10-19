/**
 * Service: Get paginated list of patients
 * 
 * Uses cursor-based pagination for efficient large dataset handling.
 * Cursor is based on combination of createdAt and id to handle ties.
 * 
 * @param fastify - Fastify instance with Prisma client
 * @param body - Pagination parameters including limit and optional cursor
 * @returns Paginated patients with metadata for navigation
 * @throws {Error} When cursor format is invalid or database operation fails
 * 
 * @example
 * ```typescript
 * // First page
 * const result = await getTotalPatients(fastify, { limit: 20 });
 * 
 * // Subsequent pages using cursor
 * const nextPage = await getTotalPatients(fastify, { 
 *   limit: 20, 
 *   cursor: result.meta.endCursor 
 * });
 * ```
 */
import type { FastifyInstance } from "fastify";
import type { getTotalPatientsParamsType } from "../../type-schemas/accounts-schemas.js";

export async function getTotalPatients(
    fastify: FastifyInstance,
    body: getTotalPatientsParamsType
) {
    const { limit, cursor } = body;

    try {
        let cursorObj: any = undefined;
        if (cursor) {
            const parts = cursor.split('|');
            
            const createdAtStr = parts[0] ?? '';
            const id = parts[1] ?? '';

            if (!createdAtStr || !id) {
                throw new Error('Invalid cursor format');
            }

            cursorObj = {
                createdAt: new Date(createdAtStr),
                id: id
            };
        }

        const findManyArgs: any = {
            select: {
                id: true,
                firstName: true,
                lastName: true,
                middleName: true,
                createdAt: true
            },
            take: limit + 1,
            orderBy: [
                { createdAt: 'desc' },
                { id: 'desc' }
            ]
        };

        if (cursorObj) {
            findManyArgs.cursor = cursorObj;
            findManyArgs.skip = 1;
        }

        const patients = await fastify.prisma.patient.findMany(findManyArgs);

        const hasNextPage = patients.length > limit;
        if (hasNextPage) {
            patients.pop();
        }

        const lastPatient = patients[patients.length - 1];
        const endCursor = lastPatient 
            ? `${lastPatient.createdAt.toISOString()}|${lastPatient.id}` 
            : null;

        fastify.log.info(
            { 
                limit, 
                hasNextPage, 
                recordsReturned: patients.length 
            },
            'Patients paginated list retrieved'
        );

        return {
            success: true,
            message: 'Patients retrieved successfully',
            data: patients.map(patient => ({
                ...patient,
                createdAt: patient.createdAt.toISOString()
            })),
            meta: {
                hasNextPage,
                endCursor,
                hasPreviousPage: !!cursor,
                limit
            }
        };

    } catch (err: unknown) {
        fastify.log.error(
            { error: err, operation: 'getTotalPatients' },
            'Failed to retrieve paginated patients'
        );
        throw err;
    }
}