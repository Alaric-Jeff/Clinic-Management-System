import {Type, type Static} from '@sinclair/typebox'

export const getTotalMedicalBillsParams = Type.Object({
  limit: Type.Number({ minimum: 1, maximum: 50 }),
  cursor: Type.Optional(Type.String()),
  direction: Type.Optional(
    Type.Union([Type.Literal("next"), Type.Literal("prev")])
  ),
}) 

export type getTOtalMedicalBillsType = Static<typeof getTotalMedicalBillsParams>


export const paginatedBills = Type.Object({
  id: Type.String(),
  totalAmount: Type.Number(),
  amountPaid: Type.Number(),
  balance: Type.Number(),
  paymentStatus: Type.String(),
  isSeniorPwdDiscountApplied: Type.Boolean(),
  discountRate: Type.Number(),
  consultationFee: Type.Number(),
  notes: Type.Optional(Type.String()),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),

  medicalDocumentation: Type.Object({
    patient: Type.Object({
      id: Type.String(),
      firstName: Type.String(),
      lastName: Type.String(),
      middleName: Type.Optional(Type.String()),
      csdIdOrPwdId: Type.Optional(Type.String()),
    }),
  }),

  billedServices: Type.Array(
    Type.Object({
      id: Type.String(),
      serviceName: Type.String(),
      serviceCategory: Type.String(),
      servicePriceAtTime: Type.Number(),
      quantity: Type.Integer(),
      subtotal: Type.Number(),
    })
  ),
});

export const getMedicalBillsPaginatedSchema = Type.Object({
  message: Type.String(),
  data: Type.Array(paginatedBills),
  meta: Type.Object({
    hasNextPage: Type.Boolean(),
    hasPreviousPage: Type.Boolean(),
    startCursor: Type.Union([Type.String(), Type.Null()]),
    endCursor: Type.Union([Type.String(), Type.Null()]),
    limit: Type.Number(),
  }),
});

export type getMedicalBillsPaginatedType = Static<typeof getMedicalBillsPaginatedSchema>
