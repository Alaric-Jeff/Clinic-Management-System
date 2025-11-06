import type { FastifyInstance } from "fastify";

export async function findExistingNameService(
    fastify: FastifyInstance,
    body: { firstName: string | null, lastName: string | null, middleName: string | null }
) {
    const { firstName, lastName, middleName } = body;

    try {
        // Normalize inputs (trim and handle null/empty)
        const normalizedFirstName = firstName?.trim() || null;
        const normalizedLastName = lastName?.trim() || null;
        const normalizedMiddleName = middleName?.trim() || null;

        // If only first name is provided, don't check (too common)
        if (normalizedFirstName && !normalizedLastName && !normalizedMiddleName) {
            return {
                isDuplicate: false,
                warning: null,
                matches: []
            };
        }

        // Build the query conditions based on what's provided
        const whereConditions: any = {
            isArchived: false // Only check active patients
        };

        if (normalizedFirstName) {
            whereConditions.firstName = {
                equals: normalizedFirstName,
                mode: 'insensitive' // Case-insensitive comparison
            };
        }

        if (normalizedLastName) {
            whereConditions.lastName = {
                equals: normalizedLastName,
                mode: 'insensitive'
            };
        }

        if (normalizedMiddleName) {
            whereConditions.middleName = {
                equals: normalizedMiddleName,
                mode: 'insensitive'
            };
        }

        // Query for potential matches
        const matches = await fastify.prisma.patient.findMany({
            where: whereConditions,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                middleName: true,
                birthDate: true,
                gender: true,
                registeredAt: true
            },
            take: 10 // Limit results to prevent performance issues
        });

        // Determine the warning level based on matches and fields provided
        if (matches.length === 0) {
            return {
                isDuplicate: false,
                warning: null,
                matches: []
            };
        }

        // Determine warning severity
        let warningLevel: 'low' | 'medium' | 'high' = 'low';
        let warningMessage = '';

        if (normalizedFirstName && normalizedLastName && normalizedMiddleName) {
            // All three fields match - almost guaranteed duplicate
            warningLevel = 'high';
            warningMessage = `A patient with the exact same name (${normalizedFirstName} ${normalizedMiddleName} ${normalizedLastName}) already exists. Please verify this is a new patient.`;
        } else if (normalizedFirstName && normalizedLastName) {
            // First and last name match - likely duplicate
            warningLevel = 'medium';
            warningMessage = `Found ${matches.length} patient(s) with similar name (${normalizedFirstName} ${normalizedLastName}). Please check if this is an existing patient.`;
        } else {
            // Only partial match
            warningLevel = 'low';
            warningMessage = `Found ${matches.length} patient(s) with similar information. Please verify.`;
        }

        return {
            isDuplicate: true,
            warning: {
                level: warningLevel,
                message: warningMessage
            },
            matches: matches.map(match => ({
                id: match.id,
                fullName: `${match.firstName} ${match.middleName || 'N/A'} ${match.lastName}`,
                firstName: match.firstName,
                lastName: match.lastName,
                middleName: match.middleName,
                birthDate: match.birthDate,
                gender: match.gender,
                registeredAt: match.registeredAt
            }))
        };

    } catch (err: unknown) {
        if (err instanceof Error) {
            fastify.log.error(`An error occurred in finding existing name service, error: ${err.message}`);
        }
        throw err;
    }
}