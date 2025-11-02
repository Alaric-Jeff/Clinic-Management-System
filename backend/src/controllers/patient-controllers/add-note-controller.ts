import type {
    FastifyRequest, FastifyReply
} from 'fastify'
import type {
    addNoteType
} from '../../type-schemas/patients/add-note-schema.js'

import { addNoteService } from '../../services/patient-services/add-note-service.js'

export async function addNoteController(
    request: FastifyRequest<{Body: addNoteType}>,
    reply: FastifyReply
){

    const {
        id,
        note
    } = request.body;

    let user = request.currentUser;

    if(!user || !user.name || !user.role){
        throw request.server.httpErrors.unauthorized("Unauthorized access")
    }

    request.log.info(`addNoteController: Starting note addition for patient ${id}`);
    request.log.info(`addNoteController: Note to add: ${note}`);

    try{
        const newNote = await addNoteService(request.server, {id, note, changedByName: user.name, changedByRole: user.role});

        request.log.info(`addNoteController: Successfully added note for patient ${id}`);

        reply.code(201).send({
            message: "Successfully added note",
            data: newNote
        })
    }catch(err: unknown){
        request.log.error(`addNoteController: Error adding note for patient ${id}:`);
        throw request.server.httpErrors.internalServerError("An error occurred while adding a note");
    }
}