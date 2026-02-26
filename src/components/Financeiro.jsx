import React from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { IconPlus, IconTrash } from './Icons'
import ConfirmDialog from './ConfirmDialog'

const DEMO_TRANSACTIONS = [
    { id: 't1', description: 'Consulta Ana Paula', type: 'receita', value: 250, date: '2026-02-24', method: 'Pix', category: 'Consulta' },
    { id: 't2', description: 'Restauração João Mendes', type: 'receita', value: 480, date: '2026-02-23', method: 'Cartão', category: 'Procedimento' },
    { id: 't3', description: 'Material odontológico', type: 'despesa', value: 320, date: '2026-02-22', method: 'Boleto', category: 'Material' },
    { id: 't4', description: 'Limpeza Camila Rocha', type: 'receita', value: 180, date: '2026-02-21', method: 'Dinheiro', category: 'Consulta' },
    { id: 't5', description: 'Canal Roberto Santos', type: 'receita', value: 850, date: '2026-02-20', method: 'Pix', category: 'Procedimento' },
    { id: 't6', description: 'Conta de luz', type: 'despesa', value: 450, date: '2026-02-19', method: 'Boleto', category: 'Aluguel' },
    { id: 't7', description: 'Clareamento Mariana', type: 'receita', value: 600, date: '2026-02-18', method: 'Cartão', category: 'Procedimento' },
    { id: 't8', description: 'Assistente dental', type: 'despesa', value: 2800, date: '2026-02-15', method: 'TED', category: 'Funcionários' },
]

export default function Financeiro({ onShowModal, showToast, extraTransactions = [] }) {
    const [transactions, setTransactions] = React.useState([])
    const [filter, setFilter] = React.useState('todos')
    const [loading, setLoading] = React.useState(true)
    const [period, setPeriod] = React.useState('mes')
    const [confirmDelete, setConfirmDelete] = React.useState(null)

    React.useEffect(() => { loadTransactions() }, [period, extraTransactions])

    async function loadTransactions() {
        setLoading(true)
        if (!supabaseConfigured) { setTransactions([...extraTransactions, ...DEMO_TRANSACTIONS]); setLoading(false); return }
        const today = new Date()
        const formatD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        let startDate
        if (period === 'semana') { const d = new Date(today); d.setDate(today.getDate() - today.getDay()); startDate = formatD(d) }
        else if (period === 'mes') { startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01` }
        else { startDate = `${today.getFullYear()}-01-01` }
        const { data } = await supabase.from('transactions').select('*').gte('date', startDate).lte('date', formatD(today)).order('date', { ascending: false })
        setTransactions(data || [])
        setLoading(false)
    }

    async function executeDeleteTransaction(t) {
        setConfirmDelete(null)
        if (!supabaseConfigured) { setTransactions(prev => prev.filter(x => x.id !== t.id)); showToast('✅ Lançamento removido.'); return }
        const { error } = await supabase.from('transactions').delete().eq('id', t.id)
        if (error) showToast('Erro: ' + error.message, 'error')
        else { showToast('✅ Lançamento removido.'); loadTransactions() }
    }

    const filtered = filter === 'todos' ? transactions : transactions.filter(t => t.type === filter)
    const totalReceita = transactions.filter(t => t.type === 'receita').reduce((s, t) => s + Number(t.value), 0)
    const totalDespesa = transactions.filter(t => t.type === 'despesa').reduce((s, t) => s + Number(t.value), 0)
    const saldo = totalReceita - totalDespesa
    const fmt = (v) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    const fmtDate = (d) => d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : '—'

    return (
        <>
            <div className="finance-grid">
                <div className="finance-card receita"><div className="finance-label">Total Receitas</div><div className="finance-value">{fmt(totalReceita)}</div></div>
                <div className="finance-card despesa"><div className="finance-label">Total Despesas</div><div className="finance-value">{fmt(totalDespesa)}</div></div>
                <div className="finance-card saldo"><div className="finance-label">Saldo Líquido</div><div className="finance-value">{fmt(saldo)}</div></div>
            </div>
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">💰 Lançamentos</h3>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div className="filter-tabs" style={{ marginBottom: 0 }}>
                            {[{ k: 'semana', l: 'Semana' }, { k: 'mes', l: 'Mês' }, { k: 'ano', l: 'Ano' }].map(p => (
                                <button key={p.k} className={`filter-tab ${period === p.k ? 'active' : ''}`} onClick={() => setPeriod(p.k)}>{p.l}</button>
                            ))}
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => onShowModal('transaction')}><IconPlus /> Novo</button>
                    </div>
                </div>
                <div className="filter-tabs">
                    {[{ k: 'todos', l: 'Todos' }, { k: 'receita', l: 'Receitas' }, { k: 'despesa', l: 'Despesas' }].map(f => (
                        <button key={f.k} className={`filter-tab ${filter === f.k ? 'active' : ''}`} onClick={() => setFilter(f.k)}>{f.l}</button>
                    ))}
                </div>
                {loading ? <div className="loading-spinner" /> : (
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Método</th><th>Tipo</th><th>Valor</th><th></th></tr></thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={7}><div className="empty-state"><h3>Nenhum lançamento</h3></div></td></tr>
                                ) : filtered.map(t => (
                                    <tr key={t.id}>
                                        <td>{fmtDate(t.date)}</td>
                                        <td style={{ fontWeight: 600 }}>{t.description}</td>
                                        <td>{t.category || '—'}</td><td>{t.method || '—'}</td>
                                        <td><span className={`type-badge ${t.type}`}>{t.type}</span></td>
                                        <td style={{ fontWeight: 700, color: t.type === 'receita' ? 'var(--success)' : 'var(--danger)' }}>
                                            {t.type === 'despesa' ? '- ' : '+ '}{fmt(t.value)}
                                        </td>
                                        <td><button className="btn-icon" onClick={() => setConfirmDelete(t)} style={{ color: 'var(--danger)' }}><IconTrash /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {confirmDelete && (
                <ConfirmDialog
                    title="Excluir Lançamento"
                    message={`Deseja excluir o lançamento "${confirmDelete.description}" no valor de R$ ${Number(confirmDelete.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}?`}
                    confirmLabel="Excluir"
                    type="danger"
                    onConfirm={() => executeDeleteTransaction(confirmDelete)}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
        </>
    )
}
