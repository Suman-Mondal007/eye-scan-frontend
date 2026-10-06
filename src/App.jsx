import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingView from './components/LandingView';
import HomeView from './components/HomeView';
import PatientFormView from './components/PatientFormView';
import ScanStudioView from './components/ScanStudioView';
import ResultStudioView from './components/ResultStudioView';
import HistoryView from './components/HistoryView';
import ClinicsView from './components/ClinicsView';
import ProfileView from './components/ProfileView';
import AIAssistantBot from './components/AIAssistantBot';

import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentTab, setCurrentTab] = useState('home'); // When logged in, defaults to main Dashboard
  const [authLoading, setAuthLoading] = useState(true);

  // Live database patient cache for system & AI Assistant Bot
  const [allPatients, setAllPatients] = useState([]);

  // Workflow states for scanning
  const [activePatient, setActivePatient] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            setUserProfile({
              fullName: currentUser.displayName || 'ASHA Field Worker',
              email: currentUser.email,
              role: 'healthcare_worker',
              hospitalName: 'Barasat Sub-divisional Hospital',
              state: 'West Bengal',
              district: 'North 24 Parganas',
              ashaId: 'ASHA-WB-814'
            });
          }
        } catch (e) {
          console.warn("User profile fetch note:", e);
        }
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Live patient records listener for AI robot and instant cross-app statistics
  useEffect(() => {
    try {
      const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'), limit(120));
      const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllPatients(list);
      }, (err) => {
        console.warn("Live patient stream for AI bot:", err.message);
      });
      return () => unsub();
    } catch (e) {
      console.warn("Patients stream initialization:", e);
    }
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Confirm logging out of this ASHA workstation?")) {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setCurrentTab('home');
    }
  };

  const handleAuthSuccess = (authUser, profile) => {
    setUser(authUser);
    setUserProfile(profile);
    // Smoothly redirect authenticated ASHA worker directly to the main dashboard page
    setCurrentTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePatientCreated = (patientData) => {
    setActivePatient(patientData);
    setCurrentTab('scan');
  };

  const handleImageSelected = (imageDataUrl) => {
    setCapturedImage(imageDataUrl);
    setCurrentTab('result');
  };

  const handleResetForNewScan = () => {
    setActivePatient(null);
    setCapturedImage(null);
    setCurrentTab('patient-form');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Dynamic Animated Ambient Background Orbs */}
      <div style={{
        position: 'fixed',
        top: '5%',
        left: '10%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.28) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: -1,
        animation: 'floatGentle 8s ease-in-out infinite'
      }} />

      <div style={{
        position: 'fixed',
        top: '40%',
        right: '8%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(147, 197, 253, 0.25) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: -1,
        animation: 'floatGentle 10s ease-in-out infinite 3s'
      }} />

      {/* Top Modern Light Blue Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        userProfile={userProfile}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main style={{ flex: 1, padding: '0 24px' }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>

          {/* 
            UNAUTHENTICATED STATE:
            When not logged in, user opens the site and is directly presented
            with the Landing Page (showing all details + embedded Login/Signup).
          */}
          {!user ? (
            <LandingView
              onAuthSuccess={handleAuthSuccess}
            />
          ) : (
            /* 
              AUTHENTICATED STATE:
              After login/signup, ASHA Karmi enters the main application.
            */
            <>
              {/* Clinical Workstation Dashboard (Current Main Page) */}
              {currentTab === 'home' && (
                <HomeView
                  operator={userProfile}
                  onStartScan={() => setCurrentTab('patient-form')}
                  onViewHistory={() => setCurrentTab('history')}
                  onFindClinics={() => setCurrentTab('clinics')}
                />
              )}

              {/* Step 1: Patient Demographic & Location Intake */}
              {currentTab === 'patient-form' && (
                <PatientFormView
                  operator={userProfile}
                  onPatientCreated={handlePatientCreated}
                  onCancel={() => setCurrentTab('home')}
                />
              )}

              {/* Step 2: Optical Camera Capture */}
              {currentTab === 'scan' && (
                <ScanStudioView
                  patient={activePatient}
                  onImageSelected={handleImageSelected}
                  onBack={() => setCurrentTab('patient-form')}
                />
              )}

              {/* Step 3: AI Inference & Clinical PDF Report */}
              {currentTab === 'result' && (
                <ResultStudioView
                  patient={activePatient}
                  image={capturedImage}
                  operator={userProfile}
                  onNewScan={handleResetForNewScan}
                  onFindClinics={() => setCurrentTab('clinics')}
                />
              )}

              {/* Combined Multi-Region History & Jurisdictional Filtration */}
              {currentTab === 'history' && (
                <HistoryView
                  onStartNewScan={() => setCurrentTab('patient-form')}
                  operator={userProfile}
                />
              )}

              {/* Referral Centers & Nearby Clinics */}
              {currentTab === 'clinics' && (
                <ClinicsView />
              )}

              {/* ASHA Karmi Operator Profile */}
              {currentTab === 'profile' && (
                <ProfileView
                  user={user}
                  userProfile={userProfile}
                  onProfileUpdated={(updated) => setUserProfile(updated)}
                  onLogout={handleLogout}
                />
              )}
            </>
          )}

        </div>
      </main>

      {/* Light Blue Polished Footer */}
      <footer style={{
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(186, 230, 253, 0.85)',
        padding: '32px 24px 28px 24px',
        color: 'var(--text-muted)',
        fontSize: '13px',
        boxShadow: '0 -4px 20px -2px rgba(2, 132, 199, 0.04)'
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontWeight: '800', color: '#091E3A', fontSize: '15px' }}>
                Ophthalmo<span style={{ color: '#0284C7' }}>Scan</span> AI
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '9px', padding: '2px 8px' }}>
                CLINICAL v2.4
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              Rural Eye Health &amp; Deep Learning Cataract Screening Initiative • Built for ASHA Workers &amp; Health Centers
            </p>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
              TensorFlow CNN Backend • FastAPI :8000
            </span>
            <span style={{ color: 'rgba(2, 132, 199, 0.3)' }}>|</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
              Firebase Auth &amp; Cloud Firestore
            </span>
          </div>
        </div>
      </footer>

      {/* 
        ══════════════════════════════════════════════════════════════════
        ─── GOOGLE GEMINI POWERED AI ROBOT ASSISTANT (NetraBot) ──────────
        ══════════════════════════════════════════════════════════════════
        Live patient data search, pos/neg count analytics, and smart clinical decisions.
      */}
      <AIAssistantBot
        patients={allPatients}
        currentTab={currentTab}
        activePatient={activePatient}
        operator={userProfile}
      />
    </div>
  );
}
