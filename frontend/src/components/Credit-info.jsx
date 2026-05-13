// ... (tus otros imports se mantienen igual)
import { toast } from "sonner" // O tu librería de notificaciones

export function CreditInfo({ cuit }) {
    const [loading, setLoading] = useState(true) // Empezamos cargando
    const [creditData, setCreditData] = useState(null)
    const [bankData, setBankData] = useState(null)
    const [qualificationData, setQualificationData] = useState(null)
    const router = useRouter()

    useEffect(() => {
        if (!cuit) return

        const fetchData = async () => {
            try {
                setLoading(true)
                
                // Usamos la URL base de tu backend
                const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

                // 1. Llamada unificada (si usaste el controlador que armamos antes)
                // O llamadas separadas si mantuviste los endpoints individuales:
                const [creditRes, bankRes, qualRes] = await Promise.all([
                    fetch(`${baseUrl}/api/bcra/${cuit}`),
                    fetch(`${baseUrl}/api/bank/${cuit}`),
                    fetch(`${baseUrl}/api/qualification/${cuit}`)
                ])

                if (!creditRes.ok) throw new Error("Error al obtener datos del BCRA")

                const cData = await creditRes.json()
                const bData = await bankRes.json()
                const qData = await qualRes.json()

                // Extraemos la data según la estructura del backend (si usamos { ok, bcra, cheques })
                setCreditData(cData.bcra || cData) 
                setBankData(bData)
                setQualificationData(qData)

            } catch (error) {
                console.error("Error fetching credit data:", error)
                toast.error("No se pudo conectar con el servicio de calificación.")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [cuit])

    if (loading) return <LoadingSkeleton />

    // Si el backend respondió pero el CUIT no existe en BCRA
    if (!creditData?.results && !loading) {
        return (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                <p className="text-muted-foreground">El CUIT {cuit} no registra actividad en la Central de Deudores.</p>
                <Button variant="link" onClick={() => router.back()}>Volver atrás</Button>
            </div>
        )
    }

    // --- CÁLCULOS SEGUROS ---
    const denominacion = creditData?.results?.denominacion || "Sin nombre registrado";
    const periodos = creditData?.results?.periodos || [];
    const entidades = periodos[0]?.entidades || [];
    
    // Situación máxima histórica o actual
    const situacionMaxima = entidades.length > 0 
        ? Math.max(...entidades.map(e => e.situacion)) 
        : 1;

    const totalMonto = entidades.reduce((sum, e) => sum + e.monto, 0);

    // --- RENDER ---
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ... resto de tu JSX igual ... */}
            
            {/* Mejora visual en la Situación Máxima */}
            <InfoCard title="Información General">
                <dl className="space-y-3">
                    <div>
                        <dt className="text-sm text-muted-foreground">Denominación</dt>
                        <dd className="font-bold text-lg leading-tight uppercase">{denominacion}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-muted-foreground">Situación BCRA</dt>
                        <dd className="mt-1">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                situacionMaxima > 2 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                            }`}>
                                NIVEL {situacionMaxima}
                            </span>
                        </dd>
                    </div>
                </dl>
            </InfoCard>

            {/* ... el resto de las tarjetas y el selector de tipo ... */}
        </div>
    )
}