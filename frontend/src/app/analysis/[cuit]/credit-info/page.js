"use client"

import { use } from "react"
import { CreditInfo } from "@/components/Credit-info"


export default function CreditInfoPage({ params }) {
  const { cuit } = use(params)
  return (
    <main className="min-h-screen bg-gray-200 p-6">
      <div className="max-w-7xl mx-auto">
        <CreditInfo cuit={cuit} />

      </div>
    </main>
  )
}
