import type {
    FastifyRequest,
    FastifyReply
} from 'fastify'

import type { SettleBillRequestType } from '../../type-schemas/payment/update-payment-schema.js'
import { updatePaymentService } from '../../services/medical-bills-services.ts/update-payment-service.js';
import type { Role } from '@prisma/client';

export async function updatePaymentController(
    request: FastifyRequest<{Body: SettleBillRequestType}>,
    reply: FastifyReply
){
    const {
        medicalBillId,
        paymentAmount,
        paymentMethod,
        notes
    } = request.body;

    try {
        let user = await request.currentUser;

        if(!user){
            throw request.server.httpErrors.unauthorized("Not authorized");
        }

        await updatePaymentService(request.server, {
            medicalBillId, 
            paymentAmount,
            paymentMethod, 
            notes: notes ?? '', 
            updatedByName: user.name,
            updatedByRole: user.role as Role
        });
        return reply.code(200).send({ 
            success: true, 
            message: "Payment processed successfully" 
        });

    } catch(err: unknown) {
        if(err instanceof Error){
            if(err.message === "Medical bill with id doesn't exist") {
                throw request.server.httpErrors.notFound(err.message);
            }
            if(err.message === "Idempotent, the payment status is already fully paid") {
                throw request.server.httpErrors.conflict(err.message);
            }
            if(err.message.includes("Medical bill") || err.message.includes("payment status")) {
                throw request.server.httpErrors.badRequest(err.message);
            }
        }
        
        throw request.server.httpErrors.internalServerError("An error occurred while updating payment");
    }
}