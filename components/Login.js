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
  return (
    <div className="login-container">
      {/* 左側: 青背景 */}
      <div className="login-left">
        <div className="login-left-content">
          <h1 className="login-logo">リズベルLP</h1>
          <p className="login-catchphrase">マイページへログイン</p>
        </div>
      </div>

      {/* 右側: 白背景 + フォーム */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="login-form">
            <div className="form-group">
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
            <div className="form-group">
              <label htmlFor="password">パスワード</label>
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
              <div className="error-message">
                {authError}
              </div>
            )}
            <button type="submit" className="login-submit-btn">
              {isSignUp ? '新規登録' : 'ログイン'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError('');
              }}
              className="login-toggle-btn"
            >
              {isSignUp ? '既にアカウントをお持ちの方はログイン' : '新規登録はこちら'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
