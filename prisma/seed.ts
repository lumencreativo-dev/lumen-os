import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============ USUARIOS ============
  const hashedPassword1 = await bcrypt.hash('lumen2026', 10);
  const hashedPassword2 = await bcrypt.hash('lumen2026', 10);

  const kevin = await prisma.user.upsert({
    where: { email: 'kevin@lumencreativo.lat' },
    update: {},
    create: {
      name: 'Kevin Flores',
      email: 'kevin@lumencreativo.lat',
      password: hashedPassword1,
      role: 'ADMIN',
      location: 'Venezuela',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lumencreativo.lat' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@lumencreativo.lat',
      password: hashedPassword2,
      role: 'ADMIN',
      location: 'Venezuela',
    },
  });

  console.log('✅ Usuarios creados:', kevin.name, admin.name);

  // ============ PIPELINES ============
  const prospectos = await prisma.pipeline.create({
    data: {
      name: 'Prospectos',
      description: 'Pipeline principal para nuevos leads',
      color: 'blue',
      isDefault: true,
      order: 0,
      columns: {
        create: [
          { name: 'Nuevo', color: 'gray', order: 0 },
          { name: 'Contactado', color: 'blue', order: 1 },
          { name: 'Propuesta Enviada', color: 'purple', order: 2 },
          { name: 'En Negociación', color: 'yellow', order: 3 },
          { name: 'Cerrado Ganado', color: 'green', order: 4 },
          { name: 'Cerrado Perdido', color: 'red', order: 5 },
        ],
      },
    },
    include: { columns: true },
  });

  await prisma.pipeline.create({
    data: {
      name: 'Clientes Activos',
      description: 'Gestión de clientes con proyectos activos',
      color: 'green',
      isDefault: false,
      order: 1,
      columns: {
        create: [
          { name: 'Onboarding', color: 'blue', order: 0 },
          { name: 'En Proyecto', color: 'purple', order: 1 },
          { name: 'En Entrega', color: 'yellow', order: 2 },
          { name: 'Satisfecho', color: 'green', order: 3 },
        ],
      },
    },
  });

  await prisma.pipeline.create({
    data: {
      name: 'En Pausa',
      description: 'Leads o clientes pausados temporalmente',
      color: 'orange',
      isDefault: false,
      order: 2,
      columns: {
        create: [
          { name: 'Pausa Temporal', color: 'yellow', order: 0 },
          { name: 'Sin Presupuesto', color: 'orange', order: 1 },
          { name: 'Para Reactivar', color: 'blue', order: 2 },
          { name: 'Descartado', color: 'gray', order: 3 },
        ],
      },
    },
  });

  console.log('✅ Pipelines creados');

  // ============ LEADS DE EJEMPLO ============
  const nuevoColumn = prospectos.columns.find(c => c.name === 'Nuevo');
  const contactadoColumn = prospectos.columns.find(c => c.name === 'Contactado');
  const negociacionColumn = prospectos.columns.find(c => c.name === 'En Negociación');

  await prisma.lead.createMany({
    data: [
      {
        name: 'LEAD-2026-001',
        leadName: 'Colegio San Ignacio',
        title: 'Renovación Web',
        phone: '+58 412 123 4567',
        email: 'contacto@sanignacio.edu.ve',
        status: 'Lead',
        pipelineId: prospectos.id,
        columnId: nuevoColumn?.id,
        source: 'website',
      },
      {
        name: 'LEAD-2026-002',
        leadName: 'Parroquia La Ascensión',
        title: 'Redes Sociales',
        phone: '+58 414 987 6543',
        email: 'parroquia@ascension.org',
        status: 'Open',
        pipelineId: prospectos.id,
        columnId: contactadoColumn?.id,
        source: 'referral',
      },
      {
        name: 'LEAD-2026-003',
        leadName: 'Fundación Cáritas',
        title: 'Campaña Anual',
        phone: '+58 424 555 5555',
        email: 'director@caritas.org',
        status: 'Opportunity',
        pipelineId: prospectos.id,
        columnId: negociacionColumn?.id,
        source: 'social',
        value: 500,
      },
    ],
  });

  console.log('✅ Leads de ejemplo creados');

  // ============ CLIENTE DE EJEMPLO ============
  await prisma.client.create({
    data: {
      name: 'Congregación Santa María',
      email: 'contacto@santamaria.org',
      phone: '+58 412 000 0000',
      instagram: 'congregacion.santamaria',
      industry: 'Religioso',
      contactPerson: 'Hna. María del Carmen',
      paymentDay: '15',
    },
  });

  console.log('✅ Cliente de ejemplo creado');

  // ============ ENTREGABLE DE EJEMPLO ============
  await prisma.deliverable.create({
    data: {
      title: 'Brand Kit Refresh - V1',
      type: 'IMAGE',
      url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
      status: 'APPROVED',
      priority: 'HIGH',
      currentVersion: 1,
      clientName: 'Congregación Santa María',
      approvedAt: new Date(),
    },
  });

  await prisma.deliverable.create({
    data: {
      title: 'Campaña Vocacional - Reels',
      type: 'VIDEO',
      url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      status: 'PENDING',
      priority: 'URGENT',
      currentVersion: 2,
      clientName: 'Seminario Mayor',
    },
  });

  console.log('✅ Entregables de ejemplo creados');

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
