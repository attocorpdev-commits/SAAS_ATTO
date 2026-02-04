import React from 'react';
import { Sidebar } from './Sidebar';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-dark text-slate-300">
            <Sidebar />
            <main className="flex-1 lg:ml-64 p-4 md:p-8 animate-fade-in relative">
                {/* Global Ambient Glow */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] -z-10 pointer-events-none" />

                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
