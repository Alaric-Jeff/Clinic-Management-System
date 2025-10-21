import { Type, type Static } from "@fastify/type-provider-typebox";
import { AccountStatus, Role } from "@prisma/client";



export const accountIdSchema = Type.Object({
    id: Type.String()
})

export const deleteResponse = Type.Object({
    success: Type.String()
})


export const createAccountSchema = Type.Object({
    firstName: Type.String({minLength: 2, maxLength: 50}),
    lastName: Type.String({minLength: 2, maxLength: 50}),
    middleName: Type.Optional(Type.Union([Type.String(), Type.Null()])), 
    email: Type.String({format: 'email'}),
    password: Type.String({ 
        minLength: 8,
        pattern: '^(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?])(?!.*\\s).+$'
    })
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
        role: Type.Enum(Role),
        name: Type.String()
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

// Password reset request schema
export const passwordResetRequestSchema = Type.Object({
    email: Type.String({format: 'email'})
});

export type passwordResetRequestType = Static<typeof passwordResetRequestSchema>;

// Password reset response schemas
export const passwordResetRequestResponse = Type.Object({
    success: Type.Boolean(),
    message: Type.String()
});

export const passwordResetConfirmResponse = Type.Object({
    success: Type.Boolean(),
    message: Type.String()
});

    export const getAccountResponse = Type.Object({
        success: Type.Boolean(),
        message: Type.String(),
        data: Type.Array(Type.Object({
            id: Type.String(),
            firstName: Type.String(),
            lastName: Type.String(),
            middleName: Type.String(),
            role: Type.Enum(Role),
            email: Type.String({format: 'email'}),
            status: Type.Enum(AccountStatus),
            createdAt: Type.String({format: 'date-time'})
        }))
    })

//-----------------------------------------------------
// get total patients limit params i.e /get-total-patients/limit?=
export const getTotalPatientsParams = Type.Object({
    limit: Type.Number({minimum: 1, maximum: 50}),
    cursor: Type.Union([Type.String(), Type.Null()])
})

    export type getTotalPatientsParamsType = Static<typeof getTotalPatientsParams>

//response
export const getTotalPatientsResponse = Type.Object({
    id: Type.String(),
    firstName: Type.String(),
    lastName: Type.String(),
    middleName: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: 'date-time' })
});

export const totalPatientPaginatedResponse = Type.Object({
    data: Type.Array(getTotalPatientsResponse), 
    meta: Type.Object({ 
        hasNextPage: Type.Boolean(),
        endCursor: Type.Union([Type.String(), Type.Null()]),
        hasPreviousPage: Type.Boolean(),
        limit: Type.Number()
    })
});

//------------------------------------------------------    