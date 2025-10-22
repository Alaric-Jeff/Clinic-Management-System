import { Type, type Static } from "@sinclair/typebox";

export const updatePaymentHistorySchema = Type.Object({
    medicalBillId: Type.String(),
    amountPaid: Type.Optional(Type.Number()),
    paymentMethod: Type.Optional(Type.String()),
    notes:  Type.Optional(Type.String())
})

export type updatePaymentHistoryType = Static<typeof updatePaymentHistorySchema>;