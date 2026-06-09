import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { KEYFRAMES, ADMIN_EMAIL } from '../data/constants';

export const ClientAuth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
      }
      navigate(email === ADMIN_EMAIL ? '/admin' : '/profil');
    } catch {
      setError(isLogin ? 'Identifiants incorrects.' : 'Erreur — mot de passe trop court ?');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14,
    backgroundColor: 'rgba(242,240,233,0.06)',
    border: '2px solid rgba(242,240,233,0.15)',
    boxShadow: '3px 3px 0px rgba(88,115,115,0.25)',
    borderRadius: 6, color: '#F2F0E9',
    padding: '14px 16px', outline: 'none', transition: 'all 150ms ease'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0D0D0D', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <style>{KEYFRAMES}</style>

      {/* NAVBAR */}
      <nav style={{ height: 64, borderBottom: '2px solid rgba(88,115,115,0.2)', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <span className="lbc-bebas" style={{ fontSize: 26, letterSpacing: '0.15em', color: '#F2F0E9', textShadow: '2px 2px 0px rgba(88,115,115,0.4)' }}>LALBICUT</span>
        </button>
        <button onClick={() => navigate('/')} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'transparent',
          border: '2px solid rgba(242,240,233,0.12)', boxShadow: '2px 2px 0px rgba(88,115,115,0.15)',
          borderRadius: 4, cursor: 'pointer', padding: '7px 16px',
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: '0.1em',
          color: 'rgba(242,240,233,0.45)', transition: 'all 150ms ease'
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(242,240,233,0.8)'; e.currentTarget.style.borderColor = 'rgba(242,240,233,0.35)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(242,240,233,0.45)'; e.currentTarget.style.borderColor = 'rgba(242,240,233,0.12)'; }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          RETOUR AU SITE
        </button>
      </nav>

      {/* CONTENU */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Card */}
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '2px solid #587373', boxShadow: '6px 6px 0px #587373', backgroundColor: 'rgba(242,240,233,0.03)' }}>
            <div style={{ backgroundColor: '#587373', borderBottom: '2px solid rgba(242,240,233,0.2)', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="lbc-bebas" style={{ fontSize: 16, color: '#F2F0E9', letterSpacing: '0.18em' }}>
                {isLogin ? 'CONNEXION' : 'CRÉER UN COMPTE'}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {['connexion', 'inscription'].map((tab, i) => (
                  <button key={tab} onClick={() => { setIsLogin(i === 0); setError(''); }} style={{
                    background: (isLogin ? i === 0 : i === 1) ? 'rgba(242,240,233,0.2)' : 'transparent',
                    border: '1.5px solid rgba(242,240,233,0.2)', borderRadius: 3,
                    padding: '3px 10px', cursor: 'pointer',
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: '0.1em',
                    color: (isLogin ? i === 0 : i === 1) ? '#F2F0E9' : 'rgba(242,240,233,0.45)',
                    transition: 'all 150ms ease'
                  }}>
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: 32 }}>
              {error && (
                <div style={{ backgroundColor: 'rgba(242,240,233,0.06)', border: '1.5px solid rgba(242,240,233,0.2)', borderRadius: 4, padding: '10px 14px', marginBottom: 20 }}>
                  <p className="lbc-bebas" style={{ fontSize: 12, color: 'rgba(242,240,233,0.55)', letterSpacing: '0.1em', margin: 0 }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!isLogin && (
                  <div>
                    <label className="lbc-bebas" style={{ display: 'block', fontSize: 12, color: 'rgba(242,240,233,0.5)', letterSpacing: '0.15em', marginBottom: 6 }}>VOTRE NOM</label>
                    <input
                      type="text" required value={name} placeholder="Ex : Maxime Leroy"
                      onChange={e => setName(e.target.value)}
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = '#587373'; e.currentTarget.style.boxShadow = '4px 4px 0px #587373'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(242,240,233,0.15)'; e.currentTarget.style.boxShadow = '3px 3px 0px rgba(88,115,115,0.25)'; }}
                    />
                  </div>
                )}

                <div>
                  <label className="lbc-bebas" style={{ display: 'block', fontSize: 12, color: 'rgba(242,240,233,0.5)', letterSpacing: '0.15em', marginBottom: 6 }}>EMAIL</label>
                  <input
                    type="email" required value={email} placeholder="Ex : maxime@email.com"
                    onChange={e => setEmail(e.target.value)}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#587373'; e.currentTarget.style.boxShadow = '4px 4px 0px #587373'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(242,240,233,0.15)'; e.currentTarget.style.boxShadow = '3px 3px 0px rgba(88,115,115,0.25)'; }}
                  />
                </div>

                <div>
                  <label className="lbc-bebas" style={{ display: 'block', fontSize: 12, color: 'rgba(242,240,233,0.5)', letterSpacing: '0.15em', marginBottom: 6 }}>MOT DE PASSE</label>
                  <input
                    type="password" required value={password} placeholder="••••••••••"
                    onChange={e => setPassword(e.target.value)}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#587373'; e.currentTarget.style.boxShadow = '4px 4px 0px #587373'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(242,240,233,0.15)'; e.currentTarget.style.boxShadow = '3px 3px 0px rgba(88,115,115,0.25)'; }}
                  />
                </div>

                <button type="submit" disabled={loading} style={{
                  width: '100%', marginTop: 8,
                  backgroundColor: loading ? 'rgba(88,115,115,0.5)' : '#587373',
                  color: '#F2F0E9', border: '2px solid rgba(242,240,233,0.2)',
                  boxShadow: loading ? 'none' : '4px 4px 0px rgba(242,240,233,0.15)',
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: '0.12em',
                  padding: 15, borderRadius: 4, cursor: loading ? 'default' : 'pointer',
                  transition: 'transform 150ms ease, box-shadow 150ms ease'
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0px rgba(242,240,233,0.2)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = loading ? 'none' : '4px 4px 0px rgba(242,240,233,0.15)'; }}
                onMouseDown={e => { if (!loading) { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px rgba(242,240,233,0.1)'; } }}>
                  {loading ? '...' : isLogin ? 'SE CONNECTER' : "S'INSCRIRE"}
                </button>
              </form>
            </div>
          </div>

          {/* Lien retour réservation */}
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'rgba(242,240,233,0.25)', fontWeight: 600 }}>
            Pas besoin de compte pour réserver —{' '}
            <span onClick={() => navigate('/')} style={{ color: '#587373', cursor: 'pointer', textDecoration: 'underline' }}>
              réserver directement
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
