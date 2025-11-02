import type { FastifyInstance } from "fastify";
import type { addNoteServiceType } from "../../type-schemas/patients/add-note-schema.js";

export async function addNoteService(
  fastify: FastifyInstance,
  body: addNoteServiceType
) {
  const { id, note, changedByName, changedByRole } = body;

  fastify.log.info(`addNoteService: Received request for patient ID: ${id}`);
  fastify.log.info(`addNoteService: Note content: ${note}`);

  try {
    const patient = await fastify.prisma.patient.findUnique({
      where: { id },
      select: { notes: true }
    });

    if (!patient) {
      fastify.log.error(`addNoteService: Patient with ID ${id} not found`);
      throw new Error("Patient with id not found");
    }

    const result = await fastify.prisma.patient.update({
      where: { id },
      data: { notes: note },
      select: { notes: true }
    });

    await fastify.prisma.patientAuditLog.create({
      data: {
        patientId: id,
        action: "updated",
        fieldsChanged: "notes",
        previousData: JSON.stringify({ notes: patient.notes ?? "" }),
        newData: JSON.stringify({ notes: note }),
        changedByName,
        changedByRole
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
