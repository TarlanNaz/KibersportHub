import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today'

    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    const transactions = await db.financialTransaction.findMany({
      where: {
        createdAt: { gte: startDate },
        type: { in: ['BOOKING', 'SALE'] }
      }
    })

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0)
    const bookingRevenue = transactions
      .filter(t => t.type === 'BOOKING')
      .reduce((sum, t) => sum + t.amount, 0)
    const salesRevenue = transactions
      .filter(t => t.type === 'SALE')
      .reduce((sum, t) => sum + t.amount, 0)

    const activeBookings = await db.booking.findMany({
      where: { status: 'ACTIVE' },
      include: { spot: true, customer: true }
    })

    const spots = await db.gamingSpot.findMany({
      include: {
        bookings: {
          where: { status: 'ACTIVE' }
        }
      }
    })

    const availableSpots = spots.filter(s => s.status === 'AVAILABLE').length
    const occupiedSpots = spots.filter(s => s.status === 'OCCUPIED').length
    const maintenanceSpots = spots.filter(s => s.status === 'MAINTENANCE').length

    const spotsByType = await db.gamingSpot.groupBy({
      by: ['spotType'],
      _count: { id: true }
    })

    const popularProducts = await db.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    })

    const productDetails = await Promise.all(
      popularProducts.map(async (item) => {
        const product = await db.product.findUnique({
          where: { id: item.productId }
        })
        return {
          ...product,
          soldQuantity: item._sum.quantity
        }
      })
    )

    const newCustomers = await db.customer.count({
      where: { createdAt: { gte: startDate } }
    })

    return NextResponse.json({
      period,
      revenue: {
        total: totalRevenue,
        bookings: bookingRevenue,
        sales: salesRevenue,
      },
      spots: {
        total: spots.length,
        available: availableSpots,
        occupied: occupiedSpots,
        maintenance: maintenanceSpots,
        occupancyRate: spots.length > 0 ? (occupiedSpots / spots.length * 100).toFixed(1) : '0',
        byType: spotsByType
      },
      bookings: {
        active: activeBookings.length,
        list: activeBookings.slice(0, 10)
      },
      products: {
        popular: productDetails.filter(p => p !== null)
      },
      customers: {
        new: newCustomers
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
