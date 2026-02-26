import React from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { IconSearch, IconPlus, IconEdit, IconTrash } from './Icons'

const DEMO_PROCEDURES = [
    { id: 'demo1', name: 'Avaliação odontológica', value: 180 },
    { id: 'demo2', name: 'Profilaxia (limpeza)', value: 250 },
    { id: 'demo3', name: 'Restaurações', value: 300 },
    { id: 'demo4', name: 'Atendimento infantil', value: 200 },
    { id: 'demo5', name: 'Cirurgias odontológicas', value: 500 },
    { id: 'demo6', name: 'Clareamento dental', value: 800 }
]

export default function Procedimentos({ onShowModal, showToast }) {
    const [procedures, setProcedures] = React.useState([])
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState('')

    React.useEffect(() => {
        loadProcedures()
    }, [])

    async function loadProcedures() {
        setLoading(true)
        if (!supabaseConfigured) {
            setProcedures(DEMO_PROCEDURES)
            setLoading(false)
            return
        }

        const { data, error } = await supabase.from('procedures').select('*').order('name')
        if (error) {
            showToast('Erro ao carregar procedimentos', 'error')
        } else {
            setProcedures(data || [])
        }
        setLoading(false)
    }

    const filtered = procedures.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div style={{ padding: '0 20px', maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center' }}>
                <div className="search-bar" style={{ flex: 1, marginBottom: 0 }}>
                    <IconSearch />
                    <input
                        type="text"
                        placeholder="Buscar procedimentos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button className="btn btn-primary" onClick={() => onShowModal('procedure')}>
                    <IconPlus /> Novo Procedimento
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div className="loading-spinner" style={{ margin: '40px auto' }} />
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <IconListCheck />
                        <h3>Nenhum procedimento encontrado</h3>
                        <p>Adicione um novo procedimento para começar.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nome do Procedimento</th>
                                    <th style={{ width: 150, textAlign: 'right' }}>Valor Baseline (R$)</th>
                                    <th style={{ width: 100, textAlign: 'center' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(p => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                                        <td style={{ textAlign: 'right' }}>R$ {Number(p.value).toFixed(2).replace('.', ',')}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                                <button
                                                    className="btn-icon"
                                                    title="Editar"
                                                    onClick={() => onShowModal('procedure', p)}
                                                >
                                                    <IconEdit />
                                                </button>
                                                {/* In a real app we might soft-delete or check constraints before deleting */}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

function IconListCheck() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 48, color: 'var(--text-muted)' }}>
            <path d="M11 5H21" /><path d="M11 12H21" /><path d="M11 19H21" /><path d="M3 5l2 2 4-4" /><path d="M3 12l2 2 4-4" /><path d="M3 19l2 2 4-4" />
        </svg>
    )
}
