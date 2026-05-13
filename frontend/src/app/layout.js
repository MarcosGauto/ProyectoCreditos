import { Providers } from "./providers";
import "./globals.css";

export const metadata = {
  title: "Análisis de Crédito",
  description: "Panel con roles y autenticación",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
