import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config({ override: true });

const url = process.env.DATABASE_URL ?? '';
const isRemote = !url.includes('localhost') && !url.includes('127.0.0.1');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const madrid = await prisma.city.upsert({
    where: { slug: 'madrid' },
    update: {},
    create: { name: 'Madrid', slug: 'madrid' },
  });

  await prisma.city.upsert({
    where: { slug: 'barcelona' },
    update: {},
    create: { name: 'Barcelona', slug: 'barcelona' },
  });

  const laRiviera = await prisma.venue.upsert({
    where: { id: 'venue-la-riviera' },
    update: {},
    create: {
      id: 'venue-la-riviera',
      name: 'La Riviera',
      address: 'Paseo Bajo de la Virgen del Puerto, s/n, 28005 Madrid',
      cityId: madrid.id,
    },
  });

  const salaClamores = await prisma.venue.upsert({
    where: { id: 'venue-sala-clamores' },
    update: {},
    create: {
      id: 'venue-sala-clamores',
      name: 'Sala Clamores',
      address: 'C. de Alburquerque, 14, 28010 Madrid',
      cityId: madrid.id,
    },
  });

  const laPaqui = await prisma.venue.upsert({
    where: { id: 'venue-la-paqui' },
    update: {},
    create: {
      id: 'venue-la-paqui',
      name: 'La Paqui',
      address: 'C. del Amparo, 80, 28012 Madrid',
      cityId: madrid.id,
    },
  });

  await prisma.meetingPoint.upsert({
    where: { id: 'mp-riviera-1' },
    update: {},
    create: { id: 'mp-riviera-1', name: 'Acceso principal', venueId: laRiviera.id },
  });
  await prisma.meetingPoint.upsert({
    where: { id: 'mp-riviera-2' },
    update: {},
    create: { id: 'mp-riviera-2', name: 'Bar cercano (La Bocana)', venueId: laRiviera.id },
  });
  await prisma.meetingPoint.upsert({
    where: { id: 'mp-riviera-3' },
    update: {},
    create: {
      id: 'mp-riviera-3',
      name: 'Parada de metro Puerta del Ángel',
      venueId: laRiviera.id,
    },
  });

  await prisma.meetingPoint.upsert({
    where: { id: 'mp-clamores-1' },
    update: {},
    create: { id: 'mp-clamores-1', name: 'Puerta principal', venueId: salaClamores.id },
  });
  await prisma.meetingPoint.upsert({
    where: { id: 'mp-clamores-2' },
    update: {},
    create: { id: 'mp-clamores-2', name: 'Bar de la esquina', venueId: salaClamores.id },
  });

  await prisma.meetingPoint.upsert({
    where: { id: 'mp-paqui-1' },
    update: {},
    create: { id: 'mp-paqui-1', name: 'Entrada principal', venueId: laPaqui.id },
  });
  await prisma.meetingPoint.upsert({
    where: { id: 'mp-paqui-2' },
    update: {},
    create: { id: 'mp-paqui-2', name: 'Terraza del bar', venueId: laPaqui.id },
  });

  const now = new Date();
  const concerts = [
    {
      id: 'concert-1',
      title: 'The Tallest Man on Earth',
      artistName: 'The Tallest Man on Earth',
      genre: 'indie folk',
      venueId: laRiviera.id,
      date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      doorsOpenTime: '20:00',
      isPublished: true,
      imageUrl: 'https://picsum.photos/seed/tallestman/600/400',
    },
    {
      id: 'concert-2',
      title: 'Sturgill Simpson',
      artistName: 'Sturgill Simpson',
      genre: 'country rock',
      venueId: salaClamores.id,
      date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      doorsOpenTime: '21:00',
      isPublished: true,
      imageUrl: 'https://picsum.photos/seed/sturgill/600/400',
    },
    {
      id: 'concert-3',
      title: 'Japanese Breakfast',
      artistName: 'Japanese Breakfast',
      genre: 'noise pop',
      venueId: laRiviera.id,
      date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      doorsOpenTime: '20:30',
      isPublished: true,
      imageUrl: 'https://picsum.photos/seed/japbreak/600/400',
    },
    {
      id: 'concert-4',
      title: 'Jeffrey Lewis',
      artistName: 'Jeffrey Lewis',
      genre: 'anti-folk',
      venueId: laPaqui.id,
      date: new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000),
      doorsOpenTime: '21:30',
      isPublished: true,
      imageUrl: 'https://picsum.photos/seed/jeffrey/600/400',
    },
    {
      id: 'concert-5',
      title: 'Fleet Foxes',
      artistName: 'Fleet Foxes',
      genre: 'folk rock',
      venueId: laRiviera.id,
      date: new Date(now.getTime() + 55 * 24 * 60 * 60 * 1000),
      doorsOpenTime: '20:00',
      isPublished: true,
      imageUrl: 'https://picsum.photos/seed/fleetfoxes/600/400',
    },
  ];

  for (const concert of concerts) {
    await prisma.concert.upsert({
      where: { id: concert.id },
      update: { imageUrl: concert.imageUrl },
      create: concert,
    });
  }

  const adminHash = await bcrypt.hash('Admin1234!', 10);
  const userHash = await bcrypt.hash('Test1234!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@gigtogether.com' },
    update: {},
    create: {
      email: 'admin@gigtogether.com',
      passwordHash: adminHash,
      alias: 'Admin',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'javier@test.com' },
    update: {},
    create: {
      email: 'javier@test.com',
      passwordHash: userHash,
      alias: 'Javier',
      role: 'USER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'lucia@test.com' },
    update: {},
    create: {
      email: 'lucia@test.com',
      passwordHash: userHash,
      alias: 'Lucía',
      role: 'USER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'marcos@test.com' },
    update: {},
    create: {
      email: 'marcos@test.com',
      passwordHash: userHash,
      alias: 'Marcos',
      role: 'USER',
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
