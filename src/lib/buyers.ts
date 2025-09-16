import { db } from '@/db'
import * as schema from '@/db/schema'
import { eq, desc, asc, like, and, or, count } from 'drizzle-orm'
import type { BuyerFilters, CreateBuyerData, UpdateBuyerData } from './validations'

export async function getBuyers(filters: BuyerFilters) {
  const { page, search, city, propertyType, status, timeline, sortBy, sortOrder } = filters
  const pageSize = 10
  const offset = (page - 1) * pageSize

  // Build where conditions
  const whereConditions = []

  if (search) {
    whereConditions.push(
      or(
        like(schema.buyers.fullName, `%${search}%`),
        like(schema.buyers.phone, `%${search}%`),
        like(schema.buyers.email, `%${search}%`)
      )
    )
  }

  if (city) {
    whereConditions.push(eq(schema.buyers.city, city))
  }

  if (propertyType) {
    whereConditions.push(eq(schema.buyers.propertyType, propertyType))
  }

  if (status) {
    whereConditions.push(eq(schema.buyers.status, status))
  }

  if (timeline) {
    whereConditions.push(eq(schema.buyers.timeline, timeline))
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

  // Build sort clause
  let sortColumn
  switch (sortBy) {
    case 'fullName':
      sortColumn = schema.buyers.fullName
      break
    case 'createdAt':
      sortColumn = schema.buyers.createdAt
      break
    default:
      sortColumn = schema.buyers.updatedAt
  }
  const orderFn = sortOrder === 'asc' ? asc : desc

  // Get total count
  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(schema.buyers)
    .where(whereClause)

  // Get buyers with user information
  const buyers = await db
    .select({
      id: schema.buyers.id,
      fullName: schema.buyers.fullName,
      email: schema.buyers.email,
      phone: schema.buyers.phone,
      city: schema.buyers.city,
      propertyType: schema.buyers.propertyType,
      bhk: schema.buyers.bhk,
      purpose: schema.buyers.purpose,
      budgetMin: schema.buyers.budgetMin,
      budgetMax: schema.buyers.budgetMax,
      timeline: schema.buyers.timeline,
      source: schema.buyers.source,
      status: schema.buyers.status,
      notes: schema.buyers.notes,
      tags: schema.buyers.tags,
      ownerId: schema.buyers.ownerId,
      createdAt: schema.buyers.createdAt,
      updatedAt: schema.buyers.updatedAt,
      ownerName: schema.users.name,
      ownerEmail: schema.users.email,
    })
    .from(schema.buyers)
    .leftJoin(schema.users, eq(schema.buyers.ownerId, schema.users.id))
    .where(whereClause)
    .orderBy(orderFn(sortColumn))
    .limit(pageSize)
    .offset(offset)

  const totalPages = Math.ceil(totalCount / pageSize)

  return {
    buyers: buyers.map(buyer => ({
      ...buyer,
      tags: buyer.tags ? JSON.parse(buyer.tags) : [],
    })),
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    }
  }
}

export async function getBuyer(id: string, userId?: string) {
  const [buyer] = await db
    .select()
    .from(schema.buyers)
    .where(eq(schema.buyers.id, id))
    .limit(1)

  if (!buyer) {
    return null
  }

  // Check ownership if userId provided
  if (userId && buyer.ownerId !== userId) {
    throw new Error('Unauthorized: You can only view your own buyers')
  }

  return {
    ...buyer,
    tags: buyer.tags ? JSON.parse(buyer.tags) : [],
  }
}

export async function createBuyer(data: CreateBuyerData, userId: string) {
  const buyerData = {
    ...data,
    tags: JSON.stringify(data.tags || []),
    ownerId: userId,
  }

  const [newBuyer] = await db.insert(schema.buyers).values(buyerData).returning()

  // Create history entry
  await db.insert(schema.buyerHistory).values({
    buyerId: newBuyer.id,
    changedBy: userId,
    diff: JSON.stringify({ action: 'created', data: buyerData }),
  })

  return {
    ...newBuyer,
    tags: newBuyer.tags ? JSON.parse(newBuyer.tags) : [],
  }
}

export async function updateBuyer(id: string, data: UpdateBuyerData, userId: string) {
  // Get current buyer
  const currentBuyer = await getBuyer(id, userId)
  if (!currentBuyer) {
    throw new Error('Buyer not found')
  }

  // Check for optimistic concurrency if updatedAt is provided
  if (data.updatedAt && currentBuyer.updatedAt.getTime() !== data.updatedAt * 1000) {
    throw new Error('Record has been modified by another user. Please refresh and try again.')
  }

  const { updatedAt: _, ...updateData } = data
  const updatePayload = {
    ...updateData,
    tags: updateData.tags ? JSON.stringify(updateData.tags) : undefined,
    updatedAt: new Date(),
  }

  const [updatedBuyer] = await db
    .update(schema.buyers)
    .set(updatePayload)
    .where(eq(schema.buyers.id, id))
    .returning()

  // Create history entry with diff
  const diff = Object.entries(updatePayload).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== (currentBuyer as any)[key]) {
      acc[key] = { from: (currentBuyer as any)[key], to: value }
    }
    return acc
  }, {} as any)

  if (Object.keys(diff).length > 0) {
    await db.insert(schema.buyerHistory).values({
      buyerId: id,
      changedBy: userId,
      diff: JSON.stringify(diff),
    })
  }

  return {
    ...updatedBuyer,
    tags: updatedBuyer.tags ? JSON.parse(updatedBuyer.tags) : [],
  }
}

export async function deleteBuyer(id: string, userId: string) {
  const buyer = await getBuyer(id, userId)
  if (!buyer) {
    throw new Error('Buyer not found')
  }

  await db.delete(schema.buyers).where(eq(schema.buyers.id, id))

  return { success: true }
}

export async function getBuyerHistory(buyerId: string, userId?: string, limit: number = 5) {
  // Check if user has access to this buyer
  if (userId) {
    const buyer = await getBuyer(buyerId, userId)
    if (!buyer) {
      throw new Error('Unauthorized or buyer not found')
    }
  }

  const history = await db
    .select({
      id: schema.buyerHistory.id,
      changedBy: schema.buyerHistory.changedBy,
      changedAt: schema.buyerHistory.changedAt,
      diff: schema.buyerHistory.diff,
      changedByName: schema.users.name,
      changedByEmail: schema.users.email,
    })
    .from(schema.buyerHistory)
    .leftJoin(schema.users, eq(schema.buyerHistory.changedBy, schema.users.id))
    .where(eq(schema.buyerHistory.buyerId, buyerId))
    .orderBy(desc(schema.buyerHistory.changedAt))
    .limit(limit)

  return history.map(entry => ({
    ...entry,
    diff: JSON.parse(entry.diff),
  }))
}