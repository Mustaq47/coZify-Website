import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
import confetti from 'canvas-confetti';

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: '📊', title: 'Smart Budget Tracking', desc: 'Track income, expenses, savings, and investments in real time. Your full financial picture, always visible.', accent: '#7B61FF' },
  { icon: '💳', title: 'Custom Categories', desc: 'Shopping, Food, Transport, Bills, Health — and any category you create. Tag every transaction your way.', accent: '#FF4D8D' },
  { icon: '📈', title: 'Neon Visual Charts', desc: 'Beautiful animated charts show spending patterns and trends across weeks and months at a glance.', accent: '#00E5FF' },
  { icon: '🌍', title: '18+ Languages', desc: 'Available in English, Hindi, Arabic, Chinese, Japanese, French, Spanish, German, Korean, and more.', accent: '#FFD166' },
  { icon: '🔒', title: 'Privacy & Security', desc: 'Your financial data is encrypted and secure. Biometric login, privacy controls, and zero data selling.', accent: '#7B61FF' },
  { icon: '🎨', title: 'Design & Themes', desc: 'Futuristic dark UI with neon accents. The app that looks as good as it works. Customise your experience.', accent: '#FF4D8D' },
];

const CATEGORIES = [
  { label: 'Shopping', color: '#EC4899', emoji: '🛍️' },
  { label: 'Food', color: '#8B5CF6', emoji: '☕' },
  { label: 'Transport', color: '#06B6D4', emoji: '🚗' },
  { label: 'Bills', color: '#F97316', emoji: '🏠' },
  { label: 'Health', color: '#EC4899', emoji: '❤️' },
  { label: 'Utilities', color: '#06B6D4', emoji: '⚡' },
  { label: 'Savings', color: '#F59E0B', emoji: '🐷' },
  { label: 'Income', color: '#22C55E', emoji: '📈' },
  { label: 'Investments', color: '#6366F1', emoji: '💹' },
];

const LANGUAGES = [
  'English', 'हिन्दी', 'العربية', '中文', '日本語',
  'Français', 'Deutsch', 'Español', '한국어', 'Português',
  'Italiano', 'Polski', 'Русский', 'Nederlands', 'Ελληνικά',
  'עברית', 'తెలుగు', 'Tiếng Việt',
];

const TRANSACTIONS = [
  { label: 'Netflix', cat: 'Bills', amount: '-₹649', color: '#F97316', emoji: '🏠' },
  { label: 'Salary', cat: 'Income', amount: '+₹85,000', color: '#22C55E', emoji: '📈' },
  { label: 'Zomato', cat: 'Food', amount: '-₹450', color: '#8B5CF6', emoji: '☕' },
  { label: 'Uber', cat: 'Transport', amount: '-₹280', color: '#06B6D4', emoji: '🚗' },
];

// ─── Motion Variants ───────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

// ─── Phone Mockup ──────────────────────────────────────────────────────────────

function PhoneMockup({ dark }: { dark: boolean }) {
  const bg = dark ? 'linear-gradient(180deg,#0a0a1f 0%,#1a0b2e 100%)' : 'linear-gradient(180deg,#f0f4ff 0%,#e8eeff 100%)';
  const mutedColor = dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
  const glassBg = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const glassBorder = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const dividerColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  return (
    <div style={{ background: dark ? 'linear-gradient(145deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))' : 'linear-gradient(145deg,rgba(0,0,0,0.1),rgba(0,0,0,0.04))', border: dark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.12)', borderRadius: '2.5rem', padding: '0.875rem', boxShadow: dark ? '0 0 80px rgba(123,97,255,0.2),0 40px 80px rgba(0,0,0,0.5)' : '0 40px 80px rgba(0,0,0,0.15)', width: 240, margin: '0 auto' }}>
      <div style={{ background: bg, borderRadius: '2rem', overflow: 'hidden', padding: '1.1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.6rem', color: mutedColor, fontFamily: 'JetBrains Mono,monospace' }}>9:41</span>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }} />
        </div>
        <div style={{ background: glassBg, border: `1px solid ${glassBorder}`, borderRadius: '0.875rem', padding: '0.7rem', marginBottom: '0.7rem' }}>
          <p style={{ fontSize: '0.6rem', color: mutedColor, marginBottom: '0.2rem' }}>Total Balance</p>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#7B61FF,#00E5FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>₹1,24,350</p>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
            <span style={{ fontSize: '0.55rem', color: '#22C55E', fontWeight: 600 }}>↑ ₹85,000</span>
            <span style={{ fontSize: '0.55rem', color: '#FF4D8D', fontWeight: 600 }}>↓ ₹12,450</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 44, marginBottom: '0.7rem' }}>
          {[40, 65, 30, 80, 55, 70, 45].map((h, i) => (
            <motion.div key={i} style={{ flex: 1, background: i === 3 ? '#7B61FF' : (dark ? 'rgba(123,97,255,0.25)' : 'rgba(123,97,255,0.15)'), borderRadius: '3px 3px 0 0' }}
              initial={{ height: 0 }} animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.05 + 0.5, duration: 0.5, ease: 'easeOut' as const }} />
          ))}
        </div>
        {TRANSACTIONS.map((t) => (
          <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.35rem 0', borderBottom: `1px solid ${dividerColor}` }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: t.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0 }}>{t.emoji}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.63rem', fontWeight: 600, color: dark ? '#fff' : '#111' }}>{t.label}</p>
              <p style={{ fontSize: '0.55rem', color: mutedColor }}>{t.cat}</p>
            </div>
            <span style={{ fontSize: '0.63rem', fontWeight: 700, color: t.amount.startsWith('+') ? '#22C55E' : '#FF4D8D' }}>{t.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, dark, children }: { title: string; onClose: () => void; dark: boolean; children: React.ReactNode }) {
  const isLogin = title.includes('Access') || title.includes('Platform');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'fixed', inset: 0,
        background: dark ? 'rgba(0,0,0,0.75)' : 'rgba(15,23,42,0.4)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
      }}
      onClick={onClose}
    >
      {/* Outer shell — Double-Bezel architecture */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        style={{
          background: dark
            ? 'linear-gradient(160deg, rgba(30,30,35,0.95) 0%, rgba(10,10,14,0.98) 100%)'
            : 'linear-gradient(160deg, #ffffff 0%, #f9fafb 100%)',
          border: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
          borderRadius: isLogin ? '2rem' : '1.75rem',
          padding: isLogin ? '2.5rem 2.25rem' : '2rem',
          maxWidth: isLogin ? 420 : 480,
          width: '100%',
          maxHeight: '85dvh',
          overflowY: 'auto',
          boxShadow: dark
            ? '0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)'
            : '0 32px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top header */}
        {!isLogin && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <h2 style={{
              fontWeight: 700, fontSize: '1.35rem', letterSpacing: '-0.03em',
              color: dark ? '#f5f5f7' : '#1d1d1f', margin: 0,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
            }}>{title}</h2>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onClose}
              style={{
                background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                border: 'none',
                color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
                fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.32,0.72,0,1)'
              }}
            >
              ✕
            </motion.button>
          </div>
        )}
        {isLogin && (
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onClose}
            style={{
              position: 'absolute', top: '1.25rem', right: '1.25rem',
              background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              border: 'none',
              color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
              fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s cubic-bezier(0.32,0.72,0,1)', zIndex: 2
            }}
          >
            ✕
          </motion.button>
        )}
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── Suggestion Section ───────────────────────────────────────────────────────

// ─── Login Form Component ─────────────────────────────────────────────────────

const syncWebUser = async (user: any, displayName?: string | null) => {
  const userRef = doc(db, "users", user.uid);
  const authMethod = user.providerData?.[0]?.providerId === "google.com" || user.email?.endsWith("@gmail.com")
    ? "google"
    : "email";
  await setDoc(userRef, {
    uid: user.uid,
    email: (user.email || `user_${user.uid}@cozify.local`).toLowerCase(),
    displayName: displayName || user.displayName || user.email?.split("@")[0] || "coZify Web User",
    photoURL: user.photoURL || null,
    platform: "Web",
    authMethod,
    appVersion: "1.0.0-web",
    lastLoginAt: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

function LoginForm({ dark, onAuthSuccess }: { dark: boolean; onAuthSuccess: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const accentPurple = '#7B61FF';

  const primaryGradient = 'linear-gradient(135deg, #7B61FF, #00E5FF)';
  const textColor = dark ? '#F8FAFC' : '#111827';
  const mutedColor = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const inputBg = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
  const borderDefault = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const focusBorder = dark ? accentPurple : accentPurple;
  const sfFont = 'Space Grotesk, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  const getInputStyle = (field: string): React.CSSProperties => ({
    width: '100%', padding: '0.9rem 1rem', borderRadius: '0.875rem',
    background: inputBg,
    border: `1px solid ${focusedField === field ? focusBorder : borderDefault}`,
    color: textColor, fontFamily: sfFont, fontSize: '0.95rem', outline: 'none',
    transition: 'all 0.25s cubic-bezier(0.32,0.72,0,1)',
    boxSizing: 'border-box' as const,
    boxShadow: focusedField === field ? `0 0 0 3px ${accentPurple}22` : 'none'
  });

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        if (password.length < 6) throw new Error("Password should be at least 6 characters.");
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (name && credential.user) {
          const { updateProfile } = await import('firebase/auth');
          await updateProfile(credential.user, { displayName: name });
        }
        if (credential.user) await syncWebUser(credential.user, name);
      } else {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        if (credential.user) await syncWebUser(credential.user, null);
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/user-not-found') {
        setError("Invalid credentials. Sign up below if you're new.");
      } else {
        setError(err?.message || "Authentication failed.");
      }
    } finally { setLoading(false); }
  };

  const handleGoogleAuth = async () => {
    setError(null); setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      if (credential.user) await syncWebUser(credential.user, null);
      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      if (err?.code !== 'auth/popup-closed-by-user') setError(err?.message || "Google Sign-In failed.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Branded header with coZify logo */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.1 }}
          style={{ margin: '0 auto 1.25rem', display: 'flex', justifyContent: 'center' }}
        >
          <img src="/cozify-logo-light.png" alt="coZify"
            style={{
              height: 48, objectFit: 'contain',
              filter: dark ? 'invert(1) hue-rotate(180deg) brightness(1.15) drop-shadow(0 0 12px rgba(123,97,255,0.4))' : 'none',
              transition: 'all 0.4s ease'
            }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={{ fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.04em', color: textColor, margin: '0 0 0.35rem', fontFamily: sfFont }}
        >{isSignUp ? 'Create account' : 'Welcome back'}</motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ color: mutedColor, fontSize: '0.88rem', margin: 0, fontFamily: sfFont }}
        >{isSignUp ? 'Set up your coZify account' : 'Sign in to your coZify account'}</motion.p>
      </div>

      {/* Form */}
      <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {isSignUp && (
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: mutedColor, marginBottom: '0.4rem', letterSpacing: '0.03em', fontFamily: sfFont }}>Full Name</label>
            <input type="text" placeholder="Your name" required value={name}
              onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
              onChange={(e) => setName(e.target.value)} style={getInputStyle('name')} />
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: mutedColor, marginBottom: '0.4rem', letterSpacing: '0.03em', fontFamily: sfFont }}>Email</label>
          <input type="email" placeholder="name@example.com" required value={email}
            onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
            onChange={(e) => setEmail(e.target.value)} style={getInputStyle('email')} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: mutedColor, marginBottom: '0.4rem', letterSpacing: '0.03em', fontFamily: sfFont }}>Password</label>
          <input type="password" placeholder="••••••••" required value={password}
            onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
            onChange={(e) => setPassword(e.target.value)} style={getInputStyle('password')} />
        </div>

        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            style={{
              color: dark ? '#F87171' : '#EF4444', fontSize: '0.82rem', fontWeight: 500,
              margin: '0.1rem 0', lineHeight: 1.5, fontFamily: sfFont,
              padding: '0.6rem 0.8rem', borderRadius: '0.75rem',
              background: dark ? 'rgba(248,113,113,0.08)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${dark ? 'rgba(248,113,113,0.15)' : 'rgba(239,68,68,0.1)'}`
            }} aria-live="polite">{error}</motion.p>
        )}

        <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
          style={{
            background: primaryGradient, color: '#fff', border: 'none',
            borderRadius: '999px', padding: '0.85rem',
            fontFamily: sfFont, fontWeight: 700, fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.35rem',
            transition: 'all 0.25s cubic-bezier(0.32,0.72,0,1)',
            opacity: loading ? 0.65 : 1,
            boxShadow: `0 0 24px rgba(123,97,255,0.3)`
          }}>
          {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Continue'}
        </motion.button>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.15rem 0' }}>
        <div style={{ flex: 1, height: 1, background: borderDefault }} />
        <span style={{ fontSize: '0.7rem', color: mutedColor, fontWeight: 500, letterSpacing: '0.04em', fontFamily: sfFont }}>or</span>
        <div style={{ flex: 1, height: 1, background: borderDefault }} />
      </div>

      {/* Google */}
      <motion.button type="button" onClick={handleGoogleAuth} disabled={loading} whileTap={{ scale: 0.97 }}
        style={{
          background: 'transparent', border: `1px solid ${borderDefault}`,
          color: textColor, borderRadius: '999px', padding: '0.8rem', cursor: 'pointer',
          fontFamily: sfFont, fontWeight: 600, fontSize: '0.92rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
          transition: 'all 0.25s cubic-bezier(0.32,0.72,0,1)'
        }}>
        <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" stroke="none" />
        </svg>
        Google
      </motion.button>

      {/* Toggle */}
      <div style={{ textAlign: 'center', marginTop: '1.15rem' }}>
        <span style={{ color: mutedColor, fontSize: '0.85rem', fontFamily: sfFont }}>{isSignUp ? 'Already have an account? ' : 'New here? '}</span>
        <motion.button type="button" onClick={() => setIsSignUp(!isSignUp)}
          whileHover={{ opacity: 0.8 }} whileTap={{ scale: 0.98 }}
          style={{ background: 'none', border: 'none', color: accentPurple, fontSize: '0.85rem', cursor: 'pointer', fontFamily: sfFont, fontWeight: 600, padding: 0 }}>
          {isSignUp ? 'Sign in' : 'Create account'}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Suggestion Section ───────────────────────────────────────────────────────

interface SuggestionProps {
  dark: boolean;
  user: any;
  onOpenLogin: () => void;
}

function SuggestionSection({ dark, user, onOpenLogin }: SuggestionProps) {
  const [form, setForm] = useState({ name: '', email: '', type: 'Feature Request', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const cardBg = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const cardBorder = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const mutedText = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const inputBg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const inputBorder = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
  const textColor = dark ? '#fff' : '#111';

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: user.displayName || '',
        email: user.email || '',
      }));
    } else {
      setForm((f) => ({ ...f, name: '', email: '' }));
    }
  }, [user]);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
    background: inputBg, border: `1px solid ${inputBorder}`, color: textColor,
    fontFamily: 'Space Grotesk,sans-serif', fontSize: '0.95rem', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in first.");
      onOpenLogin();
      return;
    }

    setLoading(true);

    addDoc(collection(db, "support_queries"), {
      name: form.name || 'Anonymous',
      email: form.email,
      type: form.type,
      message: form.message,
      uid: user.uid,
      timestamp: serverTimestamp()
    })
      .then(() => {
        setLoading(false);
        setSubmitted(true);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        fetch("https://formsubmit.co/ajax/cozifyfinance@gmail.com", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            Name: form.name || 'Anonymous',
            Email: form.email,
            Type: form.type,
            Suggestion: form.message
          })
        }).then(() => setSubmitted(true))
          .catch(() => {
            const emailSubject = `coZify Suggestion [${form.type}]`;
            const emailBody = `Name: ${form.name}\nEmail: ${form.email}\nType: ${form.type}\n\nSuggestion:\n${form.message}`;
            window.location.href = `mailto:cozifyfinance@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
            setSubmitted(true);
          });
      });
  };

  return (
    <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}
      style={{ padding: 'clamp(4rem,8vw,7rem) 1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', filter: 'blur(80px)', background: 'rgba(0,229,255,0.07)', top: '-100px', right: '-100px', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p style={{ color: '#00E5FF', fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Community</p>
          <h2 style={{ fontSize: 'clamp(1.75rem,4vw,2.75rem)', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '1rem', color: textColor }}>
            Shape the{' '}
            <span style={{ background: 'linear-gradient(135deg,#00E5FF,#7B61FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>future of coZify</span>
          </h2>
          <p style={{ color: mutedText, lineHeight: 1.7 }}>
            Got an idea? Found a bug? Want a feature? Authenticate to link your suggestion to your account and help make coZify better.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '1.5rem', padding: 'clamp(1.5rem,4vw,2.25rem)', backdropFilter: 'blur(40px)' }}>
          <AnimatePresence mode="wait">
            {!user ? (
              <motion.div key="locked" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem', color: textColor }}>Authentic Suggestions Only</h3>
                <p style={{ color: mutedText, lineHeight: 1.7, maxWidth: '440px', margin: '0 auto 1.5rem' }}>
                  Please sign in with your coZify account (or create one) to verify your identity and unlock suggestion submission.
                </p>
                <button onClick={onOpenLogin}
                  style={{ background: 'linear-gradient(135deg,#7B61FF,#00E5FF)', color: 'white', border: 'none', borderRadius: '999px', padding: '0.75rem 2rem', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 0 24px rgba(123,97,255,0.4)', transition: 'all 0.2s' }}>
                  🔑 Sign In / Register
                </button>
              </motion.div>
            ) : submitted ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '2rem 0' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                  style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</motion.div>
                <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem', color: textColor }}>Thank you, {user.displayName || 'Friend'}!</h3>
                <p style={{ color: mutedText, lineHeight: 1.7 }}>Your suggestion has been written directly to our Firestore database. The team will review it!</p>
                <button onClick={() => setSubmitted(false)}
                  style={{ marginTop: '1.5rem', background: 'rgba(123,97,255,0.15)', border: '1px solid rgba(123,97,255,0.3)', color: '#7B61FF', borderRadius: '999px', padding: '0.6rem 1.5rem', cursor: 'pointer', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 600, fontSize: '0.9rem' }}>
                  Send another →
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  {/* Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: mutedText, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your Name</label>
                    <input type="text" disabled value={form.name} style={{ ...inputStyle, opacity: 0.7 }} />
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: mutedText, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your Email</label>
                    <input type="email" disabled value={form.email} style={{ ...inputStyle, opacity: 0.7 }} />
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: mutedText, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Type</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['Feature Request', 'Bug Report', 'UI Feedback', 'Other'].map((t) => (
                      <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, type: t }))}
                        style={{ padding: '0.45rem 1rem', borderRadius: '999px', border: `1px solid ${form.type === t ? '#7B61FF' : inputBorder}`, background: form.type === t ? 'rgba(123,97,255,0.15)' : 'transparent', color: form.type === t ? '#7B61FF' : mutedText, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 500, transition: 'all 0.2s' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: mutedText, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your Suggestion *</label>
                  <textarea required placeholder="Tell us what you'd love to see in coZify..."
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
                    onFocus={(e) => (e.target.style.borderColor = '#7B61FF')}
                    onBlur={(e) => (e.target.style.borderColor = inputBorder)} />
                </div>

                {/* Submit */}
                <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading}
                  style={{ background: loading ? 'rgba(123,97,255,0.4)' : 'linear-gradient(135deg,#7B61FF,#00E5FF)', color: 'white', border: 'none', borderRadius: '999px', padding: '0.875rem', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 0 30px rgba(123,97,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
                  {loading ? (
                    <><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' as const }} style={{ display: 'inline-block' }}>⏳</motion.span> Sending...</>
                  ) : '✉️ Send Suggestion'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Past suggestion indicators */}
        <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {[{ icon: '✅', label: 'Telugu language — added' }, { icon: '✅', label: 'Custom categories — shipped' }, { icon: '🔄', label: 'iOS version — in progress' }].map((item) => (
            <span key={item.label} style={{ fontSize: '0.78rem', color: mutedText, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>{item.icon}</span> {item.label}
            </span>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const [dark, setDark] = useState(false);
  const [modal, setModal] = useState<'privacy' | 'support' | 'contact' | 'login' | null>(null);
  const [user, setUser] = useState<any>(null);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showThanks, setShowThanks] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u?.email) {
        if (sessionStorage.getItem('hasSeenThanks') !== 'true') {
          try {
            const q = query(collection(db, 'special_emails'), where('email', '==', u.email));
            const snap = await getDocs(q);
            if (!snap.empty) {
              sessionStorage.setItem('hasSeenThanks', 'true');
              setShowThanks(true);
              const duration = 3000;
              const end = Date.now() + duration;

              const frame = () => {
                confetti({
                  particleCount: 5,
                  angle: 60,
                  spread: 55,
                  origin: { x: 0 },
                  colors: ['#7B61FF', '#00E5FF', '#FF4D8D']
                });
                confetti({
                  particleCount: 5,
                  angle: 120,
                  spread: 55,
                  origin: { x: 1 },
                  colors: ['#7B61FF', '#00E5FF', '#FF4D8D']
                });

                if (Date.now() < end) {
                  requestAnimationFrame(frame);
                }
              };
              frame();
            }
          } catch (error) {
            console.error('Error checking special emails:', error);
          }
        }
      }
    });
  }, []);

  const cardBg = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const cardBorder = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const mutedText = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const textColor = dark ? '#fff' : '#111';
  const primaryGreen = dark ? '#4ADE80' : '#16A34A';
  const bodyBg = dark ? 'linear-gradient(180deg,#000000 0%,#0a0a1f 50%,#1a0b2e 100%)' : 'linear-gradient(180deg,#f0f4ff 0%,#e8f0ff 60%,#f5e8ff 100%)';
  const navBg = dark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.75)';
  const navBorder = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const divider = `linear-gradient(90deg,transparent,${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'},transparent)`;

  const apkHref = '/coZify-auth-fix.apk';

  const DownloadBtn = ({ style }: { style?: React.CSSProperties }) => {
    if (user) {
      return (
        <a href={apkHref} download style={{ background: 'linear-gradient(135deg,#7B61FF,#00E5FF)', color: 'white', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 600, border: 'none', padding: '0.75rem 1.5rem', borderRadius: 999, cursor: 'pointer', textDecoration: 'none', fontSize: '0.9rem', boxShadow: '0 0 24px rgba(123,97,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap', ...style }}>
          📥 Download APK
        </a>
      );
    }
    return (
      <button onClick={() => setModal('login')} style={{ background: 'linear-gradient(135deg,#7B61FF,#00E5FF)', color: 'white', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 600, border: 'none', padding: '0.75rem 1.5rem', borderRadius: 999, cursor: 'pointer', textDecoration: 'none', fontSize: '0.9rem', boxShadow: '0 0 24px rgba(123,97,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap', ...style }}>
        📥 Download APK
      </button>
    );
  };

  return (
    <div style={{ background: bodyBg, color: textColor, minHeight: '100dvh', transition: 'all 0.4s ease', fontFamily: 'Space Grotesk,sans-serif', overflowX: 'hidden' }}>

      {/* ─── MODALS ─── */}
      <AnimatePresence>
        {showThanks && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
            <motion.div initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: -20 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={{ background: dark ? 'rgba(20,20,30,0.85)' : 'rgba(255,255,255,0.85)', padding: '3rem 2rem', borderRadius: '2rem', border: `1px solid ${cardBorder}`, boxShadow: '0 24px 64px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) inset', maxWidth: 420, width: '100%', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(123,97,255,0.1), rgba(0,229,255,0.1))', borderRadius: '2rem', pointerEvents: 'none' }} />
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', color: textColor, letterSpacing: '-0.02em' }}>Thank You!</h2>
              <p style={{ color: mutedText, lineHeight: 1.6, marginBottom: '2rem', fontSize: '1.05rem' }}>
                Thanks for your Support and using my app. Here is the updated app, if you have any suggestions please report them to me!
              </p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowThanks(false)}
                style={{ background: 'linear-gradient(135deg,#7B61FF,#00E5FF)', color: 'white', border: 'none', padding: '0.875rem 2rem', borderRadius: 999, fontSize: '1rem', fontWeight: 600, fontFamily: 'Space Grotesk,sans-serif', cursor: 'pointer', boxShadow: '0 8px 24px rgba(123,97,255,0.3)', width: '100%' }}>
                Awesome
              </motion.button>
            </motion.div>
          </motion.div>
        )}
        {modal === 'privacy' && (
          <Modal title="Privacy Policy" onClose={() => setModal(null)} dark={dark}>
            <div style={{ color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.7)', lineHeight: 1.8, fontSize: '0.9rem' }}>
              <h3 style={{ color: primaryGreen, fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Your Data, Your Control</h3>
              <p style={{ marginBottom: '1rem' }}>coZify is designed with privacy as a core principle. We collect only what you choose to enter.</p>
              <h3 style={{ color: primaryGreen, fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>What We Collect</h3>
              <p style={{ marginBottom: '1rem' }}>Transaction data, category names, and budget settings stored locally on your device. Cloud sync is optional and encrypted.</p>
              <h3 style={{ color: primaryGreen, fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>What We Don't Do</h3>
              <ul style={{ paddingLeft: '1.25rem', marginBottom: '1rem' }}>
                <li>Never sell your data to third parties</li>
                <li>No advertising networks</li>
                <li>No cross-app tracking</li>
                <li>No access to banking credentials</li>
              </ul>
              <h3 style={{ color: primaryGreen, fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Security</h3>
              <p>All data encrypted at rest with AES-256. Optional biometric lock.</p>
            </div>
          </Modal>
        )}
        {modal === 'support' && (
          <Modal title="Help & Support" onClose={() => setModal(null)} dark={dark}>
            <div style={{ color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.7)', lineHeight: 1.8, fontSize: '0.9rem' }}>
              {[
                { q: 'How do I add a transaction?', a: 'Tap + on the Home screen, fill in amount, category, and note.' },
                { q: 'Can I create custom categories?', a: 'Yes! Go to Categories in settings and tap "Add Category".' },
                { q: 'Is my data backed up?', a: 'Stored locally by default. Sign in with Google for cloud backup.' },
                { q: 'How do I change language?', a: 'Go to Profile → Language & Region. 18+ languages available.' },
                { q: 'Is coZify really free?', a: 'Yes. Completely free. No ads, no subscriptions.' },
              ].map((item) => (
                <div key={item.q} style={{ marginBottom: '1.15rem' }}>
                  <p style={{ color: dark ? 'white' : '#111827', fontWeight: 700, marginBottom: '0.2rem', letterSpacing: '-0.01em' }}>{item.q}</p>
                  <p>{item.a}</p>
                </div>
              ))}
              <div style={{
                marginTop: '1.5rem', padding: '1.25rem',
                background: dark ? 'rgba(74,222,128,0.06)' : 'rgba(22,163,74,0.04)',
                border: dark ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(22,163,74,0.15)',
                borderRadius: '1.25rem'
              }}>
                <p style={{ color: primaryGreen, fontWeight: 700, marginBottom: '0.25rem' }}>Still need help?</p>
                <p>Email <strong style={{ color: dark ? 'white' : '#111827' }}>support@cozify.app</strong> — we respond within 24 hours.</p>
              </div>
            </div>
          </Modal>
        )}
        {modal === 'contact' && (
          <Modal title="Contact Us" onClose={() => setModal(null)} dark={dark}>
            <div style={{ color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.7)', lineHeight: 1.8, fontSize: '0.9rem' }}>
              <p style={{ marginBottom: '1.25rem' }}>Reach out for support, feedback, partnerships, or press.</p>
              {[
                { icon: '✉️', label: 'General / Support', value: 'support@cozify.app' },
                { icon: '🤝', label: 'Partnerships', value: 'hello@cozify.app' },
                { icon: '📰', label: 'Press', value: 'press@cozify.app' },
              ].map((c) => (
                <div key={c.label} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                  background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '1rem', marginBottom: '0.75rem'
                }}>
                  <span style={{ fontSize: '1.4rem' }}>{c.icon}</span>
                  <div>
                    <p style={{ color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.5)', fontSize: '0.72rem', margin: '0 0 0.15rem 0' }}>{c.label}</p>
                    <p style={{ color: primaryGreen, fontWeight: 700, margin: 0 }}>{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Modal>
        )}
        {modal === 'login' && (
          <Modal title="Access coZify Platform" onClose={() => setModal(null)} dark={dark}>
            <LoginForm dark={dark} onAuthSuccess={() => setModal(null)} />
          </Modal>
        )}
      </AnimatePresence>

      {/* ─── NAV ─── */}
      <motion.nav initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: 'easeOut' as const }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: navBg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${navBorder}`, transition: 'background 0.4s ease' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/cozify-logo-light.png" alt="coZify"
            style={{ height: 32, objectFit: 'contain', filter: dark ? 'invert(1) hue-rotate(180deg) brightness(1.15) drop-shadow(0 0 12px rgba(34,197,94,0.45))' : 'none', transition: 'all 0.4s ease' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>

        {/* Desktop controls */}
        <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setDark((d) => !d)}
            style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', border: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 999, padding: '0.45rem 1rem', cursor: 'pointer', color: textColor, fontSize: '0.8rem', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'all 0.3s ease', whiteSpace: 'nowrap' }}>
            <motion.span key={String(dark)} initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.25 }}>
              {dark ? '☀️' : '🌙'}
            </motion.span>
            {dark ? 'Light' : 'Dark'}
          </motion.button>
          {user ? (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => signOut(auth)}
              style={{ background: 'rgba(255,77,141,0.1)', border: '1px solid rgba(255,77,141,0.25)', borderRadius: 999, padding: '0.45rem 1rem', cursor: 'pointer', color: '#FF4D8D', fontSize: '0.8rem', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 600, transition: 'all 0.3s ease', whiteSpace: 'nowrap' }}>
              🚪 Sign Out
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setModal('login')}
              style={{ background: 'rgba(123,97,255,0.12)', border: '1px solid rgba(123,97,255,0.3)', borderRadius: 999, padding: '0.45rem 1rem', cursor: 'pointer', color: '#7B61FF', fontSize: '0.8rem', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 600, transition: 'all 0.3s ease', whiteSpace: 'nowrap' }}>
              🔑 Sign In
            </motion.button>
          )}
          <DownloadBtn />
        </div>

        {/* Mobile hamburger */}
        <button className="nav-mobile-btn" onClick={() => setMobileMenuOpen((o) => !o)}
          style={{ background: 'none', border: `1px solid ${navBorder}`, borderRadius: '0.5rem', padding: '0.45rem 0.6rem', cursor: 'pointer', color: textColor, fontSize: '1.1rem', display: 'none' }}>
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </motion.nav>

      {/* Mobile slide-down menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
            style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 99, background: navBg, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${navBorder}`, padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setDark((d) => !d); setMobileMenuOpen(false); }}
              style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', border: `1px solid ${cardBorder}`, borderRadius: 999, padding: '0.7rem 1.25rem', cursor: 'pointer', color: textColor, fontSize: '0.9rem', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              {dark ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
            </motion.button>
            {user ? (
              <a href={apkHref} download onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'linear-gradient(135deg,#7B61FF,#00E5FF)', color: 'white', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 600, border: 'none', padding: '0.75rem 1.5rem', borderRadius: 999, textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', boxShadow: '0 0 24px rgba(123,97,255,0.4)' }}>
                📥 Download APK — Free
              </a>
            ) : (
              <button onClick={() => { setMobileMenuOpen(false); setModal('login'); }}
                style={{ background: 'linear-gradient(135deg,#7B61FF,#00E5FF)', color: 'white', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 600, border: 'none', padding: '0.75rem 1.5rem', borderRadius: 999, textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', boxShadow: '0 0 24px rgba(123,97,255,0.4)', cursor: 'pointer' }}>
                📥 Download APK — Free
              </button>
            )}
            {user ? (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { signOut(auth); setMobileMenuOpen(false); }}
                style={{ background: 'rgba(255,77,141,0.08)', border: '1px solid rgba(255,77,141,0.2)', borderRadius: 999, padding: '0.7rem 1.25rem', cursor: 'pointer', color: '#FF4D8D', fontSize: '0.9rem', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                🚪 Sign Out ({user.displayName || user.email})
              </motion.button>
            ) : (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setModal('login'); setMobileMenuOpen(false); }}
                style={{ background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.25)', borderRadius: 999, padding: '0.7rem 1.25rem', cursor: 'pointer', color: '#7B61FF', fontSize: '0.9rem', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                🔑 Sign In / Register
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HERO ─── */}
      <section ref={heroRef} style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', paddingTop: '5rem' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', filter: 'blur(80px)', background: 'rgba(123,97,255,0.12)', top: '-150px', right: '-150px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', filter: 'blur(80px)', background: 'rgba(0,229,255,0.08)', bottom: '-80px', left: '-80px', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
          <div className="hero-grid">
            {/* Copy */}
            <motion.div style={{ y: heroY, opacity: heroOpacity }}>
              <motion.div variants={stagger} initial="hidden" animate="visible">
                <motion.div variants={fadeUp} style={{ marginBottom: '1.25rem' }}>
                  <span style={{ background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1px solid ${cardBorder}`, borderRadius: 999, padding: '0.4rem 1rem', fontSize: '0.78rem', fontFamily: 'JetBrains Mono,monospace', color: mutedText }}>
                    🚀 Smart Finance for Everyone
                  </span>
                </motion.div>

                <motion.h1 variants={fadeUp} style={{ fontSize: 'clamp(2.2rem,5vw,4rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: '1.25rem', color: textColor }}>
                  Budget smarter.{' '}
                  <span style={{ background: 'linear-gradient(135deg,#7B61FF,#00E5FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Spend better.</span>{' '}
                  <span style={{ background: 'linear-gradient(135deg,#FF4D8D,#FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Live more.</span>
                </motion.h1>

                <motion.p variants={fadeUp} style={{ fontSize: 'clamp(0.95rem,2vw,1.1rem)', lineHeight: 1.75, color: mutedText, marginBottom: '2rem', maxWidth: 480 }}>
                  coZify is the futuristic budget tracker that turns your finances into a clear, beautiful picture — real-time balance, smart categories, neon charts, and 18+ language support.
                </motion.p>

                <motion.div variants={fadeUp} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                  <DownloadBtn style={{ fontSize: '0.95rem', padding: '0.8rem 1.75rem' }} />
                  <button style={{ background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: textColor, fontFamily: 'Space Grotesk,sans-serif', fontWeight: 500, border: `1px solid ${cardBorder}`, padding: '0.8rem 1.75rem', borderRadius: 999, cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="16" height="19" viewBox="0 0 814 1000" style={{ fill: 'currentColor' }}><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.9C44.5 761.5 0 621.1 0 488.9 0 313.2 117.7 220.3 233.5 220.3c64.5 0 118.2 42.5 158.7 42.5 38.6 0 98.9-45 170.5-45 27.5 0 126.6 2.1 191.4 123.1zM554.1 159.4c31.1-36.9 53.1-88.1 53.1-139.4 0-7.1-.6-14.3-1.9-20-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8.6 15.7 1.3 18.2 2.6.6 6.4.6 10.2.6 45.9 0 103.4-30.4 139.5-70.7z" /></svg>
                    iOS Soon
                  </button>
                </motion.div>

                <motion.div variants={fadeUp} style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  {[{ value: '18+', label: 'Languages' }, { value: '100%', label: 'Free' }, { value: '∞', label: 'Categories' }].map((s) => (
                    <div key={s.label}>
                      <p style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.04em', background: 'linear-gradient(135deg,#7B61FF,#00E5FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</p>
                      <p style={{ fontSize: '0.78rem', color: mutedText, fontWeight: 500 }}>{s.label}</p>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Phone mockup */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' as const }}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' as const }}>
                <PhoneMockup dark={dark} />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ width: '100%', height: 1, background: divider }} />

      {/* ─── FEATURES ─── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(4rem,8vw,8rem) 1.5rem' }}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ color: '#7B61FF', fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Everything You Need</p>
            <h2 style={{ fontSize: 'clamp(1.75rem,4vw,3rem)', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '1rem', color: textColor }}>
              Your finances,{' '}
              <span style={{ background: 'linear-gradient(135deg,#7B61FF,#00E5FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>finally under control</span>
            </h2>
            <p style={{ color: mutedText, maxWidth: 500, margin: '0 auto', lineHeight: 1.7, fontSize: 'clamp(0.9rem,2vw,1rem)' }}>Every feature built with purpose. Designed so you spend less time worrying and more time living.</p>
          </motion.div>
          <div className="feature-grid">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp}
                style={{ background: cardBg, border: `1px solid ${hoveredFeature === i ? f.accent + '44' : cardBorder}`, backdropFilter: 'blur(40px)', borderRadius: '1.5rem', padding: 'clamp(1.25rem,3vw,1.75rem)', cursor: 'default', transition: 'all 0.3s ease', transform: hoveredFeature === i ? 'translateY(-2px)' : 'none', boxShadow: hoveredFeature === i ? `0 0 40px ${f.accent}22` : 'none' }}
                onMouseEnter={() => setHoveredFeature(i)} onMouseLeave={() => setHoveredFeature(null)}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: f.accent + '22', border: `1px solid ${f.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '0.875rem' }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.45rem', letterSpacing: '-0.02em', color: textColor }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: mutedText }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <div style={{ width: '100%', height: 1, background: divider }} />

      {/* ─── CATEGORIES ─── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(4rem,8vw,8rem) 1.5rem' }}>
          <div className="categories-grid">
            <motion.div variants={fadeUp}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                {CATEGORIES.map((c) => (
                  <motion.span key={c.label} whileHover={{ scale: 1.08 }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: `1px solid ${c.color}44`, borderRadius: 999, padding: '0.3rem 0.75rem', fontSize: '0.78rem', fontWeight: 500, color: c.color, cursor: 'default' }}>
                    {c.emoji} {c.label}
                  </motion.span>
                ))}
                <span style={{ display: 'inline-flex', alignItems: 'center', background: 'transparent', border: `1px dashed ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`, borderRadius: 999, padding: '0.3rem 0.75rem', fontSize: '0.78rem', fontWeight: 500, color: mutedText }}>
                  + Your Custom Category
                </span>
              </div>
            </motion.div>
            <motion.div variants={fadeUp}>
              <p style={{ color: '#00E5FF', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Smart Categories</p>
              <h2 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.5rem)', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '1rem', lineHeight: 1.2, color: textColor }}>
                Track every rupee,{' '}
                <span style={{ background: 'linear-gradient(135deg,#7B61FF,#00E5FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>every way you spend</span>
              </h2>
              <p style={{ color: mutedText, lineHeight: 1.75, marginBottom: '1.5rem', fontSize: 'clamp(0.875rem,2vw,1rem)' }}>9 built-in categories. Unlimited custom ones. Every transaction tagged, every pattern revealed.</p>
              <DownloadBtn />
            </motion.div>
          </div>
        </div>
      </motion.section>

      <div style={{ width: '100%', height: 1, background: divider }} />

      {/* ─── LANGUAGES ─── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        style={{ padding: 'clamp(3rem,6vw,5rem) 0', overflow: 'hidden' }}>
        <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: '2.5rem', padding: '0 1.5rem' }}>
          <p style={{ color: '#FFD166', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Global Reach</p>
          <h2 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.5rem)', fontWeight: 700, letterSpacing: '-0.04em', color: textColor }}>
            Budget in{' '}
            <span style={{ background: 'linear-gradient(135deg,#FF4D8D,#FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>your language</span>
          </h2>
        </motion.div>
        {[false, true].map((reverse) => (
          <div key={String(reverse)} style={{ display: 'flex', overflow: 'hidden', marginBottom: '0.6rem' }}>
            <div style={{ display: 'flex', gap: '0.6rem', animation: `${reverse ? 'marqueeReverse' : 'marquee'} 25s linear infinite`, width: 'max-content' }}>
              {[...LANGUAGES, ...LANGUAGES].map((lang, i) => (
                <span key={i} style={{ display: 'inline-flex', background: reverse ? (dark ? 'rgba(123,97,255,0.06)' : 'rgba(123,97,255,0.05)') : (dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'), border: `1px solid ${reverse ? (dark ? 'rgba(123,97,255,0.2)' : 'rgba(123,97,255,0.15)') : cardBorder}`, borderRadius: 999, padding: '0.3rem 0.85rem', fontSize: '0.82rem', whiteSpace: 'nowrap', color: dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)' }}>{lang}</span>
              ))}
            </div>
          </div>
        ))}
      </motion.section>

      <div style={{ width: '100%', height: 1, background: divider }} />

      {/* ─── SUGGESTION SECTION ─── */}
      <SuggestionSection dark={dark} user={user} onOpenLogin={() => setModal('login')} />

      <div style={{ width: '100%', height: 1, background: divider }} />

      {/* ─── CTA BANNER ─── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        style={{ padding: 'clamp(4rem,8vw,7rem) 1.5rem' }}>
        <motion.div variants={fadeUp} style={{ maxWidth: 700, margin: '0 auto', padding: 'clamp(2rem,5vw,4rem)', textAlign: 'center', background: cardBg, border: `1px solid ${cardBorder}`, backdropFilter: 'blur(40px)', borderRadius: '2rem', position: 'relative', overflow: 'hidden', boxShadow: '0 0 80px rgba(123,97,255,0.1)' }}>
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', filter: 'blur(80px)', background: 'rgba(123,97,255,0.1)', top: '-150px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>💰</p>
            <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.75rem)', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '1rem', lineHeight: 1.2, color: textColor }}>
              Take control of your{' '}
              <span style={{ background: 'linear-gradient(135deg,#7B61FF,#00E5FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>financial future</span>
            </h2>
            <p style={{ color: mutedText, lineHeight: 1.7, maxWidth: 440, margin: '0 auto 2rem', fontSize: 'clamp(0.875rem,2vw,1rem)' }}>Join thousands tracking smarter, spending better, and building real financial clarity. Free forever.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <DownloadBtn style={{ padding: '0.875rem 2rem', fontSize: '1rem' }} />
              <button style={{ background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: textColor, fontFamily: 'Space Grotesk,sans-serif', fontWeight: 500, border: `1px solid ${cardBorder}`, padding: '0.875rem 2rem', borderRadius: 999, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="21" viewBox="0 0 814 1000" style={{ fill: 'currentColor' }}><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.9C44.5 761.5 0 621.1 0 488.9 0 313.2 117.7 220.3 233.5 220.3c64.5 0 118.2 42.5 158.7 42.5 38.6 0 98.9-45 170.5-45 27.5 0 126.6 2.1 191.4 123.1zM554.1 159.4c31.1-36.9 53.1-88.1 53.1-139.4 0-7.1-.6-14.3-1.9-20-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8.6 15.7 1.3 18.2 2.6.6 6.4.6 10.2.6 45.9 0 103.4-30.4 139.5-70.7z" /></svg>
                Coming to iOS
              </button>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: `1px solid ${navBorder}`, padding: '1.75rem 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <img src="/cozify-logo-light.png" alt="coZify"
            style={{ height: 26, objectFit: 'contain', filter: dark ? 'invert(1) hue-rotate(180deg) brightness(1.1) drop-shadow(0 0 8px rgba(34,197,94,0.35))' : 'none', transition: 'all 0.4s ease' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <p style={{ color: mutedText, fontSize: '0.78rem', textAlign: 'center' }}>© 2026 coZify. Built for people who care about their money.</p>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: 'Privacy', action: () => setModal('privacy') },
              { label: 'Support', action: () => setModal('support') },
              { label: 'Contact', action: () => setModal('contact') },
            ].map((link) => (
              <button key={link.label} onClick={link.action}
                style={{ background: 'none', border: 'none', color: mutedText, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'Space Grotesk,sans-serif', padding: 0, transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#7B61FF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = mutedText)}>
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* ─── Responsive CSS ─── */}
      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes marqueeReverse { from { transform: translateX(-50%); } to { transform: translateX(0); } }

        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.25rem;
        }
        .categories-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        .nav-desktop { display: flex; }
        .nav-mobile-btn { display: none !important; }

        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }

          .hero-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
            text-align: center;
          }
          .hero-grid > div:first-child { order: 1; }
          .hero-grid > div:last-child { order: 0; }

          .categories-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .categories-grid > div:first-child { order: 1; }
          .categories-grid > div:last-child { order: 0; }

          .feature-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .hero-grid { gap: 2rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
