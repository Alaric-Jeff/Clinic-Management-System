import { Type, type Static } from "@sinclair/typebox";

export const getTotalPatientsParams = Type.Object({
  limit: Type.Number({ minimum: 1, maximum: 50 }),
  cursor: Type.Optional(Type.String()),
  direction: Type.Optional(
    Type.Union([Type.Literal("next"), Type.Literal("prev")])
  ),
});

export type getTotalPatientsParamsType = Static<typeof getTotalPatientsParams>;

export const patientPaginatedItemSchema = Type.Object({
  id: Type.String(),
  firstName: Type.String(),
  lastName: Type.String(),
  middleName: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String({ format: "date-time" }),
});

export const totalPatientPaginatedResponseSchema = Type.Object({
  success: Type.Boolean(),
  message: Type.String(),
  data: Type.Array(patientPaginatedItemSchema),
  meta: Type.Object({
    hasNextPage: Type.Boolean(),
    hasPreviousPage: Type.Boolean(),
    startCursor: Type.Union([Type.String(), Type.Null()]), 
    endCursor: Type.Union([Type.String(), Type.Null()]),   
    limit: Type.Number(),
  }),
}); 

export type totalPatientPaginatedResponseType = Static<
  typeof totalPatientPaginatedResponseSchema
>;
