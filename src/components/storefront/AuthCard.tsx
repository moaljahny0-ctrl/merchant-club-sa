'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { loginCustomer, registerCustomer, sendMagicLink } from '@/lib/actions/customers';
import styles from './AuthCard.module.css';

type View = 'signin' | 'signup';

type Copy = {
  signinHeroTitle: string;
  signinHeroText: string;
  signinHeroButton: string;
  signupHeroTitle: string;
  signupHeroText: string;
  signupHeroButton: string;
  signinTitle: string;
  signupTitle: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  forgotPassword: string;
  signInWithoutPassword: string;
  useYourPassword: string;
  sendLoginLink: string;
  sending: string;
  linkSent: (email: string) => string;
  backToSignIn: string;
  signIn: string;
  signingIn: string;
  signUp: string;
  creatingAccount: string;
  passwordTooShort: string;
  passwordsDontMatch: string;
  mobileHaveAccount: string;
  mobileNeedAccount: string;
};

const COPY: Record<'en' | 'ar', Copy> = {
  en: {
    signinHeroTitle: 'Welcome Back!',
    signinHeroText: 'Sign in to pick up your orders and saved brands.',
    signinHeroButton: 'SIGN IN',
    signupHeroTitle: 'New to Merchant Club?',
    signupHeroText: 'Create an account to follow brands and track orders.',
    signupHeroButton: 'SIGN UP',
    signinTitle: 'Sign In',
    signupTitle: 'Create Account',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    phone: 'Phone Number',
    forgotPassword: 'Forgot password?',
    signInWithoutPassword: 'Sign in without a password',
    useYourPassword: '← Use your password instead',
    sendLoginLink: 'Send login link',
    sending: 'Sending…',
    linkSent: email => `Check ${email} for your login link.`,
    backToSignIn: '← Back to sign in',
    signIn: 'Sign In',
    signingIn: 'Signing in…',
    signUp: 'Create account',
    creatingAccount: 'Creating account…',
    passwordTooShort: 'Password must be at least 8 characters.',
    passwordsDontMatch: 'Passwords do not match.',
    mobileHaveAccount: 'Already have an account?',
    mobileNeedAccount: 'New here?',
  },
  ar: {
    signinHeroTitle: 'مرحباً بعودتك',
    signinHeroText: 'سجّل دخولك لمتابعة طلباتك والعلامات المحفوظة.',
    signinHeroButton: 'تسجيل الدخول',
    signupHeroTitle: 'جديد في Merchant Club؟',
    signupHeroText: 'أنشئ حساباً لمتابعة العلامات وتتبع طلباتك.',
    signupHeroButton: 'إنشاء حساب',
    signinTitle: 'تسجيل الدخول',
    signupTitle: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    fullName: 'الاسم الكامل',
    phone: 'رقم الجوال',
    forgotPassword: 'نسيت كلمة المرور؟',
    signInWithoutPassword: 'الدخول بدون كلمة مرور',
    useYourPassword: '← استخدم كلمة المرور بدلاً من ذلك',
    sendLoginLink: 'أرسل رابط الدخول',
    sending: 'جارٍ الإرسال…',
    linkSent: email => `تحقق من ${email} للحصول على رابط الدخول.`,
    backToSignIn: '← رجوع لتسجيل الدخول',
    signIn: 'دخول',
    signingIn: 'جارٍ الدخول…',
    signUp: 'إنشاء الحساب',
    creatingAccount: 'جارٍ الإنشاء…',
    passwordTooShort: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.',
    passwordsDontMatch: 'كلمة المرور غير متطابقة.',
    mobileHaveAccount: 'لديك حساب بالفعل؟',
    mobileNeedAccount: 'جديد هنا؟',
  },
};

type Props = {
  initialView?: View;
  locale: string;
};

export function AuthCard({ initialView = 'signin', locale }: Props) {
  const ar = locale === 'ar';
  const t = COPY[ar ? 'ar' : 'en'];
  const router = useRouter();
  const [view, setView] = useState<View>(initialView);
  const isSignup = view === 'signup';

  return (
    <div className={styles.card} dir="ltr">
      <div className={`${styles.cardBg} ${!isSignup ? styles.signin : ''}`} aria-hidden="true" />

      <div className={`${styles.hero} ${styles.signup} ${isSignup ? styles.active : ''}`}>
        <h2>{t.signinHeroTitle}</h2>
        <p>{t.signinHeroText}</p>
        <button type="button" onClick={() => setView('signin')}>{t.signinHeroButton}</button>
      </div>
      <div className={`${styles.hero} ${styles.signin} ${!isSignup ? styles.active : ''}`}>
        <h2>{t.signupHeroTitle}</h2>
        <p>{t.signupHeroText}</p>
        <button type="button" onClick={() => setView('signup')}>{t.signupHeroButton}</button>
      </div>

      <SignInForm active={!isSignup} t={t} ar={ar} router={router} />
      <SignUpForm active={isSignup} t={t} ar={ar} router={router} />

      <div className={styles.mobileOnly} style={{ padding: '0 24px 24px' }}>
        {isSignup ? (
          <p>{t.mobileHaveAccount} <button type="button" onClick={() => setView('signin')}>{t.signIn}</button></p>
        ) : (
          <p>{t.mobileNeedAccount} <button type="button" onClick={() => setView('signup')}>{t.signUp}</button></p>
        )}
      </div>
    </div>
  );
}

function SignInForm({ active, t, ar, router }: { active: boolean; t: Copy; ar: boolean; router: ReturnType<typeof useRouter> }) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<'password' | 'magic' | 'magic-sent'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginCustomer(email, password);
      if (result.error) { setError(result.error); return; }
      router.push('/store/account');
      router.refresh();
    });
  }

  function handleMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      await sendMagicLink(email);
      setMode('magic-sent');
    });
  }

  return (
    <div className={`${styles.form} ${styles.signin} ${active ? styles.active : ''}`} dir={ar ? 'rtl' : 'ltr'}>
      <h2>{t.signinTitle}</h2>

      {mode === 'magic-sent' ? (
        <>
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#1A1208', lineHeight: 1.6 }}>
            ✓ {t.linkSent(email)}
          </p>
          <button type="button" className={styles.link} style={{ alignSelf: 'center' }} onClick={() => setMode('password')}>
            {t.backToSignIn}
          </button>
        </>
      ) : mode === 'magic' ? (
        <form onSubmit={handleMagicSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label>{t.email}</label>
            <input type="email" name="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} dir="ltr" />
          </div>
          <button type="submit" disabled={isPending}>{isPending ? t.sending : t.sendLoginLink}</button>
          <button type="button" className={styles.link} style={{ alignSelf: 'center' }} onClick={() => setMode('password')}>
            {t.useYourPassword}
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label>{t.email}</label>
            <input type="email" name="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} dir="ltr" />
          </div>
          <div>
            <label>{t.password}</label>
            <input type="password" name="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="button" className={styles.link} onClick={() => router.push('/store/forgot-password')}>
            {t.forgotPassword}
          </button>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" disabled={isPending}>{isPending ? t.signingIn : t.signIn}</button>
          <button type="button" className={styles.secondary} onClick={() => { setError(null); setMode('magic'); }}>
            {t.signInWithoutPassword}
          </button>
        </form>
      )}
    </div>
  );
}

function SignUpForm({ active, t, ar, router }: { active: boolean; t: Copy; ar: boolean; router: ReturnType<typeof useRouter> }) {
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) { setError(t.passwordTooShort); return; }
    if (password !== confirmPassword) { setError(t.passwordsDontMatch); return; }

    startTransition(async () => {
      const result = await registerCustomer(fullName, phone, email, password);
      if (result.error) { setError(result.error); return; }
      router.push('/store/account');
      router.refresh();
    });
  }

  return (
    <div className={`${styles.form} ${styles.signup} ${active ? styles.active : ''}`} dir={ar ? 'rtl' : 'ltr'}>
      <h2>{t.signupTitle}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label>{t.fullName}</label>
          <input type="text" name="fullName" required autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>
        <div>
          <label>{t.phone}</label>
          <input type="tel" name="phone" required autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" />
        </div>
        <div>
          <label>{t.email}</label>
          <input type="email" name="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} dir="ltr" />
        </div>
        <div>
          <label>{t.password}</label>
          <input type="password" name="password" required autoComplete="new-password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div>
          <label>{t.confirmPassword}</label>
          <input type="password" name="confirmPassword" required autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" disabled={isPending}>{isPending ? t.creatingAccount : t.signUp}</button>
      </form>
    </div>
  );
}
