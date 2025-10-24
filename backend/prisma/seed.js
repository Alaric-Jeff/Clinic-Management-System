import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

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

  console.log(`\n📊 Seed Summary: ${createdCount} doctors created, ${skippedCount} skipped`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });