'use client'
import React from 'react';
import '@/styles/Login.css';

const SERVICES = [
  {
    id: 'lfo',
    name: 'Rizbell LFO',
    href: 'https://lfo.rizbell.com/auth/login',
    active: false,
  },
  {
    id: 'swipe-lp',
    name: 'Rizbell スワイプLP',
    href: '/auth/login',
    active: true,
  },
];

export default function Login({
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  isSignUp,
  setIsSignUp,
  authError,
  setAuthError,
  handleLogin,
  handleSignUp
}) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="login-page">
      <div className="login-content">
        {/* 1. ブランドヘッダー */}
        <div className="login-brand">
          <h2 className="brand-system-label">Rizbell システム</h2>
          <div className="brand-logo-wrapper">
            {/* ロゴ画像が用意できたら <img src="/images/swipe-lp-logo.png" alt="Rizbell スワイプLP" /> に差し替え */}
            <span className="brand-logo-text">リズベル スワイプLP</span>
          </div>
        </div>

        {/* 2. ログインフォームカード */}
        <div className="login-card">
          <div className="login-card-header">
            <h1 className="login-card-title">{isSignUp ? '新規登録' : 'ログイン'}</h1>
            <p className="login-card-desc">
              {isSignUp
                ? 'アカウントを作成してスワイプLPを始めましょう'
                : 'メールアドレスとパスワードでログインできます'}
            </p>
          </div>
          <div className="login-card-body">
            <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
              <div className="login-form-group">
                <label htmlFor="email">メールアドレス</label>
                <input
                  id="email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  placeholder="example@email.com"
                />
              </div>
              <div className="login-form-group">
                <div className="login-label-row">
                  <label htmlFor="password">パスワード</label>
                  {!isSignUp && (
                    <a href="#" className="login-forgot-link">パスワードを忘れた方</a>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              {authError && (
                <div className="login-error">
                  {authError}
                </div>
              )}
              <button type="submit" className="login-submit-btn">
                {isSignUp ? '新規登録する' : 'ログインする'}
              </button>
            </form>
            <div className="login-toggle-row">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError('');
                }}
                className="login-toggle-btn"
              >
                {isSignUp ? '既にアカウントをお持ちの方はこちら' : 'アカウントをお持ちでない方はこちら'}
              </button>
            </div>
          </div>
        </div>

        {/* 3. サービス切り替え */}
        <div className="login-service-switch">
          <p className="service-switch-label">各種ログインはこちら</p>
          <div className="service-switch-buttons">
            {SERVICES.map((service) => (
              <a
                key={service.id}
                href={service.active ? undefined : service.href}
                className={`service-switch-btn ${service.active ? 'active' : ''}`}
                onClick={service.active ? (e) => e.preventDefault() : undefined}
              >
                {service.name}
              </a>
            ))}
          </div>
        </div>

        {/* 4. フッター */}
        <footer className="login-footer">
          &copy; {currentYear} Rizbell Inc.
        </footer>
      </div>
    </div>
  );
}
