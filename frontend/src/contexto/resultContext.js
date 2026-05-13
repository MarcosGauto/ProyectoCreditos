"use client"

import { createContext, useContext, useState } from "react"

const CreditDataContext = createContext(null)

export function CreditDataProvider({ children }) {
    const [creditData, setCreditData] = useState({})

    return (
        <CreditDataContext.Provider value={{ creditData, setCreditData }}>
            {children}
        </CreditDataContext.Provider>
    )
}

export function useCreditData() {
    return useContext(CreditDataContext)
}