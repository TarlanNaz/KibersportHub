import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const tariffs = await db.tariff.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(tariffs)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const tariff = await db.tariff.create({
      data: {
        name: data.name,
        description: data.description,
        multiplier: data.multiplier || 1.0,
        discount: data.discount || 0,
        startTime: data.startTime,
        endTime: data.endTime,
        minHours: data.minHours || 1,
        maxHours: data.maxHours,
        isActive: data.isActive ?? true,
      }
    })
    return NextResponse.json(tariff)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const tariff = await db.tariff.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        multiplier: data.multiplier,
        discount: data.discount,
        startTime: data.startTime,
        endTime: data.endTime,
        minHours: data.minHours,
        maxHours: data.maxHours,
        isActive: data.isActive,
      }
    })
    return NextResponse.json(tariff)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const tariff = await db.tariff.update({
      where: { id },
      data: { isActive: false }
    })
    return NextResponse.json(tariff)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
