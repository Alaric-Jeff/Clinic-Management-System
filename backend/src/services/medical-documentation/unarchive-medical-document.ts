import type { Role } from "@prisma/client";
import type { FastifyInstance } from "fastify";

export async function unarchiveMedicalDocument(
  fastify: FastifyInstance,
  body: {
    id: string;
    changedByName: string;
    changedByRole: Role;
  }
) {
  const { id, changedByName, changedByRole } = body;

  try {
    const document = await fastify.prisma.medicalDocumentation.findUnique({
      where: { id },
      select: { isArchived: true, archivedAt: true },
    });

    if (!document) {
      fastify.log.error(`Document doesn't exist, current id: ${id}`);
      throw new Error("Document doesn't exist");
    }

    if (document.isArchived === false) {
      fastify.log.warn(`Idempotent operation, document is already active`);
      throw new Error("The document is already active");
    }

    await fastify.prisma.$transaction(async (tx) => {
      await tx.medicalDocumentation.update({
        where: { id },
        data: {
          isArchived: false,
          archivedAt: null,
          lastUpdatedByName: changedByName,
          lastUpdatedByRole: changedByRole
        },
      });

      await tx.documentAuditLog.create({
        data: {
          medicalDocumentationId: id,
          action: "updated",
          fieldsChanged: "isArchived, archivedAt",
          previousData: JSON.stringify({
            isArchived: true,
            archivedAt: document.archivedAt
              ? document.archivedAt.toISOString()
              : null,
          }),
          newData: JSON.stringify({
            isArchived: false,
            archivedAt: null,
          }),
          changedByName,
          changedByRole,
        },
      });
    });

    fastify.log.info(`Successfully unarchived medical documentation ${id}`);
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(
        `Error occurred in unarchiving documentation service: ${err.message}`
      );
    }
    throw err;
  }
}
