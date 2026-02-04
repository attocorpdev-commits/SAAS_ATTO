import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Send,
    Calendar,
    Clock,
    Users,
    FileText,
    CheckCircle2,
    X,
    ChevronRight,
    ChevronLeft,
    Play
} from 'lucide-react';
import axios from 'axios';

interface Campaign {
    id: string;
    name: string;
    status: string;
    scheduled_at: string;
    sent_count: number;
    total_count: number;
    created_at: string;
    template_id: string;
}

export const Campaigns: React.FC = () => {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [step, setStep] = useState(1);

    // Wizard State
    const [newCampaign, setNewCampaign] = useState({
        name: '',
        template_id: '',
        target_type: 'tags' as 'tags' | 'all',
        selected_tags: [] as string[],
        scheduled_at: '',
        delaySeconds: 5 // Default delay
    });

    const [templates, setTemplates] = useState<any[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);

    useEffect(() => {
        fetchCampaigns();
        fetchData();
    }, [user]);

    async function fetchCampaigns() {
        if (!user) return;
        setLoading(true);
        const { data } = await supabase
            .from('campaigns')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (data) setCampaigns(data);
        setLoading(false);
    }

    async function fetchData() {
        if (!user) return;
        const { data: tData } = await supabase.from('templates').select('*').eq('user_id', user.id);
        const { data: cData } = await supabase.from('contacts').select('tags').eq('user_id', user.id);

        if (tData) setTemplates(tData);
        if (cData) {
            const tags = new Set<string>();
            cData.forEach(c => c.tags?.forEach((t: string) => tags.add(t)));
            setAvailableTags(Array.from(tags));
        }
    }

    const handleStartCampaign = async () => {
        if (!user) {
            alert('Você precisa estar logado para iniciar uma campanha.');
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('evolution_api_key, evolution_instance_id')
            .eq('id', user.id)
            .single();

        if (!profile?.evolution_api_key || !profile?.evolution_instance_id) {
            alert('Configure suas credenciais da Evolution API nas Configurações antes de iniciar.');
            return;
        }

        // 1. Buscar contatos alvo
        let query = supabase.from('contacts').select('id, phone, name').eq('user_id', user.id);
        if (newCampaign.target_type === 'tags' && newCampaign.selected_tags.length > 0) {
            query = query.overlaps('tags', newCampaign.selected_tags);
        }

        const { data: targetContacts, error: cError } = await query;
        if (cError || !targetContacts || targetContacts.length === 0) {
            alert('Nenhum contato encontrado para os critérios selecionados.');
            return;
        }

        setLoading(true);

        // 2. Criar a campanha no banco
        const { data: camp, error: campError } = await supabase.from('campaigns').insert({
            user_id: user.id,
            name: newCampaign.name,
            template_id: newCampaign.template_id,
            status: 'processing',
            scheduled_at: new Date().toISOString(),
            total_count: targetContacts.length,
            sent_count: 0
        }).select().single();

        if (campError) {
            alert('Erro ao criar campanha: ' + campError.message);
            setLoading(false);
            return;
        }

        // 3. Pegar o conteúdo do template
        const { data: template } = await supabase
            .from('templates')
            .select('content')
            .eq('id', newCampaign.template_id)
            .single();

        setIsWizardOpen(false);
        fetchCampaigns();

        // 4. Loop de envio (Direto pelo navegador)
        const baseUrl = import.meta.env.VITE_EVOLUTION_API_URL || 'https://api.evolution-api.com';

        for (let i = 0; i < targetContacts.length; i++) {
            const contact = targetContacts[i];
            let messageText = template?.content || '';
            messageText = messageText.replace(/{{nome}}/g, contact.name);

            try {
                // Enviar para Evolution API
                await axios.post(`${baseUrl}/message/sendText/${profile.evolution_instance_id}`, {
                    number: contact.phone.replace(/\D/g, ''),
                    text: messageText,
                    options: { delay: 1200, presence: 'composing' }
                }, {
                    headers: { 'apikey': profile.evolution_api_key }
                });

                // Registrar mensagem como enviada
                await supabase.from('messages').insert({
                    campaign_id: camp.id,
                    contact_id: contact.id,
                    content: messageText,
                    status: 'sent',
                    sent_at: new Date().toISOString()
                });

                // Atualizar progresso da campanha
                await supabase.rpc('increment_campaign_sent', { camp_id: camp.id });

                // Recarregar lista para mostrar progresso
                fetchCampaigns();
            } catch (err) {
                console.error('Erro ao enviar para', contact.name, err);
                await supabase.from('messages').insert({
                    campaign_id: camp.id,
                    contact_id: contact.id,
                    content: messageText,
                    status: 'failed',
                    error_message: 'Erro na API'
                });
            }

            // Delay customizável entre mensagens
            await new Promise(resolve => setTimeout(resolve, newCampaign.delaySeconds * 1000));
        }

        setLoading(false);
        alert('Campanha finalizada!');
        fetchCampaigns();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Campanhas</h2>
                    <p className="text-slate-500 text-sm mt-1">Gerencie e acompanhe seus disparos em massa.</p>
                </div>
                <button
                    onClick={() => {
                        setStep(1);
                        setIsWizardOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    <Play className="w-4 h-4" />
                    Nova Campanha
                </button>
            </div>

            {/* Campaigns List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="bg-white p-12 rounded-xl border border-slate-200 animate-pulse"></div>
                ) : campaigns.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300 text-slate-500">
                        Nenhuma campanha configurada.
                    </div>
                ) : (
                    campaigns.map((camp) => (
                        <div key={camp.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-slate-900">{camp.name}</h3>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                        camp.status === 'completed' ? "bg-green-100 text-green-700" :
                                            camp.status === 'processing' ? "bg-blue-100 text-blue-700 animate-pulse" :
                                                "bg-slate-100 text-slate-600"
                                    )}>
                                        {camp.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(camp.created_at).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {camp.total_count} contatos</span>
                                </div>
                            </div>

                            <div className="flex-1 max-w-[200px]">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-slate-600">Progresso</span>
                                    <span className="text-xs font-bold text-primary">{Math.round((camp.sent_count / camp.total_count) * 100) || 0}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-primary h-full transition-all duration-500"
                                        style={{ width: `${(camp.sent_count / camp.total_count) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                                    <FileText className="w-5 h-5" />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Wizard Modal */}
            {isWizardOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Criar Campanha</h3>
                                <p className="text-sm text-slate-500">Passo {step} de 4</p>
                            </div>
                            <button onClick={() => setIsWizardOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 flex-1 min-h-[300px]">
                            {step === 1 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Campanha</label>
                                        <input
                                            type="text"
                                            value={newCampaign.name}
                                            onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                            placeholder="Ex: Promoção de Natal"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Selecione o Template</label>
                                        <select
                                            value={newCampaign.template_id}
                                            onChange={(e) => setNewCampaign({ ...newCampaign, template_id: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                        >
                                            <option value="">Selecione um template...</option>
                                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                        {templates.length === 0 && (
                                            <p className="mt-2 text-xs text-red-500">Você precisa criar um template antes de iniciar uma campanha.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setNewCampaign({ ...newCampaign, target_type: 'all' })}
                                            className={cn(
                                                "p-4 border-2 rounded-xl text-left transition-all",
                                                newCampaign.target_type === 'all' ? "border-primary bg-blue-50" : "border-slate-100 hover:border-slate-200"
                                            )}
                                        >
                                            <Users className={cn("w-6 h-6 mb-2", newCampaign.target_type === 'all' ? "text-primary" : "text-slate-400")} />
                                            <p className="font-bold text-slate-900">Todos os contatos</p>
                                            <p className="text-xs text-slate-500 mt-1">Enviar para sua lista completa.</p>
                                        </button>
                                        <button
                                            onClick={() => setNewCampaign({ ...newCampaign, target_type: 'tags' })}
                                            className={cn(
                                                "p-4 border-2 rounded-xl text-left transition-all",
                                                newCampaign.target_type === 'tags' ? "border-primary bg-blue-50" : "border-slate-100 hover:border-slate-200"
                                            )}
                                        >
                                            <FileText className={cn("w-6 h-6 mb-2", newCampaign.target_type === 'tags' ? "text-primary" : "text-slate-400")} />
                                            <p className="font-bold text-slate-900">Por Tags</p>
                                            <p className="text-xs text-slate-500 mt-1">Segmentar por tags específicas.</p>
                                        </button>
                                    </div>

                                    {newCampaign.target_type === 'tags' && (
                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium text-slate-700">Selecione as Tags</label>
                                            <div className="flex flex-wrap gap-2">
                                                {availableTags.map(tag => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => {
                                                            const tags = newCampaign.selected_tags.includes(tag)
                                                                ? newCampaign.selected_tags.filter(t => t !== tag)
                                                                : [...newCampaign.selected_tags, tag];
                                                            setNewCampaign({ ...newCampaign, selected_tags: tags });
                                                        }}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                                                            newCampaign.selected_tags.includes(tag)
                                                                ? "bg-primary border-primary text-white"
                                                                : "bg-white border-slate-200 text-slate-600 hover:border-primary"
                                                        )}
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-primary" />
                                            Configurações de Envio
                                        </h4>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-3 flex justify-between">
                                                    Intervalo entre mensagens:
                                                    <span className="text-primary font-bold">{newCampaign.delaySeconds} segundos</span>
                                                </label>
                                                <input
                                                    type="range"
                                                    min="2"
                                                    max="60"
                                                    step="1"
                                                    value={newCampaign.delaySeconds}
                                                    onChange={(e) => setNewCampaign({ ...newCampaign, delaySeconds: parseInt(e.target.value) })}
                                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                                    <span>2s</span>
                                                    <span>Recomendado: 5-15s</span>
                                                    <span>60s</span>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-200">
                                                <p className="text-sm font-medium text-slate-700 mb-3">Quando iniciar?</p>
                                                <div className="space-y-3">
                                                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="schedule"
                                                            checked={!newCampaign.scheduled_at}
                                                            onChange={() => setNewCampaign({ ...newCampaign, scheduled_at: '' })}
                                                            className="w-4 h-4 text-primary"
                                                        />
                                                        <span className="text-sm font-medium text-slate-700">Imediatamente</span>
                                                    </label>
                                                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="schedule"
                                                            checked={!!newCampaign.scheduled_at}
                                                            onChange={() => setNewCampaign({ ...newCampaign, scheduled_at: new Date().toISOString() })}
                                                            className="w-4 h-4 text-primary"
                                                        />
                                                        <span className="text-sm font-medium text-slate-700">Agendar para depois</span>
                                                    </label>

                                                    {newCampaign.scheduled_at && (
                                                        <input
                                                            type="datetime-local"
                                                            value={newCampaign.scheduled_at.slice(0, 16)}
                                                            onChange={(e) => setNewCampaign({ ...newCampaign, scheduled_at: new Date(e.target.value).toISOString() })}
                                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="text-center mb-8">
                                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-900">Tudo pronto!</h4>
                                        <p className="text-slate-500 mt-1">Revise os detalhes antes de confirmar.</p>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-xl space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Nome:</span>
                                            <span className="font-bold text-slate-900">{newCampaign.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Template:</span>
                                            <span className="font-bold text-slate-900">{templates.find(t => t.id === newCampaign.template_id)?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Público:</span>
                                            <span className="font-bold text-slate-900">
                                                {newCampaign.target_type === 'all' ? 'Todos os contatos' : `${newCampaign.selected_tags.join(', ')}`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Início:</span>
                                            <span className="font-bold text-primary">
                                                {newCampaign.scheduled_at ? new Date(newCampaign.scheduled_at).toLocaleString() : 'Imediato'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                            <button
                                disabled={step === 1}
                                onClick={() => setStep(step - 1)}
                                className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold disabled:opacity-30"
                            >
                                <ChevronLeft className="w-4 h-4" /> Voltar
                            </button>

                            {step < 4 ? (
                                <button
                                    disabled={(step === 1 && (!newCampaign.name || !newCampaign.template_id))}
                                    onClick={() => setStep(step + 1)}
                                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    Próximo <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleStartCampaign}
                                    className="flex items-center gap-2 px-8 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                    Confirmar e Iniciar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
