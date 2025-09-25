import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface MobileAdminNavProps {
    navLinks: { to: string; text: string; icon: LucideIcon }[];
}

const MobileAdminNav = ({ navLinks }: MobileAdminNavProps) => {
    return (
        <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
            <nav className="flex justify-around items-center h-16">
                {navLinks.map(({ to, text, icon: Icon }) => (
                     <NavLink
                        key={to}
                        to={to}
                        end={to === "/admin"}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full text-xs transition-colors ${
                                isActive
                                    ? 'text-blue-600'
                                    : 'text-gray-500 hover:text-blue-600'
                            }`
                        }
                    >
                        <Icon className="w-6 h-6 mb-1" />
                        <span>{text}</span>
                    </NavLink>
                ))}
            </nav>
        </footer>
    );
};

export default MobileAdminNav;
