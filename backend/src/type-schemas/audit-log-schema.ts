import { Type, type Static } from "@sinclair/typebox";
import { Role } from "@prisma/client";

export const auditLogIdSchema = Type.Object({
    id: Type.String()
});

export type AuditLogIdType = Static<typeof auditLogIdSchema>;

export const auditLogResponseSchema = Type.Object({
    id: Type.String(),
    medicalDocumentationId: Type.String(),
    action: Type.String(), // "created", "updated", "status_changed"
    fieldsChanged: Type.String(), // Comma-separated or JSON string
    previousData: Type.Union([Type.String(), Type.Null()]), // JSON string
    newData: Type.Union([Type.String(), Type.Null()]), // JSON string
    changedByName: Type.String(),
    changedByRole: Type.Enum(Role),
    createdAt: Type.String({ format: 'date-time' })
});

export type AuditLogResponseType = Static<typeof auditLogResponseSchema>;

// Response for getting audit logs
export const getAuditLogsResponseSchema = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: Type.Array(auditLogResponseSchema)
});

export type GetAuditLogsResponseType = Static<typeof getAuditLogsResponseSchema>;