import React from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import MiniCalendar from './MiniCalendar'
import { IconCalendar, IconUsers, IconDollar, IconTrending } from './Icons'

const DEMO_APPOINTMENTS = [
    { id: '1', time: '08:00', procedure: 'Limpeza e profilaxia', dentist: 'Dr. Carlos Silva', status: 'confirmado', patients: { name: 'Ana Paula Ferreira', phone: '(31) 99876-5432' } },
    { id: '2', time: '09:00', procedure: 'Restauração', dentist: 'Dra. Fernanda Lima', status: 'agendado', patients: { name: 'João Mendes', phone: '(31) 98765-4321' } },
    { id: '3', time: '10:00', procedure: 'Consulta inicial', dentist: 'Dr. Carlos Silva', status: 'agendado', patients: { name: 'Camila Rocha', phone: '(31) 91234-5678' } },
    { id: '4', time: '14:00', procedure: 'Canal', dentist: 'Dr. Pedro Alves', status: 'confirmado', patients: { name: 'Roberto Santos', phone: '(31) 99999-1111' } },
    { id: '5', time: '15:00', procedure: 'Clareamento', dentist: 'Dr. Carlos Silva', status: 'agendado', patients: { name: 'Mariana Oliveira', phone: '(31) 98888-2222' } },
]

export default function Dashboard({ onNavigate }) {
    const [stats, setStats] = React.useState({ todayAppts: 0, totalPatients: 0, monthRevenue: 0, weekAppts: 0 })
    const [todayAppointments, setTodayAppointments] = React.useState([])
    const [appointmentDates, setAppointmentDates] = React.useState([])
    const [loading, setLoading] = React.useState(true)

    const today = new Date()
    const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const todayStr = formatDate(today)

    React.useEffect(() => { loadDashboard() }, [])

    async function loadDashboard() {
        setLoading(true)
        if (!supabaseConfigured) {
            setTodayAppointments(DEMO_APPOINTMENTS)
            setStats({ todayAppts: 5, totalPatients: 47, monthRevenue: 12850, weekAppts: 18 })
            const demoDatesList = []
            for (let i = -5; i <= 10; i++) {
                if (Math.random() > 0.4) {
                    const d = new Date(); d.setDate(d.getDate() + i)
                    demoDatesList.push(formatDate(d))
                }
            }
            setAppointmentDates(demoDatesList)
            setLoading(false)
            return
        }
        try {
            const { data: todayData } = await supabase.from('appointments').select('*, patients(name, phone)').eq('date', todayStr).order('time')
            setTodayAppointments(todayData || [])
            const { count: patientCount } = await supabase.from('patients').select('*', { count: 'exact', head: true })
            const startOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
            const { data: revenueData } = await supabase.from('transactions').select('value').eq('type', 'receita').gte('date', startOfMonth).lte('date', todayStr)
            const monthRevenue = (revenueData || []).reduce((s, t) => s + Number(t.value), 0)
            const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay())
            const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6)
            const { count: weekCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('date', formatDate(startOfWeek)).lte('date', formatDate(endOfWeek))
            setStats({ todayAppts: (todayData || []).length, totalPatients: patientCount || 0, monthRevenue, weekAppts: weekCount || 0 })
            const { data: apptDates } = await supabase.from('appointments').select('date').neq('status', 'cancelado')
            setAppointmentDates([...new Set((apptDates || []).map(a => a.date))])
        } catch (err) { console.error('Dashboard load error:', err) }
        setLoading(false)
    }

    const formatCurrency = (v) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })

    if (loading) return <div className="loading-spinner" />

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card blue">
                    <div className="stat-icon blue"><IconCalendar /></div>
                    <div className="stat-info">
                        <div className="stat-label">Consultas Hoje</div>
                        <div className="stat-value">{stats.todayAppts}</div>
                        <div className="stat-change up">Agenda do dia</div>
                    </div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon green"><IconUsers /></div>
                    <div className="stat-info">
                        <div className="stat-label">Pacientes</div>
                        <div className="stat-value">{stats.totalPatients}</div>
                        <div className="stat-change up">Total cadastrados</div>
                    </div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-icon purple"><IconDollar /></div>
                    <div className="stat-info">
                        <div className="stat-label">Receita do Mês</div>
                        <div className="stat-value" style={{ fontSize: '1.3rem' }}>{formatCurrency(stats.monthRevenue)}</div>
                        <div className="stat-change up">Mês atual</div>
                    </div>
                </div>
                <div className="stat-card orange">
                    <div className="stat-icon orange"><IconTrending /></div>
                    <div className="stat-info">
                        <div className="stat-label">Consultas da Semana</div>
                        <div className="stat-value">{stats.weekAppts}</div>
                        <div className="stat-change up">Semana atual</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">📅 Agenda de Hoje — {today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                        <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('agenda')}>Ver Agenda</button>
                    </div>
                    {todayAppointments.length === 0 ? (
                        <div className="empty-state"><IconCalendar /><h3>Nenhuma consulta hoje</h3><p>Sua agenda está livre.</p></div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Horário</th><th>Paciente</th><th>Procedimento</th><th>Dentista</th><th>Status</th></tr></thead>
                                <tbody>
                                    {todayAppointments.map(appt => (
                                        <tr key={appt.id}>
                                            <td><span style={{ fontWeight: 500 }}>{appt.time}</span></td>
                                            <td style={{ fontWeight: 600 }}>{appt.patients?.name || '—'}</td>
                                            <td>{appt.procedure}</td>
                                            <td>{appt.dentist}</td>
                                            <td><span className={`status-badge ${appt.status}`}>{appt.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Calendário</h3></div>
                    <MiniCalendar selectedDate={todayStr} appointmentDates={appointmentDates} onSelectDate={(d) => onNavigate('agenda', d)} />
                </div>
            </div>
        </>
    )
}
