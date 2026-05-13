"use client"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function ExistingDataViewer({ data, cuit, onNext, onExit }) {
    return (
        <div className="space-y-8">
            {/* Botones arriba */}
            <div className="flex justify-end gap-4 pb-4">
                <Button variant="outline" onClick={onExit}>
                    Salir
                </Button>
                <Button onClick={onNext}>
                    Siguiente (Calificar)
                </Button>
            </div>

            <Tabs defaultValue="iva" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="iva">IVA</TabsTrigger>
                    <TabsTrigger value="iibb">IIBB</TabsTrigger>
                    <TabsTrigger value="balances">Balances</TabsTrigger>
                </TabsList>

                {/* IVA */}
                <TabsContent value="iva">
                    <CategoryViewer
                        title="Declaraciones de IVA"
                        items={data.iva}
                    />
                </TabsContent>

                {/* IIBB */}
                <TabsContent value="iibb">
                    <CategoryViewer
                        title="Declaraciones de IIBB"
                        items={data.iibb}
                    />
                </TabsContent>

                {/* Balances */}
                <TabsContent value="balances">
                    <CategoryViewer
                        title="Balances"
                        items={data.balances}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function CategoryViewer({ title, items }) {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">{title}</h2>

            {items.length === 0 ? (
                <p className="text-muted-foreground">No hay datos cargados aún.</p>
            ) : (
                <div className="grid gap-4">
                    {items.map((item) => (
                        <Card key={item.id}>
                            <CardContent className="flex justify-between items-center p-4">
                                <div>
                                    <p className="font-medium">Período: {item.id}</p>
                                    {item.url && (
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 underline"
                                        >
                                            Ver documento
                                        </a>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
