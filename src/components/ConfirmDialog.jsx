import React from 'react'
import { IconTrash, IconAlert, IconX } from './Icons'

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', type = 'danger', onConfirm, onCancel }) {
    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
                <div className={`confirm-icon ${type}`}>
                    {type === 'danger' ? <IconTrash /> : <IconAlert />}
                </div>
                <h3>{title}</h3>
                <p>{message}</p>
                <div className="confirm-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
                    <button className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    )
}
