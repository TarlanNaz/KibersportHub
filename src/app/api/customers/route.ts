import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { nickname: { contains: search } },
      ]
    }

    const customers = await db.customer.findMany({
      where,
      include: {
        loyaltyAccount: {
          include: { program: true }
        },
        _count: { select: { bookings: true, sales: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(customers)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const customer = await db.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        nickname: data.nickname,
        balance: data.balance || 0,
      }
    })

    const bronzeProgram = await db.loyaltyProgram.findFirst({
      where: { name: 'Бронза' }
    })
    
    if (bronzeProgram) {
      await db.loyaltyAccount.create({
        data: {
          customerId: customer.id,
          programId: bronzeProgram.id,
        }
      })
    }

    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const customer = await db.customer.update({
      where: { id: data.id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        nickname: data.nickname,
        balance: data.balance,
      }
    })
    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
