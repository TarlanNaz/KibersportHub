import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const programs = await db.loyaltyProgram.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { accounts: true } }
      },
      orderBy: { minSpent: 'asc' }
    })
    return NextResponse.json(programs)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const customer = await db.customer.findUnique({
      where: { id: data.customerId },
      include: { loyaltyAccount: true }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }

    const programs = await db.loyaltyProgram.findMany({
      where: { isActive: true },
      orderBy: { minSpent: 'desc' }
    })

    const newProgram = programs.find(p => customer.totalSpent >= p.minSpent)
    
    if (!newProgram) {
      return NextResponse.json({ error: 'Программа не найдена' }, { status: 404 })
    }

    if (customer.loyaltyAccount) {
      await db.loyaltyAccount.update({
        where: { customerId: data.customerId },
        data: { programId: newProgram.id }
      })
    } else {
      await db.loyaltyAccount.create({
        data: {
          customerId: data.customerId,
          programId: newProgram.id
        }
      })
    }

    return NextResponse.json({ success: true, newLevel: newProgram.name })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
