import {Type, type Static} from '@sinclair/typebox'

export const deleteBatchIdSchema = Type.Array(Type.Object({
    id: Type.String()
}))

export type deleteBatchIdType = Static<typeof deleteBatchIdSchema>;

/**
 * Request body schema for deleting audit logs
 */
export const deleteAuditLogsBodySchema = Type.Object({
  logIds: Type.Array(Type.String(), {
    minItems: 1,
    maxItems: 1000, // Prevent abuse by limiting batch size
    description: "Array of audit log IDs to delete",
  }),
});

export type DeleteAuditLogsBodyType = Static<typeof deleteAuditLogsBodySchema>;

/**
 * Response schema for successful deletion
 */
export const deleteAuditLogsResponseSchema = Type.Object({
  success: Type.Boolean(),
  message: Type.String(),
  deletedCount: Type.Number({
    description: "Total number of logs deleted across all tables",
  }),
  deletionSummary: Type.Object({
    billAuditLogs: Type.Number(),
    billedServiceAuditLogs: Type.Number(),
    documentAuditLogs: Type.Number(),
    patientAuditLogs: Type.Number(),
  }),
});

/**
 * Error response schema
 */
export const deleteAuditLogsErrorSchema = Type.Object({
  success: Type.Literal(false),
  message: Type.String(),
  deletedCount: Type.Literal(0),
  deletionSummary: Type.Object({
    billAuditLogs: Type.Literal(0),
    billedServiceAuditLogs: Type.Literal(0),
    documentAuditLogs: Type.Literal(0),
    patientAuditLogs: Type.Literal(0),
  }),
});