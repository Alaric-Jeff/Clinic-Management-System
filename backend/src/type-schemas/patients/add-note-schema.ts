import { Type, type Static } from "@fastify/type-provider-typebox";

export const addNoteSchema = Type.Object({
    id: Type.String(),
    note: Type.String({maxLength: 150})
})

export type addNoteType = Static<typeof addNoteSchema>;


export const AddNoteResponseSchema = Type.Object({
  message: Type.String({ default: "Successfully added note" }),
  data: Type.Union([
    Type.String(),
    Type.Null()
  ])
});