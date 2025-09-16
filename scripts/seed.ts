#!/usr/bin/env tsx
import { seedDatabase } from '../src/db/index'

async function main() {
  try {
    console.log('Seeding database...')
    await seedDatabase()
    console.log('Database seeded successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

main()