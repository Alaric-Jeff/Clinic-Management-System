import { Type, type Static } from "@fastify/type-provider-typebox";

//schemas for account creation
export const createAccountSchema = Type.Object({
    firstName: Type.String({minLength: 2, maxLength: 50}),
    lastName: Type.String({minLength: 2, maxLength: 50}),
    middleName: Type.Optional(Type.Union([Type.String(), Type.Null()])), 
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

//successful login schema
export const loginSuccessSchema = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: Type.Object({
        id: Type.String(),
        role: Type.String()
    })
});


export const createAccountSuccessfulResponse = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: Type.Object({
        id: Type.String(),
        firstName: Type.String(),  
        lastName: Type.String(),   
        middleName: Type.Union([Type.String(), Type.Null()]), 
        email: Type.String()
    })
})

export const verifyAccountSchema = Type.Object({
    id: Type.String(),
    token: Type.String()
});

export type verifyAccountType = Static<typeof verifyAccountSchema>;

