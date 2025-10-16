import type { FastifyInstance } from "fastify/types/instance.js";
import type {
    updateMedicalServiceType
} from '../../type-schemas/services-schemas.js'
import { dmmfToRuntimeDataModel } from "@prisma/client/runtime/library";


/**
 * Service - Updates medical service fields (partial update)
 * Only updates fields that are provided in the body
 * 
 * @param fastify - Fastify instance with database connection
 * @param body - contains {id, name?, category?, price?}
 * @returns the updated medical service record
 * @throws Error if service not found or update fails
 */

export async function updateMedicalService(
    fastify: FastifyInstance,
    body: updateMedicalServiceType
) {
    const { id, name, category, price } = body;

    try {
        // Build dynamic update object - only include provided fields
        const updateData: Record<string, any> = {};
        
        if (name !== undefined) updateData.name = name;
        if (category !== undefined) updateData.category = category;
        if (price !== undefined) updateData.price = price;

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            throw new Error('No fields provided for update');
        }

        const updatedService = await fastify.prisma.service.update({
            where: { id },
            data: updateData, 
            select: {
                name: true,
                category: true,
                price: true,
                createdByName: true,
                createdAt: true,
            }
        });

        return updatedService;

        // Alternative: If using raw SQL
        /*
        const fields = Object.keys(updateData);
        const values = Object.values(updateData);
        const setClause = fields.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
        
        const result = await fastify.pg.query(
            `UPDATE medical_services 
             SET ${setClause}, updated_at = NOW() 
             WHERE id = $${values.length + 1} 
             RETURNING *`,
            [...values, id]
        );

        if (result.rows.length === 0) {
            throw new Error('Medical service not found');
        }

        return result.rows[0];
        */

    } catch (err: unknown) {
        fastify.log.error({ err, body }, 'Failed to update medical service');
        
        if (err instanceof Error) {
            throw new Error(`Failed to update medical service: ${err.message}`);
        }
        
        throw new Error('Failed to update medical service: Unknown error');
    }
}