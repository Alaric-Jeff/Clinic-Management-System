import {Type, type Static} from '@sinclair/typebox'

export const deleteBatchIdSchema = Type.Array(Type.Object({
    id: Type.String()
}))

export type deleteBatchIdType = Static<typeof deleteBatchIdSchema>;