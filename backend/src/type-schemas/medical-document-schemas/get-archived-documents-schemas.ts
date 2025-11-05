import { Type, type Static } from "@sinclair/typebox";

export const getArchivedDocumentsResponse = Type.Object({
    message: Type.String(),
    data: Type.Array(Type.Object({
        id: Type.String()
    }))
})