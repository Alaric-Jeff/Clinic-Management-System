import { Type, type Static } from "@sinclair/typebox";

export const createDoctorSchema = Type.Object({
    firstName: Type.String({minLength: 2, maxLength: 30}),
    lastName: Type.String({minLength: 2, maxLength: 30}),
    middleInitial: Type.Union([Type.String(), Type.Null()])
});

export type createDoctorType = Static<typeof createDoctorSchema>;

export const doctorIdSchema = Type.Object({
    id: Type.String()
});

export const createDoctorResponseSchema = Type.Object({
    success: Type.String(),
    message: Type.String({maxLength: 30}),
    data: Type.Array(Type.Object({
        id: Type.String(),
        firstName: Type.String(),
        lastName: Type.String(),
        middleInitial: Type.Union([Type.String(), Type.Null()])
    }))
});

export type createDoctorResponseType = Static<typeof createDoctorResponseSchema>;



