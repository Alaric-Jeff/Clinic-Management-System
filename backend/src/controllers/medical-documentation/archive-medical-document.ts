import type {
    FastifyRequest,
    FastifyReply
} from 'fastify';
import { archiveMedicalDocument } from '../../services/medical-documentation/archive-medical-document.js';


export async function archiveDocumentController(
    request: FastifyRequest<{Body: {id: string}}>,
    reply: FastifyReply
){
    const {
        id
    } = request.body;

    try{
        let user = request.currentUser;

        if(!user || !user.name || !user.role){
            throw request.server.httpErrors.unauthorized("Unauthorized access")
        }

        await archiveMedicalDocument(request.server, {id, changedByName: user.name, changedByRole: user.role})

        reply.code(200).send({
            success: true,
            message: "Successfully archived medical document"
        })

    }catch(err: unknown){
        if(err instanceof Error){
            if(err.message === "Document doesn't exist"){
                throw request.server.httpErrors.notFound("Document doesn't exist")
            }

            if(err.message === "The document is already archived"){
                throw request.server.httpErrors.conflict("The document is already archived")
            }
        }
        throw request.server.httpErrors.internalServerError("Error occured in archiving medical document");
    }
}