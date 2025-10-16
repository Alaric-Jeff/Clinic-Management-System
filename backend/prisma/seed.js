import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const existingAdmin = await prisma.account.findFirst({
    where: { role: 'admin' }
  });

  if (existingAdmin) {
    console.log('✅ Admin account already exists');
    return;
  }

  const hashedPassword = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'admin123', 10);
  
  const admin = await prisma.account.create({
    data: {
      firstName: 'System',
      lastName: 'Administrator',
      middleName: 'N/A',
      email: process.env.ADMIN_EMAIL || 'admin@clinic.local',
      password: hashedPassword,
      role: 'admin',
      status: 'activated',
    }
  });

  console.log('✅ Admin account created:', admin.email);
  console.log('⚠️  Default password:', process.env.ADMIN_DEFAULT_PASSWORD || 'admin123');
  console.log('🔐 Please change the password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });