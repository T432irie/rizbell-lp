'use client'
import React from 'react';
import '@/styles/Login.css';

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
      <div className="login-inner">
        {/* ヘッダー：ブランド + サービス名 */}
        <div className="login-header">
          <h1 className="login-header-title">Rizbell システム</h1>
          <div className="login-header-logo">
            <p className="login-header-service">リズベル スワイプLP</p>
          </div>
        </div>

        {/* ログインフォーム */}
        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-card-title">{isSignUp ? '新規登録' : 'ログイン'}</h2>
            <p className="login-card-desc">
              {isSignUp
                ? 'アカウントを作成してスワイプLPを始めましょう'
                : 'メールアドレスとパスワードでログインできます'}
            </p>
          </div>
          <div className="login-card-body">
            <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="login-form">
              <div className="login-field">
                <label htmlFor="email" className="login-label">メールアドレス</label>
                <input
                  id="email"
                  type="email"
                  className="login-input"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  placeholder="example@email.com"
                />
              </div>
              <div className="login-field">
                <div className="login-label-row">
                  <label htmlFor="password" className="login-label">パスワード</label>
                  {!isSignUp && (
                    <a href="#" className="login-forgot-link">パスワードを忘れた方</a>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  className="login-input"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              {authError && (
                <div className="login-error">{authError}</div>
              )}
              <button type="submit" className="login-submit-btn">
                {isSignUp ? '新規登録する' : 'ログインする'}
              </button>
              <div className="login-toggle-row">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}
                  className="login-toggle-btn"
                >
                  {isSignUp ? '既にアカウントをお持ちの方はこちら' : 'アカウントをお持ちでない方はこちら'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* サービス切り替え */}
        <div className="login-service-switch">
          <p className="service-switch-label">各種ログインはこちら</p>
          <div className="service-switch-buttons">
            <a href="https://lfo.rizbell.com/auth/login" className="service-switch-btn">
              Rizbell LFO
            </a>
            <a href="/auth/login" className="service-switch-btn active" onClick={(e) => e.preventDefault()}>
              Rizbell スワイプLP
            </a>
          </div>
        </div>

        {/* フッター */}
        <div className="login-footer">
          &copy; {currentYear} Rizbell Inc.
        </div>
      </div>
    </div>
  );
}
