import React from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { IconSearch, IconPlus, IconEdit, IconTrash, IconFile } from './Icons'
import ConfirmDialog from './ConfirmDialog'

const DEMO_PATIENTS = [
    { id: 'p1', name: 'Ana Paula Ferreira', cpf: '123.456.789-00', phone: '(31) 99876-5432', email: 'ana@email.com', birthdate: '1990-05-15', blood_type: 'A+', allergies: 'Penicilina', notes: 'Paciente pontual', created_at: '2025-01-10T10:00:00Z' },
    { id: 'p2', name: 'João Mendes', cpf: '987.654.321-00', phone: '(31) 98765-4321', email: 'joao@email.com', birthdate: '1985-08-22', blood_type: 'O+', allergies: '', notes: '', created_at: '2025-02-14T10:00:00Z' },
    { id: 'p3', name: 'Camila Rocha', cpf: '456.789.123-00', phone: '(31) 91234-5678', email: 'camila@email.com', birthdate: '1995-11-03', blood_type: 'B-', allergies: 'Latex', notes: 'Ansiosa com procedimentos', created_at: '2025-03-01T10:00:00Z' },
    { id: 'p4', name: 'Roberto Santos', cpf: '321.654.987-00', phone: '(31) 99999-1111', email: 'roberto@email.com', birthdate: '1978-02-28', blood_type: 'AB+', allergies: '', notes: '', created_at: '2025-04-20T10:00:00Z' },
    { id: 'p5', name: 'Mariana Oliveira', cpf: '654.321.987-00', phone: '(31) 98888-2222', email: 'mariana@email.com', birthdate: '2000-07-12', blood_type: 'O-', allergies: 'Dipirona', notes: 'Clareamento em andamento', created_at: '2025-06-15T10:00:00Z' },
]

const DEMO_PRONTUARIO = [
    { id: 'e1', date: '2026-02-20', dentist: 'Dr. Carlos Silva', procedure: 'Limpeza e profilaxia', notes: 'Limpeza completa realizada. Gengivas saudáveis.', prontuario_files: [] },
    { id: 'e2', date: '2026-01-15', dentist: 'Dra. Fernanda Lima', procedure: 'Restauração', notes: 'Restauração no dente 36, resina composta.', prontuario_files: [{ id: 'f1', file_name: 'raio-x-36.jpg' }] },
]

const DEMO_CONSULTAS = [
    { id: 'c1', date: '2026-02-24', time: '10:00', procedure: 'Consulta de retorno', status: 'agendado' },
    { id: 'c2', date: '2026-02-20', time: '09:00', procedure: 'Limpeza e profilaxia', status: 'realizado' },
    { id: 'c3', date: '2026-01-15', time: '14:00', procedure: 'Restauração', status: 'realizado' },
]

export default function Patients({ onShowModal, showToast }) {
    const [patients, setPatients] = React.useState([])
    const [search, setSearch] = React.useState('')
    const [selected, setSelected] = React.useState(null)
    const [detailTab, setDetailTab] = React.useState('info')
    const [prontuario, setProntuario] = React.useState([])
    const [consultas, setConsultas] = React.useState([])
    const [loading, setLoading] = React.useState(true)
    const [confirmDelete, setConfirmDelete] = React.useState(null)

    React.useEffect(() => { loadPatients() }, [])

    async function loadPatients() {
        setLoading(true)
        if (!supabaseConfigured) { setPatients(DEMO_PATIENTS); setLoading(false); return }
        const { data } = await supabase.from('patients').select('*').order('name')
        setPatients(data || [])
        setLoading(false)
    }

    async function selectPatient(p) {
        setSelected(p); setDetailTab('info')
        if (!supabaseConfigured) { setProntuario(DEMO_PRONTUARIO); setConsultas(DEMO_CONSULTAS); return }
        const { data: entries } = await supabase.from('prontuario_entries').select('*, prontuario_files(*)').eq('patient_id', p.id).order('date', { ascending: false })
        setProntuario(entries || [])
        const { data: appts } = await supabase.from('appointments').select('*').eq('patient_id', p.id).order('date', { ascending: false })
        setConsultas(appts || [])
    }

    async function executeDeletePatient(p) {
        setConfirmDelete(null)
        if (!supabaseConfigured) { setPatients(prev => prev.filter(x => x.id !== p.id)); setSelected(null); showToast(`✅ Paciente ${p.name} removido.`); return }
        const { error } = await supabase.from('patients').delete().eq('id', p.id)
        if (error) showToast('Erro: ' + error.message, 'error')
        else { showToast(`✅ Paciente ${p.name} removido.`); setSelected(null); loadPatients() }
    }

    const filtered = patients.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.cpf?.includes(search) || p.phone?.includes(search))
    const formatDate = (d) => d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : '—'
    const getInitials = (name) => name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'

    return (
        <>
            <div className="patients-container">
                <div className="patients-list">
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
                        <div className="search-bar" style={{ flex: 1, marginBottom: 0 }}>
                            <IconSearch />
                            <input placeholder="Buscar paciente por nome, CPF ou telefone..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button className="btn btn-primary" onClick={() => onShowModal('patient')}><IconPlus /> Novo Paciente</button>
                    </div>
                    {loading ? <div className="loading-spinner" /> : (
                        <div className="card" style={{ flex: 1, overflow: 'auto' }}>
                            <div className="table-container">
                                <table>
                                    <thead><tr><th>Paciente</th><th>CPF</th><th>Telefone</th><th>Email</th><th>Cadastro</th><th></th></tr></thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr><td colSpan={6}><div className="empty-state"><h3>Nenhum paciente encontrado</h3><p>Cadastre um novo paciente.</p></div></td></tr>
                                        ) : filtered.map(p => (
                                            <tr key={p.id} onClick={() => selectPatient(p)} style={{ cursor: 'pointer' }}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#1B4B72,#2C6A9E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{getInitials(p.name)}</div>
                                                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                                                    </div>
                                                </td>
                                                <td>{p.cpf || '—'}</td><td>{p.phone || '—'}</td><td>{p.email || '—'}</td>
                                                <td>{formatDate(p.created_at?.split('T')[0])}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 4 }}>
                                                        <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onShowModal('patient-edit', p) }}><IconEdit /></button>
                                                        <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setConfirmDelete(p) }} style={{ color: 'var(--danger)' }}><IconTrash /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {selected && (
                    <div className="patients-detail">
                        <div className="patient-detail-header">
                            <div className="patient-avatar">{getInitials(selected.name)}</div>
                            <div><h2>{selected.name}</h2><p>{selected.phone || 'Sem telefone'} · {selected.email || 'Sem email'}</p></div>
                        </div>
                        <div className="patient-tabs">
                            {['info', 'prontuario', 'consultas'].map(tab => (
                                <button key={tab} className={`patient-tab ${detailTab === tab ? 'active' : ''}`} onClick={() => setDetailTab(tab)}>
                                    {tab === 'info' ? 'Informações' : tab === 'prontuario' ? 'Prontuário' : 'Consultas'}
                                </button>
                            ))}
                        </div>
                        <div className="patient-detail-body">
                            {detailTab === 'info' && (
                                <div className="info-grid">
                                    <div className="info-item"><div className="info-label">CPF</div><div className="info-value">{selected.cpf || '—'}</div></div>
                                    <div className="info-item"><div className="info-label">Telefone</div><div className="info-value">{selected.phone || '—'}</div></div>
                                    <div className="info-item"><div className="info-label">Email</div><div className="info-value">{selected.email || '—'}</div></div>
                                    <div className="info-item"><div className="info-label">Nascimento</div><div className="info-value">{formatDate(selected.birthdate)}</div></div>
                                    <div className="info-item"><div className="info-label">Tipo Sanguíneo</div><div className="info-value">{selected.blood_type || '—'}</div></div>
                                    <div className="info-item"><div className="info-label">Alergias</div><div className="info-value">{selected.allergies || 'Nenhuma'}</div></div>
                                    <div className="info-item" style={{ gridColumn: '1/-1' }}><div className="info-label">Observações</div><div className="info-value">{selected.notes || 'Nenhuma observação'}</div></div>
                                </div>
                            )}
                            {detailTab === 'prontuario' && (
                                <>
                                    <button className="btn btn-sm btn-primary" style={{ marginBottom: 16 }} onClick={() => onShowModal('prontuario', selected)}><IconPlus /> Adicionar Registro</button>
                                    {prontuario.length === 0 ? <div className="empty-state"><IconFile /><h3>Prontuário vazio</h3></div> : prontuario.map(entry => (
                                        <div key={entry.id} className="prontuario-entry">
                                            <div className="entry-header"><span className="entry-date">{formatDate(entry.date)}</span><span className="entry-dentist">{entry.dentist}</span></div>
                                            <div className="entry-procedure">{entry.procedure}</div>
                                            {entry.notes && <div className="entry-notes">{entry.notes}</div>}
                                            {entry.prontuario_files?.length > 0 && (
                                                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {entry.prontuario_files.map(f => <span key={f.id} style={{ fontSize: '0.72rem', padding: '3px 8px', background: 'var(--primary-50)', borderRadius: 'var(--radius-sm)', color: 'var(--primary)', fontWeight: 500 }}>📎 {f.file_name}</span>)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </>
                            )}
                            {detailTab === 'consultas' && (
                                consultas.length === 0 ? <div className="empty-state"><h3>Nenhuma consulta</h3></div> : (
                                    <div className="table-container"><table>
                                        <thead><tr><th>Data</th><th>Hora</th><th>Procedimento</th><th>Status</th></tr></thead>
                                        <tbody>{consultas.map(c => (
                                            <tr key={c.id}><td>{formatDate(c.date)}</td><td>{c.time}</td><td>{c.procedure}</td><td><span className={`status-badge ${c.status}`}>{c.status}</span></td></tr>
                                        ))}</tbody>
                                    </table></div>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>

            {confirmDelete && (
                <ConfirmDialog
                    title="Excluir Paciente"
                    message={`Tem certeza que deseja excluir ${confirmDelete.name}? Todos os dados, prontuário e consultas serão removidos permanentemente.`}
                    confirmLabel="Excluir Paciente"
                    type="danger"
                    onConfirm={() => executeDeletePatient(confirmDelete)}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
        </>
    )
}
