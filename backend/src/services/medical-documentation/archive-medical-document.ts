import type { FastifyInstance } from "fastify";
import type { changeIsArchivedType } from "../../type-schemas/medical-document-schemas/archive-unarchive-schema.js";

export async function archiveMedicalDocument(
  fastify: FastifyInstance,
  body: changeIsArchivedType
) {
  const { id, changedByName, changedByRole } = body;

  try {
    const document = await fastify.prisma.medicalDocumentation.findUnique({
      where: { id },
      select: { isArchived: true }
    });

    if (!document) {
      fastify.log.error(`Document doesn't exist, current id: ${id}`);
      throw new Error("Document doesn't exist");
    }

    if (document.isArchived === true) {
      fastify.log.warn(`Idempotent operation, document is already archived`);
      throw new Error("The document is already archived");
    }

    await fastify.prisma.$transaction(async (tx) => {
      await tx.medicalDocumentation.update({
        where: { id },
        data: { isArchived: true }
      });

      await tx.documentAuditLog.create({
        data: {
          medicalDocumentationId: id,
          action: "updated",
          fieldsChanged: "isArchived",
          previousData: JSON.stringify({ isArchived: false }),
          newData: JSON.stringify({ isArchived: true }),
          changedByName,
          changedByRole
        }
      });
    });

    fastify.log.info(`Successfully archived medical documentation ${id}`);

    return;
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(`Error occurred in archiving documentation: ${err.message}`);
    }
    throw err;
  }
}
