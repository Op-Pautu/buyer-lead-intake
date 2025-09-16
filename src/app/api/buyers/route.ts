import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createBuyer, getBuyers } from '@/lib/buyers'
import { createBuyerSchema, buyerFiltersSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = buyerFiltersSchema.parse({
      page: searchParams.get('page'),
      search: searchParams.get('search'),
      city: searchParams.get('city'),
      propertyType: searchParams.get('propertyType'),
      status: searchParams.get('status'),
      timeline: searchParams.get('timeline'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    })

    const result = await getBuyers(filters)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching buyers:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createBuyerSchema.parse(body)

    const buyer = await createBuyer(validatedData, session.user.id)
    
    return NextResponse.json(buyer, { status: 201 })
  } catch (error) {
    console.error('Error creating buyer:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}