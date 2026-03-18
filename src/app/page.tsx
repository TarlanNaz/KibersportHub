'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Monitor, Gamepad2, Headset, Radio, Users, ShoppingCart, 
  Trophy, Clock, DollarSign, TrendingUp, AlertCircle, CheckCircle,
  Play, Square, Search, Plus, CreditCard, Coffee, Shirt, Gift
} from 'lucide-react'

type SpotType = 'PC' | 'CONSOLE' | 'VR' | 'STREAMING'
type SpotStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'

interface GamingSpot {
  id: string
  name: string
  spotType: SpotType
  status: SpotStatus
  specs: string | null
  hourlyRate: number
  bookings: Booking[]
}

interface Tariff {
  id: string
  name: string
  description: string | null
  multiplier: number
  discount: number
  minHours: number
  maxHours: number | null
}

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  nickname: string | null
  balance: number
  totalSpent: number
  visitsCount: number
  loyaltyAccount?: {
    points: number
    program: { name: string; cashbackPercent: number }
  }
}

interface Booking {
  id: string
  spotId: string
  customerId: string | null
  spot?: GamingSpot
  customer?: Customer
  tariff?: Tariff
  startTime: string
  endTime: string
  status: string
  baseAmount: number
  discount: number
  totalAmount: number
}

interface Product {
  id: string
  name: string
  category: 'FOOD' | 'DRINKS' | 'MERCH' | 'ACCESSORIES'
  price: number
  costPrice: number
  stock: number
}

interface DashboardData {
  period: string
  revenue: { total: number; bookings: number; sales: number }
  spots: {
    total: number
    available: number
    occupied: number
    maintenance: number
    occupancyRate: string
    byType: { spotType: string; _count: { id: number } }[]
  }
  bookings: { active: number; list: Booking[] }
  products: { popular: (Product & { soldQuantity: number | null })[] }
  customers: { new: number }
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [spots, setSpots] = useState<GamingSpot[]>([])
  const [tariffs, setTariffs] = useState<Tariff[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [isSeeded, setIsSeeded] = useState(false)

  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', nickname: '', email: '' })
  const [newBooking, setNewBooking] = useState({
    spotId: '',
    customerId: '',
    tariffId: '',
    startTime: '',
    endTime: '',
    notes: ''
  })
  const [newSale, setNewSale] = useState<{ customerId: string; items: { productId: string; quantity: number }[] }>({
    customerId: '',
    items: []
  })
  const [searchCustomer, setSearchCustomer] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('today')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dashRes, spotsRes, tariffsRes, customersRes, productsRes, bookingsRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/spots'),
        fetch('/api/tariffs'),
        fetch('/api/customers'),
        fetch('/api/products'),
        fetch('/api/bookings?status=ACTIVE')
      ])

      if (dashRes.ok) setDashboard(await dashRes.json())
      if (spotsRes.ok) setSpots(await spotsRes.json())
      if (tariffsRes.ok) setTariffs(await tariffsRes.json())
      if (customersRes.ok) setCustomers(await customersRes.json())
      if (productsRes.ok) setProducts(await productsRes.json())
      if (bookingsRes.ok) setBookings(await bookingsRes.json())
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSeed = async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success('База данных заполнена!')
        setIsSeeded(true)
        fetchData()
      }
    } catch {
      toast.error('Ошибка при заполнении БД')
    }
  }

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error('Заполните имя и телефон')
      return
    }
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      })
      if (res.ok) {
        toast.success('Клиент создан')
        setNewCustomer({ name: '', phone: '', nickname: '', email: '' })
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Ошибка')
      }
    } catch {
      toast.error('Ошибка создания клиента')
    }
  }

  const handleCreateBooking = async () => {
    if (!newBooking.spotId || !newBooking.startTime || !newBooking.endTime) {
      toast.error('Заполните все обязательные поля')
      return
    }
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking)
      })
      if (res.ok) {
        toast.success('Бронирование создано')
        setNewBooking({ spotId: '', customerId: '', tariffId: '', startTime: '', endTime: '', notes: '' })
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Ошибка')
      }
    } catch {
      toast.error('Ошибка создания бронирования')
    }
  }

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, status: 'COMPLETED' })
      })
      if (res.ok) {
        toast.success('Сессия завершена')
        fetchData()
      }
    } catch {
      toast.error('Ошибка')
    }
  }

  const handleCreateSale = async () => {
    if (!newSale.items.length) {
      toast.error('Добавьте товары')
      return
    }
    try {
      const itemsWithPrices = newSale.items.map(item => {
        const product = products.find(p => p.id === item.productId)
        return { ...item, price: product?.price || 0 }
      })

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: newSale.customerId || null,
          items: itemsWithPrices,
          paymentMethod: 'cash'
        })
      })
      if (res.ok) {
        toast.success('Продажа оформлена')
        setNewSale({ customerId: '', items: [] })
        fetchData()
      }
    } catch {
      toast.error('Ошибка оформления продажи')
    }
  }

  const addSaleItem = (productId: string) => {
    const existing = newSale.items.find(i => i.productId === productId)
    if (existing) {
      setNewSale({
        ...newSale,
        items: newSale.items.map(i => 
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
        )
      })
    } else {
      setNewSale({ ...newSale, items: [...newSale.items, { productId, quantity: 1 }] })
    }
  }

  const getSpotIcon = (type: SpotType) => {
    switch (type) {
      case 'PC': return <Monitor className="w-5 h-5" />
      case 'CONSOLE': return <Gamepad2 className="w-5 h-5" />
      case 'VR': return <Headset className="w-5 h-5" />
      case 'STREAMING': return <Radio className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: SpotStatus) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-500'
      case 'OCCUPIED': return 'bg-red-500'
      case 'MAINTENANCE': return 'bg-yellow-500'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'FOOD': return <Coffee className="w-4 h-4" />
      case 'DRINKS': return <Coffee className="w-4 h-4" />
      case 'MERCH': return <Shirt className="w-4 h-4" />
      case 'ACCESSORIES': return <Gift className="w-4 h-4" />
      default: return <ShoppingCart className="w-4 h-4" />
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    c.phone.includes(searchCustomer) ||
    (c.nickname && c.nickname.toLowerCase().includes(searchCustomer.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CyberHub</h1>
              <p className="text-xs text-gray-400">Система управления киберспортивным клубом</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!isSeeded && spots.length === 0 && (
              <Button onClick={handleSeed} variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/20">
                <Plus className="w-4 h-4 mr-2" />
                Заполнить данными
              </Button>
            )}
            <Badge variant="outline" className="border-green-500 text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
              Онлайн
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-black/30 border border-white/10">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-600">Дашборд</TabsTrigger>
            <TabsTrigger value="spots" className="data-[state=active]:bg-purple-600">Места</TabsTrigger>
            <TabsTrigger value="booking" className="data-[state=active]:bg-purple-600">Бронь</TabsTrigger>
            <TabsTrigger value="sales" className="data-[state=active]:bg-purple-600">Магазин</TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-purple-600">Клиенты</TabsTrigger>
            <TabsTrigger value="loyalty" className="data-[state=active]:bg-purple-600">Лояльность</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Обзор</h2>
              <Select value={selectedPeriod} onValueChange={(v) => { setSelectedPeriod(v); fetchData(); }}>
                <SelectTrigger className="w-40 bg-black/30 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Сегодня</SelectItem>
                  <SelectItem value="week">Неделя</SelectItem>
                  <SelectItem value="month">Месяц</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-black/30 border-white/10 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Выручка</CardTitle>
                  <DollarSign className="w-4 h-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">₽{dashboard?.revenue.total.toLocaleString() || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">Игры: ₽{dashboard?.revenue.bookings.toLocaleString() || 0}</p>
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-white/10 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Загрузка</CardTitle>
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{dashboard?.spots.occupancyRate || 0}%</div>
                  <Progress value={parseFloat(dashboard?.spots.occupancyRate || '0')} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-white/10 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Активные сессии</CardTitle>
                  <Play className="w-4 h-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{dashboard?.bookings.active || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">{dashboard?.spots.available} мест свободно</p>
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-white/10 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Новые клиенты</CardTitle>
                  <Users className="w-4 h-4 text-pink-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{dashboard?.customers.new || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">За период</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-black/30 border-white/10 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Карта клуба</CardTitle>
                  <CardDescription className="text-gray-400">{dashboard?.spots.total} игровых мест</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                    {spots.map(spot => (
                      <div
                        key={spot.id}
                        className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-1 cursor-pointer transition-all hover:scale-105 ${
                          spot.status === 'AVAILABLE' 
                            ? 'border-green-500/50 bg-green-500/10 hover:bg-green-500/20' 
                            : spot.status === 'OCCUPIED' 
                            ? 'border-red-500/50 bg-red-500/10' 
                            : 'border-yellow-500/50 bg-yellow-500/10'
                        }`}
                        title={spot.specs || spot.name}
                      >
                        {getSpotIcon(spot.spotType)}
                        <span className="text-[10px] text-white mt-1 truncate w-full text-center">{spot.name}</span>
                        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${getStatusColor(spot.status)}`}></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500"></div>Свободно</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500"></div>Занято</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-500"></div>Ремонт</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-white/10 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />Активные сессии
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {bookings.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Нет активных сессий</p>
                    ) : (
                      bookings.map(booking => (
                        <div key={booking.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge variant="outline" className="border-purple-500 text-purple-400 mb-1">{booking.spot?.name}</Badge>
                              <p className="text-white text-sm font-medium">{booking.customer?.name || 'Гость'}</p>
                              <p className="text-gray-500 text-xs">до {new Date(booking.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleCompleteBooking(booking.id)}>
                              <Square className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="mt-2 text-sm text-gray-400">Сумма: <span className="text-white font-medium">₽{booking.totalAmount}</span></div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-black/30 border-white/10 backdrop-blur">
              <CardHeader><CardTitle className="text-white">Популярные товары</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {dashboard?.products.popular.map(product => (
                    <div key={product.id} className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                      {getCategoryIcon(product.category)}
                      <p className="text-white text-sm mt-1">{product.name}</p>
                      <p className="text-gray-500 text-xs">Продано: {product.soldQuantity || 0}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spots Tab */}
          <TabsContent value="spots" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Игровые места</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spots.map(spot => (
                <Card key={spot.id} className="bg-black/30 border-white/10 backdrop-blur">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getSpotIcon(spot.spotType)}
                        <CardTitle className="text-white">{spot.name}</CardTitle>
                      </div>
                      <Badge className={`${getStatusColor(spot.status)} text-white`}>
                        {spot.status === 'AVAILABLE' ? 'Свободно' : spot.status === 'OCCUPIED' ? 'Занято' : 'Ремонт'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 text-sm mb-3">{spot.specs}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold">₽{spot.hourlyRate}/час</span>
                      {spot.status === 'AVAILABLE' && (
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => { setActiveTab('booking'); setNewBooking(prev => ({ ...prev, spotId: spot.id })); }}>
                          Забронировать
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Booking Tab */}
          <TabsContent value="booking" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Бронирование</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-black/30 border-white/10 backdrop-blur">
                <CardHeader><CardTitle className="text-white">Новое бронирование</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-400">Игровое место *</Label>
                    <Select value={newBooking.spotId} onValueChange={v => setNewBooking(prev => ({ ...prev, spotId: v }))}>
                      <SelectTrigger className="bg-black/30 border-white/10 text-white"><SelectValue placeholder="Выберите место" /></SelectTrigger>
                      <SelectContent>
                        {spots.filter(s => s.status === 'AVAILABLE').map(spot => (
                          <SelectItem key={spot.id} value={spot.id}>{spot.name} - ₽{spot.hourlyRate}/час</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-400">Клиент (опционально)</Label>
                    <Select value={newBooking.customerId} onValueChange={v => setNewBooking(prev => ({ ...prev, customerId: v }))}>
                      <SelectTrigger className="bg-black/30 border-white/10 text-white"><SelectValue placeholder="Гость" /></SelectTrigger>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>{customer.name} ({customer.nickname || customer.phone})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-400">Тариф</Label>
                    <Select value={newBooking.tariffId} onValueChange={v => setNewBooking(prev => ({ ...prev, tariffId: v }))}>
                      <SelectTrigger className="bg-black/30 border-white/10 text-white"><SelectValue placeholder="Стандарт" /></SelectTrigger>
                      <SelectContent>
                        {tariffs.map(tariff => (
                          <SelectItem key={tariff.id} value={tariff.id}>{tariff.name} {tariff.discount > 0 ? `(-${tariff.discount}%)` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400">Начало *</Label>
                      <Input type="datetime-local" className="bg-black/30 border-white/10 text-white" value={newBooking.startTime} onChange={e => setNewBooking(prev => ({ ...prev, startTime: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-gray-400">Окончание *</Label>
                      <Input type="datetime-local" className="bg-black/30 border-white/10 text-white" value={newBooking.endTime} onChange={e => setNewBooking(prev => ({ ...prev, endTime: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-400">Примечания</Label>
                    <Input className="bg-black/30 border-white/10 text-white" placeholder="Дополнительная информация" value={newBooking.notes} onChange={e => setNewBooking(prev => ({ ...prev, notes: e.target.value }))} />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" onClick={handleCreateBooking}>Создать бронирование</Button>
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-white/10 backdrop-blur">
                <CardHeader><CardTitle className="text-white">Активные бронирования</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {bookings.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Нет активных бронирований</p>
                    ) : (
                      bookings.map(booking => (
                        <div key={booking.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <Badge variant="outline" className="border-purple-500 text-purple-400">{booking.spot?.name}</Badge>
                              {booking.tariff && <Badge variant="outline" className="border-pink-500 text-pink-400 ml-2">{booking.tariff.name}</Badge>}
                            </div>
                            <span className="text-white font-bold">₽{booking.totalAmount}</span>
                          </div>
                          <p className="text-white">{booking.customer?.name || 'Гость'}</p>
                          <p className="text-gray-500 text-sm">{new Date(booking.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
                          {booking.discount > 0 && <p className="text-green-400 text-sm">Скидка: ₽{booking.discount}</p>}
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" className="border-green-500 text-green-400 hover:bg-green-500/10 flex-1" onClick={() => handleCompleteBooking(booking.id)}>
                              <CheckCircle className="w-4 h-4 mr-1" />Завершить
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10">
                              <AlertCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-black/30 border-white/10 backdrop-blur">
              <CardHeader><CardTitle className="text-white">Доступные тарифы</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {tariffs.map(tariff => (
                    <div key={tariff.id} className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                      <h4 className="text-white font-medium">{tariff.name}</h4>
                      {tariff.discount > 0 && <Badge className="bg-green-500 text-white mt-2">-{tariff.discount}%</Badge>}
                      {tariff.multiplier !== 1 && <p className="text-gray-400 text-sm mt-1">x{tariff.multiplier}</p>}
                      <p className="text-gray-500 text-xs mt-2">{tariff.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Магазин</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-black/30 border-white/10 backdrop-blur">
                  <CardHeader><CardTitle className="text-white">Товары</CardTitle></CardHeader>
                  <CardContent>
                    <Tabs defaultValue="FOOD">
                      <TabsList className="bg-black/30 border border-white/10 mb-4">
                        <TabsTrigger value="FOOD">Еда</TabsTrigger>
                        <TabsTrigger value="DRINKS">Напитки</TabsTrigger>
                        <TabsTrigger value="MERCH">Мерч</TabsTrigger>
                        <TabsTrigger value="ACCESSORIES">Аксессуары</TabsTrigger>
                      </TabsList>
                      {['FOOD', 'DRINKS', 'MERCH', 'ACCESSORIES'].map(category => (
                        <TabsContent key={category} value={category}>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {products.filter(p => p.category === category).map(product => (
                              <div key={product.id} className="p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all" onClick={() => addSaleItem(product.id)}>
                                <div className="flex justify-between items-start mb-2">
                                  {getCategoryIcon(product.category)}
                                  <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">{product.stock} шт</Badge>
                                </div>
                                <p className="text-white text-sm">{product.name}</p>
                                <p className="text-purple-400 font-bold mt-1">₽{product.price}</p>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-black/30 border-white/10 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2"><ShoppingCart className="w-5 h-5" />Чек</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-400">Клиент (опционально)</Label>
                      <Select value={newSale.customerId} onValueChange={v => setNewSale(prev => ({ ...prev, customerId: v }))}>
                        <SelectTrigger className="bg-black/30 border-white/10 text-white"><SelectValue placeholder="Без клиента" /></SelectTrigger>
                        <SelectContent>
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator className="bg-white/10" />
                    {newSale.items.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Выберите товары</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {newSale.items.map(item => {
                          const product = products.find(p => p.id === item.productId)
                          if (!product) return null
                          return (
                            <div key={item.productId} className="flex justify-between items-center p-2 bg-white/5 rounded">
                              <div>
                                <p className="text-white text-sm">{product.name}</p>
                                <p className="text-gray-500 text-xs">₽{product.price} x {item.quantity}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">₽{product.price * item.quantity}</span>
                                <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10 h-6 w-6 p-0" onClick={() => setNewSale(prev => ({ ...prev, items: prev.items.filter(i => i.productId !== item.productId) }))}>×</Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {newSale.items.length > 0 && (
                      <>
                        <Separator className="bg-white/10" />
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Итого:</span>
                          <span className="text-white text-xl font-bold">₽{newSale.items.reduce((sum, item) => { const product = products.find(p => p.id === item.productId); return sum + (product?.price || 0) * item.quantity }, 0)}</span>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" onClick={handleCreateSale}>
                          <CreditCard className="w-4 h-4 mr-2" />Оплатить
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Клиенты</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700"><Plus className="w-4 h-4 mr-2" />Новый клиент</Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-white">Новый клиент</DialogTitle>
                    <DialogDescription className="text-gray-400">Заполните информацию о клиенте</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div><Label className="text-gray-400">Имя *</Label><Input className="bg-black/30 border-white/10 text-white" value={newCustomer.name} onChange={e => setNewCustomer(prev => ({ ...prev, name: e.target.value }))} /></div>
                    <div><Label className="text-gray-400">Телефон *</Label><Input className="bg-black/30 border-white/10 text-white" placeholder="+7..." value={newCustomer.phone} onChange={e => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))} /></div>
                    <div><Label className="text-gray-400">Никнейм</Label><Input className="bg-black/30 border-white/10 text-white" value={newCustomer.nickname} onChange={e => setNewCustomer(prev => ({ ...prev, nickname: e.target.value }))} /></div>
                    <div><Label className="text-gray-400">Email</Label><Input type="email" className="bg-black/30 border-white/10 text-white" value={newCustomer.email} onChange={e => setNewCustomer(prev => ({ ...prev, email: e.target.value }))} /></div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateCustomer} className="bg-purple-600 hover:bg-purple-700">Создать</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input className="bg-black/30 border-white/10 text-white pl-10" placeholder="Поиск по имени, телефону или нику..." value={searchCustomer} onChange={e => setSearchCustomer(e.target.value)} />
            </div>
            <Card className="bg-black/30 border-white/10 backdrop-blur">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-gray-400">Клиент</TableHead>
                      <TableHead className="text-gray-400">Контакты</TableHead>
                      <TableHead className="text-gray-400">Уровень</TableHead>
                      <TableHead className="text-gray-400">Посещений</TableHead>
                      <TableHead className="text-gray-400">Потрачено</TableHead>
                      <TableHead className="text-gray-400">Баллы</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map(customer => (
                      <TableRow key={customer.id} className="border-white/10 hover:bg-white/5">
                        <TableCell>
                          <div><p className="text-white font-medium">{customer.name}</p>{customer.nickname && <p className="text-purple-400 text-sm">{customer.nickname}</p>}</div>
                        </TableCell>
                        <TableCell className="text-gray-300"><div><p>{customer.phone}</p>{customer.email && <p className="text-sm text-gray-500">{customer.email}</p>}</div></TableCell>
                        <TableCell><Badge className="bg-gradient-to-r from-purple-600 to-pink-600">{customer.loyaltyAccount?.program.name || 'Бронза'}</Badge></TableCell>
                        <TableCell className="text-white">{customer.visitsCount}</TableCell>
                        <TableCell className="text-white">₽{customer.totalSpent.toLocaleString()}</TableCell>
                        <TableCell className="text-yellow-400 font-medium">{customer.loyaltyAccount?.points.toFixed(0) || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Программа лояльности</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Бронза', minSpent: 0, cashback: 3, discount: 0, color: 'from-amber-700 to-amber-900' },
                { name: 'Серебро', minSpent: 5000, cashback: 5, discount: 5, color: 'from-gray-400 to-gray-600' },
                { name: 'Золото', minSpent: 15000, cashback: 7, discount: 10, color: 'from-yellow-500 to-yellow-700' },
                { name: 'Платина', minSpent: 30000, cashback: 10, discount: 15, color: 'from-slate-300 to-slate-500' },
              ].map(level => (
                <Card key={level.name} className={`bg-gradient-to-br ${level.color} border-0`}>
                  <CardHeader>
                    <div className="flex items-center gap-2"><Trophy className="w-6 h-6 text-white" /><CardTitle className="text-white">{level.name}</CardTitle></div>
                  </CardHeader>
                  <CardContent className="text-white">
                    <p className="text-sm opacity-80 mb-2">От ₽{level.minSpent.toLocaleString()}</p>
                    <div className="space-y-1 text-sm"><p>💎 Кэшбэк: {level.cashback}%</p><p>🏷️ Скидка: {level.discount}%</p></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="bg-black/30 border-white/10 backdrop-blur">
              <CardHeader><CardTitle className="text-white">Топ клиенты по уровню</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customers.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10).map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">{index + 1}</div>
                        <div><p className="text-white font-medium">{customer.name}</p><p className="text-gray-500 text-sm">{customer.nickname}</p></div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">{customer.loyaltyAccount?.program.name || 'Бронза'}</Badge>
                        <p className="text-white font-medium mt-1">₽{customer.totalSpent.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-white/10 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>CyberHub Management System • Хакатон ИТ-Форум 2026</p>
        </div>
      </footer>
    </div>
  )
}
