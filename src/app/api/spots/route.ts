import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (type) where.spotType = type

    const spots = await db.gamingSpot.findMany({
      where,
      include: {
        bookings: {
          where: { status: 'ACTIVE' },
          include: { customer: true, tariff: true }
        }
      },
      orderBy: { position: 'asc' }
    })

    return NextResponse.json(spots)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const spot = await db.gamingSpot.create({
      data: {
        name: data.name,
        spotType: data.spotType || 'PC',
        status: data.status || 'AVAILABLE',
        specs: data.specs,
        hourlyRate: data.hourlyRate || 150,
        position: data.position || 0,
      }
    })
    return NextResponse.json(spot)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const spot = await db.gamingSpot.update({
      where: { id: data.id },
      data: {
        name: data.name,
        spotType: data.spotType,
        status: data.status,
        specs: data.specs,
        hourlyRate: data.hourlyRate,
      }
    })
    return NextResponse.json(spot)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await db.gamingSpot.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
