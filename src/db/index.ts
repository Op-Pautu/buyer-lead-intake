import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { join } from 'path'

// Create SQLite database connection
const sqlite = new Database('./dev.db')
export const db = drizzle(sqlite, { schema })

// Run migrations
export function runMigrations() {
  migrate(db, { migrationsFolder: './drizzle' })
}

// Utility function to seed the database with test data
export async function seedDatabase() {
  // Create a test user
  const [testUser] = await db.insert(schema.users).values({
    email: 'test@example.com',
    name: 'Test User',
  }).returning()

  // Create some sample buyers
  const sampleBuyers = [
    {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210',
      city: 'Chandigarh',
      propertyType: 'Apartment',
      bhk: '3',
      purpose: 'Buy',
      budgetMin: 5000000,
      budgetMax: 7000000,
      timeline: '0-3m',
      source: 'Website',
      status: 'New',
      notes: 'Looking for 3BHK in Sector 22',
      tags: JSON.stringify(['urgent', 'verified']),
      ownerId: testUser.id,
    },
    {
      fullName: 'Jane Smith',
      phone: '9876543211',
      city: 'Mohali',
      propertyType: 'Villa',
      bhk: '4',
      purpose: 'Buy',
      budgetMin: 8000000,
      budgetMax: 12000000,
      timeline: '3-6m',
      source: 'Referral',
      status: 'Qualified',
      notes: 'Prefers independent house',
      tags: JSON.stringify(['high-budget']),
      ownerId: testUser.id,
    },
    {
      fullName: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      phone: '9876543212',
      city: 'Zirakpur',
      propertyType: 'Plot',
      purpose: 'Buy',
      budgetMin: 3000000,
      budgetMax: 5000000,
      timeline: '>6m',
      source: 'Walk-in',
      status: 'Contacted',
      notes: 'Looking for investment opportunity',
      tags: JSON.stringify(['investor']),
      ownerId: testUser.id,
    },
  ]

  await db.insert(schema.buyers).values(sampleBuyers)
  
  console.log('Database seeded successfully!')
  return testUser
}