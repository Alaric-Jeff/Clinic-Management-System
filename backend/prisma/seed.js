// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { addDays, format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const prisma = new PrismaClient();

const doctorsList = [
  { firstName: 'Jose', lastName: 'Lopez', middleInitial: null },
  { firstName: 'Richard', lastName: 'Viado', middleInitial: null },
  { firstName: 'Rey Angelo', lastName: 'Sanchez', middleInitial: null },
  { firstName: 'Vanessa', lastName: 'Flores', middleInitial: null },
  { firstName: 'Jorrel', lastName: 'Flores', middleInitial: null },
  { firstName: 'Deo Andrio', lastName: 'De Guzman', middleInitial: null },
  { firstName: 'Calman Jan', lastName: 'Asprer', middleInitial: null },
  { firstName: 'Faye', lastName: 'Cabalang', middleInitial: null },
  { firstName: 'Lovelyn', lastName: 'Perez', middleInitial: null },
  { firstName: 'Jan Russel', lastName: 'Estipular', middleInitial: null },
];

// Medical services with realistic pricing and categories
const medicalServices = [
  // Hematology
  { name: 'Complete Blood Count', category: 'hematology', price: 350 },
  { name: 'Hemoglobin Test', category: 'hematology', price: 180 },
  { name: 'Platelet Count', category: 'hematology', price: 200 },
  { name: 'ESR Test', category: 'hematology', price: 150 },
  
  // Clinical Chemistry
  { name: 'Blood Glucose Test', category: 'clinical_chemistry', price: 120 },
  { name: 'Creatinine Test', category: 'clinical_chemistry', price: 250 },
  { name: 'Uric Acid Test', category: 'clinical_chemistry', price: 220 },
  { name: 'Cholesterol Panel', category: 'clinical_chemistry', price: 450 },
  { name: 'Liver Function Test', category: 'clinical_chemistry', price: 600 },
  
  // Electrolytes
  { name: 'Sodium Test', category: 'electrolytes', price: 200 },
  { name: 'Potassium Test', category: 'electrolytes', price: 200 },
  { name: 'Calcium Test', category: 'electrolytes', price: 280 },
  
  // Serology & Immunology
  { name: 'RA Factor Test', category: 'serology_immunology', price: 320 },
  { name: 'ASO Titer', category: 'serology_immunology', price: 380 },
  { name: 'CRP Test', category: 'serology_immunology', price: 300 },
  
  // Clinical Microscopy
  { name: 'Urinalysis', category: 'clinical_microscopy', price: 150 },
  { name: 'Fecalysis', category: 'clinical_microscopy', price: 180 },
  { name: 'Pregnancy Test', category: 'clinical_microscopy', price: 100 },
  
  // 24-Hour Urine Test
  { name: '24H Urine Protein', category: 'twenty_four_hour_urine_test', price: 500 },
  { name: '24H Urine Creatinine', category: 'twenty_four_hour_urine_test', price: 450 },
  
  // Bacteriology
  { name: 'Culture & Sensitivity', category: 'bacteriology', price: 650 },
  { name: 'Gram Stain', category: 'bacteriology', price: 280 },
  
  // Vaccine
  { name: 'Flu Vaccine', category: 'vaccine', price: 800 },
  { name: 'Hepatitis B Vaccine', category: 'vaccine', price: 950 },
  
  // Histopathology
  { name: 'Biopsy Examination', category: 'histopathology', price: 1200 },
  
  // To be read by Pathologist
  { name: 'Peripheral Smear', category: 'to_be_read_by_pathologist', price: 400 },
  { name: 'Bone Marrow Aspiration', category: 'to_be_read_by_pathologist', price: 1500 },
  
  // Tumor Markers
  { name: 'PSA Test', category: 'tumor_markers', price: 850 },
  { name: 'CEA Test', category: 'tumor_markers', price: 750 },
  { name: 'CA-125 Test', category: 'tumor_markers', price: 900 },
  
  // Thyroid Function Test
  { name: 'TSH Test', category: 'thyroid_function_test', price: 450 },
  { name: 'T3 Test', category: 'thyroid_function_test', price: 500 },
  { name: 'T4 Test', category: 'thyroid_function_test', price: 500 },
  { name: 'Thyroid Panel', category: 'thyroid_function_test', price: 1200 },
  
  // Hormones
  { name: 'Cortisol Test', category: 'hormones', price: 600 },
  { name: 'Testosterone Test', category: 'hormones', price: 650 },
  { name: 'Estradiol Test', category: 'hormones', price: 680 },
  
  // Hepatitis
  { name: 'HBsAg Test', category: 'hepatitis', price: 350 },
  { name: 'Anti-HCV Test', category: 'hepatitis', price: 380 },
  { name: 'Hepatitis Panel', category: 'hepatitis', price: 1200 },
  
  // Enzymes
  { name: 'Amylase Test', category: 'enzymes', price: 320 },
  { name: 'Lipase Test', category: 'enzymes', price: 350 },
  { name: 'CPK Test', category: 'enzymes', price: 420 }
];

// Service popularity weights (some services are ordered more frequently)
const servicePopularity = {
  'Complete Blood Count': 0.9,
  'Urinalysis': 0.8,
  'Blood Glucose Test': 0.7,
  'Cholesterol Panel': 0.6,
  'Hemoglobin Test': 0.5,
  'Pregnancy Test': 0.4,
  'TSH Test': 0.4,
  'HBsAg Test': 0.3,
  'Creatinine Test': 0.3,
  'Liver Function Test': 0.3,
  // Other services have base popularity of 0.1-0.2
};

async function createServicesIfNotExist() {
  console.log('\n🩺 Creating medical services...');
  let createdCount = 0;
  let skippedCount = 0;

  for (const serviceData of medicalServices) {
    const existingService = await prisma.service.findFirst({
      where: {
        name: serviceData.name
      }
    });

    if (existingService) {
      skippedCount++;
    } else {
      await prisma.service.create({
        data: {
          name: serviceData.name,
          category: serviceData.category,
          price: serviceData.price,
          createdByName: 'System',
          createdByRole: 'admin'
        }
      });
      createdCount++;
    }
  }

  console.log(`✅ Services: ${createdCount} created, ${skippedCount} skipped`);
  return medicalServices;
}

async function generateComprehensiveAnalytics() {
  console.log('\n📊 Generating comprehensive analytics (2 years)...');
  
  const services = await prisma.service.findMany();
  if (services.length === 0) {
    console.log('❌ No services found. Please create services first.');
    return { serviceRecords: 0, categoryRecords: 0 };
  }

  const today = new Date();
  const monthsToGenerate = 24;
  let serviceRecordsCreated = 0;
  let categoryRecordsCreated = 0;
  let dailyRecordsCreated = 0;

  for (let monthOffset = monthsToGenerate; monthOffset > 0; monthOffset--) {
    const monthStart = startOfMonth(subMonths(today, monthOffset));
    const monthEnd = endOfMonth(monthStart);

    let currentDate = new Date(monthStart);
    
    while (currentDate <= monthEnd) {
      // Only weekdays (Mon-Fri)
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        // Check if this date already exists
        const existingDaily = await prisma.dailySalesAnalytics.findUnique({
          where: { date: currentDate }
        });

        if (!existingDaily) {
          // Generate analytics for this day
          const dailyData = await generateSingleDayAnalytics(services, new Date(currentDate));
          
          // Create daily sales analytics record
          const dailyAnalytics = await prisma.dailySalesAnalytics.create({
            data: {
              date: new Date(currentDate),
              totalRevenue: dailyData.totalRevenue,
              totalBills: dailyData.totalBills,
              totalServices: dailyData.totalServices,
              paidBills: dailyData.paidBills,
              unpaidBills: dailyData.unpaidBills,
              partiallyPaidBills: dailyData.partiallyPaidBills,
              averageBillAmount: dailyData.averageBillAmount
            }
          });

          // Create service analytics records
          for (const serviceData of dailyData.serviceAnalytics) {
            await prisma.serviceDailyAnalytics.create({
              data: {
                dailyAnalyticsId: dailyAnalytics.id,  
                serviceId: serviceData.serviceId,
                serviceName: serviceData.serviceName,
                serviceCategory: serviceData.serviceCategory,
                totalRevenue: serviceData.totalRevenue,
                quantitySold: serviceData.quantitySold,
                averagePrice: serviceData.averagePrice
              }
            });
            serviceRecordsCreated++;
          }

          // Create category analytics records
          for (const categoryData of dailyData.categoryAnalytics) {
            await prisma.categoryDailyAnalytics.create({
              data: {
                dailyAnalyticsId: dailyAnalytics.id,
                category: categoryData.category,
                totalRevenue: categoryData.totalRevenue,
                totalServices: categoryData.totalServices,
                quantitySold: categoryData.quantitySold
              }
            });
            categoryRecordsCreated++;
          }

          dailyRecordsCreated++;
        }
      }
      
      currentDate = addDays(currentDate, 1);
    }

    console.log(`✅ ${format(monthStart, 'MMM yyyy')}: Analytics generated`);
  }

  console.log(`\n🎉 Analytics Summary:`);
  console.log(`   📅 Daily records: ${dailyRecordsCreated}`);
  console.log(`   🩺 Service records: ${serviceRecordsCreated}`);
  console.log(`   📂 Category records: ${categoryRecordsCreated}`);
  
  return { serviceRecords: serviceRecordsCreated, categoryRecords: categoryRecordsCreated };
}

async function generateSingleDayAnalytics(services, date) {
  const dayOfWeek = date.getDay();
  const month = date.getMonth();
  
  // Base activity level - varies by day and season
  let baseActivityLevel = 0.6; // 60% base
  
  // Day of week factor
  if (dayOfWeek === 3 || dayOfWeek === 4) { // Wed/Thu busier
    baseActivityLevel *= 1.3;
  } else if (dayOfWeek === 1) { // Monday busiest
    baseActivityLevel *= 1.5;
  } else if (dayOfWeek === 5) { // Friday slower
    baseActivityLevel *= 0.9;
  }
  
  // Seasonal variation
  const seasonalFactors = {
    9: 1.3,  // October - flu season start
    10: 1.4, // November - peak flu season
    11: 1.3, // December - holidays
    0: 1.2,  // January - new year checkups
    1: 1.1,  // February
    3: 1.2,  // April - summer prep checkups
    8: 1.2,  // September - back to routine
  };
  
  baseActivityLevel *= (seasonalFactors[month] || 1.0);
  
  // Random daily variation
  baseActivityLevel *= (0.8 + Math.random() * 0.4); // ±20% random
  
  // Generate service-level data
  const serviceAnalytics = [];
  const categoryMap = new Map();
  
  for (const service of services) {
    let serviceProbability = servicePopularity[service.name] || 0.15;
    serviceProbability *= baseActivityLevel;
    
    // Service-specific seasonal factors
    if (month >= 9 || month <= 1) { // Flu season
      if (service.name === 'Complete Blood Count') serviceProbability *= 1.4;
      if (service.name === 'Flu Vaccine') serviceProbability *= 2.0;
    }
    if (month >= 5 && month <= 7) { // Summer
      if (service.name === 'Hepatitis B Vaccine') serviceProbability *= 1.4;
    }
    
    if (Math.random() < serviceProbability) {
      // Determine quantity
      let quantity = 1;
      if (service.name.includes('Panel') && Math.random() < 0.3) {
        quantity = Math.floor(1 + Math.random() * 2);
      }
      
      // Price variation (±10%)
      const priceVariation = 0.9 + Math.random() * 0.2;
      const actualPrice = service.price * priceVariation;
      const totalRevenue = quantity * actualPrice;
      
      serviceAnalytics.push({
        serviceId: service.id,
        serviceName: service.name,
        serviceCategory: service.category,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        quantitySold: quantity,
        averagePrice: Math.round(actualPrice * 100) / 100
      });
      
      // Aggregate by category
      if (!categoryMap.has(service.category)) {
        categoryMap.set(service.category, {
          category: service.category,
          totalRevenue: 0,
          totalServices: 0,
          quantitySold: 0
        });
      }
      
      const categoryData = categoryMap.get(service.category);
      categoryData.totalRevenue += totalRevenue;
      categoryData.totalServices += 1;
      categoryData.quantitySold += quantity;
    }
  }
  
  // Calculate daily totals
  const totalServices = serviceAnalytics.reduce((sum, s) => sum + s.quantitySold, 0);
  const totalRevenue = serviceAnalytics.reduce((sum, s) => sum + s.totalRevenue, 0);
  
  // Add consultation fees (250 per bill, assume avg 2-3 services per bill)
  const totalBills = totalServices > 0 ? Math.ceil(totalServices / 2.5) : 0;
  const consultationRevenue = totalBills * 250;
  const grandTotalRevenue = totalRevenue + consultationRevenue;
  
  // Payment status distribution (realistic)
  const paidBills = Math.floor(totalBills * (0.65 + Math.random() * 0.15)); // 65-80% paid
  const partiallyPaidBills = Math.floor(totalBills * (0.10 + Math.random() * 0.10)); // 10-20% partial
  const unpaidBills = totalBills - paidBills - partiallyPaidBills;
  
  const averageBillAmount = totalBills > 0 
    ? Math.round((grandTotalRevenue / totalBills) * 100) / 100 
    : 0;
  
  // Round category totals
  const categoryAnalytics = Array.from(categoryMap.values()).map(cat => ({
    ...cat,
    totalRevenue: Math.round(cat.totalRevenue * 100) / 100
  }));
  
  return {
    totalRevenue: Math.round(grandTotalRevenue * 100) / 100,
    totalBills,
    totalServices,
    paidBills,
    unpaidBills,
    partiallyPaidBills,
    averageBillAmount,
    serviceAnalytics,
    categoryAnalytics
  };
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Check and create admin account
  const existingAdmin = await prisma.account.findFirst({
    where: { role: 'admin' }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'Adminpass123!', 10);
    
    const admin = await prisma.account.create({
      data: {
        firstName: 'System',
        lastName: 'Administrator',
        middleName: 'N/A',
        email: process.env.ADMIN_EMAIL || 'admin@gmail.com',
        password: hashedPassword,
        role: 'admin',
        status: 'activated',
      }
    });

    console.log('✅ Admin account created:', admin.email);
    console.log('⚠️  Default password:', process.env.ADMIN_DEFAULT_PASSWORD || 'Adminpass123!');
    console.log('🔐 Please change the password after first login!');
  } else {
    console.log('✅ Admin account already exists:', existingAdmin.email);
  }

  // Create doctors if they don't exist
  console.log('\n🏥 Creating doctors...');
  let createdCount = 0;
  let skippedCount = 0;

  for (const doctor of doctorsList) {
    const existingDoctor = await prisma.doctors.findFirst({
      where: {
        firstName: doctor.firstName,
        lastName: doctor.lastName,
      }
    });

    if (existingDoctor) {
      skippedCount++;
    } else {
      await prisma.doctors.create({
        data: {
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          middleInitial: doctor.middleInitial,
        }
      });
      createdCount++;
    }
  }

  console.log(`📊 Doctors Summary: ${createdCount} created, ${skippedCount} skipped`);

  // Create medical services
  await createServicesIfNotExist();

  // Generate comprehensive analytics
  const analyticsResults = await generateComprehensiveAnalytics();

  console.log('\n🎯 SEED COMPLETE SUMMARY:');
  console.log(`   👨‍⚕️  Doctors: ${createdCount} created`);
  console.log(`   🩺 Services: ${medicalServices.length} total`);
  console.log(`   📈 Service Analytics: ${analyticsResults.serviceRecords} records`);
  console.log(`   📂 Category Analytics: ${analyticsResults.categoryRecords} records`);
  console.log(`   💰 2 years of comprehensive analytics data ready!`);
  console.log('\n🚀 Your analytics dashboard now has rich historical data!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });