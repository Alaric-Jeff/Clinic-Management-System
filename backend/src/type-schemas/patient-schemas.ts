import { Type, type Static } from "@fastify/type-provider-typebox";

export const createPatientSchema = Type.Object({
    firstName: Type.String({minLength: 2, maxLength: 30}),
    lastName: Type.String({minLength: 2, maxLength: 30}),
    middleName: Type.Union(
        [
            Type.String({minLength: 3, maxLength: 30}),
            Type.Null()
        ]
    ),
    birthDate: Type.String(),
    csdIdOrPwdId: Type.String(),
    mobileNumber: Type.String(),
    residentialAddress: Type.String(),
    createdById: Type.String(),
    updatedById: Type.String()
});

export type createPatientType = Static<typeof createPatientSchema>;