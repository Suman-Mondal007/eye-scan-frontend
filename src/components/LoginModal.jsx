import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Building2, 
  MapPin, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { auth, db } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ALL_INDIAN_STATES, getDistrictsForState } from '../data/indiaLocations';

export default function LoginModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form Fields
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
    if (isOpen) {
      resetCaptcha();
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, isLogin]);

  const handleCaptchaChange = (e) => {
    const val = e.target.value;
    setCaptchaInput(val);
    if (parseInt(val) === captchaNum1 + captchaNum2) {
      setCaptchaValid(true);
    } else {
      setCaptchaValid(false);
    }
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
        // Sign In
        let cred;
        try {
          cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        } catch (err) {
          // If demo email or unseeded, create or fallback gracefully for local testing if offline
          console.warn("Sign-in fallback note:", err);
          throw err;
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
        }

        onAuthSuccess(cred.user, profile);
        onClose();
      } else {
        // Sign Up
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match.');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters.');
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
        onAuthSuccess(cred.user, profileData);
        onClose();
      }
    } catch (err) {
      console.error("Auth error:", err);
      let msg = err.message;
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email address or password combination. If you are new, click "Register Operator" to sign up.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Try signing in with password.';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Please type your email address above to receive a password reset link.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMessage('Password reset link has been dispatched to your email address.');
    } catch (err) {
      setErrorMessage(err.message || 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(9, 30, 58, 0.45)',
      backdropFilter: 'blur(10px)',
      padding: '20px'
    }}>
      <div 
        className="glass-panel-elevated"
        style={{
          width: '100%',
          maxWidth: isLogin ? '460px' : '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px',
          position: 'relative',
          background: '#FFFFFF',
          border: '1.5px solid rgba(186, 230, 253, 0.95)',
          boxShadow: '0 24px 60px rgba(2, 132, 199, 0.18)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#F0F8FE',
            border: 'none',
            color: 'var(--text-muted)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto',
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.3)'
          }}>
            <ShieldCheck size={28} color="#FFFFFF" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#091E3A', margin: '0 0 6px 0' }}>
            {isLogin ? 'ASHA & Clinician Portal' : 'New Healthcare Operator Intake'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {isLogin 
              ? 'Authorized access for ophthalmology triage & screening' 
              : 'Register field diagnostic operator credentials'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: '#E8F4FC',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '14px',
          border: '1.5px solid #BAE6FD'
        }}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setErrorMessage(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: isLogin ? '#0284C7' : 'transparent',
              color: isLogin ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: isLogin ? '800' : '600',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ASHA Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setErrorMessage(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: !isLogin ? '#0284C7' : 'transparent',
              color: !isLogin ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: !isLogin ? '800' : '600',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Register ASHA Karmi
          </button>
        </div>

        {/* Quick Demo Fill Helper */}
        <div style={{
          marginBottom: '18px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            type="button"
            onClick={handleFillDemo}
            style={{
              background: '#F0F9FF',
              border: '1px dashed #0284C7',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              color: '#0284C7',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={13} />
            <span>Auto-fill Demo ASHA Karmi Credentials</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div style={{
            background: 'var(--rose-bg)',
            border: '1px solid var(--rose-border)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: 'var(--rose-danger)',
            fontSize: '13px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '18px'
          }}>
            <AlertCircle size={18} color="#E11D48" style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            background: 'var(--emerald-bg)',
            border: '1px solid var(--emerald-border)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: 'var(--emerald-success)',
            fontSize: '13px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '18px'
          }}>
            <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuthSubmit}>
          {!isLogin && (
            <>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label"><User size={13} /> Full Name *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Sunita Mondal"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label"><ShieldCheck size={13} /> ASHA Worker ID *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. ASHA-WB-814"
                    value={ashaId}
                    onChange={(e) => setAshaId(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label"><Building2 size={13} /> Sub-centre / PHC Hospital *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Barasat Sub-divisional Hospital"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label"><Phone size={13} /> Mobile Contact Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    className="input-field"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label"><MapPin size={13} /> State / UT *</label>
                  <select 
                    className="input-field" 
                    value={state} 
                    onChange={handleStateChange}
                  >
                    {ALL_INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label"><MapPin size={13} /> District *</label>
                  <select
                    className="input-field"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  >
                    {getDistrictsForState(state).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label"><MapPin size={13} /> Gram Panchayat / Village / Ward</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Habra Gram Panchayat / Ward 4"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="input-group">
            <label className="input-label"><Mail size={13} /> Work Email</label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="asha.worker@health.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label"><Lock size={13} /> Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="input-field"
                placeholder="Enter secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="input-group">
              <label className="input-label"><KeyRound size={13} /> Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="input-field"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          {/* Math CAPTCHA */}
          <div style={{
            background: '#F0F8FE',
            border: `1.5px solid ${captchaValid ? '#059669' : '#BAE6FD'}`,
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#0284C7' }}>
                Security Verification
              </span>
              {captchaValid && (
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> Verified
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: '#FFFFFF',
                border: '1.5px solid #BAE6FD',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '800',
                color: '#091E3A',
                letterSpacing: '1px'
              }}>
                {captchaNum1} + {captchaNum2} = ?
              </div>
              <input
                type="number"
                value={captchaInput}
                onChange={handleCaptchaChange}
                placeholder="Result"
                className="input-field"
                style={{ width: '100px', textAlign: 'center', padding: '8px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
          >
            {loading ? 'Authenticating...' : (isLogin ? 'Sign In to Portal' : 'Create Operator Account')}
          </button>

          {isLogin && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284C7',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Forgot your password?
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
