'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowRight, TrendingDown, TrendingUp, DollarSign, Search, AlertCircle, Plus } from 'lucide-react'

function calculateDifference(order) {
  if (!order.exchangeRateInvoice) return null

  // Calcular USD dividiendo el monto en pesos entre el tipo de cambio
  const usdAtOrder = order.amountPesos / order.exchangeRateOrder
  const usdAtInvoice = order.amountPesos / order.exchangeRateInvoice

  // La diferencia en USD
  const differenceUSD = usdAtOrder - usdAtInvoice

  // ND a generar: diferencia en USD multiplicada por el TC de factura
  const ndToGenerate = differenceUSD * order.exchangeRateInvoice

  const differencePercentage = ((order.exchangeRateInvoice - order.exchangeRateOrder) / order.exchangeRateOrder) * 100

  return {
    usdAtOrder,
    usdAtInvoice,
    differenceUSD,
    ndToGenerate,
    differencePercentage,
    type: differenceUSD > 0 ? 'gain' : differenceUSD < 0 ? 'loss' : 'neutral'
  }
}

export function ExchangeDifference() {
  const [orders, setOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.client.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalDifferences = orders
    .filter(o => o.status === 'invoiced')
    .reduce((acc, order) => {
      const diff = calculateDifference(order)
      return acc + (diff?.ndToGenerate || 0)
    }, 0)

  const handleAddOrder = (newOrder) => {
    const order = {
      ...newOrder,
      id: Date.now().toString()
    }
    setOrders(prev => [...prev, order])
    setIsAddDialogOpen(false)
  }

  const handleUpdateInvoice = (orderId, invoiceData) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId
        ? { ...order, ...invoiceData, status: 'invoiced' }
        : order
    ))
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-whte">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-balanc text-black">Diferencias de Tipo de Cambio</h1>
          <p className="text-muted-foreground text-pretty text-black">
            Monitorea las diferencias de tipo de cambio entre pedidos y facturas
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-500 hover:bg-gray-500">
              <Plus className="h-4 w-4 mr-2 bg-" />
              Agregar Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-black">Agregar Nuevo Pedido</DialogTitle>
              <DialogDescription>
                Ingresa los datos del pedido y su tipo de cambio
              </DialogDescription>
            </DialogHeader>
            <AddOrderForm onSubmit={handleAddOrder} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ND a Generar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalDifferences.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalDifferences >= 0 ? 'Total acumulado' : 'Pérdida acumulada'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Facturados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'invoiced').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              De {orders.length} totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Esperando facturación
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Pedidos y Facturas</CardTitle>
              <CardDescription>Consulta las diferencias de tipo de cambio por pedido</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pedido o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border rounded-lg">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay pedidos registrados</p>
              <p className="text-sm mt-2">Comienza agregando tu primer pedido usando el botón "Agregar Pedido"</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Monto (Pesos)</TableHead>
                    <TableHead>T.C. Pedido</TableHead>
                    <TableHead>T.C. Factura</TableHead>
                    <TableHead>ND a Generar</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const diff = calculateDifference(order)
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.client}</TableCell>
                        <TableCell>${order.amountPesos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>USD {order.exchangeRateOrder.toFixed(2)}</TableCell>
                        <TableCell>
                          {order.exchangeRateInvoice ? `USD ${order.exchangeRateInvoice.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>
                          {diff ? (
                            <div className="flex items-center gap-1">
                              {diff.type === 'gain' ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : diff.type === 'loss' ? (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              ) : null}
                              <span className={diff.type === 'gain' ? 'text-green-600' : diff.type === 'loss' ? 'text-red-600' : ''}>
                                ${Math.abs(diff.ndToGenerate).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.status === 'invoiced' ? 'default' : 'secondary'}>
                            {order.status === 'invoiced' ? 'Facturado' : 'Pendiente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.status === 'pending' ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Facturar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="text-black">Registrar Factura</DialogTitle>
                                  <DialogDescription>
                                    Ingresa los datos de facturación para {order.orderNumber}
                                  </DialogDescription>
                                </DialogHeader>
                                <InvoiceForm order={order} onSubmit={(data) => handleUpdateInvoice(order.id, data)} />
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                                  Ver detalle
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl text-black">
                                <DialogHeader>
                                  <DialogTitle>Detalle de Diferencia - {order.orderNumber}</DialogTitle>
                                  <DialogDescription>
                                    Análisis completo del tipo de cambio
                                  </DialogDescription>
                                </DialogHeader>
                                <OrderDetailView order={order} />
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-start mt-6 print:hidden">
        <Button
          asChild
          variant="outline"
          className="rounded-full px-4 py-1 text-sm hover:bg-gray-200 text-gray-500"
        >
          <Link href="/">← Atrás</Link>
        </Button>
      </div>
    </div>

  )
}

function AddOrderForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    orderNumber: '',
    client: '',
    amountPesos: '',
    exchangeRateOrder: '',
    orderDate: new Date().toISOString().split('T')[0]
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    onSubmit({
      orderNumber: formData.orderNumber,
      client: formData.client,
      amountPesos: parseFloat(formData.amountPesos),
      exchangeRateOrder: parseFloat(formData.exchangeRateOrder),
      orderDate: formData.orderDate,
      invoiceDate: null,
      exchangeRateInvoice: null,
      status: 'pending'
    })

    // Reset form
    setFormData({
      orderNumber: '',
      client: '',
      amountPesos: '',
      exchangeRateOrder: '',
      orderDate: new Date().toISOString().split('T')[0]
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="orderNumber" className="text-black">Número de Pedido</Label>
          <Input
            id="orderNumber"
            placeholder="Fc A 00098-00009227"
            value={formData.orderNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
            required
            className="text-black"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="orderDate" className="text-black">Fecha del Pedido</Label>
          <Input
            id="orderDate"
            type="date"
            value={formData.orderDate}
            onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
            required
            className="text-black"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="client" className="text-black">Cliente / Comprobante</Label>
        <Input
          id="client"
          placeholder="Nombre del cliente o tipo de comprobante"
          value={formData.client}
          onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
          required
          className="text-black"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amountPesos" className="text-black">Monto en Pesos (Pesos)</Label>
          <Input
            id="amountPesos"
            type="number"
            step="0.01"
            placeholder="2805921.10"
            value={formData.amountPesos}
            onChange={(e) => setFormData(prev => ({ ...prev, amountPesos: e.target.value }))}
            required
            className="text-black"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exchangeRateOrder" className="text-black">Tipo de Cambio Pedido (USD)</Label>
          <Input
            id="exchangeRateOrder"
            type="number"
            step="0.01"
            placeholder="1330.00"
            value={formData.exchangeRateOrder}
            onChange={(e) => setFormData(prev => ({ ...prev, exchangeRateOrder: e.target.value }))}
            required
            className="text-black"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 ">
        <Button type="submit" className="bg-red-500 hover:bg-gray-500">Agregar Pedido</Button>
      </div>
    </form>
  )
}

function InvoiceForm({ order, onSubmit }) {
  const [formData, setFormData] = useState({
    invoiceDate: new Date().toISOString().split('T')[0],
    exchangeRateInvoice: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    onSubmit({
      invoiceDate: formData.invoiceDate,
      exchangeRateInvoice: parseFloat(formData.exchangeRateInvoice)
    })
  }


  const calculatedUSD = formData.exchangeRateInvoice ?
    (order.amountPesos / parseFloat(formData.exchangeRateInvoice)).toFixed(2) : '0.00'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
        <div className="flex justify-between text-sm text-black">
          <span className="text-muted-foreground">Pedido:</span>
          <span className="font-medium text-black">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between text-sm ">
          <span className="text-muted-foregroun text-black">Cliente:</span>
          <span className="font-medium text-black">{order.client}</span>
        </div>
        <div className="flex justify-between text-sm text-black">
          <span className="text-muted-foreground ">Monto (Pesos):</span>
          <span className="font-medium text-black">${order.amountPesos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm text-black">
          <span className="text-muted-foreground ">T.C. Original:</span>
          <span className="font-medium text-black">USD {order.exchangeRateOrder.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-black">
          <span className="text-muted-foreground ">USD al pedido:</span>
          <span className="font-medium">USD {(order.amountPesos / order.exchangeRateOrder).toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-2 text-black">
        <Label htmlFor="invoiceDate">Fecha de Facturación</Label>
        <Input
          id="invoiceDate"
          type="date"
          value={formData.invoiceDate}
          onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2 text-black">
        <Label htmlFor="exchangeRateInvoice">Tipo de Cambio de Factura (USD)</Label>
        <Input
          id="exchangeRateInvoice"
          type="number"
          step="0.01"
          placeholder="1460.00"
          value={formData.exchangeRateInvoice}
          onChange={(e) => setFormData(prev => ({ ...prev, exchangeRateInvoice: e.target.value }))}
          required
        />
        {formData.exchangeRateInvoice && (
          <p className="text-sm text-muted-foreground">
            Cantidad en USD: ${calculatedUSD}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 text-black">
        <Button type="submit" className="bg-red-500 hover:bg-gray-400">Registrar Factura</Button>
      </div>
    </form>
  )
}

function OrderDetailView({ order }) {
  const diff = calculateDifference(order)

  if (!diff) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Este pedido aún no ha sido facturado</p>
        <p className="text-sm mt-2">La diferencia de tipo de cambio se calculará al momento de la facturación</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Información del Cliente */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
        <div>
          <Label className="text-xs text-muted-foreground text-black">Cliente</Label>
          <p className="font-medium text-black">{order.client}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground text-black">Número de Pedido</Label>
          <p className="font-medium text-black">{order.orderNumber}</p>
        </div>
      </div>

      {/* Timeline de fechas */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="text-center">
          <Label className="text-xs text-muted-foreground text-black">Fecha Pedido</Label>
          <p className="font-medium text-black">{new Date(order.orderDate).toLocaleDateString('es-MX')}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        <div className="text-center">
          <Label className="text-xs text-muted-foreground text-black">Fecha Factura</Label>
          <p className="font-medium text-black">{order.invoiceDate ? new Date(order.invoiceDate).toLocaleDateString('es-MX') : '-'}</p>
        </div>
        <div className="text-center">
          <Label className="text-xs text-muted-foreground text-black">Días transcurridos</Label>
          <p className="font-medium text-black">
            {order.invoiceDate
              ? Math.floor((new Date(order.invoiceDate).getTime() - new Date(order.orderDate).getTime()) / (1000 * 60 * 60 * 24))
              : '-'
            } días
          </p>
        </div>
      </div>

      {/* Cálculos detallados */}
      <div className="space-y-4">
        <h4 className="font-semibold text-black">Cálculo de Diferencias</h4>

        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-black" >Al momento del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground ">Monto (Pesos):</span>
                <span className="font-medium">${order.amountPesos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tipo de Cambio:</span>
                <span className="font-medium">USD {order.exchangeRateOrder.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fórmula:</span>
                <span className="font-mono text-xs">${order.amountPesos.toLocaleString()} ÷ {order.exchangeRateOrder}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="font-medium">Cantidad en USD:</span>
                <span className="font-bold">USD {diff.usdAtOrder.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Al momento de Facturación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monto (Pesos):</span>
                <span className="font-medium">${order.amountPesos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tipo de Cambio:</span>
                <span className="font-medium">USD {order.exchangeRateInvoice?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fórmula:</span>
                <span className="font-mono text-xs">${order.amountPesos.toLocaleString()} ÷ {order.exchangeRateInvoice}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="font-medium">Cantidad en USD:</span>
                <span className="font-bold">USD {diff.usdAtInvoice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Diferencia en USD</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">USD al pedido:</span>
                <span className="font-medium">USD {diff.usdAtOrder.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">USD al facturar:</span>
                <span className="font-medium">USD {diff.usdAtInvoice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-blue-300 ">
                <span className="font-medium">Diferencia USD:</span>
                <span className="font-bold text-blue-700">USD {Math.abs(diff.differenceUSD).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resultado final - ND a Generar */}
        <Card className={diff.type === 'gain' ? 'border-green-200 bg-green-50' : diff.type === 'loss' ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {diff.type === 'gain' ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground text-black">ND a Generar</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    USD {Math.abs(diff.differenceUSD).toFixed(2)} × {order.exchangeRateInvoice}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${diff.type === 'gain' ? 'text-green-600' : 'text-red-600'}`}>
                    ${Math.abs(diff.ndToGenerate).toLocaleString('es-MX', { minimumFractionDigits: 2 })} Pesos
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Variación T.C.</p>
                <p className={`text-xl font-bold ${diff.differencePercentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {diff.differencePercentage > 0 ? '+' : ''}{diff.differencePercentage.toFixed(2)}%
                </p>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
