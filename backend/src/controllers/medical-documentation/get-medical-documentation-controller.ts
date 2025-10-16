import type { FastifyRequest, FastifyReply } from "fastify";
import { getMedicalDocumentation } from "../../services/medical-documentation/getMedicalDocumentation.js";

interface GetMedicalDocumentationParams {
  id: string;
}

export async function getMedicalDocumentationController(
  request: FastifyRequest<{
    Params: GetMedicalDocumentationParams;
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;

    // Validate that ID is provided
    if (!id) {
      throw request.server.httpErrors.badRequest("Medical documentation ID is required");
    }

    // Call the service to get medical documentation
    const medicalDocumentation = await getMedicalDocumentation(request.server, { id });

    // If no documentation found, return 404
    if (!medicalDocumentation) {
      throw request.server.httpErrors.notFound("Medical documentation not found");
    }

    // Return successful response
    return reply.send({
      success: true,
      message: "Medical documentation retrieved successfully",
      data: medicalDocumentation
    });

  } catch (err: unknown) {
    
    // If it's already a Fastify error, re-throw it
    if (err instanceof request.server.httpErrors.HttpError) {
      throw err;
    }

    // For other errors, throw internal server error
    throw request.server.httpErrors.internalServerError();
  }
}