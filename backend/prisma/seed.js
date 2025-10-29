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

async function generateServiceDailyAnalytics() {
  console.log('\n📊 Generating service daily analytics (2 years)...');
  
  const services = await prisma.service.findMany();
  if (services.length === 0) {
    console.log('❌ No services found. Please create services first.');
    return 0;
  }

  const today = new Date();
  const monthsToGenerate = 24;
  let serviceRecordsCreated = 0;

  for (let monthOffset = monthsToGenerate; monthOffset > 0; monthOffset--) {
    const monthStart = startOfMonth(subMonths(today, monthOffset));
    const monthEnd = endOfMonth(monthStart);

    // Get or create daily analytics for this month
    let currentDate = new Date(monthStart);
    
    while (currentDate <= monthEnd) {
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Weekdays only
        // Find or create daily sales analytics record
        let dailyAnalytics = await prisma.dailySalesAnalytics.findUnique({
          where: { date: currentDate }
        });

        if (!dailyAnalytics) {
          dailyAnalytics = await prisma.dailySalesAnalytics.create({
            data: {
              date: currentDate,
              totalRevenue: 0,
              totalBills: 0,
              totalServices: 0,
              paidBills: 0,
              unpaidBills: 0,
              partiallyPaidBills: 0,
              averageBillAmount: 0
            }
          });
        }

        // Generate service-level data for this day
        const dailyServiceRecords = await generateDailyServiceData(dailyAnalytics.id, services, currentDate);
        serviceRecordsCreated += dailyServiceRecords;
      }
      
      currentDate = addDays(currentDate, 1);
    }

    console.log(`✅ ${format(monthStart, 'MMM yyyy')}: Service analytics generated`);
  }

  console.log(`🎉 Created ${serviceRecordsCreated} service daily analytics records!`);
  return serviceRecordsCreated;
}

async function generateDailyServiceData(dailyAnalyticsId, services, date) {
  let recordsCreated = 0;
  const dayOfMonth = date.getDate();
  const month = date.getMonth();
  
  // Seasonal factors affecting different services
  const seasonalFactors = {
    // Flu season affects related tests
    9: { 'Complete Blood Count': 1.3, 'Flu Vaccine': 1.8 }, // October
    10: { 'Complete Blood Count': 1.4, 'Flu Vaccine': 2.0 }, // November
    11: { 'Complete Blood Count': 1.2, 'Flu Vaccine': 1.5 }, // December
    0: { 'Complete Blood Count': 1.1, 'Flu Vaccine': 1.2 }, // January
    
    // Summer - more travel vaccines
    5: { 'Hepatitis B Vaccine': 1.3 }, // June
    6: { 'Hepatitis B Vaccine': 1.4 }, // July
    
    // Routine checkup season
    3: { 'Cholesterol Panel': 1.2, 'Blood Glucose Test': 1.3 }, // April
    8: { 'Cholesterol Panel': 1.2, 'Blood Glucose Test': 1.3 }, // September
  };

  for (const service of services) {
    // Base probability of this service being ordered
    let baseProbability = servicePopularity[service.name] || 0.15;
    
    // Apply seasonal factors
    const monthFactors = seasonalFactors[month];
    if (monthFactors && monthFactors[service.name]) {
      baseProbability *= monthFactors[service.name];
    }
    
    // Day-of-week variation (mid-week busier)
    const dayOfWeek = date.getDay();
    const dayFactor = dayOfWeek === 3 ? 1.2 : dayOfWeek === 4 ? 1.1 : 1.0; // Wed/Thu busier
    baseProbability *= dayFactor;

    // Random variation
    const randomFactor = 0.7 + Math.random() * 0.6;
    baseProbability *= randomFactor;

    // Determine if this service was ordered today
    if (Math.random() < baseProbability) {
      // Calculate quantity sold (usually 1, but sometimes multiple for panels)
      let quantity = 1;
      if (service.name.includes('Panel') && Math.random() < 0.3) {
        quantity = Math.floor(1 + Math.random() * 2); // 1-3 for panels
      }

      // Small chance of price variation (discounts or premium)
      const priceVariation = 0.9 + Math.random() * 0.2; // ±10% price variation
      const actualPrice = service.price * priceVariation;
      
      const totalRevenue = quantity * actualPrice;

      // Create service daily analytics record
      await prisma.serviceDailyAnalytics.create({
        data: {
          dailyAnalyticsId: dailyAnalyticsId,
          serviceId: service.id,
          serviceName: service.name,
          serviceCategory: service.category,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          quantitySold: quantity,
          averagePrice: Math.round(actualPrice * 100) / 100
        }
      });

      recordsCreated++;
    }
  }

  return recordsCreated;
}

async function updateDailySalesTotals() {
  console.log('\n🔄 Updating daily sales totals from service data...');
  
  const allDailyRecords = await prisma.dailySalesAnalytics.findMany({
    include: {
      serviceAnalytics: true
    }
  });

  let updatedCount = 0;

  for (const dailyRecord of allDailyRecords) {
    const serviceAnalytics = dailyRecord.serviceAnalytics;
    
    if (serviceAnalytics.length > 0) {
      const totalRevenue = serviceAnalytics.reduce((sum, service) => sum + service.totalRevenue, 0);
      const totalServices = serviceAnalytics.reduce((sum, service) => sum + service.quantitySold, );
      const totalBills = Math.ceil(totalServices / 2.5); // Estimate bills from services
      
      // Update the daily record with calculated totals
      await prisma.dailySalesAnalytics.update({
        where: { id: dailyRecord.id },
        data: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalServices: totalServices,
          totalBills: totalBills,
          paidBills: Math.floor(totalBills * (0.7 + Math.random() * 0.25)),
          unpaidBills: Math.floor(totalBills * 0.1),
          partiallyPaidBills: Math.floor(totalBills * 0.2),
          averageBillAmount: totalBills > 0 ? Math.round((totalRevenue / totalBills) * 100) / 100 : 0
        }
      });
      
      updatedCount++;
    }
  }

  console.log(`✅ Updated ${updatedCount} daily sales records with service-based totals`);
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
    console.log('⚠️  Default password:', process.env.ADMIN_DEFAULT_PASSWORD || 'admin123');
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
      console.log(`⏭️  Dr. ${doctor.firstName} ${doctor.lastName} already exists`);
      skippedCount++;
    } else {
      const newDoctor = await prisma.doctors.create({
        data: {
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          middleInitial: doctor.middleInitial,
        }
      });
      console.log(`✅ Created: Dr. ${newDoctor.firstName} ${newDoctor.lastName}`);
      createdCount++;
    }
  }

  console.log(`\n📊 Doctors Summary: ${createdCount} created, ${skippedCount} skipped`);

  // Create medical services
  await createServicesIfNotExist();

  // Generate service daily analytics
  const serviceRecordsCreated = await generateServiceDailyAnalytics();

  // Update daily sales totals based on service data
  await updateDailySalesTotals();

  console.log('\n🎯 SEED COMPLETE SUMMARY:');
  console.log(`   👨‍⚕️  Doctors: ${createdCount} created, ${skippedCount} skipped`);
  console.log(`   🩺 Services: ${medicalServices.length} medical services`);
  console.log(`   📈 Service Analytics: ${serviceRecordsCreated} daily service records`);
  console.log(`   💰 2 years of detailed service performance data now available!`);
  console.log('\n🚀 Your service forecasting API now has rich data to work with!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });