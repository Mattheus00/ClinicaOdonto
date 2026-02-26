import React from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { IconX } from './Icons'
import ConfirmDialog from './ConfirmDialog'

const DENTISTS = ['Dra. Ana Letícia']
const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
const STATUSES = ['agendado', 'confirmado', 'realizado', 'cancelado']
const METHODS = ['Pix', 'Cartão', 'Dinheiro', 'Boleto', 'TED']
const CATEGORIES = ['Consulta', 'Procedimento', 'Material', 'Aluguel', 'Funcionários', 'Equipamentos', 'Outros']

export function AppointmentModal({ onClose, showToast, prefill, onSaved }) {
    const [form, setForm] = React.useState({
        patient_id: '', dentist: DENTISTS[0], date: prefill?.date || '', time: prefill?.time || '08:00',
        procedure_id: '', procedure_name: '', status: 'agendado', notes: '', value: 0
    })
    const [patients, setPatients] = React.useState([])
    const [procedures, setProcedures] = React.useState([])
    const [saving, setSaving] = React.useState(false)

    React.useEffect(() => {
        if (!supabaseConfigured) {
            setPatients([
                { id: 'p1', name: 'Ana Paula Ferreira' }, { id: 'p2', name: 'João Mendes' }, { id: 'p3', name: 'Camila Rocha' }
            ])
            setProcedures([
                { id: 'demo1', name: 'Limpeza e profilaxia', value: 250 },
                { id: 'demo2', name: 'Restauração simples', value: 300 }
            ])
            return
        }
        supabase.from('patients').select('id, name').order('name').then(({ data }) => setPatients(data || []))
        supabase.from('procedures').select('id, name, value').order('name').then(({ data }) => setProcedures(data || []))
    }, [])

    async function save(e) {
        e.preventDefault()
        if (!form.patient_id) { showToast('Selecione um paciente.', 'error'); return }
        if (!form.date) { showToast('Selecione uma data.', 'error'); return }
        setSaving(true)
        if (!supabaseConfigured) {
            setSaving(false)
            showToast('✅ Consulta agendada com sucesso! (modo demo)'); onSaved?.(); onClose()
            return
        }
        const { data: conflict } = await supabase.from('appointments')
            .select('id').eq('date', form.date).eq('time', form.time).eq('dentist', form.dentist).neq('status', 'cancelado')
        if (conflict?.length > 0) {
            showToast(`⚠️ Conflito — ${form.dentist} já tem consulta às ${form.time} nessa data.`, 'error')
            setSaving(false); return
        }
        const { error } = await supabase.from('appointments').insert({
            patient_id: form.patient_id, dentist: form.dentist, date: form.date, time: form.time,
            procedure: form.procedure_name || form.procedure_id, status: form.status, notes: form.notes, value: parseFloat(form.value)
        })
        setSaving(false)
        if (error) showToast('Erro: ' + error.message, 'error')
        else { showToast('✅ Consulta agendada com sucesso!'); onSaved?.(); onClose() }
    }

    const u = (k, v) => setForm(p => ({ ...p, [k]: v }))

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">📅 Nova Consulta</h2>
                    <button className="btn-icon" onClick={onClose}><IconX /></button>
                </div>
                <form onSubmit={save}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Paciente *</label>
                            <select className="form-select" value={form.patient_id} onChange={e => u('patient_id', e.target.value)}>
                                <option value="">Selecione...</option>
                                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Data *</label>
                                <input type="date" className="form-input" value={form.date} onChange={e => u('date', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Horário *</label>
                                <select className="form-select" value={form.time} onChange={e => u('time', e.target.value)}>
                                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Dentista</label>
                                <select className="form-select" value={form.dentist} onChange={e => u('dentist', e.target.value)}>
                                    {DENTISTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Procedimento</label>
                                <select className="form-select" value={form.procedure_id} onChange={e => {
                                    const proc = procedures.find(p => p.id === e.target.value)
                                    setForm(prev => ({ ...prev, procedure_id: e.target.value, procedure_name: proc?.name || '', value: proc?.value || 0 }))
                                }}>
                                    <option value="">Selecione...</option>
                                    {procedures.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Valor (R$)</label>
                                <input type="number" step="0.01" className="form-input" value={form.value} onChange={e => u('value', e.target.value)} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Observações</label>
                            <textarea className="form-textarea" value={form.notes} onChange={e => u('notes', e.target.value)} placeholder="Observações opcionais..." />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Agendar Consulta'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export function AppointmentDetailModal({ appointment, onClose, showToast, onSaved }) {
    const [status, setStatus] = React.useState(appointment.status)
    const [saving, setSaving] = React.useState(false)
    const [showCancelConfirm, setShowCancelConfirm] = React.useState(false)

    async function updateStatus(newStatus) {
        setSaving(true)
        if (!supabaseConfigured) {
            setSaving(false); setStatus(newStatus); showToast(`✅ Status atualizado para "${newStatus}". (demo)`); onSaved?.(); return
        }
        const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', appointment.id)
        setSaving(false)
        if (error) showToast('Erro: ' + error.message, 'error')
        else { setStatus(newStatus); showToast(`✅ Status atualizado para "${newStatus}".`); onSaved?.() }
    }

    async function executeCancelAppt() {
        setShowCancelConfirm(false)
        await updateStatus('cancelado')
        onClose()
    }

    const fmtDate = (d) => new Date(d + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">Detalhes da Consulta</h2>
                        <button className="btn-icon" onClick={onClose}><IconX /></button>
                    </div>
                    <div className="modal-body">
                        <div className="info-grid">
                            <div className="info-item"><div className="info-label">Paciente</div><div className="info-value">{appointment.patients?.name || '—'}</div></div>
                            <div className="info-item"><div className="info-label">Dentista</div><div className="info-value">{appointment.dentist}</div></div>
                            <div className="info-item"><div className="info-label">Data</div><div className="info-value">{fmtDate(appointment.date)}</div></div>
                            <div className="info-item"><div className="info-label">Horário</div><div className="info-value">{appointment.time}</div></div>
                            <div className="info-item"><div className="info-label">Procedimento</div><div className="info-value">{appointment.procedure}</div></div>
                            <div className="info-item"><div className="info-label">Status</div><div className="info-value"><span className={`status-badge ${status}`}>{status}</span></div></div>
                        </div>
                        {appointment.notes && (
                            <div style={{ marginTop: 12 }}><div className="info-label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 3 }}>Observações</div><div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{appointment.notes}</div></div>
                        )}
                        <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {STATUSES.filter(s => s !== status).map(s => (
                                <button key={s} className={`btn btn-sm ${s === 'cancelado' ? 'btn-danger' : 'btn-secondary'}`}
                                    onClick={() => s === 'cancelado' ? setShowCancelConfirm(true) : updateStatus(s)} disabled={saving}>
                                    {s === 'confirmado' ? '✅ Confirmar' : s === 'realizado' ? '✔️ Marcar Realizado' : s === 'cancelado' ? '❌ Cancelar' : '📅 Agendar'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
                    </div>
                </div>
            </div>

            {showCancelConfirm && (
                <ConfirmDialog
                    title="Cancelar Consulta"
                    message={`Deseja cancelar a consulta de ${appointment.patients?.name || 'paciente'} agendada para ${appointment.time} em ${new Date(appointment.date + 'T12:00').toLocaleDateString('pt-BR')}?`}
                    confirmLabel="Cancelar Consulta"
                    type="danger"
                    onConfirm={executeCancelAppt}
                    onCancel={() => setShowCancelConfirm(false)}
                />
            )}
        </>
    )
}

export function PatientModal({ onClose, showToast, patient, onSaved }) {
    const isEdit = !!patient
    const [form, setForm] = React.useState({
        name: patient?.name || '', cpf: patient?.cpf || '', phone: patient?.phone || '',
        email: patient?.email || '', birthdate: patient?.birthdate || '', blood_type: patient?.blood_type || '',
        allergies: patient?.allergies || '', notes: patient?.notes || ''
    })
    const [saving, setSaving] = React.useState(false)
    const u = (k, v) => setForm(p => ({ ...p, [k]: v }))

    async function save(e) {
        e.preventDefault()
        if (!form.name.trim()) { showToast('Nome é obrigatório.', 'error'); return }
        setSaving(true)
        if (!supabaseConfigured) {
            setSaving(false); showToast(`✅ Paciente ${isEdit ? 'atualizado' : 'cadastrado'}! (demo)`); onSaved?.(); onClose(); return
        }
        let result
        if (isEdit) {
            result = await supabase.from('patients').update(form).eq('id', patient.id)
        } else {
            result = await supabase.from('patients').insert(form)
        }
        setSaving(false)
        if (result.error) showToast('Erro: ' + result.error.message, 'error')
        else { showToast(`✅ Paciente ${isEdit ? 'atualizado' : 'cadastrado'}!`); onSaved?.(); onClose() }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEdit ? '✏️ Editar Paciente' : '👤 Novo Paciente'}</h2>
                    <button className="btn-icon" onClick={onClose}><IconX /></button>
                </div>
                <form onSubmit={save}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Nome completo *</label>
                            <input className="form-input" value={form.name} onChange={e => u('name', e.target.value)} placeholder="Nome do paciente" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">CPF</label>
                                <input className="form-input" value={form.cpf} onChange={e => u('cpf', e.target.value)} placeholder="000.000.000-00" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Telefone</label>
                                <input className="form-input" value={form.phone} onChange={e => u('phone', e.target.value)} placeholder="(00) 00000-0000" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-input" value={form.email} onChange={e => u('email', e.target.value)} placeholder="email@exemplo.com" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Data de Nascimento</label>
                                <input type="date" className="form-input" value={form.birthdate} onChange={e => u('birthdate', e.target.value)} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Tipo Sanguíneo</label>
                                <select className="form-select" value={form.blood_type} onChange={e => u('blood_type', e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Alergias</label>
                                <input className="form-input" value={form.allergies} onChange={e => u('allergies', e.target.value)} placeholder="Listar alergias" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Observações</label>
                            <textarea className="form-textarea" value={form.notes} onChange={e => u('notes', e.target.value)} placeholder="Notas adicionais..." />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : isEdit ? 'Atualizar' : 'Cadastrar'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export function TransactionModal({ onClose, showToast, onSaved }) {
    const [form, setForm] = React.useState({
        description: '', type: 'receita', value: '', date: new Date().toISOString().split('T')[0],
        method: 'Pix', category: 'Consulta'
    })
    const [saving, setSaving] = React.useState(false)
    const u = (k, v) => setForm(p => ({ ...p, [k]: v }))

    async function save(e) {
        e.preventDefault()
        if (!form.description || !form.value) { showToast('Preencha descrição e valor.', 'error'); return }
        setSaving(true)
        if (!supabaseConfigured) {
            setSaving(false); showToast('✅ Lançamento registrado! (demo)'); onSaved?.(); onClose(); return
        }
        const { error } = await supabase.from('transactions').insert({ ...form, value: parseFloat(form.value) })
        setSaving(false)
        if (error) showToast('Erro: ' + error.message, 'error')
        else { showToast('✅ Lançamento registrado!'); onSaved?.(); onClose() }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">💰 Novo Lançamento</h2>
                    <button className="btn-icon" onClick={onClose}><IconX /></button>
                </div>
                <form onSubmit={save}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Descrição *</label>
                            <input className="form-input" value={form.description} onChange={e => u('description', e.target.value)} placeholder="Ex: Consulta Ana Paula" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Tipo</label>
                                <select className="form-select" value={form.type} onChange={e => u('type', e.target.value)}>
                                    <option value="receita">💚 Receita</option>
                                    <option value="despesa">🔴 Despesa</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Valor (R$) *</label>
                                <input type="number" step="0.01" className="form-input" value={form.value} onChange={e => u('value', e.target.value)} placeholder="0,00" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Data</label>
                                <input type="date" className="form-input" value={form.date} onChange={e => u('date', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Método</label>
                                <select className="form-select" value={form.method} onChange={e => u('method', e.target.value)}>
                                    {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Categoria</label>
                            <select className="form-select" value={form.category} onChange={e => u('category', e.target.value)}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Registrar'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export function ProntuarioModal({ patient, onClose, showToast, onSaved }) {
    const [form, setForm] = React.useState({
        date: new Date().toISOString().split('T')[0], dentist: DENTISTS[0],
        procedure_id: '', procedure_name: '', notes: ''
    })
    const [procedures, setProcedures] = React.useState([])
    const [files, setFiles] = React.useState([])
    const [saving, setSaving] = React.useState(false)
    const u = (k, v) => setForm(p => ({ ...p, [k]: v }))

    React.useEffect(() => {
        if (!supabaseConfigured) {
            setProcedures([
                { id: 'demo1', name: 'Limpeza e profilaxia', value: 250 },
                { id: 'demo2', name: 'Restauração simples', value: 300 }
            ])
            return
        }
        supabase.from('procedures').select('id, name').order('name').then(({ data }) => setProcedures(data || []))
    }, [])

    async function save(e) {
        e.preventDefault()
        setSaving(true)
        if (!supabaseConfigured) {
            setSaving(false); showToast('✅ Registro adicionado ao prontuário! (demo)'); onSaved?.(); onClose(); return
        }
        const entryData = {
            date: form.date, dentist: form.dentist, procedure: form.procedure_name || form.procedure_id, notes: form.notes
        }

        const { data: entry, error } = await supabase
            .from('prontuario_entries')
            .insert({ ...entryData, patient_id: patient.id })
            .select().single()
        if (error) { showToast('Erro: ' + error.message, 'error'); setSaving(false); return }

        for (const file of files) {
            const path = `${patient.id}/${entry.id}/${file.name}`
            const { error: upErr } = await supabase.storage.from('prontuario-files').upload(path, file)
            if (!upErr) {
                await supabase.from('prontuario_files').insert({
                    entry_id: entry.id, file_name: file.name, storage_path: path, file_type: file.type
                })
            }
        }
        setSaving(false)
        showToast('✅ Registro adicionado ao prontuário!')
        onSaved?.(); onClose()
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">📋 Novo Registro — {patient.name}</h2>
                    <button className="btn-icon" onClick={onClose}><IconX /></button>
                </div>
                <form onSubmit={save}>
                    <div className="modal-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Data</label>
                                <input type="date" className="form-input" value={form.date} onChange={e => u('date', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Dentista</label>
                                <select className="form-select" value={form.dentist} onChange={e => u('dentist', e.target.value)}>
                                    {DENTISTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Procedimento</label>
                            <select className="form-select" value={form.procedure_id} onChange={e => {
                                const proc = procedures.find(p => p.id === e.target.value)
                                setForm(prev => ({ ...prev, procedure_id: e.target.value, procedure_name: proc?.name || '' }))
                            }}>
                                <option value="">Selecione...</option>
                                {procedures.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Notas</label>
                            <textarea className="form-textarea" value={form.notes} onChange={e => u('notes', e.target.value)} placeholder="Detalhes do procedimento..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Arquivos (radiografias, exames...)</label>
                            <input type="file" multiple className="form-input" onChange={e => setFiles([...e.target.files])}
                                style={{ padding: 8 }} />
                            {files.length > 0 && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>{files.length} arquivo(s) selecionado(s)</p>}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar Registro'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export function ProcedureModal({ procedure, onClose, showToast, onSaved }) {
    const isEdit = !!procedure
    const [form, setForm] = React.useState({
        name: procedure?.name || '', value: procedure?.value || ''
    })
    const [saving, setSaving] = React.useState(false)
    const u = (k, v) => setForm(p => ({ ...p, [k]: v }))

    async function save(e) {
        e.preventDefault()
        if (!form.name.trim()) { showToast('Nome é obrigatório.', 'error'); return }
        setSaving(true)
        if (!supabaseConfigured) {
            setSaving(false); showToast(`✅ Procedimento ${isEdit ? 'atualizado' : 'cadastrado'}! (demo)`); onSaved?.(); onClose(); return
        }
        const dataToSave = { name: form.name, value: parseFloat(form.value) || 0 }
        let result
        if (isEdit) {
            result = await supabase.from('procedures').update(dataToSave).eq('id', procedure.id)
        } else {
            result = await supabase.from('procedures').insert(dataToSave)
        }
        setSaving(false)
        if (result.error) showToast('Erro: ' + result.error.message, 'error')
        else { showToast(`✅ Procedimento ${isEdit ? 'atualizado' : 'cadastrado'}!`); onSaved?.(); onClose() }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEdit ? '✏️ Editar Procedimento' : '➕ Novo Procedimento'}</h2>
                    <button className="btn-icon" onClick={onClose}><IconX /></button>
                </div>
                <form onSubmit={save}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Nome do Procedimento *</label>
                            <input className="form-input" value={form.name} onChange={e => u('name', e.target.value)} placeholder="Ex: Clareamento a Laser" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Valor Padrão (R$) *</label>
                            <input type="number" step="0.01" className="form-input" value={form.value} onChange={e => u('value', e.target.value)} placeholder="0.00" />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
