import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Users,
    Send,
    CheckCircle2,
    TrendingUp,
    Clock,
    ArrowUpRight
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

interface DashboardStats {
    totalContacts: number;
    activeCampaigns: number;
    deliveryRate: string;
    sentToday: number;
}

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalContacts: 0,
        activeCampaigns: 0,
        deliveryRate: '0%',
        sentToday: 0
    });
    const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchDashboardData();
    }, [user]);

    async function fetchDashboardData() {
        setLoading(true);
        try {
            const { count: contactsCount } = await supabase
                .from('contacts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user!.id);

            const { count: activeCount } = await supabase
                .from('campaigns')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user!.id)
                .eq('status', 'processing');

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count: todayCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'sent')
                .gte('sent_at', today.toISOString());

            const { data: messages } = await supabase
                .from('messages')
                .select('status')
                .limit(1000);

            const total = messages?.length || 0;
            const sent = messages?.filter(m => m.status === 'sent').length || 0;
            const rate = total > 0 ? ((sent / total) * 100).toFixed(1) + '%' : '100%';

            setStats({
                totalContacts: contactsCount || 0,
                activeCampaigns: activeCount || 0,
                deliveryRate: rate,
                sentToday: todayCount || 0
            });

            const { data: campaigns } = await supabase
                .from('campaigns')
                .select('*')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false })
                .limit(5);

            setRecentCampaigns(campaigns || []);

            setChartData([
                { name: 'Seg', envios: 10 },
                { name: 'Ter', envios: 20 },
                { name: 'Qua', envios: todayCount || 5 },
                { name: 'Qui', envios: 15 },
                { name: 'Sex', envios: 25 },
                { name: 'Sab', envios: 10 },
                { name: 'Dom', envios: 18 },
            ]);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    const statCards = [
        { id: 1, name: 'Contatos na Rede', value: stats.totalContacts, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
        { id: 2, name: 'Fluxos Ativos', value: stats.activeCampaigns, icon: Send, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { id: 3, name: 'Eficiência de Entrega', value: stats.deliveryRate, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { id: 4, name: 'Outbound Hoje', value: stats.sentToday, icon: TrendingUp, color: 'text-sky-400', bg: 'bg-sky-400/10' },
    ];

    if (loading) {
        return <div className="animate-pulse space-y-8">
            <div className="h-8 bg-surface rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-surface rounded-3xl border border-border"></div>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 h-80 bg-surface rounded-3xl border border-border"></div>
                <div className="h-80 bg-surface rounded-3xl border border-border"></div>
            </div>
        </div>;
    }

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Intelligence <span className="text-primary italic">Center</span></h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-1">Outbound Control Panel</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    SYSTEM OPERATIONAL
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <div key={stat.id} className="group bg-surface/50 backdrop-blur-sm p-8 rounded-[2rem] border border-border hover:border-primary/50 transition-all duration-500 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className={`p-4 ${stat.bg} rounded-2xl border border-white/5 transition-transform group-hover:scale-110 duration-500`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-slate-700 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{stat.name}</p>
                        <h3 className="text-3xl font-black text-white mt-1 tracking-tighter">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-surface/50 backdrop-blur-sm p-8 rounded-[2rem] border border-border shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Fluxo de Dados</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Volume de mensagens processadas</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                                Outbound
                            </div>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorEnvios" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#525252', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#525252', fontSize: 10, fontWeight: 'bold' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#171717', borderRadius: '16px', border: '1px solid #262626', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="envios" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorEnvios)" animationDuration={2000} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Campaigns */}
                <div className="bg-surface/50 backdrop-blur-sm p-8 rounded-[2rem] border border-border shadow-2xl">
                    <div className="mb-8">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Recent <span className="text-primary italic">Ops</span></h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Últimos processos executados</p>
                    </div>
                    <div className="space-y-6">
                        {recentCampaigns.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                                    <Clock className="w-6 h-6 text-slate-700" />
                                </div>
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Nenhum registro</p>
                            </div>
                        ) : recentCampaigns.map((camp) => (
                            <div key={camp.id} className="p-4 bg-dark/50 rounded-2xl border border-border hover:border-primary/30 transition-all group cursor-pointer">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                                        <Send className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate uppercase tracking-tight">{camp.name}</p>
                                        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">
                                            {camp.sent_count} / {camp.total_count} UNIDADES
                                        </p>
                                        <div className="w-full bg-dark h-1.5 rounded-full mt-3 overflow-hidden border border-white/5">
                                            <div
                                                className="bg-primary h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000"
                                                style={{ width: `${(camp.sent_count / camp.total_count) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
