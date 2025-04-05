import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Code, LogOut, Loader2 } from "lucide-react";
import MobileNav from "./MobileNav";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isLoading, logoutMutation } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
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
            {user && (
              <Link href="/my-portfolios" className={`text-slate-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium ${location === '/my-portfolios' ? 'text-primary-600' : ''}`}>
                My Portfolios
              </Link>
            )}
          </nav>
          
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
            ) : user ? (
              <>
                <Link href="/create" className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-md text-sm font-medium transition">
                  Create Portfolio
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative rounded-full">
                      <span className="font-medium">{user.username}</span>
                      {user.role === "admin" && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Admin
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {user.role === "admin" && (
                      <Link href="/admin">
                        <DropdownMenuItem>
                          Admin Dashboard
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <Link href="/my-portfolios">
                      <DropdownMenuItem>
                        My Portfolios
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                      {logoutMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Logging out...</span>
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/auth" className="text-primary-600 hover:text-primary-800 font-medium">
                Sign In
              </Link>
            )}
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
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} onLogout={handleLogout} />
    </header>
  );
};

export default Header;
