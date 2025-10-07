import Image from "next/image";
import Link from "next/link";
import { Navbar } from "../components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center bg-gray-50 px-4 py-16">
        {/* Logo UNFPA */}
        <div className="mb-8">
          <Image
            src="/UNFPA.png"
            alt="UNFPA Logo"
            width={200}
            height={80}
            priority
            className="mx-auto"
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
          Plataforma de Análisis de Opinión Ciudadana
        </h1>
        
        <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto text-center">
          Herramienta de Análisis de Textos para el Fondo de Población de las Naciones 
          Unidas (UNFPA) para clasificar opiniones ciudadanas en Objetivos de Desarrollo 
          Sostenible (ODS).
        </p>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            href="/clasificar"
            className="rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium text-sm sm:text-base h-10 sm:h-12 px-6 py-3 flex items-center justify-center min-w-40"
          >
            Clasificar Opiniones
          </Link>
          <Link
            href="/entrenar"
            className="rounded-lg bg-orange-500 hover:bg-orange-600 transition-colors text-white font-medium text-sm sm:text-base h-10 sm:h-12 px-6 py-3 flex items-center justify-center min-w-64"
          >
            Re-entrenar Modelo
          </Link>
        </div>
      </main>
      <footer className="py-4 bg-white border-t border-gray-200 text-center text-sm text-gray-600">
       Fondo de Población de las Naciones Unidas.
      </footer>
    </div>
  );
}
