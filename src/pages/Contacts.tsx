import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Plus,
    Upload,
    Search,
    Filter,
    MoreVertical,
    UserPlus,
    FileDown,
    Trash2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

interface Contact {
    id: string;
    name: string;
    phone: string;
    tags: string[];
    status: string;
    created_at: string;
}

export const Contacts: React.FC = () => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [gdprConsent, setGdprConsent] = useState(false);

    useEffect(() => {
        fetchContacts();
    }, [user]);

    async function fetchContacts() {
        if (!user) return;
        setLoading(true);
        const { data } = await supabase
            .from('contacts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) setContacts(data);
        setLoading(false);
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (!gdprConsent) {
            setNotification({ type: 'error', text: 'Você deve confirmar o consentimento GDPR para importar contatos.' });
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');

            const newContacts = lines.slice(1)
                .filter(line => line.trim() !== '')
                .map(line => {
                    const values = line.split(',');
                    return {
                        user_id: user.id,
                        name: values[0]?.trim(),
                        phone: values[1]?.trim().replace(/\D/g, ''), // Keep only digits
                        tags: values[2] ? values[2].split(';').map(t => t.trim()) : [],
                        status: 'active'
                    };
                })
                .filter(c => c.name && c.phone); // Basic validation

            if (newContacts.length === 0) {
                setNotification({ type: 'error', text: 'Nenhum contato válido encontrado no CSV.' });
                return;
            }

            const { error } = await supabase.from('contacts').insert(newContacts);

            if (error) {
                setNotification({ type: 'error', text: 'Erro ao importar: ' + error.message });
            } else {
                setNotification({ type: 'success', text: `${newContacts.length} contatos importados com sucesso!` });
                fetchContacts();
                setIsUploadModalOpen(false);
            }
        };
        reader.readAsText(file);
    };

    const deleteContact = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este contato?')) return;

        const { error } = await supabase.from('contacts').delete().eq('id', id);
        if (!error) {
            setContacts(contacts.filter(c => c.id !== id));
            setNotification({ type: 'success', text: 'Contato excluído.' });
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Contatos</h2>
                    <p className="text-slate-500 text-sm mt-1">Gerencie sua lista de contatos e audiência.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Importar CSV
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        <UserPlus className="w-4 h-4" />
                        Novo Contato
                    </button>
                </div>
            </div>

            {notification && (
                <div className={cn(
                    "p-4 rounded-lg flex items-center justify-between border animate-fade-in",
                    notification.type === 'success' ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800"
                )}>
                    <div className="flex items-center gap-3">
                        {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="text-sm font-medium">{notification.text}</span>
                    </div>
                    <button onClick={() => setNotification(null)} className="text-current opacity-50 hover:opacity-100 italic text-xs">Fechar</button>
                </div>
            )}

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                        <Filter className="w-4 h-4" />
                        Filtros
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                        <FileDown className="w-4 h-4" />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse responsive-table">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Telefone</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tags</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Criado em</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        Nenhum contato encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredContacts.map((contact) => (
                                    <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap" data-label="Nome">
                                            <div className="font-medium text-slate-900">{contact.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600" data-label="Telefone">
                                            {contact.phone}
                                        </td>
                                        <td className="px-6 py-4" data-label="Tags">
                                            <div className="flex flex-wrap gap-1">
                                                {contact.tags?.map((tag, i) => (
                                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap" data-label="Status">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                contact.status === 'active' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                            )}>
                                                {contact.status === 'active' ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500" data-label="Criado em">
                                            {new Date(contact.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button className="text-slate-400 hover:text-primary transition-colors">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => deleteContact(contact.id)}
                                                    className="text-slate-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Upload className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Importar Contatos</h3>
                            <p className="text-slate-500 text-sm mt-1">Carregue um arquivo CSV com nome, telefone e tags.</p>
                        </div>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-slate-50 transition-all group"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".csv"
                                className="hidden"
                            />
                            <Plus className="w-10 h-10 text-slate-300 mx-auto mb-2 group-hover:text-primary transition-colors" />
                            <p className="text-sm font-medium text-slate-600">Clique para selecionar ou arraste o arquivo</p>
                            <p className="text-xs text-slate-400 mt-1">Apenas arquivos .CSV são permitidos</p>
                        </div>

                        <div className="mt-6 bg-slate-50 rounded-lg p-4 text-xs text-slate-500 leading-relaxed">
                            <p className="font-semibold text-slate-700 mb-1">Formato esperado:</p>
                            <p>Nome, Telefone, Tags (separadas por ;)</p>
                            <p className="mt-1">Exemplo: João Silva, 5511999999999, lead;promo-verao</p>
                        </div>

                        <div className="mt-4 flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="gdpr"
                                checked={gdprConsent}
                                onChange={(e) => setGdprConsent(e.target.checked)}
                                className="mt-1 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                            />
                            <label htmlFor="gdpr" className="text-[10px] text-slate-500">
                                Confirmo que possuo o consentimento destes contatos para o envio de mensagens, em conformidade com a LGPD/GDPR.
                            </label>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
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
