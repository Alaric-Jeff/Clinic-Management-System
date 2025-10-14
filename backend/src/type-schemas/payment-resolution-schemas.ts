import { Type, type Static } from "@sinclair/typebox";


//------------------------------

export const updatePaymentStatusBodySchema = Type.Object({
    medicalbillId: Type.String(),
    
});

export type updatePaymentStatusBodytype = Static<typeof updatePaymentStatusBodySchema>;


//------------------------------