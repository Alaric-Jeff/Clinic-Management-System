import type { FastifyInstance } from "fastify";
import { type addPaymentHistoryParameterType } from "../../type-schemas/analytics-schemas/add-payment-schema.js";
export async function addPaymentHistory(
    fastify: FastifyInstance,
    body: addPaymentHistoryParameterType
): Promise<boolean>{

    const {
        medicalBillId,
        amountPaid,
        paymentMethod,
        notes,
        recordedByName,
        recordedByRole
    } = body;

    try{
        await fastify.prisma.paymentHistory.create({
            data:{
                medicalBillId,
                amountPaid,
                paymentMethod,  
                notes,
                recordedByName,
                recordedByRole
            }
        })



        return true
    }catch(err: unknown){
        if(err instanceof Error){
            fastify.log.error("An Error occured in adding a bill to payment history")
        }
        throw err;
    }
}