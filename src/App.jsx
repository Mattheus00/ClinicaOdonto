import React from 'react'
import './index.css'
import { supabase, supabaseConfigured } from './lib/supabase'
import Dashboard from './components/Dashboard'
import Agenda from './components/Agenda'
import Patients from './components/Patients'
import Financeiro from './components/Financeiro'
import Procedimentos from './components/Procedimentos'
import Toast from './components/Toast'
import { AppointmentModal, AppointmentDetailModal, PatientModal, TransactionModal, ProntuarioModal, ProcedureModal } from './components/Modals'
import { IconDashboard, IconCalendar, IconUsers, IconDollar, IconLogoAL, IconBell, IconSettings, IconClock, IconX, IconCheck, IconListCheck } from './components/Icons'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: IconDashboard },
  { id: 'agenda', label: 'Agenda', icon: IconCalendar },
  { id: 'pacientes', label: 'Pacientes', icon: IconUsers },
  { id: 'procedimentos', label: 'Procedimentos', icon: IconListCheck },
  { id: 'financeiro', label: 'Financeiro', icon: IconDollar },
]

const TAB_TITLES = {
  dashboard: 'Dashboard',
  agenda: 'Agenda',
  pacientes: 'Pacientes',
  procedimentos: 'Procedimentos',
  financeiro: 'Financeiro',
}

function getNotifications(confirmedIds, todayAppointments) {
  const now = new Date()
  const notifications = []

  todayAppointments.forEach(appt => {
    if (confirmedIds.has(appt.id) || appt.status === 'cancelado') return // Skip already confirmed or cancelled

    const [h, m] = appt.time.split(':').map(Number)
    const apptTime = new Date()
    apptTime.setHours(h, m, 0, 0)

    const diffMs = apptTime.getTime() - now.getTime()
    const diffMin = Math.round(diffMs / 60000)

    if (diffMin > 0 && diffMin <= 30) {
      notifications.push({
        id: appt.id, type: 'upcoming',
        title: `Consulta em ${diffMin} min`,
        message: `${appt.patient} — ${appt.procedure}`,
        time: appt.time, urgent: diffMin <= 10,
        patient: appt.patient, procedure: appt.procedure, value: appt.value,
      })
    } else if (diffMin > 30 && diffMin <= 60) {
      notifications.push({
        id: appt.id, type: 'soon',
        title: `Próxima consulta às ${appt.time}`,
        message: `${appt.patient} — ${appt.procedure}`,
        time: appt.time, urgent: false,
        patient: appt.patient, procedure: appt.procedure, value: appt.value,
      })
    }
  })

  // Always show next upcoming appointment
  if (notifications.length === 0) {
    const upcoming = todayAppointments.filter(appt => {
      if (confirmedIds.has(appt.id) || appt.status === 'cancelado') return false
      const [h, m] = appt.time.split(':').map(Number)
      const apptTime = new Date()
      apptTime.setHours(h, m, 0, 0)
      return apptTime.getTime() > now.getTime()
    }).sort((a, b) => a.time.localeCompare(b.time))

    if (upcoming.length > 0) {
      const next = upcoming[0]
      const [h, m] = next.time.split(':').map(Number)
      const apptTime = new Date()
      apptTime.setHours(h, m, 0, 0)
      const diffMin = Math.round((apptTime.getTime() - now.getTime()) / 60000)
      const hours = Math.floor(diffMin / 60)
      const mins = diffMin % 60
      notifications.push({
        id: next.id, type: 'info',
        title: `Próxima consulta em ${hours > 0 ? hours + 'h ' : ''}${mins}min`,
        message: `${next.patient} — ${next.procedure} às ${next.time}`,
        time: next.time, urgent: false,
        patient: next.patient, procedure: next.procedure, value: next.value,
      })
    }
  }

  // Also show past unconfirmed appointments as "pending payment"
  todayAppointments.forEach(appt => {
    if (confirmedIds.has(appt.id) || appt.status === 'cancelado') return
    const [h, m] = appt.time.split(':').map(Number)
    const apptTime = new Date()
    apptTime.setHours(h, m, 0, 0)
    if (apptTime.getTime() < now.getTime()) {
      notifications.push({
        id: appt.id, type: 'payment',
        title: `Pagamento pendente — ${appt.time}`,
        message: `${appt.patient} — ${appt.procedure}`,
        time: appt.time, urgent: false,
        patient: appt.patient, procedure: appt.procedure, value: appt.value,
      })
    }
  })

  return notifications
}

function NotificationDropdown({ isOpen, onClose, onConfirmPayment, confirmedIds, todayAppointments }) {
  const [notifications, setNotifications] = React.useState([])
  const dropdownRef = React.useRef(null)

  React.useEffect(() => {
    setNotifications(getNotifications(confirmedIds, todayAppointments))
    const interval = setInterval(() => {
      setNotifications(getNotifications(confirmedIds, todayAppointments))
    }, 30000)
    return () => clearInterval(interval)
  }, [confirmedIds, todayAppointments])

  React.useEffect(() => {
    if (!isOpen) return
    // Refresh on open
    setNotifications(getNotifications(confirmedIds, todayAppointments))
  }, [isOpen, confirmedIds, todayAppointments])

  React.useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="notif-dropdown" ref={dropdownRef}>
      <div className="notif-header">
        <h4>Notificações</h4>
        <button className="btn-icon" onClick={onClose} style={{ padding: 4 }}><IconX /></button>
      </div>
      <div className="notif-body">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <IconBell />
            <p>Nenhuma notificação no momento</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`notif-item ${n.urgent ? 'urgent' : ''} ${n.type}`}>
              <div className="notif-icon-wrap">
                {n.type === 'payment' ? <IconDollar /> : <IconClock />}
              </div>
              <div className="notif-content">
                <div className="notif-title">{n.title}</div>
                <div className="notif-message">{n.message}</div>
                {n.value && (
                  <div className="notif-value">R$ {n.value.toFixed(2).replace('.', ',')}</div>
                )}
              </div>
              <button
                className="notif-confirm-btn"
                onClick={(e) => { e.stopPropagation(); onConfirmPayment(n) }}
                title="Confirmar pagamento"
              >
                <IconCheck />
                <span>Confirmar</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = React.useState('dashboard')
  const [toast, setToast] = React.useState(null)
  const [modal, setModal] = React.useState(null)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [confirmedIds, setConfirmedIds] = React.useState(new Set())
  const [confirmedTransactions, setConfirmedTransactions] = React.useState([])

  const [todayAppointments, setTodayAppointments] = React.useState([])

  React.useEffect(() => {
    async function fetchTodayData() {
      if (!supabaseConfigured) {
        setTodayAppointments([
          { id: 'n1', time: '08:00', patient: 'Ana Paula Ferreira', procedure: 'Avaliação odontológica', dentist: 'Dra. Ana Letícia', value: 180, status: 'agendado' },
          { id: 'n2', time: '09:00', patient: 'João Mendes', procedure: 'Profilaxia (limpeza)', dentist: 'Dra. Ana Letícia', value: 250, status: 'agendado' },
          { id: 'n3', time: '10:00', patient: 'Camila Rocha', procedure: 'Restaurações', dentist: 'Dra. Ana Letícia', value: 300, status: 'agendado' },
        ])
        return
      }

      const today = new Date()
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, time, date, procedure, dentist, value, status,
          patients(name)
        `)
        .eq('date', dateStr)

      if (!error && data) {
        const mapped = data.map(d => ({
          ...d,
          patient: d.patients?.name || 'Desconhecido'
        }))
        setTodayAppointments(mapped)
      }
    }
    fetchTodayData()
  }, [refreshKey])

  const showToast = (message, type = 'success') => setToast({ message, type })
  const refresh = () => setRefreshKey(k => k + 1)

  const unconfirmedCount = todayAppointments.filter(a => {
    if (confirmedIds.has(a.id) || a.status === 'cancelado') return false
    const [h, m] = a.time.split(':').map(Number)
    const t = new Date(); t.setHours(h, m, 0, 0)
    return t.getTime() < Date.now() // Past appointments with pending payment
  }).length

  function openModal(type, data) {
    setModal({ type, data })
  }

  function closeModal() {
    setModal(null)
  }

  function handleNavigate(tab, data) {
    setActiveTab(tab)
  }

  function toggleNotifications(e) {
    e.stopPropagation()
    setShowNotifications(prev => !prev)
  }

  async function handleConfirmPayment(notification) {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const transaction = {
      id: 'confirmed-' + notification.id + '-' + Date.now(),
      date: dateStr,
      description: `${notification.procedure} — ${notification.patient}`,
      category: 'Consulta',
      method: 'Cartão',
      type: 'receita',
      value: notification.value,
    }

    if (supabaseConfigured) {
      const { error } = await supabase.from('transactions').insert(transaction)
      if (error) {
        showToast('Erro ao registrar pagamento: ' + error.message, 'error')
        return
      }
    }

    // Store the transaction for the Financeiro table
    setConfirmedTransactions(prev => [...prev, transaction])
    setConfirmedIds(prev => new Set([...prev, notification.id]))
    showToast(`Pagamento de R$ ${notification.value.toFixed(2).replace('.', ',')} confirmado — ${notification.patient}`)
    refresh()
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <IconLogoAL />
          </div>
        </div>

        <nav className="sidebar-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
            >
              <tab.icon />
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="main-content">
        <header className="topbar">
          <h2 className="topbar-title">{TAB_TITLES[activeTab]}</h2>
          <div className="topbar-actions">
            <div className="topbar-date">
              <IconCalendar />
              <span>{dateStr}</span>
            </div>
            <div style={{ position: 'relative' }}>
              <button className="topbar-icon-btn" title="Notificações" onClick={toggleNotifications}>
                <IconBell />
                {unconfirmedCount > 0 && <span className="notif-dot">{unconfirmedCount}</span>}
              </button>
              <NotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onConfirmPayment={handleConfirmPayment}
                confirmedIds={confirmedIds}
                todayAppointments={todayAppointments}
              />
            </div>
            <button className="topbar-icon-btn" title="Configurações">
              <IconSettings />
            </button>
            <div className="topbar-avatar" title="Dra. Ana Letícia">AL</div>
          </div>
        </header>

        <div className="page-content" key={refreshKey}>
          {activeTab === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {activeTab === 'agenda' && <Agenda onShowModal={openModal} showToast={showToast} />}
          {activeTab === 'pacientes' && <Patients onShowModal={openModal} showToast={showToast} />}
          {activeTab === 'procedimentos' && <Procedimentos onShowModal={openModal} showToast={showToast} />}
          {activeTab === 'financeiro' && <Financeiro onShowModal={openModal} showToast={showToast} extraTransactions={confirmedTransactions} />}
        </div>
      </main>

      {/* Modals */}
      {modal?.type === 'appointment' && (
        <AppointmentModal onClose={closeModal} showToast={showToast} prefill={modal.data} onSaved={refresh} />
      )}
      {modal?.type === 'appointment-detail' && (
        <AppointmentDetailModal appointment={modal.data} onClose={closeModal} showToast={showToast} onSaved={refresh} />
      )}
      {modal?.type === 'patient' && (
        <PatientModal onClose={closeModal} showToast={showToast} onSaved={refresh} />
      )}
      {modal?.type === 'patient-edit' && (
        <PatientModal patient={modal.data} onClose={closeModal} showToast={showToast} onSaved={refresh} />
      )}
      {modal?.type === 'procedure' && (
        <ProcedureModal procedure={modal.data} onClose={closeModal} showToast={showToast} onSaved={refresh} />
      )}
      {modal?.type === 'transaction' && (
        <TransactionModal onClose={closeModal} showToast={showToast} onSaved={refresh} />
      )}
      {modal?.type === 'prontuario' && (
        <ProntuarioModal patient={modal.data} onClose={closeModal} showToast={showToast} onSaved={refresh} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
