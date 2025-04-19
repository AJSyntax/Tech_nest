import { Link, useLocation } from "wouter";
import { LogOut, ShoppingCart } from "lucide-react";
import { User } from "@shared/schema";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose, user, onLogout }) => {
  const [location] = useLocation();

  if (!isOpen) return null;

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <div className="md:hidden border-t border-slate-200">
      <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        <Link
          href="/templates"
          onClick={onClose}
          className={`block px-3 py-2 rounded-md text-base font-medium ${
            location === '/templates'
              ? 'text-primary-600 bg-slate-50'
              : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'
          }`}
        >
          Templates
        </Link>
      </div>
      <div className="pt-4 pb-3 border-t border-slate-200">
        <div className="px-2 space-y-1">
          {user ? (
            <>
              <div className="px-3 py-2 text-base font-medium text-slate-600">
                Signed in as <span className="font-semibold">{user.username}</span>
                {user.role === "admin" && (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Admin
                  </span>
                )}
              </div>
              <Link
                href="/create"
                onClick={onClose}
                className="block w-full px-3 py-2 rounded-md text-base font-medium text-center bg-primary-600 text-white hover:bg-primary-700"
              >
                Create Portfolio
              </Link>
              <Link
                href="/my-portfolios"
                onClick={onClose}
                className="block w-full px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50"
              >
                My Portfolios
              </Link>
              <Link
                href="/my-purchases"
                onClick={onClose}
                className="block w-full px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50"
              >
                My Purchases
              </Link>
              {user.role === "admin" && (
                <>
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className="block w-full px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Admin Dashboard
                  </Link>
                  <Link
                    href="/admin/template-purchases"
                    onClick={onClose}
                    className="block w-full px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <div className="flex items-center">
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Purchase Requests
                    </div>
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-5 w-5" />
                <span>Log out</span>
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              onClick={onClose}
              className="block w-full px-3 py-2 rounded-md text-base font-medium text-center bg-primary-600 text-white hover:bg-primary-700"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
