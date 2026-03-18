import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    const where: Record<string, unknown> = {}
    if (date) {
      const start = new Date(date)
      const end = new Date(date)
      end.setDate(end.getDate() + 1)
      where.createdAt = { gte: start, lt: end }
    }

    const sales = await db.sale.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(sales)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    let totalAmount = 0
    const items = data.items.map((item: { productId: string; price: number; quantity: number }) => {
      const total = item.price * item.quantity
      totalAmount += total
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total,
      }
    })

    const discount = data.discount || 0
    const finalAmount = totalAmount - discount

    const sale = await db.sale.create({
      data: {
        customerId: data.customerId || null,
        totalAmount,
        discount,
        finalAmount,
        paymentMethod: data.paymentMethod || 'cash',
        notes: data.notes,
        items: {
          create: items
        }
      },
      include: {
        items: { include: { product: true } }
      }
    })

    for (const item of data.items) {
      await db.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      })
    }

    if (data.customerId) {
      await db.customer.update({
        where: { id: data.customerId },
        data: { totalSpent: { increment: finalAmount } }
      })

      const customer = await db.customer.findUnique({
        where: { id: data.customerId },
        include: { loyaltyAccount: { include: { program: true } } }
      })
      
      if (customer?.loyaltyAccount) {
        const cashback = finalAmount * (customer.loyaltyAccount.program.cashbackPercent / 100)
        await db.loyaltyAccount.update({
          where: { id: customer.loyaltyAccount.id },
          data: {
            points: { increment: cashback },
            totalEarned: { increment: cashback }
          }
        })
      }
    }

    await db.financialTransaction.create({
      data: {
        type: 'SALE',
        amount: finalAmount,
        description: `Продажа товаров`,
        referenceId: sale.id,
      }
    })

    return NextResponse.json(sale)
  } catch (error) {
    console.error('Sale error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
