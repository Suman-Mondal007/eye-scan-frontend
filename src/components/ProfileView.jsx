import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Building2, 
  Shield, 
  MapPin, 
  KeyRound, 
  LogOut, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Edit3
} from 'lucide-react';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { ALL_INDIAN_STATES, getDistrictsForState } from '../data/indiaLocations';

export default function ProfileView({ user, userProfile, onProfileUpdated, onLogout, onOpenLogin }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Editable fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [designation, setDesignation] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');

  // Password fields
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setState(newState);
    const districts = getDistrictsForState(newState);
    setDistrict(districts[0] || '');
  };

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || user?.displayName || '');
      setPhone(userProfile.phoneNumber || '');
      setHospitalName(userProfile.hospitalName || '');
      setDesignation(userProfile.designation || 'ASHA Healthcare Worker');
      setState(userProfile.state || 'West Bengal');
      setDistrict(userProfile.district || 'North 24 Parganas');
    }
  }, [userProfile, user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedData = {
        fullName: fullName.trim(),
        phoneNumber: phone.trim(),
        hospitalName: hospitalName.trim(),
        designation: designation.trim(),
        state,
        district
      };

      await updateDoc(userRef, updatedData);
      setSuccessMsg('Operator profile successfully updated in cloud database.');
      setEditing(false);
      onProfileUpdated({ ...userProfile, ...updatedData });
    } catch (err) {
      console.error("Profile update error:", err);
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await updatePassword(user, newPassword);
      setSuccessMsg('Account password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (err) {
      console.error("Change password error:", err);
      let msg = err.message;
      if (err.code === 'auth/requires-recent-login') {
        msg = 'For security reasons, please log out and sign in again before changing your password.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ maxWidth: '640px', margin: '60px auto', textAlign: 'center', padding: '48px 32px', background: '#FFFFFF' }} className="glass-panel-elevated">
        <User size={48} color="#0284C7" style={{ margin: '0 auto 16px auto' }} />
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#091E3A', margin: '0 0 10px 0' }}>
          Operator Session Inactive
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>
          Please sign in with your healthcare credentials to view operator records and modify clinic settings.
        </p>
        <button onClick={onOpenLogin} className="btn-primary" style={{ padding: '12px 28px' }}>
          Operator Sign In
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '36px 0 60px 0' }}>
      {/* Top Profile Card */}
      <div 
        className="glass-panel-elevated"
        style={{
          padding: '36px',
          marginBottom: '28px',
          position: 'relative',
          background: '#FFFFFF'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          {/* Avatar and Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '74px',
              height: '74px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              color: '#FFFFFF',
              fontSize: '28px',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(2, 132, 199, 0.35)'
            }}>
              {(userProfile?.fullName || user.email || 'A').charAt(0).toUpperCase()}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#091E3A', margin: 0 }}>
                  {userProfile?.fullName || 'ASHA Field Worker'}
                </h2>
                <span className="badge badge-cyan">
                  Verified Operator
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                {userProfile?.designation || 'Community Health Screener'} • {userProfile?.hospitalName || 'Primary Health Center'}
              </p>
              <div style={{ display: 'flex', gap: '14px', marginTop: '8px', fontSize: '12px', color: '#0284C7', fontWeight: '700' }}>
                <span>ID: {userProfile?.ashaId || 'ASHA-WB-001'}</span>
                <span>•</span>
                <span>{userProfile?.district || 'North 24 Parganas'}, {userProfile?.state || 'West Bengal'}</span>
              </div>
            </div>
          </div>

          {/* Toggle Edit Button */}
          <button
            onClick={() => setEditing(!editing)}
            className="btn-secondary"
            style={{ padding: '10px 18px', fontSize: '13px' }}
          >
            <Edit3 size={15} />
            <span>{editing ? 'Cancel Editing' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div style={{
          background: 'var(--emerald-bg)',
          border: '1px solid var(--emerald-border)',
          borderRadius: '10px',
          padding: '12px 16px',
          color: 'var(--emerald-success)',
          fontWeight: '700',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: 'var(--rose-bg)',
          border: '1px solid var(--rose-border)',
          borderRadius: '10px',
          padding: '12px 16px',
          color: 'var(--rose-danger)',
          fontWeight: '700',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <AlertCircle size={18} color="#E11D48" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Edit Form or Static Grid */}
      {editing ? (
        <div className="glass-panel" style={{ padding: '32px', marginBottom: '28px', background: '#FFFFFF' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#091E3A', marginBottom: '20px' }}>
            Modify Operator Information
          </h3>

          <form onSubmit={handleSaveProfile}>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label"><User size={13} /> Full Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label"><Phone size={13} /> Mobile Contact</label>
                <input
                  type="tel"
                  required
                  className="input-field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label"><Building2 size={13} /> Affiliated Hospital / PHC</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label"><Shield size={13} /> Official Designation</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label"><MapPin size={13} /> State / UT</label>
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
                <label className="input-label"><MapPin size={13} /> District</label>
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

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ padding: '12px 24px' }}
              >
                <Save size={16} />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid-2" style={{ marginBottom: '28px' }}>
          <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '16px' }}>
              Health Worker Credentials
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: '700' }}>EMAIL ACCOUNT</span>
                <strong style={{ color: '#091E3A' }}>{user.email}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: '700' }}>PHONE</span>
                <strong style={{ color: '#091E3A' }}>{userProfile?.phoneNumber || 'Not provided'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: '700' }}>ASHA / STAFF ID</span>
                <strong style={{ color: '#091E3A' }}>{userProfile?.ashaId || 'ASHA-WB-001'}</strong>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '16px' }}>
              Institutional Posting
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: '700' }}>HOSPITAL / HEALTH CENTER</span>
                <strong style={{ color: '#091E3A' }}>{userProfile?.hospitalName || 'Barasat Sub-divisional Hospital'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: '700' }}>DISTRICT / STATE</span>
                <strong style={{ color: '#091E3A' }}>{userProfile?.district || 'North 24 Parganas'}, {userProfile?.state || 'West Bengal'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: '700' }}>ROLE ACCESS TIER</span>
                <strong style={{ color: '#059669' }}>Certified Tele-Diagnostic Screener</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security & Password Section */}
      <div className="glass-panel" style={{ padding: '24px 30px', marginBottom: '28px', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#091E3A', margin: '0 0 4px 0' }}>
              Security & Credentials
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Update your account password or review session authorizations
            </p>
          </div>
          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            <KeyRound size={14} />
            <span>{showPasswordSection ? 'Hide' : 'Change Password'}</span>
          </button>
        </div>

        {showPasswordSection && (
          <form onSubmit={handleChangePassword} style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E8F2FC' }}>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">New Password (Min 6 characters)</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Confirm New Password</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ padding: '10px 20px', fontSize: '13px' }}
              >
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Logout Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onLogout}
          className="btn-danger"
          style={{ padding: '12px 24px', fontSize: '14px' }}
        >
          <LogOut size={16} />
          <span>Sign Out of Operator Station</span>
        </button>
      </div>
    </div>
  );
}
