import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const spotId = searchParams.get('spotId')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (spotId) where.spotId = spotId
    if (date) {
      const start = new Date(date)
      const end = new Date(date)
      end.setDate(end.getDate() + 1)
      where.startTime = { gte: start, lt: end }
    }

    const bookings = await db.booking.findMany({
      where,
      include: {
        spot: true,
        customer: true,
        tariff: true,
      },
      orderBy: { startTime: 'asc' }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const spot = await db.gamingSpot.findUnique({
      where: { id: data.spotId }
    })
    if (!spot) {
      return NextResponse.json({ error: 'Место не найдено' }, { status: 404 })
    }

    let tariff = null
    if (data.tariffId) {
      tariff = await db.tariff.findUnique({ where: { id: data.tariffId } })
    }

    const startTime = new Date(data.startTime)
    const endTime = new Date(data.endTime)
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    
    let baseAmount = spot.hourlyRate * hours
    if (tariff) {
      baseAmount *= tariff.multiplier
    }
    
    let discount = 0
    if (tariff && tariff.discount > 0) {
      discount = baseAmount * (tariff.discount / 100)
    }

    const totalAmount = baseAmount - discount

    const booking = await db.booking.create({
      data: {
        spotId: data.spotId,
        customerId: data.customerId || null,
        tariffId: data.tariffId || null,
        startTime,
        endTime,
        status: 'ACTIVE',
        baseAmount,
        discount,
        totalAmount,
        notes: data.notes,
      },
      include: {
        spot: true,
        customer: true,
        tariff: true,
      }
    })

    await db.gamingSpot.update({
      where: { id: data.spotId },
      data: { status: 'OCCUPIED' }
    })

    if (data.customerId) {
      await db.customer.update({
        where: { id: data.customerId },
        data: {
          totalSpent: { increment: totalAmount },
          visitsCount: { increment: 1 }
        }
      })
    }

    await db.financialTransaction.create({
      data: {
        type: 'BOOKING',
        amount: totalAmount,
        description: `Бронирование ${spot.name}`,
        referenceId: booking.id,
      }
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const booking = await db.booking.update({
      where: { id: data.id },
      data: {
        status: data.status,
      },
      include: { spot: true }
    })

    if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
      await db.gamingSpot.update({
        where: { id: booking.spotId },
        data: { status: 'AVAILABLE' }
      })
    }

    return NextResponse.json(booking)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
