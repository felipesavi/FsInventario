import { JetBrains_Mono } from "next/font/google";
import './globals.css';
import Nav from "@/components/Nav";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-jetbrainsMono",
});

export const metadata = {
  title: "fs-Inventario",
  description: "Aplicacion de inventario, para un colegio prueba",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${jetbrainsMono.variable} h-full antialiased`}>
        <div className="flex h-full flex-col">
          <div className="flex flex-1 overflow-hidden">
            <Nav />
            <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}