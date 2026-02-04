import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Key, Globe, Database, Save, CheckCircle, AlertCircle, RefreshCw, Send, Play } from 'lucide-react';
import axios from 'axios';

export const Settings: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [settings, setSettings] = useState({
        evolution_api_key: '',
        evolution_instance_id: '',
        webhook_url: '',
    });

    useEffect(() => {
        async function fetchSettings() {
            // Se não houver usuário, apenas carrega valores vazios
            if (!user) {
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('profiles')
                .select('evolution_api_key, evolution_instance_id, webhook_url')
                .eq('id', user.id)
                .single();

            if (data) {
                setSettings({
                    evolution_api_key: data.evolution_api_key || '',
                    evolution_instance_id: data.evolution_instance_id || '',
                    webhook_url: data.webhook_url || '',
                });
            }
            setLoading(false);
        }
        fetchSettings();
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setMessage({ type: 'error', text: 'Você precisa estar autenticado para salvar configurações.' });
            return;
        }

        setSaving(true);
        setMessage(null);

        const { error } = await supabase
            .from('profiles')
            .update({
                evolution_api_key: settings.evolution_api_key,
                evolution_instance_id: settings.evolution_instance_id,
                webhook_url: settings.webhook_url,
            })
            .eq('id', user.id);

        if (error) {
            setMessage({ type: 'error', text: 'Erro ao salvar configurações: ' + error.message });
        } else {
            setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
        }
        setSaving(false);
    };

    const testConnection = async () => {
        setTesting(true);
        setMessage(null);
        try {
            const baseUrl = import.meta.env.VITE_EVOLUTION_API_URL || 'https://api.evolution-api.com';

            const response = await axios.get(`${baseUrl}/instance/fetchInstances`, {
                headers: {
                    'apikey': settings.evolution_api_key
                }
            });

            const instances = response.data;
            const exists = instances.find((i: any) => i.name === settings.evolution_instance_id);

            if (exists) {
                setMessage({ type: 'success', text: 'Conexão estabelecida! Instância "' + settings.evolution_instance_id + '" encontrada.' });
            } else {
                setMessage({ type: 'error', text: 'API Key válida, mas Instância não encontrada.' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Erro de conexão: ' + (err.response?.data?.message || err.message) });
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-64 bg-slate-100 rounded"></div>
        </div>;
    }

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Configurações da API</h2>
                <p className="text-slate-500 text-sm mt-1">Conecte sua conta com a Evolution API para começar a disparar mensagens.</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <form onSubmit={handleSave} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Key className="w-4 h-4 text-slate-400" />
                                Evolution API Key
                            </label>
                            <input
                                type="password"
                                value={settings.evolution_api_key}
                                onChange={(e) => setSettings({ ...settings, evolution_api_key: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="Ex: 3F9A2B..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Database className="w-4 h-4 text-slate-400" />
                                Instance ID
                            </label>
                            <input
                                type="text"
                                value={settings.evolution_instance_id}
                                onChange={(e) => setSettings({ ...settings, evolution_instance_id: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="Nome da sua instância"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-slate-400" />
                                Webhook URL (Opcional)
                            </label>
                            <input
                                type="url"
                                value={settings.webhook_url}
                                onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="https://sua-url.com/webhook"
                            />
                            <p className="text-xs text-slate-500">URL para receber status de entrega e leitura das mensagens.</p>
                        </div>
                    </div>

                    {message && (
                        <div className={cn(
                            "p-4 rounded-lg flex items-start gap-3 border",
                            message.type === 'success' ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800"
                        )}>
                            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
                            <span className="text-sm font-medium">{message.text}</span>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={saving || !user}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salvar Configurações
                        </button>
                        <button
                            type="button"
                            onClick={testConnection}
                            disabled={testing || !settings.evolution_api_key || !settings.evolution_instance_id}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                            Testar Conexão
                        </button>
                    </div>
                </form>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <h4 className="text-blue-900 font-bold mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Como obter as credenciais?
                </h4>
                <div className="text-blue-800 text-sm space-y-2">
                    <p>1. Acesse seu painel da Evolution API.</p>
                    <p>2. No menu lateral, vá em "Global Apikey" para obter sua chave.</p>
                    <p>3. Crie uma nova instância e utilize o nome definido como "Instance ID".</p>
                    <p>4. Cole as informações acima e clique em "Salvar".</p>
                </div>
            </div>

            {/* Quick Test Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Send className="w-5 h-5 text-primary" />
                    Teste de Envio Rápido
                </h3>
                <p className="text-slate-500 text-sm mb-6">Envie uma mensagem de teste para validar sua conexão em tempo real.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Número (com DDI e DDD)</label>
                        <input
                            type="text"
                            id="test_number"
                            placeholder="Ex: 5511999999999"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Mensagem</label>
                        <input
                            type="text"
                            id="test_message"
                            placeholder="Sua mensagem de teste"
                            defaultValue="Olá! Este é um teste do Evolution SAAS. 🚀"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={async () => {
                        const number = (document.getElementById('test_number') as HTMLInputElement).value;
                        const text = (document.getElementById('test_message') as HTMLInputElement).value;

                        if (!number) {
                            alert('Por favor, insira um número.');
                            return;
                        }

                        setTesting(true);
                        try {
                            const baseUrl = import.meta.env.VITE_EVOLUTION_API_URL || 'https://api.evolution-api.com';
                            const response = await axios.post(`${baseUrl}/message/sendText/${settings.evolution_instance_id}`, {
                                number: number.replace(/\D/g, ''),
                                text: text,
                                options: { delay: 1200, presence: 'composing' }
                            }, {
                                headers: { 'apikey': settings.evolution_api_key }
                            });

                            if (response.data) {
                                alert('✅ Mensagem enviada com sucesso!');
                            }
                        } catch (err: any) {
                            alert('❌ Erro ao enviar: ' + (err.response?.data?.message || err.message));
                        } finally {
                            setTesting(false);
                        }
                    }}
                    disabled={testing || !settings.evolution_api_key || !settings.evolution_instance_id}
                    className="w-full sm:w-auto px-8 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                    {testing ? <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> : <Play className="w-4 h-4 inline mr-2" />}
                    Enviar Mensagem de Teste
                </button>
            </div>
        </div>
    );
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
