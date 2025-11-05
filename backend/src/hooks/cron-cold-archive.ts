import cron from 'node-cron';
import type { FastifyInstance } from 'fastify';
import { archiveOldRecords } from '../services/scheduled-services/check-for-archived.js';

/**
 * Cold Archive Cron Job
 * 
 * Runs daily at 12:00 AM (midnight) to check for records that have been archived for >= 30 days
 * and moves them to cold storage (file-based system).
 * 
 * This includes:
 * - Patients archived >= 30 days
 * - Medical Documentations archived >= 30 days
 * - Creates audit logs for transparency
 * - Exports data to JSON files before deletion
 */
export function setupColdArchiveCron(fastify: FastifyInstance) {
  // Run every day at 12:00 AM (midnight)
  // Format: '0 0 * * *' = minute hour day month weekday
  const cronSchedule = '0 0 * * *';

  cron.schedule(cronSchedule, async () => {
    fastify.log.info('Cold Archive Cron Job Started');

    try {
      const result = await archiveOldRecords(fastify);

      fastify.log.info({
        patientsArchived: result.patientsArchived,
        documentationsArchived: result.documentationsArchived,
        archiveFilePath: result.archiveFilePath,
        executionTime: result.executionTime
      }, 'Cold Archive Cron Job Completed Successfully');

    } catch (error) {
      if (error instanceof Error) {
        fastify.log.error({
          error: error.message,
          stack: error.stack
        }, 'Cold Archive Cron Job Failed');
      } else {
        fastify.log.error({
          error
        }, 'Cold Archive Cron Job Failed with Unknown Error');
      }
    }
  });

  fastify.log.info(`🕐 Cold Archive Cron Job Scheduled: ${cronSchedule} (Daily at 12:00 AM)`);
}