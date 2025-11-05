import {Type} from "@sinclair/typebox";

export const ArchivedDocumentsResponse = Type.Object({
  message: Type.String(),
  data: Type.Array(Type.Object({
    id: Type.String(),
    admittedByName: Type.String(),
    createdAt: Type.String({ format: 'date-time' }),
    lastUpdatedByName: Type.String(),
    patient: Type.Object({
      firstName: Type.String(),
      lastName: Type.String(),
      middleName: Type.Union([Type.String(), Type.Null()])
    })
  }))
});