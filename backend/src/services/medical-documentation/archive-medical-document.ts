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
      select: { isArchived: true },
    });

    if (!document) {
      fastify.log.error(`Document doesn't exist, current id: ${id}`);
      throw new Error("Document doesn't exist");
    }

    if (document.isArchived === true) {
      fastify.log.warn(`Idempotent operation, document is already archived`);
      throw new Error("The document is already archived");
    }

    const archivedAt = new Date(); // ✅ single consistent timestamp

    await fastify.prisma.$transaction(async (tx) => {
      await tx.medicalDocumentation.update({
        where: { id },
        data: {
          isArchived: true,
          archivedAt, 
        },
      });

      await tx.documentAuditLog.create({
        data: {
          medicalDocumentationId: id,
          action: "updated",
          fieldsChanged: "isArchived, archivedAt", 
          previousData: JSON.stringify({
            isArchived: false,
            archivedAt: null,
          }),
          newData: JSON.stringify({
            isArchived: true,
            archivedAt: archivedAt.toISOString(),
          }),
          changedByName,
          changedByRole,
        },
      });
    });

    fastify.log.info(`Successfully archived medical documentation ${id}`);
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(
        `Error occurred in archiving documentation: ${err.message}`
      );
    }
    throw err;
  }
}
