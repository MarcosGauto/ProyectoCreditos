

// app/analysis/[cuit]/layout.js
import { CreditDataProvider } from "@/contexto/resultContext"

export default function CuitLayout({ children }) {
    return (
        <CreditDataProvider>
            {children}
        </CreditDataProvider>
    )
}
