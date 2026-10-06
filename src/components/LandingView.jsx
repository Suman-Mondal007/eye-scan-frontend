import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  ArrowRight, 
  MapPin, 
  Clock, 
  Users, 
  FileText, 
  CheckCircle2, 
  Activity, 
  Stethoscope, 
  Lock,
  Globe2,
  HeartHandshake,
  Mail,
  User,
  Phone,
  Building2,
  KeyRound,
  AlertCircle,
  EyeOff
} from 'lucide-react';
import EyePulseVisual from './EyePulseVisual';
import { auth, db } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ALL_INDIAN_STATES, getDistrictsForState } from '../data/indiaLocations';
import { useLanguage } from '../context/LanguageContext';

export default function LandingView({ onAuthSuccess }) {
  const { language, t } = useLanguage();
  const authRef = useRef(null);

  // ── Auth Form State ────────────────────────────────────────────────────
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [ashaId, setAshaId] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [village, setVillage] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('West Bengal');
  const [district, setDistrict] = useState('North 24 Parganas');

  // Math CAPTCHA
  const [captchaNum1, setCaptchaNum1] = useState(5);
  const [captchaNum2, setCaptchaNum2] = useState(7);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaValid, setCaptchaValid] = useState(false);

  const resetCaptcha = () => {
    const n1 = Math.floor(Math.random() * 9) + 2;
    const n2 = Math.floor(Math.random() * 8) + 1;
    setCaptchaNum1(n1);
    setCaptchaNum2(n2);
    setCaptchaInput('');
    setCaptchaValid(false);
  };

  useEffect(() => {
    resetCaptcha();
  }, [isLogin]);

  const handleCaptchaChange = (e) => {
    const val = e.target.value;
    setCaptchaInput(val);
    setCaptchaValid(parseInt(val) === captchaNum1 + captchaNum2);
  };

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setState(newState);
    const districts = getDistrictsForState(newState);
    setDistrict(districts[0] || '');
  };

  const handleFillDemo = () => {
    setEmail('asha.worker@health.gov.in');
    setPassword('AshaHealth@2024');
    setConfirmPassword('AshaHealth@2024');
    setFullName('Sunita Mondal');
    setAshaId('ASHA-WB-814');
    setHospitalName('Barasat Sub-divisional Hospital');
    setVillage('Habra Gram Panchayat');
    setPhone('9830123456');
    setState('West Bengal');
    setDistrict('North 24 Parganas');
    setCaptchaInput(String(captchaNum1 + captchaNum2));
    setCaptchaValid(true);
  };

  const scrollToAuth = () => {
    const el = document.getElementById('auth-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!captchaValid) {
      setErrorMessage(`Please solve the security calculation (${captchaNum1} + ${captchaNum2}).`);
      return;
    }
    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        let cred;
        try {
          cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        } catch (err) {
          // If demo email or unseeded, automatically create demo user
          if (
            email.trim() === 'asha.worker@health.gov.in' && 
            (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials')
          ) {
            try {
              cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
              await updateProfile(cred.user, { displayName: 'Sunita Mondal (ASHA)' });
            } catch (createErr) {
              throw err;
            }
          } else {
            throw err;
          }
        }

        const userDocRef = doc(db, 'users', cred.user.uid);
        const snap = await getDoc(userDocRef);
        let profile = {
          fullName: cred.user.displayName || 'Sunita Mondal (ASHA)',
          email: cred.user.email,
          ashaId: 'ASHA-WB-814',
          hospitalName: 'Barasat Sub-divisional Hospital',
          state: 'West Bengal',
          district: 'North 24 Parganas',
          role: 'healthcare_worker'
        };
        if (snap.exists()) {
          profile = { ...profile, ...snap.data() };
        } else {
          await setDoc(userDocRef, profile);
        }
        if (onAuthSuccess) {
          onAuthSuccess(cred.user, profile);
        }
      } else {
        if (password !== confirmPassword) {
          setErrorMessage(language === 'bn' ? 'পাসওয়ার্ড দুটি মেলেনি।' : 'Passwords do not match.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage(language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: fullName.trim() });
        const profileData = {
          fullName: fullName.trim(),
          email: email.trim(),
          ashaId: ashaId.trim() || `ASHA-${Math.floor(100 + Math.random() * 900)}`,
          hospitalName: hospitalName.trim() || 'Sub-divisional Eye Clinic',
          village: village.trim() || '',
          phoneNumber: phone.trim(),
          state,
          district,
          role: 'healthcare_worker',
          createdAt: new Date()
        };
        await setDoc(doc(db, 'users', cred.user.uid), profileData);
        if (onAuthSuccess) {
          onAuthSuccess(cred.user, profileData);
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      let msg = err.message;
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        msg = language === 'bn' 
          ? 'ভুল ইমেইল বা পাসওয়ার্ড। নতুন কর্মী হলে "আশা কর্মী নিবন্ধন" ট্যাবে ক্লিক করুন।' 
          : 'Invalid email or password. If you are a new worker, click "Register ASHA Karmi" to sign up.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = language === 'bn' 
          ? 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে। "আশা সাইন ইন" করুন।' 
          : 'An account with this email already exists. Switch to "ASHA Sign In".';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage(language === 'bn' ? 'পাসওয়ার্ড রিসেট লিঙ্ক পেতে উপরে আপনার ইমেইল দিন।' : 'Please enter your email address above to receive a password reset link.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMessage(language === 'bn' ? 'পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে।' : 'Password reset link sent to your email.');
    } catch (err) {
      setErrorMessage(err.message || 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px 0 60px 0' }}>

      {/* ══════════════════════════════════════════════════════════════════
          ─── 1. HERO SECTION ────────────────────────────────────────── */}
      <div 
        className="glass-panel-elevated"
        style={{
          padding: '54px 36px',
          marginBottom: '40px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(240,248,255,0.95) 100%)',
          border: '1.5px solid rgba(186,230,253,0.95)',
          boxShadow: '0 20px 48px -10px rgba(2,132,199,0.14)'
        }}
      >
        <div style={{ position:'absolute', top:'-50px', left:'50%', transform:'translateX(-50%)', width:'420px', height:'420px', borderRadius:'50%', background:'radial-gradient(circle,rgba(56,189,248,0.28) 0%,transparent 70%)', filter:'blur(45px)', pointerEvents:'none' }} />

        <div style={{ marginBottom: '24px' }}>
          <EyePulseVisual size={150} />
        </div>

        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'center', marginBottom:'20px' }}>
          <span className="badge badge-cyan"><Zap size={12} /> {t('heroBadge1')}</span>
          <span className="badge badge-success"><ShieldCheck size={12} /> {t('heroBadge2')}</span>
          <span className="badge" style={{ background:'#F5F3FF', color:'#7C3AED', border:'1px solid #DDD6FE' }}><Sparkles size={12} /> {t('heroBadge3')}</span>
        </div>

        <h1 style={{ fontSize:'clamp(28px,4.5vw,46px)', fontWeight:'900', color:'#091E3A', letterSpacing:'-1px', maxWidth:'880px', lineHeight:1.2, margin:'0 0 18px 0' }}>
          {t('heroTitle')}
        </h1>
        <p style={{ fontSize:'17px', color:'var(--text-muted)', maxWidth:'740px', lineHeight:1.65, margin:'0 0 34px 0' }}>
          {t('heroSubtitle')}
        </p>

        <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', justifyContent:'center' }}>
          <button onClick={scrollToAuth} className="btn-primary" style={{ padding:'15px 36px', fontSize:'15px' }}>
            <Lock size={18} />
            <span>{t('heroCta')}</span>
            <ArrowRight size={18} />
          </button>
        </div>

        <div style={{ marginTop:'28px', padding:'10px 20px', borderRadius:'30px', background:'rgba(235,246,255,0.9)', border:'1px solid #BAE6FD', display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:'#0284C7', fontWeight:'600' }}>
          <ShieldCheck size={16} />
          <span>{t('heroNotice')}</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ─── 2. EMBEDDED LOGIN / SIGNUP SECTION ───────────────────────── */}
      <div ref={authRef} id="auth-section" style={{ marginBottom:'44px' }}>
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <span className="badge badge-success" style={{ marginBottom:'8px' }}>{t('authSectionBadge')}</span>
          <h2 style={{ fontSize:'28px', fontWeight:'800', color:'#091E3A', margin:'4px 0 8px 0' }}>
            {isLogin ? t('authLoginTitle') : t('authRegisterTitle')}
          </h2>
          <p style={{ fontSize:'14px', color:'var(--text-muted)', maxWidth:'620px', margin:'0 auto' }}>
            {t('authSubtitle')}
          </p>
        </div>

        <div style={{ maxWidth:'580px', margin:'0 auto' }}>
          <div
            className="glass-panel-elevated"
            style={{
              padding:'36px',
              background:'#FFFFFF',
              border:'1.5px solid rgba(186,230,253,0.95)',
              boxShadow:'0 24px 60px rgba(2,132,199,0.12)',
              borderRadius:'20px'
            }}
          >
            {/* Header Icon */}
            <div style={{ textAlign:'center', marginBottom:'20px' }}>
              <div style={{
                width:'54px', height:'54px', borderRadius:'16px',
                background:'linear-gradient(135deg,#0284C7 0%,#0369A1 100%)',
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 12px auto',
                boxShadow:'0 4px 16px rgba(2,132,199,0.3)'
              }}>
                <ShieldCheck size={28} color="#FFFFFF" />
              </div>
              <h3 style={{ fontSize:'20px', fontWeight:'800', color:'#091E3A', margin:'0 0 4px 0' }}>
                {isLogin ? t('authLoginTitle') : t('authRegisterTitle')}
              </h3>
              <p style={{ fontSize:'13px', color:'var(--text-muted)', margin:0 }}>
                {isLogin ? t('portalLoginSubtitle') : t('portalRegisterSubtitle')}
              </p>
            </div>

            {/* Tab Switcher */}
            <div style={{ display:'flex', background:'#E8F4FC', borderRadius:'12px', padding:'4px', marginBottom:'14px', border:'1.5px solid #BAE6FD' }}>
              <button 
                type="button" 
                onClick={() => { setIsLogin(true); setErrorMessage(''); }} 
                style={{ 
                  flex:1, 
                  padding:'10px', 
                  borderRadius:'8px', 
                  border:'none', 
                  background:isLogin ? '#0284C7' : 'transparent', 
                  color:isLogin ? '#FFF' : 'var(--text-muted)', 
                  fontWeight:isLogin ? '800' : '600', 
                  fontSize:'13px', 
                  cursor:'pointer', 
                  transition:'all 0.2s' 
                }}
              >
                {t('tabSignIn')}
              </button>
              <button 
                type="button" 
                onClick={() => { setIsLogin(false); setErrorMessage(''); }} 
                style={{ 
                  flex:1, 
                  padding:'10px', 
                  borderRadius:'8px', 
                  border:'none', 
                  background:!isLogin ? '#0284C7' : 'transparent', 
                  color:!isLogin ? '#FFF' : 'var(--text-muted)', 
                  fontWeight:!isLogin ? '800' : '600', 
                  fontSize:'13px', 
                  cursor:'pointer', 
                  transition:'all 0.2s' 
                }}
              >
                {t('tabRegister')}
              </button>
            </div>

            {/* Demo Fill Helper */}
            <div style={{ marginBottom:'18px', display:'flex', justifyContent:'center' }}>
              <button 
                type="button" 
                onClick={handleFillDemo} 
                style={{ 
                  background:'#F0F9FF', 
                  border:'1px dashed #0284C7', 
                  borderRadius:'8px', 
                  padding:'6px 14px', 
                  fontSize:'12px', 
                  color:'#0284C7', 
                  fontWeight:'700', 
                  cursor:'pointer', 
                  display:'flex', 
                  alignItems:'center', 
                  gap:'6px' 
                }}
              >
                <Sparkles size={13} />
                <span>{t('btnAutoFillDemo')}</span>
              </button>
            </div>

            {/* Error / Success Alerts */}
            {errorMessage && (
              <div style={{ background:'var(--rose-bg)', border:'1px solid var(--rose-border)', borderRadius:'10px', padding:'12px 16px', color:'var(--rose-danger)', fontSize:'13px', fontWeight:'700', display:'flex', alignItems:'center', gap:'10px', marginBottom:'18px' }}>
                <AlertCircle size={18} color="#E11D48" style={{ flexShrink:0 }} />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div style={{ background:'var(--emerald-bg)', border:'1px solid var(--emerald-border)', borderRadius:'10px', padding:'12px 16px', color:'var(--emerald-success)', fontSize:'13px', fontWeight:'700', display:'flex', alignItems:'center', gap:'10px', marginBottom:'18px' }}>
                <CheckCircle2 size={18} color="#059669" style={{ flexShrink:0 }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuthSubmit}>
              {!isLogin && (
                <>
                  <div className="grid-2">
                    <div className="input-group">
                      <label className="input-label"><User size={13} /> {t('labelFullName')}</label>
                      <input 
                        type="text" 
                        required 
                        className="input-field" 
                        placeholder={language === 'bn' ? 'যেমন: সুনিতা মণ্ডল' : 'e.g. Sunita Mondal'} 
                        value={fullName} 
                        onChange={(e)=>setFullName(e.target.value)} 
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label"><ShieldCheck size={13} /> {t('labelAshaId')}</label>
                      <input 
                        type="text" 
                        required 
                        className="input-field" 
                        placeholder="e.g. ASHA-WB-814" 
                        value={ashaId} 
                        onChange={(e)=>setAshaId(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="input-group">
                      <label className="input-label"><Building2 size={13} /> {t('labelHospital')}</label>
                      <input 
                        type="text" 
                        required 
                        className="input-field" 
                        placeholder="Barasat Sub-divisional Hospital" 
                        value={hospitalName} 
                        onChange={(e)=>setHospitalName(e.target.value)} 
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label"><Phone size={13} /> {t('labelMobile')}</label>
                      <input 
                        type="tel" 
                        required 
                        maxLength={10} 
                        className="input-field" 
                        placeholder={language === 'bn' ? '১০-সংখ্যার মোবাইল' : '10-digit mobile'} 
                        value={phone} 
                        onChange={(e)=>setPhone(e.target.value.replace(/\D/g,''))} 
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="input-group">
                      <label className="input-label"><MapPin size={13} /> {t('labelState')}</label>
                      <select className="input-field" value={state} onChange={handleStateChange}>
                        {ALL_INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label"><MapPin size={13} /> {t('labelDistrict')}</label>
                      <select className="input-field" value={district} onChange={(e)=>setDistrict(e.target.value)}>
                        {getDistrictsForState(state).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label"><MapPin size={13} /> {t('labelVillage')}</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder={language === 'bn' ? 'যেমন: হাবড়া গ্রাম পঞ্চায়েত / ওয়ার্ড ৪' : 'e.g. Habra Gram Panchayat / Ward 4'} 
                      value={village} 
                      onChange={(e)=>setVillage(e.target.value)} 
                    />
                  </div>
                </>
              )}

              <div className="input-group">
                <label className="input-label"><Mail size={13} /> {t('labelEmail')}</label>
                <input 
                  type="email" 
                  required 
                  className="input-field" 
                  placeholder="asha.worker@health.gov.in" 
                  value={email} 
                  onChange={(e)=>setEmail(e.target.value)} 
                />
              </div>

              <div className="input-group">
                <label className="input-label"><Lock size={13} /> {t('labelPassword')}</label>
                <div style={{ position:'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    className="input-field" 
                    placeholder="Enter password" 
                    value={password} 
                    onChange={(e)=>setPassword(e.target.value)} 
                  />
                  <button 
                    type="button" 
                    onClick={()=>setShowPassword(!showPassword)} 
                    style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="input-group">
                  <label className="input-label"><KeyRound size={13} /> {t('labelConfirmPassword')}</label>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    className="input-field" 
                    placeholder="Re-enter password" 
                    value={confirmPassword} 
                    onChange={(e)=>setConfirmPassword(e.target.value)} 
                  />
                </div>
              )}

              {/* CAPTCHA */}
              <div style={{ background:'#F0F8FE', border:`1.5px solid ${captchaValid ? '#059669' : '#BAE6FD'}`, borderRadius:'12px', padding:'14px 16px', marginBottom:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                  <span style={{ fontSize:'12px', fontWeight:'800', color:'#0284C7' }}>{t('labelSecurityCalc')}</span>
                  {captchaValid && <span style={{ fontSize:'11px', color:'#059669', fontWeight:'800', display:'flex', alignItems:'center', gap:'4px' }}><CheckCircle2 size={13} /> {t('verifiedBadge')}</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ background:'#FFF', border:'1.5px solid #BAE6FD', padding:'8px 14px', borderRadius:'8px', fontSize:'15px', fontWeight:'800', color:'#091E3A', letterSpacing:'1px' }}>
                    {captchaNum1} + {captchaNum2} = ?
                  </div>
                  <input 
                    type="number" 
                    value={captchaInput} 
                    onChange={handleCaptchaChange} 
                    placeholder="Result" 
                    className="input-field" 
                    style={{ width:'100px', textAlign:'center', padding:'8px' }} 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="btn-primary" 
                style={{ width:'100%', padding:'14px', fontSize:'15px' }}
              >
                {loading ? t('authenticating') : (isLogin ? t('btnSubmitLogin') : t('btnSubmitRegister'))}
              </button>

              {isLogin && (
                <div style={{ textAlign:'center', marginTop:'16px' }}>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword} 
                    style={{ background:'none', border:'none', color:'#0284C7', fontSize:'12px', fontWeight:'700', cursor:'pointer', textDecoration:'underline' }}
                  >
                    {t('btnForgotPassword')}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ─── 3. FOUR-STEP COMMUNITY PIPELINE ──────────────────────────── */}
      <div style={{ marginBottom:'44px' }}>
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <span className="badge badge-cyan" style={{ marginBottom:'8px' }}>CLINICAL PROTOCOL</span>
          <h2 style={{ fontSize:'26px', fontWeight:'800', color:'#091E3A', margin:'4px 0 8px 0' }}>{t('pipelineTitle')}</h2>
          <p style={{ fontSize:'14px', color:'var(--text-muted)', maxWidth:'600px', margin:'0 auto' }}>{t('pipelineSubtitle')}</p>
        </div>
        <div className="grid-4">
          {[
            { n:'1', bg:'#E0F2FE', fg:'#0284C7', title:t('step1Title'), desc:t('step1Desc') },
            { n:'2', bg:'#ECFDF5', fg:'#059669', title:t('step2Title'), desc:t('step2Desc') },
            { n:'3', bg:'#F5F3FF', fg:'#7C3AED', title:t('step3Title'), desc:t('step3Desc') },
            { n:'4', bg:'#FFF1F2', fg:'#E11D48', title:t('step4Title'), desc:t('step4Desc') }
          ].map(s=>(
            <div key={s.n} className="glass-panel" style={{ padding:'26px', background:'#FFF' }}>
              <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:s.bg, color:s.fg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900', fontSize:'16px', marginBottom:'16px' }}>{s.n}</div>
              <h3 style={{ fontSize:'16px', fontWeight:'800', color:'#091E3A', marginBottom:'8px' }}>{s.title}</h3>
              <p style={{ fontSize:'13px', color:'var(--text-muted)', lineHeight:1.5, margin:0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ─── 4. PLATFORM CAPABILITIES ─────────────────────────────────── */}
      <div className="grid-2" style={{ marginBottom:'44px' }}>
        <div className="glass-panel" style={{ padding:'34px', background:'#FFF' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
            <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'#E0F2FE', display:'flex', alignItems:'center', justifyContent:'center', color:'#0284C7' }}><Globe2 size={24} /></div>
            <div>
              <h3 style={{ fontSize:'19px', fontWeight:'800', color:'#091E3A', margin:0 }}>{t('feature1Title')}</h3>
              <p style={{ fontSize:'12px', color:'var(--text-muted)', margin:0 }}>{t('feature1Subtitle')}</p>
            </div>
          </div>
          <p style={{ fontSize:'14px', color:'var(--text-muted)', lineHeight:1.6, marginBottom:'20px' }}>
            {t('feature1Desc')}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {[
              t('feature1Bullet1'),
              t('feature1Bullet2'),
              t('feature1Bullet3')
            ].map((text, i)=>(
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                <CheckCircle2 size={18} color="#0284C7" style={{ marginTop:'2px', flexShrink:0 }} />
                <span style={{ fontSize:'13px', color:'#091E3A' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding:'34px', background:'#FFF' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
            <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'#ECFDF5', display:'flex', alignItems:'center', justifyContent:'center', color:'#059669' }}><Stethoscope size={24} /></div>
            <div>
              <h3 style={{ fontSize:'19px', fontWeight:'800', color:'#091E3A', margin:0 }}>{t('feature2Title')}</h3>
              <p style={{ fontSize:'12px', color:'var(--text-muted)', margin:0 }}>{t('feature2Subtitle')}</p>
            </div>
          </div>
          <p style={{ fontSize:'14px', color:'var(--text-muted)', lineHeight:1.6, marginBottom:'20px' }}>
            {t('feature2Desc')}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {[
              t('feature2Bullet1'),
              t('feature2Bullet2'),
              t('feature2Bullet3')
            ].map((text, i)=>(
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                <CheckCircle2 size={18} color="#059669" style={{ marginTop:'2px', flexShrink:0 }} />
                <span style={{ fontSize:'13px', color:'#091E3A' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ─── 5. CATARACT TYPES ────────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding:'36px', marginBottom:'44px', background:'linear-gradient(180deg,#FFF 0%,#F8FBFE 100%)', border:'1.5px solid rgba(186,230,253,0.95)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
          <FileText size={24} color="#0284C7" />
          <div>
            <h3 style={{ fontSize:'20px', fontWeight:'800', color:'#091E3A', margin:0 }}>{t('cataractTypesTitle')}</h3>
            <p style={{ fontSize:'13px', color:'var(--text-muted)', margin:0 }}>{t('cataractTypesSubtitle')}</p>
          </div>
        </div>
        <div className="grid-3">
          {[
            { title:t('type1Title'), badge:t('type1Badge'), badgeCls:'badge badge-warning', desc:t('type1Desc') },
            { title:t('type2Title'), badge:t('type2Badge'), badgeCls:'badge badge-cyan', desc:t('type2Desc') },
            { title:t('type3Title'), badge:t('type3Badge'), badgeCls:'badge badge-danger', desc:t('type3Desc') }
          ].map(c=>(
            <div key={c.title} style={{ background:'#FFF', border:'1.5px solid rgba(186,230,253,0.9)', borderRadius:'14px', padding:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                <strong style={{ color:'#091E3A', fontSize:'15px' }}>{c.title}</strong>
                <span className={c.badgeCls}>{c.badge}</span>
              </div>
              <p style={{ margin:0, fontSize:'13px', color:'var(--text-muted)', lineHeight:1.55 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ─── 6. ASHA MISSION BANNER ───────────────────────────────────── */}
      <div className="glass-panel-elevated" style={{ padding:'40px 36px', background:'linear-gradient(135deg,#091E3A 0%,#0369A1 100%)', color:'#FFF', borderRadius:'24px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', boxShadow:'0 20px 48px rgba(3,105,161,0.25)' }}>
        <div style={{ width:'60px', height:'60px', borderRadius:'18px', background:'rgba(255,255,255,0.15)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'18px' }}>
          <HeartHandshake size={32} color="#BAE6FD" />
        </div>
        <h2 style={{ fontSize:'26px', fontWeight:'900', color:'#FFF', margin:'0 0 12px 0' }}>{t('missionTitle')}</h2>
        <p style={{ fontSize:'15px', color:'#E0F2FE', maxWidth:'720px', lineHeight:1.65, margin:'0 0 28px 0' }}>
          {t('missionDesc')}
        </p>
        <button onClick={scrollToAuth} className="btn-primary" style={{ background:'#FFF', color:'#0369A1', fontWeight:'800', padding:'14px 32px', fontSize:'15px' }}>
          <Lock size={18} />
          <span>{t('heroCta')}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
