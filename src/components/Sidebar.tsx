import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    Settings,
    BarChart3,
    FileText,
    Menu,
    X,
    LogOut,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const logoUrl = "https://krpophlzyxkzxeocgfow.supabase.co/storage/v1/object/public/Logo/Gemini_Generated_Image_v0mdlav0mdlav0md-removebg-preview.png";

const navItems = [
    { name: 'Início', icon: LayoutDashboard, href: '/' },
    { name: 'Contatos', icon: Users, href: '/contacts' },
    { name: 'Campanhas', icon: MessageSquare, href: '/campaigns' },
    { name: 'Templates', icon: FileText, href: '/templates' },
    { name: 'Relatórios', icon: BarChart3, href: '/reports' },
    { name: 'Configurações', icon: Settings, href: '/settings' },
];

export const Sidebar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { signOut, user } = useAuth();

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={toggleSidebar}
                className="fixed top-4 left-4 z-50 p-2 bg-surface border border-border rounded-md shadow-lg lg:hidden"
            >
                {isOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 h-full bg-dark border-r border-border z-40 transition-transform duration-300 ease-in-out w-64",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-border">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="relative w-10 h-10 flex items-center justify-center">
                                <div className="absolute inset-0 bg-primary/20 blur-md rounded-full group-hover:bg-primary/30 transition-all"></div>
                                <img
                                    src={logoUrl}
                                    alt="ATTO Logo"
                                    className="relative z-10 w-full h-full object-contain filter brightness-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black text-white tracking-tighter leading-none">
                                    ATTO<span className="text-primary italic">CORP</span>
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">Intelligence</span>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                                        isActive
                                            ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5", isActive ? "text-primary transition-all scale-110" : "text-slate-500 group-hover:text-white")} />
                                    <span className="font-semibold text-sm">{item.name}</span>
                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t border-border bg-surface/50">
                        <div className="flex items-center gap-3 px-2 py-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20 shadow-inner">
                                {user?.email?.[0].toUpperCase() ?? 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">
                                    {user?.email?.split('@')[0] ?? 'Admin'}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate font-medium">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={signOut}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 border border-transparent rounded-xl transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            Encerrar Sessão
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};
