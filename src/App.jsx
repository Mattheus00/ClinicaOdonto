import React from 'react'
import './index.css'
import { supabase, supabaseConfigured } from './lib/supabase'
import Dashboard from './components/Dashboard'
import Agenda from './components/Agenda'
import Patients from './components/Patients'
import Financeiro from './components/Financeiro'
import Toast from './components/Toast'
import { AppointmentModal, AppointmentDetailModal, PatientModal, TransactionModal, ProntuarioModal } from './components/Modals'
import { IconDashboard, IconCalendar, IconUsers, IconDollar, IconLogoAL, IconBell, IconSettings, IconClock, IconX, IconCheck } from './components/Icons'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: IconDashboard },
  { id: 'agenda', label: 'Agenda', icon: IconCalendar },
  { id: 'pacientes', label: 'Pacientes', icon: IconUsers },
  { id: 'financeiro', label: 'Financeiro', icon: IconDollar },
]

const TAB_TITLES = {
  dashboard: 'Dashboard',
  agenda: 'Agenda',
  pacientes: 'Pacientes',
  financeiro: 'Financeiro',
}

// Demo appointments for notifications
const DEMO_TODAY_APPOINTMENTS = [
  { id: 'n1', time: '08:00', patient: 'Ana Paula Ferreira', procedure: 'Limpeza e profilaxia', dentist: 'Dra. Ana Letícia', value: 250 },
  { id: 'n2', time: '09:00', patient: 'João Mendes', procedure: 'Restauração', dentist: 'Dra. Ana Letícia', value: 400 },
  { id: 'n3', time: '10:00', patient: 'Camila Rocha', procedure: 'Consulta inicial', dentist: 'Dra. Ana Letícia', value: 180 },
  { id: 'n4', time: '14:00', patient: 'Roberto Santos', procedure: 'Canal', dentist: 'Dra. Ana Letícia', value: 800 },
  { id: 'n5', time: '15:00', patient: 'Mariana Oliveira', procedure: 'Clareamento', dentist: 'Dra. Ana Letícia', value: 600 },
]

function getNotifications(confirmedIds) {
  const now = new Date()
  const notifications = []

  DEMO_TODAY_APPOINTMENTS.forEach(appt => {
    if (confirmedIds.has(appt.id)) return // Skip already confirmed

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
    const upcoming = DEMO_TODAY_APPOINTMENTS.filter(appt => {
      if (confirmedIds.has(appt.id)) return false
      const [h, m] = appt.time.split(':').map(Number)
      const apptTime = new Date()
      apptTime.setHours(h, m, 0, 0)
      return apptTime.getTime() > now.getTime()
    })
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
  DEMO_TODAY_APPOINTMENTS.forEach(appt => {
    if (confirmedIds.has(appt.id)) return
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

function NotificationDropdown({ isOpen, onClose, onConfirmPayment, confirmedIds }) {
  const [notifications, setNotifications] = React.useState([])
  const dropdownRef = React.useRef(null)

  React.useEffect(() => {
    setNotifications(getNotifications(confirmedIds))
    const interval = setInterval(() => {
      setNotifications(getNotifications(confirmedIds))
    }, 30000)
    return () => clearInterval(interval)
  }, [confirmedIds])

  React.useEffect(() => {
    if (!isOpen) return
    // Refresh on open
    setNotifications(getNotifications(confirmedIds))
  }, [isOpen, confirmedIds])

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

  const showToast = (message, type = 'success') => setToast({ message, type })
  const refresh = () => setRefreshKey(k => k + 1)

  const unconfirmedCount = DEMO_TODAY_APPOINTMENTS.filter(a => {
    if (confirmedIds.has(a.id)) return false
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
