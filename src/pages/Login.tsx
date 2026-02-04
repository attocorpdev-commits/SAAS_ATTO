import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Chrome, UserPlus, LogIn, ChevronRight, Zap } from 'lucide-react';

const logoUrl = "https://krpophlzyxkzxeocgfow.supabase.co/storage/v1/object/public/Logo/Gemini_Generated_Image_v0mdlav0mdlav0md-removebg-preview.png";

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        if (isSignUp) {
            const { error, data } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });
            if (error) {
                setError(error.message);
            } else if (data.user && data.session === null) {
                setSuccessMessage('Verifique seu e-mail para confirmar o acesso.');
                setIsSignUp(false);
            } else {
                setSuccessMessage('Conta criada com sucesso!');
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setError(error.message);
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
    };

    return (
        <div className="min-h-screen bg-dark flex overflow-hidden">
            {/* Left Side: Branding & Visuals */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden border-r border-border">
                {/* Background animations */}
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full" />

                <div className="relative z-10 max-w-lg text-center">
                    <div className="mb-12 inline-block">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full scale-110"></div>
                            <img
                                src={logoUrl}
                                alt="ATTO Logo"
                                className="relative w-56 h-56 mx-auto object-contain filter brightness-110 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-transform duration-700 hover:scale-105"
                            />
                        </div>
                    </div>

                    <h1 className="text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8 select-none">
                        ATTO<br /><span className="text-primary italic font-black">CORP</span>
                    </h1>

                    <div className="space-y-8 flex flex-col items-center">
                        <p className="text-xl text-slate-400 font-medium max-w-sm leading-relaxed">
                            Liderando a nova era do <span className="text-white font-bold">Outbound Inteligente</span>. Alta performance e conversão em escala global.
                        </p>

                        <div className="flex flex-col gap-5 items-start">
                            {[
                                "Disparos Inteligentes de WhatsApp",
                                "Dashboards Analíticos em Tempo Real",
                                "Automação de Fluxo de Conversão"
                            ].map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                    <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                        <Zap className="w-4 h-4 text-primary" fill="currentColor" />
                                    </div>
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-10 left-12 text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">
                    Atto Corp Systems &bull; 2.0.4
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-surface/30 backdrop-blur-sm relative">
                {/* Mobile-only logo */}
                <div className="lg:hidden absolute top-12 left-1/2 -translate-x-1/2 text-center w-full">
                    <img src={logoUrl} alt="ATTO" className="w-20 h-20 mx-auto mb-4 filter drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    <h2 className="text-2xl font-black text-white tracking-tighter">ATTO<span className="text-primary italic">CORP</span></h2>
                </div>

                <div className="w-full max-w-md animate-fade-in">
                    <div className="mb-10 lg:mb-12">
                        <h3 className="text-3xl lg:text-4xl font-black text-white tracking-tight uppercase">Autenticar <span className="text-primary">Sistema</span></h3>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2 px-1">Insira suas credenciais para acessar o portal</p>
                    </div>

                    <div className="bg-dark/40 border border-border rounded-[2.5rem] p-1.5 mb-8">
                        <div className="flex">
                            <button
                                onClick={() => setIsSignUp(false)}
                                className={`flex-1 py-4 text-xs font-black rounded-3xl transition-all uppercase tracking-widest ${!isSignUp ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
                            >
                                <LogIn className="w-4 h-4 inline mr-2" />
                                Login
                            </button>
                            <button
                                onClick={() => setIsSignUp(true)}
                                className={`flex-1 py-4 text-xs font-black rounded-3xl transition-all uppercase tracking-widest ${isSignUp ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
                            >
                                <UserPlus className="w-4 h-4 inline mr-2" />
                                Ingressar
                            </button>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black rounded-2xl animate-fade-in text-center uppercase">
                                {error}
                            </div>
                        )}
                        {successMessage && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black rounded-2xl animate-fade-in text-center uppercase">
                                {successMessage}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-3">E-mail Operacional</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-14 pr-4 py-4 bg-dark/60 border border-border rounded-2xl text-white placeholder-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm font-medium"
                                    placeholder="USUARIO@ATTO.CORP"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-3">Protocolo de Acesso</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-14 pr-4 py-4 bg-dark/60 border border-border rounded-2xl text-white placeholder-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 rounded-2xl shadow-[0_20px_40px_rgba(59,130,246,0.3)] text-xs font-black text-white bg-primary hover:bg-secondary hover:translate-y-[-2px] transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.3em] flex items-center justify-center gap-2"
                        >
                            {loading ? 'Validando...' : (isSignUp ? 'Criar Protocolo' : 'Entrar no Sistema')}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.4em] mb-6">Acesso via Autenticação Externa</p>
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full py-4 border border-border rounded-2xl bg-dark/40 text-[10px] font-black text-white hover:bg-dark hover:border-primary/50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest group"
                        >
                            <Chrome className="w-4 h-4 group-hover:text-primary transition-colors" />
                            Google Workspace
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
