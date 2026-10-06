import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  ArrowLeft, 
  RotateCcw,
  Zap
} from 'lucide-react';

// Demo sample images so users can test immediately without needing an external eye photo
const SAMPLE_EYE_IMAGES = [
  {
    name: 'Sample A: Cataract Eye Case',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    type: 'cataract'
  },
  {
    name: 'Sample B: Normal Healthy Eye',
    url: 'https://images.unsplash.com/photo-1544465544-1b71aae9c0a2?w=600&auto=format&fit=crop&q=80',
    type: 'normal'
  }
];

export default function ScanStudioView({ patient, onImageSelected, onBack }) {
  const [mode, setMode] = useState('camera'); // 'camera' | 'upload'
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // back camera preferred for eyes

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Start Camera
  const startCamera = async (facing = facingMode) => {
    setCameraError('');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn("Camera access note:", err);
      setCameraError('Camera access not available or permission denied. You can use image upload or quick sample presets.');
      setCameraActive(false);
      setMode('upload');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (mode === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, facingMode, capturedImage]);

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Crop center square for optimal lens focus
    const size = Math.min(video.videoWidth, video.videoHeight) || 600;
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;
    
    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample) => {
    setCapturedImage(sample.url);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (mode === 'camera') {
      startCamera();
    }
  };

  const handleProceedToAnalysis = () => {
    if (!capturedImage) return;
    onImageSelected(capturedImage);
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '36px 0 60px 0' }}>
      {/* Patient Demographic Banner */}
      <div 
        className="glass-panel"
        style={{
          padding: '16px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.95)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBack}
            style={{
              background: '#E0F2FE',
              border: '1.5px solid #BAE6FD',
              color: '#0284C7',
              borderRadius: '10px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span style={{ fontSize: '11px', color: '#0284C7', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              CURRENT PATIENT
            </span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#091E3A' }}>
              {patient?.name || 'Anonymous Patient'}
            </h3>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="badge badge-cyan">
            Age: {patient?.age || 'N/A'} yrs
          </span>
          <span className="badge badge-cyan">
            {patient?.gender || 'Male'}
          </span>
          <span className="badge" style={{ background: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD' }}>
            {patient?.location?.district || patient?.location?.state || 'Local Health Center'}
          </span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      {!capturedImage && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px',
          gap: '12px'
        }}>
          <button
            onClick={() => setMode('camera')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: '12px',
              background: mode === 'camera' ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : '#FFFFFF',
              color: mode === 'camera' ? '#FFFFFF' : '#4A6582',
              border: `1.5px solid ${mode === 'camera' ? '#0284C7' : 'rgba(186, 230, 253, 0.95)'}`,
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: mode === 'camera' ? '0 4px 16px rgba(2, 132, 199, 0.28)' : '0 2px 6px rgba(2, 132, 199, 0.04)',
              transition: 'all 0.2s ease'
            }}
          >
            <Camera size={16} />
            <span>Live Camera Optical Scanner</span>
          </button>

          <button
            onClick={() => setMode('upload')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: '12px',
              background: mode === 'upload' ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : '#FFFFFF',
              color: mode === 'upload' ? '#FFFFFF' : '#4A6582',
              border: `1.5px solid ${mode === 'upload' ? '#0284C7' : 'rgba(186, 230, 253, 0.95)'}`,
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: mode === 'upload' ? '0 4px 16px rgba(2, 132, 199, 0.28)' : '0 2px 6px rgba(2, 132, 199, 0.04)',
              transition: 'all 0.2s ease'
            }}
          >
            <Upload size={16} />
            <span>High-Res File Upload</span>
          </button>
        </div>
      )}

      {/* Main Viewport Box */}
      <div 
        className="glass-panel-elevated"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        {/* State 1: Captured Image Preview */}
        {capturedImage ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              aspectRatio: '1 / 1',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '3px solid #0284C7',
              boxShadow: '0 12px 36px rgba(2, 132, 199, 0.25)',
              marginBottom: '24px'
            }}>
              <img 
                src={capturedImage} 
                alt="Captured Eye Scan"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Reticle Overlay on Preview */}
              <div style={{
                position: 'absolute',
                inset: '20px',
                border: '1.5px dashed rgba(2, 132, 199, 0.6)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }} />

              {/* 4 Corner HUD brackets */}
              <div style={{ position: 'absolute', top: '15px', left: '15px', width: '24px', height: '24px', borderTop: '3px solid #0284C7', borderLeft: '3px solid #0284C7' }} />
              <div style={{ position: 'absolute', top: '15px', right: '15px', width: '24px', height: '24px', borderTop: '3px solid #0284C7', borderRight: '3px solid #0284C7' }} />
              <div style={{ position: 'absolute', bottom: '15px', left: '15px', width: '24px', height: '24px', borderBottom: '3px solid #0284C7', borderLeft: '3px solid #0284C7' }} />
              <div style={{ position: 'absolute', bottom: '15px', right: '15px', width: '24px', height: '24px', borderBottom: '3px solid #0284C7', borderRight: '3px solid #0284C7' }} />

              <div style={{
                position: 'absolute',
                bottom: '14px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #A7F3D0',
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
              }}>
                <CheckCircle size={14} /> Optical Frame Acquired
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={handleRetake}
                className="btn-secondary"
                style={{ padding: '12px 24px' }}
              >
                <RotateCcw size={16} />
                <span>Retake / Change Image</span>
              </button>

              <button
                onClick={handleProceedToAnalysis}
                className="btn-primary"
                style={{ padding: '14px 34px', fontSize: '15px' }}
              >
                <Zap size={18} />
                <span>Start AI Cataract Analysis</span>
              </button>
            </div>
          </div>
        ) : mode === 'camera' ? (
          /* State 2: Active WebRTC Camera */
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              aspectRatio: '1 / 1',
              borderRadius: '24px',
              overflow: 'hidden',
              background: '#040F1E',
              border: '2px solid rgba(2, 132, 199, 0.4)',
              boxShadow: '0 12px 36px rgba(2, 132, 199, 0.2)',
              marginBottom: '20px'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />

              {/* Laser Scanning Bar */}
              <div className="laser-line" />

              {/* Eye Alignment Reticle HUD */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '65%',
                height: '65%',
                borderRadius: '50%',
                border: '2px solid rgba(56, 189, 248, 0.75)',
                boxShadow: '0 0 20px rgba(2, 132, 199, 0.4), inset 0 0 20px rgba(2, 132, 199, 0.3)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Inner Pupil Alignment Circle */}
                <div style={{
                  width: '35%',
                  height: '35%',
                  borderRadius: '50%',
                  border: '1.5px dashed #38BDF8',
                  pointerEvents: 'none'
                }} />
              </div>

              {/* 4 Corner Brackets */}
              <div style={{ position: 'absolute', top: '20px', left: '20px', width: '30px', height: '30px', borderTop: '3px solid #38BDF8', borderLeft: '3px solid #38BDF8' }} />
              <div style={{ position: 'absolute', top: '20px', right: '20px', width: '30px', height: '30px', borderTop: '3px solid #38BDF8', borderRight: '3px solid #38BDF8' }} />
              <div style={{ position: 'absolute', bottom: '20px', left: '20px', width: '30px', height: '30px', borderBottom: '3px solid #38BDF8', borderLeft: '3px solid #38BDF8' }} />
              <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '30px', height: '30px', borderBottom: '3px solid #38BDF8', borderRight: '3px solid #38BDF8' }} />

              {/* System Live Pill */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #BAE6FD',
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '10px',
                fontWeight: '800',
                color: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284C7', boxShadow: '0 0 6px #0284C7' }} />
                <span>SYSTEM LIVE</span>
              </div>

              {/* Flip camera toggle if multiple cams */}
              <button
                type="button"
                onClick={() => setFacingMode(facingMode === 'user' ? 'environment' : 'user')}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #BAE6FD',
                  color: '#091E3A',
                  borderRadius: '10px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={12} /> Flip
              </button>

              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(255, 255, 255, 0.92)',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#091E3A',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                pointerEvents: 'none'
              }}>
                Align patient's eye directly inside the circle
              </div>
            </div>

            {/* Shutter Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button
                type="button"
                onClick={handleCapturePhoto}
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  border: '4px solid #FFFFFF',
                  boxShadow: '0 8px 26px rgba(2, 132, 199, 0.45)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.15s ease'
                }}
                title="Capture eye scan"
              >
                <Camera size={30} color="#FFFFFF" />
              </button>
            </div>
          </div>
        ) : (
          /* State 3: Upload Mode & Sample Presets */
          <div style={{ width: '100%', maxWidth: '580px' }}>
            {/* Drag & Drop Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(2, 132, 199, 0.45)',
                borderRadius: '20px',
                padding: '48px 24px',
                textAlign: 'center',
                background: '#F0F8FE',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '24px'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#E0F2FE',
                border: '1.5px solid #BAE6FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#0284C7'
              }}>
                <Upload size={28} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#091E3A', margin: '0 0 6px 0' }}>
                Click to browse or drop an eye scan image
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Supports JPG, PNG, WEBP (Minimum 224x224 px for CNN model)
              </p>
            </div>

            {/* Quick Testing Presets */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '20px',
              border: '1.5px solid rgba(186, 230, 253, 0.95)',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.05)'
            }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#0284C7', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                Instant Clinical Test Presets
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 14px 0' }}>
                Test the neural network pipeline immediately with verified clinical examples:
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {SAMPLE_EYE_IMAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      background: '#F8FBFE',
                      border: '1.5px solid rgba(186, 230, 253, 0.85)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <img 
                      src={sample.url} 
                      alt={sample.name} 
                      style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }} 
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#091E3A' }}>{sample.name}</div>
                      <div style={{ fontSize: '10px', color: '#0284C7', fontWeight: '600' }}>Click to load & analyze</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hidden Canvas for Video Extraction */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
