import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  FileText, 
  ArrowRight, 
  AlertCircle,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ALL_INDIAN_STATES, getDistrictsForState } from '../data/indiaLocations';

export default function PatientFormView({ onPatientCreated, onCancel, operator }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  
  const [state, setState] = useState(operator?.state || 'West Bengal');
  const [district, setDistrict] = useState(operator?.district || 'North 24 Parganas');
  const [block, setBlock] = useState('');
  const [pincode, setPincode] = useState('');
  const [symptoms, setSymptoms] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize initial operator state if operator loads
  useEffect(() => {
    if (operator?.state && ALL_INDIAN_STATES.includes(operator.state)) {
      setState(operator.state);
      const districts = getDistrictsForState(operator.state);
      if (operator.district && districts.includes(operator.district)) {
        setDistrict(operator.district);
      } else if (districts.length > 0) {
        setDistrict(districts[0]);
      }
    }
  }, [operator]);

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setState(newState);
    const districts = getDistrictsForState(newState);
    setDistrict(districts[0] || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter the patient full name.');
      return;
    }

    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile contact number.');
      return;
    }

    if (!age || parseInt(age) < 1 || parseInt(age) > 120) {
      setErrorMsg('Please enter a realistic patient age (1 - 120).');
      return;
    }

    if (!pincode || pincode.trim().length < 6) {
      setErrorMsg('Please enter a valid 6-digit postal pincode.');
      return;
    }

    setLoading(true);

    try {
      const patientData = {
        name: name.trim(),
        phone: phone.trim(),
        age: parseInt(age),
        gender,
        location: {
          state,
          district,
          block: block.trim() || 'N/A',
          pincode: pincode.trim()
        },
        symptoms: symptoms.trim() || 'Routine screening',
        is_analyzed: false,
        operator: {
          name: operator?.fullName || 'ASHA Field Worker',
          ashaId: operator?.ashaId || 'ASHA-GEN-001',
          hospital: operator?.hospitalName || 'Sub-divisional Eye Clinic',
          state: operator?.state || state,
          district: operator?.district || district
        },
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "patients"), patientData);
      
      onPatientCreated({
        id: docRef.id,
        ...patientData
      });
    } catch (err) {
      console.error("Firestore Patient Creation Error:", err);
      // Fallback local patient object if offline
      onPatientCreated({
        id: `local_${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        age: parseInt(age),
        gender,
        location: { state, district, block: block.trim(), pincode: pincode.trim() },
        symptoms: symptoms.trim(),
        operator: {
          name: operator?.fullName || 'ASHA Field Worker',
          ashaId: operator?.ashaId || 'ASHA-GEN-001',
          hospital: operator?.hospitalName || 'Sub-divisional Eye Clinic',
          state: operator?.state || state,
          district: operator?.district || district
        },
        is_analyzed: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '36px 0 60px 0' }}>
      <div className="glass-panel-elevated" style={{ padding: '36px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          borderBottom: '1px solid rgba(186, 230, 253, 0.85)',
          paddingBottom: '20px',
          marginBottom: '28px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.28)'
          }}>
            <UserPlus size={24} color="#FFFFFF" />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#091E3A', margin: '0 0 4px 0' }}>
              Patient Demographic & Clinical Intake
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Step 1 of 2: Register patient record before launching optical retina scanner
            </p>
          </div>
        </div>

        {/* Logged in ASHA Operator Badge */}
        {operator && (
          <div style={{
            background: '#F0F9FF',
            border: '1.5px solid #BAE6FD',
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369A1' }}>
              <ShieldCheck size={18} color="#0284C7" />
              <span>ASHA Operator: <strong style={{ color: '#091E3A' }}>{operator.fullName || 'Verified Operator'}</strong> ({operator.ashaId || 'ASHA-ID'})</span>
            </div>
            <div style={{ color: '#0284C7', fontWeight: '700' }}>
              PHC: {operator.hospitalName || 'Sub-divisional Centre'} • {operator.district || district}, {operator.state || state}
            </div>
          </div>
        )}

        {errorMsg && (
          <div style={{
            background: 'var(--rose-bg)',
            border: '1px solid var(--rose-border)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: 'var(--rose-danger)',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px'
          }}>
            <AlertCircle size={18} color="#E11D48" style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Patient Personal Details */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '13px',
              fontWeight: '800',
              color: '#0284C7',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '14px'
            }}>
              Personal Information
            </h3>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label"><User size={13} /> Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra Das"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label"><Phone size={13} /> Mobile Contact Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  className="input-field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label"><Calendar size={13} /> Age (Years) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  placeholder="e.g. 58"
                  className="input-field"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Gender *</label>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  height: '46px'
                }}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      style={{
                        flex: 1,
                        background: gender === g ? '#0284C7' : '#FFFFFF',
                        border: `1.5px solid ${gender === g ? '#0284C7' : 'rgba(186, 230, 253, 0.95)'}`,
                        borderRadius: 'var(--radius-md)',
                        color: gender === g ? '#FFFFFF' : 'var(--text-main)',
                        fontWeight: gender === g ? '800' : '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: gender === g ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none'
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Location & Jurisdiction */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '13px',
              fontWeight: '800',
              color: '#0284C7',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '14px'
            }}>
              Address & Rural Health Jurisdiction
            </h3>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label"><MapPin size={13} /> State / Union Territory *</label>
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

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Village / Block / Ward</label>
                <input
                  type="text"
                  placeholder="e.g. Barasat Block-I / Habra"
                  className="input-field"
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Postal Pincode *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6-digit pincode"
                  className="input-field"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
          </div>

          {/* Symptoms & Notes */}
          <div className="input-group" style={{ marginBottom: '32px' }}>
            <label className="input-label">
              <FileText size={13} /> Patient Reported Symptoms & Comorbidities (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Blurring in right eye for 6 months, difficulty seeing at night, diabetic for 8 years..."
              className="input-field"
              style={{ resize: 'vertical' }}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ padding: '14px 28px' }}
            >
              {loading ? 'Creating Record...' : (
                <>
                  <Eye size={18} />
                  <span>Proceed to Optical Scan</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
