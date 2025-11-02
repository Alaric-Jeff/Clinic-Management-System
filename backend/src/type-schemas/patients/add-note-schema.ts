import { Type, type Static } from "@fastify/type-provider-typebox";
import { Role } from "@prisma/client";

export const addNoteSchema = Type.Object({
    id: Type.String(),
    note: Type.String({maxLength: 150}),
})

export type addNoteType = Static<typeof addNoteSchema>;


export const addNoteServiceSchema = Type.Object({
    id: Type.String(),
    note: Type.String({maxLength: 150}),
    changedByName: Type.String(),
    changedByRole: Type.Enum(Role)
})

export type addNoteServiceType = Static<typeof addNoteServiceSchema>

export const AddNoteResponseSchema = Type.Object({
  message: Type.String({ default: "Successfully added note" }),
  data: Type.Union([
    Type.String(),
    Type.Null()
  ])
});