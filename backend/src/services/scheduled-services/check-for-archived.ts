import cron from 'node-cron'

/**Service: Check every 12AM if there's an existing records (patients, and medical documentations) where being archived >= 30 days
 * this includes adding the deleted into auditing log so that the users don't get surprised and confused
 * cold archive the "deleted"
 */import type { FastifyInstance } from 'fastify';
import fs from 'fs/promises';
import path from 'path';

interface ArchiveResult {
  patientsArchived: number;
  documentationsArchived: number;
  archiveFilePath: string;
  executionTime: string;
}

/**
 * Service: Archive old records (patients and medical documentations)
 * 
 * Finds records that have been archived for >= 30 days and:
 * 1. Exports them to JSON files (cold storage)
 * 2. Creates audit logs for transparency
 * 3. Deletes them from the database
 */
export async function archiveOldRecords(
  fastify: FastifyInstance
): Promise<ArchiveResult> {
  const startTime = Date.now();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    // Step 1: Find patients archived >= 30 days
    const patientsToArchive = await fastify.prisma.patient.findMany({
      where: {
        isArchived: true,
        archivedAt: {
          lte: thirtyDaysAgo
        }
      },
      include: {
        medicalDocumentations: true,
        patientAuditLogs: true
      }
    });

    // Step 2: Find medical documentations archived >= 30 days
    const documentationsToArchive = await fastify.prisma.medicalDocumentation.findMany({
      where: {
        isArchived: true,
        archivedAt: {
          lte: thirtyDaysAgo
        }
      },
      include: {
        medicalBill: {
          include: {
            billedServices: true,
            paymentHistory: true
          }
        },
        auditLogs: true
      }
    });

    // Step 3: Create cold storage directory if it doesn't exist
    const archiveDir = path.join(process.cwd(), 'cold_storage', 'archives');
    await fs.mkdir(archiveDir, { recursive: true });

    // Step 4: Generate archive file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveFileName = `archive_${timestamp}.json`;
    const archiveFilePath = path.join(archiveDir, archiveFileName);

    // Step 5: Prepare archive data
    const archiveData = {
      archivedAt: new Date().toISOString(),
      cutoffDate: thirtyDaysAgo.toISOString(),
      summary: {
        totalPatients: patientsToArchive.length,
        totalDocumentations: documentationsToArchive.length
      },
      patients: patientsToArchive.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        birthDate: p.birthDate.toISOString(),
        registeredAt: p.registeredAt.toISOString(),
        archivedAt: p.archivedAt?.toISOString() || null,
        medicalDocumentations: p.medicalDocumentations.map(md => ({
          ...md,
          createdAt: md.createdAt.toISOString(),
          updatedAt: md.updatedAt.toISOString()
        })),
        patientAuditLogs: p.patientAuditLogs.map(log => ({
          ...log,
          createdAt: log.createdAt.toISOString()
        }))
      })),
      medicalDocumentations: documentationsToArchive.map(md => ({
        ...md,
        createdAt: md.createdAt.toISOString(),
        updatedAt: md.updatedAt.toISOString(),
        archivedAt: md.archivedAt?.toISOString() || null,
        medicalBill: md.medicalBill ? {
          ...md.medicalBill,
          createdAt: md.medicalBill.createdAt.toISOString(),
          updatedAt: md.medicalBill.updatedAt.toISOString(),
          billedServices: md.medicalBill.billedServices.map(bs => ({
            ...bs,
            createdAt: bs.createdAt.toISOString()
          })),
          paymentHistory: md.medicalBill.paymentHistory.map(ph => ({
            ...ph,
            createdAt: ph.createdAt.toISOString()
          }))
        } : null,
        auditLogs: md.auditLogs.map(log => ({
          ...log,
          createdAt: log.createdAt.toISOString()
        }))
      }))
    };

    // Step 6: Write archive file
    await fs.writeFile(
      archiveFilePath,
      JSON.stringify(archiveData, null, 2),
      'utf-8'
    );

    fastify.log.info(
      { archiveFilePath, recordCount: patientsToArchive.length + documentationsToArchive.length },
      'Archive file created successfully'
    );

    // Step 7: Create audit logs for archived patients
    for (const patient of patientsToArchive) {
      await fastify.prisma.patientAuditLog.create({
        data: {
          patientId: patient.id,
          action: 'cold_archived',
          fieldsChanged: 'all_fields',
          previousData: JSON.stringify({
            id: patient.id,
            name: `${patient.firstName} ${patient.lastName}`,
            archivedAt: patient.archivedAt?.toISOString()
          }),
          newData: JSON.stringify({
            archiveFile: archiveFileName,
            archivePath: archiveFilePath,
            archivedToStorage: new Date().toISOString()
          }),
          changedByName: 'System (Automated)',
          changedByRole: 'admin'
        }
      });
    }

    // Step 8: Create audit logs for archived medical documentations
    for (const documentation of documentationsToArchive) {
      await fastify.prisma.documentAuditLog.create({
        data: {
          medicalDocumentationId: documentation.id,
          action: 'cold_archived',
          fieldsChanged: 'all_fields',
          previousData: JSON.stringify({
            id: documentation.id,
            patientId: documentation.patientId,
            archivedAt: documentation.archivedAt?.toISOString()
          }),
          newData: JSON.stringify({
            archiveFile: archiveFileName,
            archivePath: archiveFilePath,
            archivedToStorage: new Date().toISOString()
          }),
          changedByName: 'System (Automated)',
          changedByRole: 'admin'
        }
      });
    }

    // Step 9: Delete records from database (using transaction)
    await fastify.prisma.$transaction(async (prisma) => {
      // Delete medical documentations (cascade will handle related records)
      if (documentationsToArchive.length > 0) {
        await prisma.medicalDocumentation.deleteMany({
          where: {
            id: {
              in: documentationsToArchive.map(md => md.id)
            }
          }
        });
      }

      // Delete patients (cascade will handle related records)
      if (patientsToArchive.length > 0) {
        await prisma.patient.deleteMany({
          where: {
            id: {
              in: patientsToArchive.map(p => p.id)
            }
          }
        });
      }
    });

    const executionTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;

    return {
      patientsArchived: patientsToArchive.length,
      documentationsArchived: documentationsToArchive.length,
      archiveFilePath,
      executionTime
    };

  } catch (error) {
    fastify.log.error(
      { error, operation: 'archiveOldRecords' },
      'Failed to archive old records'
    );
    throw error;
  }
}