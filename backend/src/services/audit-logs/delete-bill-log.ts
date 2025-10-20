import type {FastifyInstance} from 'fastify'
import type { deleteBatchIdType } from '../../type-schemas/audit-logs/delete-batch-id-schema.js'

export async function batchDeleteBill(
    fastify: FastifyInstance,
    body: deleteBatchIdType
){
    try{
        
    }catch(err: unknown){
        throw err;
    }
}