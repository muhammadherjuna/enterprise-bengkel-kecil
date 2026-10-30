import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Wrench, ShoppingBag, Package, Menu } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutGrid },
    { to: '/services', label: 'Servis', icon: Wrench },
    { to: '/pos', label: 'POS Kasir', icon: ShoppingBag },
    { to: '/inventory', label: 'Inventori', icon: Package },
    { to: '/menu', label: 'Lainnya', icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/90 md:hidden flex justify-around items-center h-14 px-2 safe-area-bottom shadow-card">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full py-1 text-[11px] font-medium transition-colors relative ${
                isActive
                  ? 'text-zinc-950 font-bold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-zinc-900 absolute top-1.5 right-6"></span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
