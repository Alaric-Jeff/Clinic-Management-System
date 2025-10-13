import { Type, type Static } from "@sinclair/typebox";

import { Role } from "@prisma/client";

export const auditLogIdSchema = Type.Object({
    id: Type.String()
})

export type auditLogType = Static<typeof auditLogIdSchema>;

export const logSchemaResponse = Type.Object({
    id: Type.String(),
    medicalDocumentationId: Type.String(),
    action: Type.String(),
    fieldsChanged: Type.String(),
    previousData: Type.Union([Type.String(), Type.Null()]),
    newData: Type.Union([Type.String(), Type.Null()]), 
    changedByName: Type.String(),
    changedByRole: Type.Enum(Role),
    createdAt: Type.String({format: 'date-time'})
})

export type logTypeResponse = Static<typeof logSchemaResponse>;