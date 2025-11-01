import { ServiceCategory } from "@prisma/client";
import { Type, type Static } from "@sinclair/typebox";

// request body:
export const searchServiceSchema = Type.Object({
    searchServiceBody: Type.String({maxLength: 32, minLength: 1})
})


export type searchServiceType = Static<typeof searchServiceSchema>;

// response: 
export const searchServiceEngineResponse = Type.Object({
    message: Type.String(),
    result: Type.Array(Type.Object({
        id: Type.String(),
        name: Type.String(),
        category: Type.Enum(ServiceCategory),
        price: Type.Number()
    }))
})

export type searchServiceEngineType = Static<typeof searchServiceEngineResponse>;