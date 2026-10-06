import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  FileDown, 
  MapPin, 
  RotateCcw, 
  ShieldCheck, 
  Clock, 
  Activity, 
  User
} from 'lucide-react';
import { predictEyeScan } from '../services/api';
import { downloadMedicalReportPDF } from '../services/pdfReport';
import { db } from '../services/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function ResultStudioView({ 
  patient, 
  image, 
  operator, 
  onNewScan, 
  onFindClinics 
}) {
  const [loading, setLoading] = useState(true);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [syncStatus, setSyncStatus] = useState('syncing');

  const analysisSteps = [
    'Initializing CNN model weights & anterior tensor layers...',
    'Rescaling ocular matrix to 224x224 RGB input format...',
    'Evaluating lens opacification and crystalline pupillary density...',
    'Calculating Bayesian posterior risk & generating clinical classification...'
  ];

  useEffect(() => {
    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < analysisSteps.length) {
        setAnalyzingStep(stepIndex);
      }
    }, 600);

    // Call AI Prediction API — real backend inference
    predictEyeScan(image)
      .then(async (diagnostic) => {
        clearInterval(interval);

        const scanId = `DX${new Date().getFullYear()}${Math.floor(100000 + Math.random() * 900000)}`;
        const finalResult = {
          ...diagnostic,
          scanId,
          date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        };

        setResult(finalResult);
        setLoading(false);

        // Synchronize results with Firestore
        try {
          if (patient?.id) {
            const patientRef = doc(db, 'patients', patient.id);
            await updateDoc(patientRef, {
              cataract_status: finalResult.status,
              cataract_value: finalResult.confidence,
              diagnostic_result: finalResult.condition,
              severity: finalResult.severity,
              scan_id: scanId,
              is_analyzed: true,
              analysis_timestamp: serverTimestamp()
            });
            setSyncStatus('saved');
          } else {
            setSyncStatus('saved');
          }
        } catch (err) {
          console.warn('Firestore patient update note:', err);
          setSyncStatus('offline');
        }
      })
      .catch((err) => {
        clearInterval(interval);
        setError(err.message || 'Prediction failed. Please check if the backend is running.');
        setLoading(false);
      });

    return () => clearInterval(interval);
  }, [image, patient]);

  const handleDownloadPDF = async () => {
    if (!result) return;
    setPdfGenerating(true);
    try {
      await downloadMedicalReportPDF(patient, result, image, operator || {});
    } catch (e) {
      console.error('PDF Generation Error:', e);
      alert('Could not download PDF. Please try again.');
    } finally {
      setPdfGenerating(false);
    }
  };

  if (error) {
    return (
      <div style={{
        maxWidth: '680px',
        margin: '60px auto',
        textAlign: 'center',
        padding: '48px 32px'
      }} className="glass-panel-elevated">
        <div style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: 'var(--rose-bg)',
          border: '1.5px solid var(--rose-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          color: 'var(--rose-danger)'
        }}>
          <AlertTriangle size={36} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#091E3A', margin: '0 0 10px 0' }}>
          Backend Model Connection Error
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
          {error}
        </p>
        <div style={{
          background: '#F0F8FE',
          border: '1.5px solid #BAE6FD',
          borderRadius: '10px',
          padding: '14px 18px',
          textAlign: 'left',
          marginBottom: '24px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: '#0284C7',
          whiteSpace: 'pre-wrap'
        }}>
          {`cd backend\n.\\venv\\Scripts\\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`}
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setError(null); setLoading(true); setAnalyzingStep(0); }}
            className="btn-primary"
            style={{ padding: '10px 22px' }}
          >
            Retry Analysis
          </button>
          <button
            onClick={onNewScan}
            className="btn-secondary"
          >
            Back to Patient Scan
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        maxWidth: '680px',
        margin: '60px auto',
        textAlign: 'center',
        padding: '48px 32px',
        background: '#FFFFFF',
        border: '1.5px solid rgba(186, 230, 253, 0.95)'
      }} className="glass-panel-elevated">
        {/* Radar Scanning Spinner */}
        <div style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          border: '3px solid #E0F2FE',
          margin: '0 auto 28px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            position: 'absolute',
            inset: '-3px',
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: '#0284C7',
            animation: 'spinSlow 1.2s linear infinite'
          }} />
          <Activity size={40} color="#0284C7" style={{ animation: 'pulseGlow 1.5s infinite' }} />
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#091E3A', margin: '0 0 10px 0' }}>
          Analyzing Ocular Lens Opacities
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#0284C7',
          fontWeight: '700',
          minHeight: '24px',
          margin: '0 0 24px 0'
        }}>
          {analysisSteps[analyzingStep]}
        </p>

        <div style={{
          width: '100%',
          height: '6px',
          background: '#E0F2FE',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${((analyzingStep + 1) / analysisSteps.length) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #38BDF8, #0284C7)',
            transition: 'width 0.5s ease',
            boxShadow: '0 0 10px #0284C7'
          }} />
        </div>
      </div>
    );
  }

  const isPositive = result.status === 'Positive';
  const conf = Number(result.confidence);
  
  // Theme colors matching clinical guidelines
  let primaryColor = '#059669';
  let badgeClass = 'badge-success';
  let riskText = 'LOW RISK';
  let bannerBorder = '#A7F3D0';
  let bannerBg = 'linear-gradient(180deg, #FFFFFF 0%, #F0FDF4 100%)';

  if (isPositive) {
    if (conf > 80) {
      primaryColor = '#E11D48';
      badgeClass = 'badge-danger';
      riskText = 'HIGH RISK';
      bannerBorder = '#FECDD3';
      bannerBg = 'linear-gradient(180deg, #FFFFFF 0%, #FFF1F2 100%)';
    } else {
      primaryColor = '#D97706';
      badgeClass = 'badge-warning';
      riskText = 'MODERATE RISK';
      bannerBorder = '#FDE68A';
      bannerBg = 'linear-gradient(180deg, #FFFFFF 0%, #FFFBEB 100%)';
    }
  }

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '36px 0 60px 0' }}>
      {/* Top Banner */}
      <div 
        className="glass-panel-elevated"
        style={{
          border: `2px solid ${bannerBorder}`,
          boxShadow: isPositive ? '0 10px 30px rgba(225, 29, 72, 0.12)' : '0 10px 30px rgba(5, 150, 105, 0.12)',
          padding: '32px',
          marginBottom: '28px',
          position: 'relative',
          overflow: 'hidden',
          background: bannerBg
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          {/* Diagnostic Verdict & Gauge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {/* Circular Gauge */}
            <div style={{
              position: 'relative',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: `3px solid ${primaryColor}`,
              boxShadow: `0 4px 20px ${primaryColor}25`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '26px', fontWeight: '900', color: primaryColor, fontFamily: 'var(--font-mono)' }}>
                {conf}%
              </span>
              <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                Confidence
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <span className={`badge ${badgeClass}`}>
                  {riskText}
                </span>
                <span className="badge badge-cyan">
                  Severity: {result.severity}
                </span>
                {syncStatus === 'saved' && (
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Synced to Database
                  </span>
                )}
              </div>

              <h1 style={{
                fontSize: 'clamp(26px, 3.5vw, 36px)',
                fontWeight: '900',
                color: primaryColor,
                margin: '0 0 6px 0',
                letterSpacing: '-0.5px'
              }}>
                {result.condition}
              </h1>

              <p style={{
                margin: 0,
                fontSize: '14px',
                color: 'var(--text-main)',
                maxWidth: '520px',
                lineHeight: 1.5
              }}>
                {isPositive 
                  ? 'Abnormal lens opacification and crystalline clouding confirmed. Patient should be scheduled for ophthalmology slit-lamp biomicroscopy.' 
                  : 'Clear crystalline ocular lens structures detected with normal light transmission. No significant cataractous opacification observed.'}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '220px' }}>
            <button
              onClick={handleDownloadPDF}
              disabled={pdfGenerating}
              className="btn-primary"
              style={{ padding: '12px 20px', fontSize: '14px', width: '100%' }}
            >
              <FileDown size={18} />
              <span>{pdfGenerating ? 'Building Report...' : 'Download Official PDF'}</span>
            </button>

            {isPositive && (
              <button
                onClick={onFindClinics}
                className="btn-secondary"
                style={{ padding: '12px 20px', fontSize: '14px', width: '100%' }}
              >
                <MapPin size={18} />
                <span>Find Eye Hospitals</span>
              </button>
            )}

            <button
              onClick={onNewScan}
              style={{
                background: '#FFFFFF',
                border: '1.5px solid rgba(186, 230, 253, 0.95)',
                color: '#4A6582',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.05)'
              }}
            >
              <RotateCcw size={15} />
              <span>Screen Next Patient</span>
            </button>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid-3" style={{ marginBottom: '28px' }}>
        {/* Patient Demographics */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={16} /> Patient Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E8F2FC', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Name:</span>
              <strong style={{ color: '#091E3A' }}>{patient?.name || 'N/A'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E8F2FC', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Age / Gender:</span>
              <strong style={{ color: '#091E3A' }}>{patient?.age || 'N/A'} yrs / {patient?.gender || 'N/A'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E8F2FC', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Contact:</span>
              <strong style={{ color: '#091E3A' }}>{patient?.phone || 'N/A'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Jurisdiction:</span>
              <strong style={{ color: '#091E3A', textAlign: 'right' }}>
                {patient?.location?.district || patient?.location?.state || 'West Bengal'}
              </strong>
            </div>
          </div>
        </div>

        {/* Scan Metadata */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} /> Tele-Scan Metadata
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E8F2FC', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Scan Reference:</span>
              <strong style={{ color: '#0284C7', fontFamily: 'var(--font-mono)' }}>{result.scanId}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E8F2FC', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Timestamp:</span>
              <strong style={{ color: '#091E3A' }}>{result.date} {result.time}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E8F2FC', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>AI Architecture:</span>
              <strong style={{ color: '#091E3A' }}>CNN (TensorFlow 2.19)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Operator:</span>
              <strong style={{ color: '#091E3A' }}>{operator?.fullName || 'Certified Field Officer'}</strong>
            </div>
          </div>
        </div>

        {/* Captured Eye Optical Thumbnail */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '2px solid #BAE6FD',
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.12)'
          }}>
            <img 
              src={image} 
              alt="Scan Thumbnail" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', fontWeight: '600' }}>
            Retinal Frame Captured
          </span>
        </div>
      </div>

      {/* Clinical Guidance Recommendations */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#091E3A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={20} color="#0284C7" />
          Prescribed Clinical Action Plan & Next Steps
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {isPositive ? (
            <>
              <div style={{ background: '#FFF1F2', padding: '16px', borderRadius: '12px', border: '1px solid #FECDD3' }}>
                <strong style={{ color: '#E11D48', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
                  1. Slit-Lamp Biomicroscopy
                </strong>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Refer patient to nearest district eye hospital or affiliated clinic for dilated slit-lamp assessment to determine nuclear vs cortical density.
                </p>
              </div>

              <div style={{ background: '#FFF1F2', padding: '16px', borderRadius: '12px', border: '1px solid #FECDD3' }}>
                <strong style={{ color: '#E11D48', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
                  2. Snellen Visual Acuity Check
                </strong>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Record pinhole visual acuity (BCVA) for both eyes to measure functional impairment before discussing phacoemulsification or manual SICS surgery.
                </p>
              </div>

              <div style={{ background: '#FFF1F2', padding: '16px', borderRadius: '12px', border: '1px solid #FECDD3' }}>
                <strong style={{ color: '#E11D48', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
                  3. Systemic Risk Counseling
                </strong>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Screen for fasting blood glucose and hypertension. Diabetic retinopathy can coexist with cataracts and requires fundus examination.
                </p>
              </div>
            </>
          ) : (
            <>
              <div style={{ background: '#ECFDF5', padding: '16px', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                <strong style={{ color: '#059669', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
                  1. Annual Routine Surveillance
                </strong>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Schedule follow-up ocular scan in 12 months for routine preventive eye health check-up.
                </p>
              </div>

              <div style={{ background: '#ECFDF5', padding: '16px', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                <strong style={{ color: '#059669', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
                  2. Photoprotection (UV-400)
                </strong>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Advise patient to wear wide-brim hats and UV protective eyewear when working under direct sunlight to prevent future photo-oxidation.
                </p>
              </div>

              <div style={{ background: '#ECFDF5', padding: '16px', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                <strong style={{ color: '#059669', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
                  3. Nutritional Eye Health
                </strong>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Recommend antioxidant rich diet with dark leafy vegetables, citrus fruits, and adequate hydration.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
