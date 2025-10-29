import { Type, type Static } from "@sinclair/typebox";

import { Role } from "@prisma/client";
//for service

export const settleBillSchema = Type.Object({
  medicalBillId: Type.String({
    description: "ID of the medical bill to settle"
  }),
  paymentAmount: Type.Number({
    minimum: 0.01,
    description: "Payment amount - must be at least 0.01"
  }),
  paymentMethod: Type.String({
    minLength: 1,
    description: "Payment method (cash, card, gcash, insurance, etc.)"
  }),
  notes: Type.Optional(
    Type.String({
      description: "Optional notes about the payment"
    })
  ),
  updatedByName: Type.String(),
  updatedByRole: Type.Enum(Role)
});

export type SettleBillType = Static<typeof settleBillSchema>;


export const settleBillRequestSchema = Type.Object({
  medicalBillId: Type.String({
    description: "ID of the medical bill to settle"
  }),
  paymentAmount: Type.Number({
    minimum: 0.01,
    description: "Payment amount - must be at least 0.01"
  }),
  paymentMethod: Type.String({
    minLength: 1,
    description: "Payment method (cash, card, gcash, insurance, etc.)"
  }),
  notes: Type.Optional(
    Type.String({
      description: "Optional notes about the payment"
    })
  )
});

export type SettleBillRequestType = Static<typeof settleBillRequestSchema>;