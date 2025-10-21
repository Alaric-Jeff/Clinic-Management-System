import { Type, type Static } from "@sinclair/typebox";
import { Role } from "@prisma/client";

export const addPaymentHistoryParameters = Type.Object({
    medicalBillId: Type.String(),
    amountPaid: Type.Number({minimum: 0}),
    paymentMethod: Type.Union([Type.String(), Type.Null()]),
    notes:  Type.Union([Type.String(), Type.Null()]),
    recordedByName: Type.String(),
    recordedByRole: Type.Enum(Role)
})

export type addPaymentHistoryParameterType = Static<typeof addPaymentHistoryParameters>;