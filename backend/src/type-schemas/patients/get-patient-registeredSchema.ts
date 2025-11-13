import { Type, type Static } from "@sinclair/typebox";

export const getPatientBasedOnDateSchema = Type.Object({
  year: Type.Optional(Type.Integer({ minimum: 1900, maximum: 2100 })),
  month: Type.Optional(Type.Integer({ minimum: 1, maximum: 12 })),
  week: Type.Optional(Type.Integer({ minimum: 1, maximum: 5 })),
  date: Type.Union([Type.String({ pattern: "^\\d{2}/\\d{2}/\\d{4}$" }), Type.Null()]),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50, default: 100 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
});

export type getPatientBasedOnDateType = Static<typeof getPatientBasedOnDateSchema>;