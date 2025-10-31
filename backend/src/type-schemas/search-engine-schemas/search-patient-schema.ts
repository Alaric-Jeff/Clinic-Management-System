import { Type, type Static } from "@sinclair/typebox";

// request body:

export const searchBodySchema = Type.Object({
    searchBody: Type.String({maxLength: 32, minLength: 1})
})


export type searchBodyType = Static<typeof searchBodySchema>;
// response: 

export const searchPatientEngineResponse = Type.Object({
    message: Type.String(),
    result: Type.Array(Type.Object({
        id: Type.String(),
        firstName: Type.String(),
        lastName: Type.String(),
        middleName: Type.Union([Type.String(), Type.Null()])
    }))
})

export type searchPatientEngineType = Static<typeof searchPatientEngineResponse>;