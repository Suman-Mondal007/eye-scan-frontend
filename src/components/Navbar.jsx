import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Activity, 
  UserCheck, 
  Clock, 
  MapPin, 
  LogIn, 
  LogOut, 
  Menu, 
  X,
  Globe
} from 'lucide-react';
import { checkBackendHealth } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  user, 
  userProfile, 
  onLogout 
}) {
  const { language, setLanguage, t } = useLanguage();
  const [backendOnline, setBackendOnline] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Initial health check
    checkBackendHealth().then(res => setBackendOnline(res.isOnline));
    const interval = setInterval(() => {
      checkBackendHealth().then(res => setBackendOnline(res.isOnline));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // When logged in, the main navigation items (NO "Overview" tab)
  const navItems = [
    { id: 'home', label: t('navDashboard'), icon: Activity },
    { id: 'patient-form', label: t('navNewScan'), icon: Eye },
    { id: 'history', label: t('navHistory'), icon: Clock },
    { id: 'clinics', label: t('navClinics'), icon: MapPin },
    { id: 'profile', label: t('navProfile'), icon: UserCheck }
  ];

  const handleLogoClick = () => {
    if (user) {
      setCurrentTab('home');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToAuth = () => {
    const el = document.getElementById('auth-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleTabClick = (id) => {
    setCurrentTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(255, 255, 255, 0.94)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(186, 230, 253, 0.85)',
      boxShadow: '0 4px 20px -2px rgba(2, 132, 199, 0.06)',
      padding: '0 24px'
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        height: '74px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={handleLogoClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
          }}>
            <Eye size={24} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '18px',
                fontWeight: '800',
                letterSpacing: '-0.3px',
                color: '#091E3A'
              }}>
                {t('brandTitle')}<span style={{ color: '#0284C7' }}> AI</span>
              </span>
              {/* <span style={{
                background: '#E0F2FE',
                color: '#0284C7',
                fontSize: '10px',
                fontWeight: '900',
                padding: '2px 7px',
                borderRadius: '6px',
                border: '1px solid #BAE6FD',
                letterSpacing: '0.8px'
              }}>AI PRO</span> */}
            </div>
            <p style={{
              margin: 0,
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontWeight: '600'
            }}>
              {t('brandSubtitle')}
            </p>
          </div>
        </div>

        {/* Center Navigation Links (Only shown when user is logged in) */}
        {user ? (
          <nav style={{
            display: 'none',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(235, 246, 255, 0.85)',
            padding: '5px 6px',
            borderRadius: '16px',
            border: '1px solid rgba(186, 230, 253, 0.8)'
          }} className="desktop-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    background: isActive ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : 'transparent',
                    border: isActive ? '1px solid #0284C7' : '1px solid transparent',
                    color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: isActive ? '700' : '600',
                    cursor: 'pointer',
                    transition: 'all 0.22s ease',
                    boxShadow: isActive ? '0 4px 14px rgba(2, 132, 199, 0.3)' : 'none'
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        ) : null}

        {/* Right Status, Language Switcher & Auth Elements */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* ── Language Switcher (EN / বাংলা) ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#F0F8FE',
            border: '1.5px solid #BAE6FD',
            borderRadius: '20px',
            padding: '2px 4px',
            gap: '2px'
          }} title="Switch language between English and বাংলা (Bengali)">
            <Globe size={13} color="#0284C7" style={{ marginLeft: '4px', marginRight: '2px' }} />
            <button
              type="button"
              onClick={() => setLanguage('en')}
              style={{
                border: 'none',
                borderRadius: '16px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer',
                background: language === 'en' ? '#0284C7' : 'transparent',
                color: language === 'en' ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'all 0.18s'
              }}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('bn')}
              style={{
                border: 'none',
                borderRadius: '16px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer',
                background: language === 'bn' ? '#0284C7' : 'transparent',
                color: language === 'bn' ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'all 0.18s'
              }}
            >
              বাংলা
            </button>
          </div>

          {/* Backend Status indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '20px',
            background: backendOnline ? '#ECFDF5' : '#FFFBEB',
            border: `1px solid ${backendOnline ? '#A7F3D0' : '#FDE68A'}`,
            fontSize: '11px',
            fontWeight: '700',
            color: backendOnline ? '#059669' : '#D97706'
          }} title={backendOnline ? "FastAPI TensorFlow AI backend connected at :8000" : "Checking backend status"}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: backendOnline ? '#10B981' : '#F59E0B',
              boxShadow: backendOnline ? '0 0 8px #10B981' : '0 0 8px #F59E0B'
            }} />
            <span>{backendOnline ? t('backendOnline') : t('backendConnecting')}</span>
          </div>

          {/* User Auth Elements */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                onClick={() => handleTabClick('profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '12px',
                  border: '1.5px solid rgba(186, 230, 253, 0.9)',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.05)'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {(userProfile?.fullName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#091E3A' }}>
                    {userProfile?.fullName || (language === 'bn' ? 'আশা কর্মী' : 'ASHA Worker')}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {userProfile?.hospitalName || user.email?.split('@')[0]}
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                style={{
                  background: '#FFF1F2',
                  border: '1px solid #FECDD3',
                  color: '#E11D48',
                  borderRadius: '10px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                title={t('navSignOut')}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={scrollToAuth}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              <LogIn size={15} />
              <span>{t('navSignIn')}</span>
            </button>
          )}

          {/* Mobile Menu Hamburger (Only for logged in users) */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'flex',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                cursor: 'pointer',
                padding: '6px'
              }}
              className="mobile-hamburger"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer (Only for logged in users) */}
      {user && mobileMenuOpen && (
        <div style={{
          padding: '16px 0',
          borderTop: '1px solid rgba(186, 230, 253, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: isActive ? '#E0F2FE' : 'transparent',
                  border: 'none',
                  color: isActive ? '#0284C7' : 'var(--text-main)',
                  fontWeight: isActive ? '700' : '600',
                  fontSize: '14px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          .desktop-nav { display: flex !important; }
          .mobile-hamburger { display: none !important; }
        }
      `}</style>
    </header>
  );
}