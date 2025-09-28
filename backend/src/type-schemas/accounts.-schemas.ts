import { Type, type Static } from "@fastify/type-provider-typebox";

//schemas for account creation
export const createAccountSchema = Type.Object({
    firstName: Type.String({minLength: 2, maxLength: 50}),
    lastName: Type.String({minLength: 2, maxLength: 50}),
    middleName: Type.Union([Type.String({minLength: 2, maxLength: 50}), Type.Undefined(), Type.Null()]),
    email: Type.String({format: 'email'}),
    password: Type.String({minLength: 8})
})

export type createAccountType = Static<typeof createAccountSchema>;

//schema for log in
export const loginSchema = Type.Object({
     email: Type.String({format: 'email'}),
     password: Type.String({minLength: 8})
})

export type loginType = Static<typeof loginSchema>;
