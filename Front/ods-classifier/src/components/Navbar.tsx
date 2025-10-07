import Link from 'next/link';
import Image from 'next/image';

export const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm px-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo y título */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-blue-600 font-semibold text-lg mr-2">UNFPA</span>
            </Link>
          </div>
          
          {/* Enlaces de navegación */}
          <div className="hidden md:flex space-x-8">
            <NavLink href="/">Inicio</NavLink>
            <NavLink href="/clasificar">Clasificar</NavLink>
            <NavLink href="/entrenar">Entrenar</NavLink>
          </div>
          
          {/* Botón para móvil (podemos añadir funcionalidad después si es necesario) */}
          <div className="md:hidden">
            <button type="button" className="text-gray-700">
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

const NavLink = ({ href, children }: NavLinkProps) => {
  return (
    <Link 
      href={href} 
      className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
    >
      {children}
    </Link>
  );
};