import React from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import MiniCalendar from './MiniCalendar'
import { IconChevLeft, IconChevRight, IconPlus } from './Icons'

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const DENTIST_COLORS = ['#7C3AED', '#F59E0B', '#10B981', '#EAB308', '#EC4899', '#2563EB', '#EF4444']

function getDentistColor(dentist) {
    if (!dentist) return DENTIST_COLORS[0]
    let hash = 0
    for (let i = 0; i < dentist.length; i++) hash = dentist.charCodeAt(i) + ((hash << 5) - hash)
    return DENTIST_COLORS[Math.abs(hash) % DENTIST_COLORS.length]
}

function generateDemoAppointments(weekStart) {
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const names = ['Ana Paula', 'João Mendes', 'Camila Rocha', 'Roberto Santos', 'Mariana Oliveira', 'Pedro Lima', 'Fernanda Costa', 'Lucas Silva']
    const procs = ['Limpeza e profilaxia', 'Restauração', 'Consulta inicial', 'Canal', 'Clareamento', 'Avaliação', 'Extração', 'Ajuste ortodôntico']
    const statuses = ['agendado', 'confirmado', 'realizado', 'agendado', 'confirmado']
    const demos = []
    for (let day = 1; day <= 5; day++) {
        const d = new Date(weekStart); d.setDate(weekStart.getDate() + day)
        const numAppts = 2 + Math.floor(Math.random() * 3)
        const usedTimes = new Set()
        for (let i = 0; i < numAppts; i++) {
            let tIdx
            do { tIdx = Math.floor(Math.random() * TIME_SLOTS.length) } while (usedTimes.has(tIdx))
            usedTimes.add(tIdx)
            demos.push({
                id: `demo-${day}-${i}`, date: fmt(d), time: TIME_SLOTS[tIdx],
                procedure: procs[Math.floor(Math.random() * procs.length)],
                dentist: ['Dr. Carlos Silva', 'Dra. Fernanda Lima', 'Dr. Pedro Alves'][Math.floor(Math.random() * 3)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                patients: { name: names[Math.floor(Math.random() * names.length)] }
            })
        }
    }
    return demos
}

function CurrentTimeLine() {
    const [now, setNow] = React.useState(new Date())

    React.useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(interval)
    }, [])

    const hours = now.getHours()
    const minutes = now.getMinutes()

    // Only show if within time slots range (08:00 - 19:00)
    if (hours < 8 || hours >= 19) return null

    const slotStart = 8 // 08:00
    const totalMinutes = (hours - slotStart) * 60 + minutes
    const topPx = (totalMinutes / 60) * 60 // 60px per hour

    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

    return (
        <div
            className="current-time-line"
            data-time={timeStr}
            style={{ top: `${topPx}px` }}
        />
    )
}

export default function Agenda({ onShowModal, showToast }) {
    const [weekStart, setWeekStart] = React.useState(() => {
        const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d
    })
    const [appointments, setAppointments] = React.useState([])
    const [dragItem, setDragItem] = React.useState(null)
    const [dragOver, setDragOver] = React.useState(null)
    const [loading, setLoading] = React.useState(true)

    const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d })
    const today = new Date(); today.setHours(0, 0, 0, 0)

    React.useEffect(() => { loadAppointments() }, [weekStart])

    React.useEffect(() => {
        if (!supabaseConfigured) return
        const channel = supabase.channel('appointments-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => loadAppointments())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [weekStart])

    async function loadAppointments() {
        setLoading(true)
        if (!supabaseConfigured) {
            setAppointments(generateDemoAppointments(weekStart))
            setLoading(false)
            return
        }
        const endDate = new Date(weekStart); endDate.setDate(weekStart.getDate() + 6)
        const { data } = await supabase.from('appointments').select('*, patients(name)').gte('date', formatDate(weekStart)).lte('date', formatDate(endDate)).order('time')
        setAppointments(data || [])
        setLoading(false)
    }

    const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }
    const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }
    const goToday = () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); setWeekStart(d) }

    function getAppointment(date, time) { return appointments.find(a => a.date === date && a.time === time) }

    function handleDragStart(e, appt) { setDragItem(appt); e.dataTransfer.effectAllowed = 'move' }
    function handleDragOver(e, date, time) { e.preventDefault(); setDragOver(`${date}-${time}`) }
    function handleDragLeave() { setDragOver(null) }

    async function handleDrop(e, date, time) {
        e.preventDefault(); setDragOver(null)
        if (!dragItem) return
        const existing = getAppointment(date, time)
        if (existing && existing.id !== dragItem.id) { showToast('⚠️ Conflito — já existe consulta nesse horário.', 'error'); return }
        if (!supabaseConfigured) {
            setAppointments(prev => prev.map(a => a.id === dragItem.id ? { ...a, date, time } : a))
            showToast(`✅ Consulta reagendada para ${time} em ${new Date(date + 'T12:00').toLocaleDateString('pt-BR')}`)
            setDragItem(null); return
        }
        const { error } = await supabase.from('appointments').update({ date, time }).eq('id', dragItem.id)
        if (error) showToast('Erro ao reagendar: ' + error.message, 'error')
        else showToast(`✅ Consulta reagendada para ${time} em ${new Date(date + 'T12:00').toLocaleDateString('pt-BR')}`)
        setDragItem(null)
    }

    const weekLabel = `${weekDays[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} — ${weekDays[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`

    // Check if this week contains today
    const isCurrentWeek = today >= weekDays[0] && today <= weekDays[6]

    return (
        <div className="agenda-container">
            <div className="agenda-main">
                <div className="week-nav">
                    <button className="btn-icon" onClick={prevWeek}><IconChevLeft /></button>
                    <button className="btn btn-sm btn-secondary" onClick={goToday}>Hoje</button>
                    <button className="btn-icon" onClick={nextWeek}><IconChevRight /></button>
                    <h3>{weekLabel}</h3>
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-primary btn-pill" onClick={() => onShowModal('appointment')}><IconPlus /> Nova Consulta</button>
                </div>
                {loading ? <div className="loading-spinner" /> : (
                    <>
                        <div className="agenda-grid-scroll">
                            <div className="week-header">
                                <div className="week-header-spacer" />
                                {weekDays.map((d, i) => (
                                    <div key={i} className={`week-header-cell ${d.getTime() === today.getTime() ? 'today' : ''}`}>
                                        <div className="day-name">{DAY_NAMES[d.getDay()]}</div>
                                        <div className="day-number">{String(d.getDate()).padStart(2, '0')}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="time-grid-wrapper">
                                <div className="time-grid">
                                    {isCurrentWeek && <CurrentTimeLine />}
                                    {TIME_SLOTS.map(time => (
                                        <React.Fragment key={time}>
                                            <div className="time-label">{time}</div>
                                            {weekDays.map((d, i) => {
                                                const dateStr = formatDate(d)
                                                const appt = getAppointment(dateStr, time)
                                                const isDragOver = dragOver === `${dateStr}-${time}`
                                                return (
                                                    <div key={i} className={`time-slot ${isDragOver ? 'drag-over' : ''}`}
                                                        onDragOver={(e) => handleDragOver(e, dateStr, time)}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={(e) => handleDrop(e, dateStr, time)}
                                                        onClick={() => !appt && onShowModal('appointment', { date: dateStr, time })}
                                                    >
                                                        {appt && (
                                                            <div
                                                                className={`appointment-card ${appt.status}`}
                                                                draggable
                                                                onDragStart={(e) => handleDragStart(e, appt)}
                                                                onClick={(e) => { e.stopPropagation(); onShowModal('appointment-detail', appt) }}
                                                                style={{ borderLeftColor: getDentistColor(appt.dentist) }}
                                                            >
                                                                <div className="appt-name">{appt.patients?.name || '—'}</div>
                                                                <div className="appt-procedure">{appt.procedure}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
            <div className="agenda-sidebar">
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Calendário</h3></div>
                    <MiniCalendar selectedDate={formatDate(weekStart)} appointmentDates={[...new Set(appointments.map(a => a.date))]}
                        onSelectDate={(d) => { const dt = new Date(d + 'T12:00'); dt.setDate(dt.getDate() - dt.getDay()); dt.setHours(0, 0, 0, 0); setWeekStart(dt) }} />
                </div>
            </div>
        </div>
    )
}
