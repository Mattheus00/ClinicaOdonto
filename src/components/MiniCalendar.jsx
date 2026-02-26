import React from 'react'
import { IconChevLeft, IconChevRight } from './Icons'

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function MiniCalendar({ selectedDate, onSelectDate, appointmentDates = [] }) {
    const [viewDate, setViewDate] = React.useState(new Date(selectedDate || new Date()))
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrev = new Date(year, month, 0).getDate()

    const days = []
    for (let i = firstDay - 1; i >= 0; i--) {
        days.push({ day: daysInPrev - i, current: false })
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push({ day: i, current: true })
    }
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
        days.push({ day: i, current: false })
    }

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

    const formatDateStr = (d) => {
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        return `${d.getFullYear()}-${mm}-${dd}`
    }

    return (
        <div className="mini-calendar">
            <div className="cal-header">
                <button className="btn-icon" onClick={prevMonth}><IconChevLeft /></button>
                <h3>{MONTHS[month]} {year}</h3>
                <button className="btn-icon" onClick={nextMonth}><IconChevRight /></button>
            </div>
            <div className="cal-grid">
                {DAYS.map(d => <div key={d} className="cal-day-header">{d}</div>)}
                {days.map((d, i) => {
                    const dateObj = d.current ? new Date(year, month, d.day) : null
                    const dateStr = dateObj ? formatDateStr(dateObj) : ''
                    const isToday = dateObj && dateObj.getTime() === today.getTime()
                    const hasAppt = appointmentDates.includes(dateStr)
                    let cls = 'cal-day'
                    if (!d.current) cls += ' other-month'
                    if (isToday) cls += ' today'
                    if (hasAppt) cls += ' has-appointments'

                    return (
                        <div key={i} className={cls}
                            onClick={() => dateObj && onSelectDate && onSelectDate(dateStr)}>
                            {d.day}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
