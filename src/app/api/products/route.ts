import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where: Record<string, unknown> = { isActive: true }
    if (category) where.category = category

    const products = await db.product.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    })

    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const product = await db.product.create({
      data: {
        name: data.name,
        category: data.category || 'FOOD',
        price: data.price,
        costPrice: data.costPrice || 0,
        stock: data.stock || 0,
        imageUrl: data.imageUrl,
      }
    })
    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const product = await db.product.update({
      where: { id: data.id },
      data: {
        name: data.name,
        category: data.category,
        price: data.price,
        costPrice: data.costPrice,
        stock: data.stock,
        imageUrl: data.imageUrl,
        isActive: data.isActive,
      }
    })
    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
