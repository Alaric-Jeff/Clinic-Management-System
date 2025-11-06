import type { FastifyInstance } from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import type { Prisma } from '@prisma/client';

interface ArchiveResult {
  patientsArchived: number;
  documentationsArchived: number;
  billsAdjusted: number;
  analyticsRecordsUpdated: number;
  archiveFilePath: string;
  executionTime: string;
  errors: string[];
}

interface AnalyticsAdjustment {
  date: Date;
  billId: string;
  totalAmount: number;
  paymentStatus: string;
  servicesCount: number;
  services: Array<{
    name: string;
    category: string;
    subtotal: number;
    quantity: number;
  }>;
}

/**
 * Service: Archive old records (patients and medical documentations)
 * 
 * Production-grade implementation that:
 * 1. Exports records to JSON files (cold storage)
 * 2. Creates audit logs for transparency
 * 3. Adjusts analytics to maintain data consistency
 * 4. Deletes records from database in a single atomic transaction
 * 5. Handles errors gracefully with detailed logging
 */
export async function archiveOldRecords(
  fastify: FastifyInstance
): Promise<ArchiveResult> {
  const startTime = Date.now();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const errors: string[] = [];
  let billsAdjusted = 0;
  let analyticsRecordsUpdated = 0;

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

    fastify.log.info(
      { count: patientsToArchive.length },
      'Found patients to archive'
    );

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

    fastify.log.info(
      { count: documentationsToArchive.length },
      'Found documentations to archive'
    );

    // Early return if nothing to archive
    if (patientsToArchive.length === 0 && documentationsToArchive.length === 0) {
      fastify.log.info('No records to archive');
      return {
        patientsArchived: 0,
        documentationsArchived: 0,
        billsAdjusted: 0,
        analyticsRecordsUpdated: 0,
        archiveFilePath: '',
        executionTime: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
        errors: []
      };
    }

    // Step 3: Collect analytics adjustments needed
    const analyticsAdjustments = new Map<string, AnalyticsAdjustment>();
    
    for (const doc of documentationsToArchive) {
      if (doc.medicalBill) {
        const bill = doc.medicalBill;
        const billDate = new Date(bill.createdAt);
        billDate.setHours(0, 0, 0, 0);
        const dateKey = billDate.toISOString();

        if (!analyticsAdjustments.has(dateKey)) {
          analyticsAdjustments.set(dateKey, {
            date: billDate,
            billId: bill.id,
            totalAmount: 0,
            paymentStatus: bill.paymentStatus,
            servicesCount: 0,
            services: []
          });
        }

        const adjustment = analyticsAdjustments.get(dateKey)!;
        adjustment.totalAmount += bill.totalAmount;
        adjustment.servicesCount += bill.billedServices.length;

        // Collect service details for analytics adjustment
        for (const service of bill.billedServices) {
          adjustment.services.push({
            name: service.serviceName,
            category: service.serviceCategory,
            subtotal: service.subtotal,
            quantity: service.quantity
          });
        }
      }
    }

    fastify.log.info(
      { uniqueDates: analyticsAdjustments.size },
      'Analytics adjustments calculated'
    );

    // Step 4: Create cold storage directory
    const archiveDir = path.join(process.cwd(), 'cold_storage', 'archives');
    await fs.mkdir(archiveDir, { recursive: true });

    // Step 5: Generate archive file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveFileName = `archive_${timestamp}.json`;
    const archiveFilePath = path.join(archiveDir, archiveFileName);

    // Step 6: Prepare archive data
    const archiveData = {
      archivedAt: new Date().toISOString(),
      cutoffDate: thirtyDaysAgo.toISOString(),
      summary: {
        totalPatients: patientsToArchive.length,
        totalDocumentations: documentationsToArchive.length,
        totalBills: documentationsToArchive.filter(d => d.medicalBill).length,
        analyticsAdjustments: analyticsAdjustments.size
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

    // Step 7: Write archive file
    await fs.writeFile(
      archiveFilePath,
      JSON.stringify(archiveData, null, 2),
      'utf-8'
    );

    fastify.log.info(
      { archiveFilePath, recordCount: patientsToArchive.length + documentationsToArchive.length },
      'Archive file created successfully'
    );

    // Step 8: Execute everything in a single atomic transaction
    await fastify.prisma.$transaction(async (prisma) => {
      // 8.1: Adjust analytics FIRST (before deletion)
      for (const [dateKey, adjustment] of analyticsAdjustments.entries()) {
        try {
          // Find or skip if analytics record doesn't exist
          const dailyAnalytics = await prisma.dailySalesAnalytics.findUnique({
            where: { date: adjustment.date }
          });

          if (!dailyAnalytics) {
            fastify.log.warn(
              { date: dateKey },
              'No analytics record found for date - skipping adjustment'
            );
            continue;
          }

          // Count bills by status for this date
          const billsByStatus = documentationsToArchive
            .filter(d => {
              if (!d.medicalBill) return false;
              const billDate = new Date(d.medicalBill.createdAt);
              billDate.setHours(0, 0, 0, 0);
              return billDate.getTime() === adjustment.date.getTime();
            })
            .reduce((acc, d) => {
              if (d.medicalBill) {
                acc[d.medicalBill.paymentStatus] = (acc[d.medicalBill.paymentStatus] || 0) + 1;
              }
              return acc;
            }, {} as Record<string, number>);

          const paidCount = billsByStatus['paid'] || 0;
          const unpaidCount = billsByStatus['unpaid'] || 0;
          const partiallyPaidCount = billsByStatus['partially_paid'] || 0;
          const totalBillsCount = paidCount + unpaidCount + partiallyPaidCount;

          // Update daily analytics
          await prisma.dailySalesAnalytics.update({
            where: { id: dailyAnalytics.id },
            data: {
              totalRevenue: Math.max(0, dailyAnalytics.totalRevenue - adjustment.totalAmount),
              totalBills: Math.max(0, dailyAnalytics.totalBills - totalBillsCount),
              totalServices: Math.max(0, dailyAnalytics.totalServices - adjustment.servicesCount),
              paidBills: Math.max(0, dailyAnalytics.paidBills - paidCount),
              unpaidBills: Math.max(0, dailyAnalytics.unpaidBills - unpaidCount),
              partiallyPaidBills: Math.max(0, dailyAnalytics.partiallyPaidBills - partiallyPaidCount),
              // Recalculate average
              averageBillAmount: dailyAnalytics.totalBills - totalBillsCount > 0
                ? (dailyAnalytics.totalRevenue - adjustment.totalAmount) / (dailyAnalytics.totalBills - totalBillsCount)
                : 0
            }
          });

          analyticsRecordsUpdated++;

          // 8.2: Adjust service analytics
          const serviceAdjustments = adjustment.services.reduce((acc, service) => {
            const key = service.name;
            if (!acc[key]) {
              acc[key] = {
                name: service.name,
                category: service.category,
                totalRevenue: 0,
                quantitySold: 0
              };
            }
            acc[key].totalRevenue += service.subtotal;
            acc[key].quantitySold += service.quantity;
            return acc;
          }, {} as Record<string, any>);

          for (const serviceAdj of Object.values(serviceAdjustments)) {
            const serviceAnalytics = await prisma.serviceDailyAnalytics.findFirst({
              where: {
                dailyAnalyticsId: dailyAnalytics.id,
                serviceName: serviceAdj.name
              }
            });

            if (serviceAnalytics) {
              const newQuantity = Math.max(0, serviceAnalytics.quantitySold - serviceAdj.quantitySold);
              const newRevenue = Math.max(0, serviceAnalytics.totalRevenue - serviceAdj.totalRevenue);

              await prisma.serviceDailyAnalytics.update({
                where: { id: serviceAnalytics.id },
                data: {
                  totalRevenue: newRevenue,
                  quantitySold: newQuantity,
                  averagePrice: newQuantity > 0 ? newRevenue / newQuantity : 0
                }
              });

              analyticsRecordsUpdated++;
            }
          }

          // 8.3: Adjust category analytics
          const categoryAdjustments = adjustment.services.reduce((acc, service) => {
            const key = service.category;
            if (!acc[key]) {
              acc[key] = {
                totalRevenue: 0,
                quantitySold: 0
              };
            }
            acc[key].totalRevenue += service.subtotal;
            acc[key].quantitySold += service.quantity;
            return acc;
          }, {} as Record<string, any>);

          for (const [category, categoryAdj] of Object.entries(categoryAdjustments)) {
            const categoryAnalytics = await prisma.categoryDailyAnalytics.findFirst({
              where: {
                dailyAnalyticsId: dailyAnalytics.id,
                category: category as any
              }
            });

            if (categoryAnalytics) {
              await prisma.categoryDailyAnalytics.update({
                where: { id: categoryAnalytics.id },
                data: {
                  totalRevenue: Math.max(0, categoryAnalytics.totalRevenue - categoryAdj.totalRevenue),
                  quantitySold: Math.max(0, categoryAnalytics.quantitySold - categoryAdj.quantitySold)
                }
              });

              analyticsRecordsUpdated++;
            }
          }

          billsAdjusted += totalBillsCount;

        } catch (error) {
          const errorMsg = `Failed to adjust analytics for ${dateKey}: ${error}`;
          fastify.log.error({ error, date: dateKey }, errorMsg);
          errors.push(errorMsg);
          // Continue with other dates even if one fails
        }
      }

      // 8.4: Create audit logs for patients
      for (const patient of patientsToArchive) {
        await prisma.patientAuditLog.create({
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

      // 8.5: Create audit logs for medical documentations
      for (const documentation of documentationsToArchive) {
        await prisma.documentAuditLog.create({
          data: {
            medicalDocumentationId: documentation.id,
            action: 'cold_archived',
            fieldsChanged: 'all_fields',
            previousData: JSON.stringify({
              id: documentation.id,
              patientId: documentation.patientId,
              archivedAt: documentation.archivedAt?.toISOString(),
              hasBill: !!documentation.medicalBill
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

      // 8.6: Delete medical documentations (cascade handles bills, services, etc.)
      if (documentationsToArchive.length > 0) {
        await prisma.medicalDocumentation.deleteMany({
          where: {
            id: {
              in: documentationsToArchive.map(md => md.id)
            }
          }
        });

        fastify.log.info(
          { count: documentationsToArchive.length },
          'Deleted medical documentations'
        );
      }

      // 8.7: Delete patients (cascade handles remaining relations)
      if (patientsToArchive.length > 0) {
        await prisma.patient.deleteMany({
          where: {
            id: {
              in: patientsToArchive.map(p => p.id)
            }
          }
        });

        fastify.log.info(
          { count: patientsToArchive.length },
          'Deleted patients'
        );
      }
    }, {
      timeout: 120000, // 2 minute timeout for large operations
      maxWait: 10000,  // Max 10s to acquire transaction lock
    });

    const executionTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;

    fastify.log.info(
      {
        patientsArchived: patientsToArchive.length,
        documentationsArchived: documentationsToArchive.length,
        billsAdjusted,
        analyticsRecordsUpdated,
        executionTime,
        errors: errors.length
      },
      'Archive operation completed'
    );

    return {
      patientsArchived: patientsToArchive.length,
      documentationsArchived: documentationsToArchive.length,
      billsAdjusted,
      analyticsRecordsUpdated,
      archiveFilePath,
      executionTime,
      errors
    };

  } catch (error) {
    fastify.log.error(
      { error, operation: 'archiveOldRecords' },
      'Failed to archive old records'
    );
    throw error;
  }
}