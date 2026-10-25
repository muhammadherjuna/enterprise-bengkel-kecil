import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Wrench, ShoppingBag, Package, Menu } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Beranda', icon: Home },
    { to: '/services', label: 'Servis', icon: Wrench },
    { to: '/pos', label: 'Kasir', icon: ShoppingBag },
    { to: '/inventory', label: 'Stok', icon: Package },
    { to: '/menu', label: 'Menu', icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:hidden flex justify-around items-center h-16 px-1 shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full py-1 text-xs font-medium transition-colors ${
                isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-1" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
