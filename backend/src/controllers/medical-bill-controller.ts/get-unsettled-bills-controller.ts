import type { FastifyRequest, FastifyReply } from "fastify";
import { getUnsettledBills } from "../../services/medical-bills-services/get-all-unsettled-service.js";

export async function getUnsettledBillsController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const unsettledBills = await getUnsettledBills(request.server);

        return reply.code(200).send({
            success: true,
            message: "Successfully fetched unsettled medical bills",
            data: unsettledBills
        });

    } catch (err: unknown) {
        if (err instanceof Error) {
            request.server.log.error({
                error: err,
                message: err.message
            }, "Failed to fetch unsettled medical bills");
        } else {
            request.server.log.error({
                error: err
            }, "Unknown error occurred while fetching unsettled medical bills");
        }
        throw request.server.httpErrors.internalServerError();
    }
}
