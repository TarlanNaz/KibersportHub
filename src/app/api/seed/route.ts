import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Создаём тарифы
    const tariffs = await Promise.all([
      db.tariff.create({
        data: {
          name: 'Стандарт',
          description: 'Обычный тариф',
          multiplier: 1.0,
          discount: 0,
          minHours: 1,
        }
      }),
      db.tariff.create({
        data: {
          name: 'Ночной',
          description: 'С 22:00 до 08:00',
          multiplier: 1.0,
          discount: 30,
          startTime: '22:00',
          endTime: '08:00',
          minHours: 3,
        }
      }),
      db.tariff.create({
        data: {
          name: 'VIP',
          description: 'VIP зал с улучшенным оборудованием',
          multiplier: 1.5,
          discount: 0,
          minHours: 2,
        }
      }),
      db.tariff.create({
        data: {
          name: 'Тренировочный',
          description: 'Для командных тренировок',
          multiplier: 0.8,
          discount: 20,
          minHours: 4,
        }
      }),
      db.tariff.create({
        data: {
          name: 'Студенческий',
          description: 'Скидка для студентов по будням',
          multiplier: 1.0,
          discount: 25,
          minHours: 1,
        }
      }),
    ])

    // Создаём игровые места
    const spots = []
    for (let i = 1; i <= 20; i++) {
      const spotType = i <= 15 ? 'PC' : i <= 18 ? 'CONSOLE' : i <= 19 ? 'VR' : 'STREAMING'
      const hourlyRate = spotType === 'PC' ? 150 : spotType === 'CONSOLE' ? 200 : spotType === 'VR' ? 350 : 300
      spots.push(
        db.gamingSpot.create({
          data: {
            name: spotType === 'PC' ? `PC-${String(i).padStart(2, '0')}` :
                  spotType === 'CONSOLE' ? `PS5-${String(i - 15).padStart(2, '0')}` :
                  spotType === 'VR' ? 'VR-01' : 'STR-01',
            spotType,
            status: 'AVAILABLE',
            specs: spotType === 'PC' ? 'RTX 4070, 32GB RAM, i7-13700K, 240Hz Monitor' :
                   spotType === 'CONSOLE' ? 'PlayStation 5, 4K TV 65"' :
                   spotType === 'VR' ? 'Valve Index, RTX 4080' :
                   'Dual PC Setup, RTX 4090, Professional Audio',
            hourlyRate,
            position: i,
          }
        })
      )
    }
    await Promise.all(spots)

    // Создаём товары
    const products = await Promise.all([
      db.product.create({
        data: { name: 'Кола 0.5л', category: 'DRINKS', price: 100, costPrice: 40, stock: 50 }
      }),
      db.product.create({
        data: { name: 'Энергетик 0.5л', category: 'DRINKS', price: 150, costPrice: 70, stock: 30 }
      }),
      db.product.create({
        data: { name: 'Пицца Маргарита', category: 'FOOD', price: 350, costPrice: 180, stock: 10 }
      }),
      db.product.create({
        data: { name: 'Бургер', category: 'FOOD', price: 280, costPrice: 120, stock: 15 }
      }),
      db.product.create({
        data: { name: 'Картофель фри', category: 'FOOD', price: 150, costPrice: 50, stock: 20 }
      }),
      db.product.create({
        data: { name: 'Футболка клуба', category: 'MERCH', price: 1500, costPrice: 600, stock: 25 }
      }),
      db.product.create({
        data: { name: 'Кепка', category: 'MERCH', price: 800, costPrice: 300, stock: 30 }
      }),
      db.product.create({
        data: { name: 'Игровая мышь', category: 'ACCESSORIES', price: 2500, costPrice: 1500, stock: 10 }
      }),
    ])

    // Создаём программы лояльности
    const loyaltyPrograms = await Promise.all([
      db.loyaltyProgram.create({
        data: {
          name: 'Бронза',
          minSpent: 0,
          cashbackPercent: 3,
          discountPercent: 0,
          benefits: '3% кэшбэк на все покупки'
        }
      }),
      db.loyaltyProgram.create({
        data: {
          name: 'Серебро',
          minSpent: 5000,
          cashbackPercent: 5,
          discountPercent: 5,
          benefits: '5% кэшбэк, 5% скидка на игровое время'
        }
      }),
      db.loyaltyProgram.create({
        data: {
          name: 'Золото',
          minSpent: 15000,
          cashbackPercent: 7,
          discountPercent: 10,
          benefits: '7% кэшбэк, 10% скидка, приоритетное бронирование'
        }
      }),
      db.loyaltyProgram.create({
        data: {
          name: 'Платина',
          minSpent: 30000,
          cashbackPercent: 10,
          discountPercent: 15,
          benefits: '10% кэшбэк, 15% скидка, VIP комната, личный менеджер'
        }
      }),
    ])

    // Создаём тестовых клиентов
    const customers = await Promise.all([
      db.customer.create({
        data: {
          name: 'Иван Петров',
          phone: '+79001234567',
          email: 'ivan@mail.ru',
          nickname: 'ProGamer_2000',
          balance: 500,
          totalSpent: 12500,
          visitsCount: 15
        }
      }),
      db.customer.create({
        data: {
          name: 'Алексей Смирнов',
          phone: '+79002345678',
          email: 'alex@yandex.ru',
          nickname: 'NightOwl',
          balance: 1200,
          totalSpent: 28000,
          visitsCount: 42
        }
      }),
      db.customer.create({
        data: {
          name: 'Мария Козлова',
          phone: '+79003456789',
          email: 'maria@gmail.com',
          nickname: 'LadyDragon',
          balance: 300,
          totalSpent: 4500,
          visitsCount: 8
        }
      }),
    ])

    // Создаём счета лояльности
    await Promise.all([
      db.loyaltyAccount.create({
        data: {
          customerId: customers[0].id,
          programId: loyaltyPrograms[1].id,
          points: 625,
          totalEarned: 625,
        }
      }),
      db.loyaltyAccount.create({
        data: {
          customerId: customers[1].id,
          programId: loyaltyPrograms[2].id,
          points: 1960,
          totalEarned: 1960,
        }
      }),
      db.loyaltyAccount.create({
        data: {
          customerId: customers[2].id,
          programId: loyaltyPrograms[0].id,
          points: 135,
          totalEarned: 135,
        }
      }),
    ])

    // Создаём несколько бронирований
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const pc01 = await db.gamingSpot.findFirst({ where: { name: 'PC-01' } })
    const pc05 = await db.gamingSpot.findFirst({ where: { name: 'PC-05' } })
    const ps01 = await db.gamingSpot.findFirst({ where: { name: 'PS5-01' } })

    if (pc01 && pc05 && ps01) {
      await Promise.all([
        db.booking.create({
          data: {
            spotId: pc01.id,
            customerId: customers[0].id,
            tariffId: tariffs[0].id,
            startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000),
            endTime: new Date(today.getTime() + 14 * 60 * 60 * 1000),
            status: 'ACTIVE',
            baseAmount: 600,
            totalAmount: 600,
          }
        }),
        db.booking.create({
          data: {
            spotId: pc05.id,
            customerId: customers[1].id,
            tariffId: tariffs[1].id,
            startTime: new Date(today.getTime() + 22 * 60 * 60 * 1000),
            endTime: new Date(today.getTime() + 26 * 60 * 60 * 1000),
            status: 'ACTIVE',
            baseAmount: 600,
            discount: 180,
            totalAmount: 420,
          }
        }),
        db.booking.create({
          data: {
            spotId: ps01.id,
            customerId: customers[2].id,
            tariffId: tariffs[3].id,
            startTime: new Date(today.getTime() + 12 * 60 * 60 * 1000),
            endTime: new Date(today.getTime() + 16 * 60 * 60 * 1000),
            status: 'ACTIVE',
            baseAmount: 640,
            discount: 128,
            totalAmount: 512,
          }
        }),
      ])
    }

    // Создаём продажи
    await Promise.all([
      db.sale.create({
        data: {
          customerId: customers[0].id,
          totalAmount: 550,
          finalAmount: 550,
          paymentMethod: 'card',
          items: {
            create: [
              { productId: products[1].id, quantity: 1, price: 150, total: 150 },
              { productId: products[2].id, quantity: 1, price: 350, total: 350 },
              { productId: products[4].id, quantity: 1, price: 150, total: 150 },
            ]
          }
        }
      }),
      db.sale.create({
        data: {
          customerId: customers[1].id,
          totalAmount: 800,
          finalAmount: 800,
          paymentMethod: 'card',
          items: {
            create: [
              { productId: products[0].id, quantity: 2, price: 100, total: 200 },
              { productId: products[3].id, quantity: 2, price: 280, total: 560 },
            ]
          }
        }
      }),
    ])

    return NextResponse.json({ 
      success: true, 
      message: 'База данных успешно заполнена тестовыми данными',
      data: {
        tariffs: tariffs.length,
        spots: spots.length,
        products: products.length,
        loyaltyPrograms: loyaltyPrograms.length,
        customers: customers.length,
      }
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 })
  }
}
