import React from 'react'
import { IconLogoAL, IconTooth } from './Icons'

const VALID_USERS = [
    { username: 'analeticia', password: '484659', name: 'Dra. Ana Letícia' },
]

export default function LoginScreen({ onLogin }) {
    const [username, setUsername] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [error, setError] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [showPassword, setShowPassword] = React.useState(false)

    function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Simulate a brief loading
        setTimeout(() => {
            const user = VALID_USERS.find(
                u => u.username === username.toLowerCase().trim() && u.password === password
            )

            if (user) {
                onLogin(user)
            } else {
                setError('Usuário ou senha inválidos')
                setLoading(false)
            }
        }, 600)
    }

    return (
        <div className="login-screen">
            {/* Animated background particles */}
            <div className="login-bg-particles">
                <div className="particle p1"></div>
                <div className="particle p2"></div>
                <div className="particle p3"></div>
                <div className="particle p4"></div>
                <div className="particle p5"></div>
            </div>

            <div className="login-card">
                {/* Logo section */}
                <div className="login-logo-section">
                    <div className="login-logo-circle">
                        <IconLogoAL />
                    </div>
                    <h1 className="login-brand-name">OdontoClin</h1>
                    <p className="login-brand-subtitle">Sistema de Gestão Odontológica</p>
                </div>

                {/* Decorative divider */}
                <div className="login-divider">
                    <span className="login-divider-line"></span>
                    <IconTooth />
                    <span className="login-divider-line"></span>
                </div>

                {/* Form */}
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label className="login-label" htmlFor="login-user">Usuário</label>
                        <div className="login-input-wrap">
                            <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <input
                                id="login-user"
                                type="text"
                                className="login-input"
                                placeholder="Digite seu usuário"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                autoComplete="username"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="login-field">
                        <label className="login-label" htmlFor="login-pass">Senha</label>
                        <div className="login-input-wrap">
                            <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                id="login-pass"
                                type={showPassword ? 'text' : 'password'}
                                className="login-input"
                                placeholder="Digite sua senha"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="login-toggle-pass"
                                onClick={() => setShowPassword(v => !v)}
                                tabIndex={-1}
                                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {showPassword ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="login-error">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className={`login-btn ${loading ? 'loading' : ''}`}
                        disabled={loading || !username || !password}
                    >
                        {loading ? (
                            <span className="login-spinner"></span>
                        ) : (
                            <>
                                <span>Entrar</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                    <polyline points="10 17 15 12 10 7" />
                                    <line x1="15" y1="12" x2="3" y2="12" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>© 2026 OdontoClin — Todos os direitos reservados</p>
                </div>
            </div>
        </div>
    )
}
