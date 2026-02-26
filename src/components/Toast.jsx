import React from 'react'
import { IconCheck, IconAlert, IconX } from './Icons'

export default function Toast({ message, type = 'success', onClose }) {
    React.useEffect(() => {
        const t = setTimeout(onClose, 4000)
        return () => clearTimeout(t)
    }, [onClose])

    return (
        <div className={`toast ${type}`}>
            {type === 'success' ? <IconCheck /> : <IconAlert />}
            <span style={{ flex: 1 }}>{message}</span>
            <button className="btn-icon" onClick={onClose} style={{ color: '#fff' }}><IconX /></button>
        </div>
    )
}
