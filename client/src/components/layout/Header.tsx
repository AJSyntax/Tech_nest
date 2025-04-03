import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Code } from "lucide-react";
import MobileNav from "./MobileNav";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  return (
    <header className="sticky top-0 bg-white border-b border-slate-200 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Code className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-semibold">Technest</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/templates" className={`text-slate-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium ${location === '/templates' ? 'text-primary-600' : ''}`}>
              Templates
            </Link>
            <Link href="/features" className={`text-slate-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium ${location === '/features' ? 'text-primary-600' : ''}`}>
              Features
            </Link>
          </nav>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/create" className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-md text-sm font-medium transition">
              Create Portfolio
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={toggleMobileMenu}
              className="text-slate-600 hover:text-primary-600 focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </header>
  );
};

export default Header;
