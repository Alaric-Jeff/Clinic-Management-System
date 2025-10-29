import type { FastifyInstance } from "fastify";

export async function deleteNoteService(
  fastify: FastifyInstance,
  body: {id: string}
) {
  const { id } = body;

  try {
    const patient = await fastify.prisma.patient.findUnique({
      where: { id }
    });

    if (!patient) throw new Error("Patient with id not found");

    await fastify.prisma.patient.update({
      where: { id },
      data: { notes: "" }, 
    });

    return true

  } catch (err: unknown) {
    throw err;
  }
}