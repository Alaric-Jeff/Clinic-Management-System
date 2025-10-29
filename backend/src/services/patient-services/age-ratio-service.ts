import type { FastifyInstance } from "fastify";

export async function ageRatioService(fastify: FastifyInstance) {
  try {
    const patients = await fastify.prisma.patient.findMany({
      select: { birthDate: true },
    });

    const now = new Date();
    let kid = 0, adult = 0, elder = 0;

    for (const p of patients) {
      const birthDate = new Date(p.birthDate);
      const age =
        now.getFullYear() -
        birthDate.getFullYear() -
        (now < new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0);

      if (age < 13) kid++;
      else if (age < 60) adult++;
      else elder++;
    }

    return {
      data: { kid, adult, elder },
    };
  } catch (err: unknown) {
    fastify.log.error(err);
    throw err;
}
}