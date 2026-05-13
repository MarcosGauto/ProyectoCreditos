"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserIcon, BuildingIcon } from "lucide-react"

export function PersonTypeSelector({ cuit }) {
    const router = useRouter()

    const handleSelection = (type) => {
        router.push(`/analysis/${cuit}/${type}`)
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-center">Seleccione el tipo de persona</h2>
            <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
                <Card
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleSelection("fisica")}
                >
                    <CardHeader className="text-center">
                        <CardTitle className="flex flex-col items-center gap-2">
                            <UserIcon className="h-12 w-12" />
                            Persona Física
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline">
                            Seleccionar
                        </Button>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleSelection("juridica")}
                >
                    <CardHeader className="text-center">
                        <CardTitle className="flex flex-col items-center gap-2">
                            <BuildingIcon className="h-12 w-12" />
                            Persona Jurídica
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline">
                            Seleccionar
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

