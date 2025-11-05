import { Role } from "@prisma/client";
import { Type, type Static } from "@sinclair/typebox";

export const changeIsArchivedServiceSchema = Type.Object({
    id: Type.String(),
    changedByName: Type.String(),
    changedByRole: Type.Enum(Role)
})

export type changeIsArchivedType = Static<typeof changeIsArchivedServiceSchema>

export const changeIsArchivedBodySchema = Type.Object({
    id: Type.String()
})