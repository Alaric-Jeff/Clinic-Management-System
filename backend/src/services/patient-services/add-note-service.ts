import type { FastifyInstance } from "fastify";
import type { addNoteType } from "../../type-schemas/patients/add-note-schema.js";

export async function addNoteService(
  fastify: FastifyInstance,
  body: addNoteType
) {
  const { id, note } = body;

  fastify.log.info(`addNoteService: Received request for patient ID: ${id}`);
  fastify.log.info(`addNoteService: Note content: ${note}`);

  try {
    const patient = await fastify.prisma.patient.findUnique({
      where: { id },
      select: { notes: true },
    });

    if (!patient) {
      fastify.log.error(`addNoteService: Patient with ID ${id} not found`);
      throw new Error("Patient with id not found");
    }

    fastify.log.info(`addNoteService: Current patient notes: ${patient.notes}`);

    // REPLACE the notes instead of appending
    const result = await fastify.prisma.patient.update({
      where: { id },
      data: { notes: note }, // Directly use the new note (replace)
      select: {
        notes: true
      }
    });

    fastify.log.info(`addNoteService: Successfully updated notes for patient ${id}`);
    fastify.log.info(`addNoteService: New notes: ${result.notes}`);

    return result;

  } catch (err: unknown) {
    fastify.log.error(`addNoteService: Error updating patient ${id}:`);
    throw err;
  }
}