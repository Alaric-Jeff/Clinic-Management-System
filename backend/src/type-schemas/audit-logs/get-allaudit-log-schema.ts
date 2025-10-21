import { Type, type Static } from "@sinclair/typebox";

export const getAllAuditLogsResponse = Type.Object({
  success: Type.Boolean(),
  message: Type.String(),
  data: Type.Array(
    Type.Object({
      id: Type.String(),
      sourceType: Type.String(), 
      action: Type.String(),
      fieldsChanged: Type.String(),
      previousData: Type.Union([Type.String(), Type.Null()]),
      newData: Type.Union([Type.String(), Type.Null()]),
      changedByName: Type.String(),
      changedByRole: Type.String(),
      createdAt: Type.String({ format: "date-time" }),
    })
  ),
});