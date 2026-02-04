import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Plus,
    Eye,
    Edit2,
    Trash2,
    Save,
    X,
    Variable
} from 'lucide-react';

interface Template {
    id: string;
    name: string;
    content: string;
    variables: string[];
    category: string;
    created_at: string;
}

export const Templates: React.FC = () => {
    const { user } = useAuth();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, [user]);

    async function fetchTemplates() {
        setLoading(true);
        // Se não houver usuário, tenta buscar sem filtro ou usa uma lista vazia
        const query = supabase
            .from('templates')
            .select('*');

        if (user) {
            query.eq('user_id', user.id);
        }

        const { data } = await query.order('created_at', { ascending: false });

        if (data) setTemplates(data);
        setLoading(false);
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTemplate?.name || !editingTemplate?.content) return;

        // Extract variables like {{name}}
        const varRegex = /{{(.*?)}}/g;
        const variables = Array.from(editingTemplate.content.matchAll(varRegex)).map(match => match[1].trim());

        let finalContent = editingTemplate.content;
        if (!finalContent.toLowerCase().includes('stop')) {
            finalContent += '\n\nResponda STOP para cancelar';
        }

        // Se não houver usuário, enviamos null (permitido após alteração no SQL)
        const userId = user?.id || null;

        const templateData = {
            ...editingTemplate,
            content: finalContent,
            user_id: userId,
            variables: Array.from(new Set(variables)), // Unique variables
        };

        let error;
        try {
            if (editingTemplate.id) {
                const { error: err } = await supabase.from('templates').update(templateData).eq('id', editingTemplate.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('templates').insert([templateData]);
                error = err;
            }
        } catch (err: any) {
            error = err;
        }

        if (error) {
            alert('Erro ao salvar: ' + (error.message || 'Verifique se o RLS está desabilitado no Supabase para acesso sem login.'));
        } else {
            setIsEditorOpen(false);
            fetchTemplates();
        }
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm('Excluir este template?')) return;
        await supabase.from('templates').delete().eq('id', id);
        fetchTemplates();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Templates</h2>
                    <p className="text-slate-500 text-sm mt-1">Crie templates reutilizáveis para suas campanhas.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingTemplate({ name: '', content: '', category: 'marketing' });
                        setIsEditorOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Novo Template
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-48 bg-white border border-slate-200 rounded-xl animate-pulse"></div>
                    ))
                ) : templates.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-white border border-dashed border-slate-300 rounded-xl text-slate-500">
                        Nenhum template criado ainda.
                    </div>
                ) : (
                    templates.map((template) => (
                        <div key={template.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                            <div className="p-5 flex-1">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="px-2 py-0.5 bg-blue-50 text-primary text-xs font-bold rounded uppercase">
                                        {template.category}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingTemplate(template);
                                                setIsEditorOpen(true);
                                            }}
                                            className="text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteTemplate(template.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">{template.name}</h3>
                                <p className="text-sm text-slate-600 line-clamp-3 whitespace-pre-wrap">
                                    {template.content}
                                </p>
                            </div>
                            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Variable className="w-3 h-3" />
                                    {template.variables?.length || 0} variáveis
                                </div>
                                <button className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> Preview
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Editor Modal */}
            {isEditorOpen && (editingTemplate) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
                        {/* Editor Side */}
                        <div className="flex-1 p-8 border-r border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-900">
                                    {editingTemplate.id ? 'Editar Template' : 'Novo Template'}
                                </h3>
                                <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Template</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingTemplate.name}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Ex: Boas-vindas"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                    <select
                                        value={editingTemplate.category}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                    >
                                        <option value="marketing">Marketing</option>
                                        <option value="support">Suporte</option>
                                        <option value="transactional">Transacional</option>
                                    </select>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-medium text-slate-700">Conteúdo da Mensagem</label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const content = (editingTemplate.content || '') + ' {{nome}}';
                                                    setEditingTemplate({ ...editingTemplate, content });
                                                }}
                                                className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded font-mono text-slate-700"
                                            >
                                                + {"{{nome}}"}
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        required
                                        rows={8}
                                        value={editingTemplate.content}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none font-sans"
                                        placeholder="Olá {{nome}}, tudo bem? ..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        Salvar Template
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Preview Side */}
                        <div className="w-full md:w-80 bg-slate-50 p-8 flex flex-col">
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Preview WhatsApp</h4>
                            <div className="relative flex-1">
                                {/* iPhone style container */}
                                <div className="bg-white rounded-2xl shadow-lg p-4 border border-slate-200 min-h-[300px] flex flex-col">
                                    <div className="bg-[#DCF8C6] self-start rounded-lg rounded-tl-none p-3 shadow-sm max-w-[90%] mb-2 animate-fade-in">
                                        <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">
                                            {editingTemplate.content || 'Digite algo para ver o preview...'}
                                        </p>
                                        <span className="text-[10px] text-slate-500 mt-1 block text-right">09:41</span>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-3">
                                    <p className="text-xs text-slate-400 italic">
                                        Dica: Use <b>*texto*</b> para negrito, <i>_texto_</i> para itálico e <s>~texto~</s> para tachado.
                                    </p>
                                    <p className="text-xs text-slate-400 italic">
                                        Insira variáveis usando chaves duplas: <b>{"{{variável}}"}</b>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
