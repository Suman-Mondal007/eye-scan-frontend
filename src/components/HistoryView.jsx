import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Clock, 
  FileDown, 
  Trash2, 
  Eye, 
  User, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  Plus,
  Filter,
  ShieldCheck,
  Building2,
  X,
  RotateCcw,
  Sparkles,
  Globe
} from 'lucide-react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { downloadMedicalReportPDF } from '../services/pdfReport';
import { ALL_INDIAN_STATES, getDistrictsForState } from '../data/indiaLocations';

export default function HistoryView({ onStartNewScan, operator }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedAsha, setSelectedAsha] = useState('');
  const [onlyMyRegion, setOnlyMyRegion] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    try {
      const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setPatients(list);
        setLoading(false);
      }, (err) => {
        console.warn("Firestore history snapshot note:", err);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore history setup note:", e);
      setLoading(false);
    }
  }, []);

  // Compute available districts based on selectedState
  const availableDistricts = useMemo(() => {
    if (selectedState) {
      return getDistrictsForState(selectedState);
    }
    // Extract unique districts present in current patients dataset
    const distSet = new Set();
    patients.forEach(p => {
      const d = p.location?.district;
      if (d) distSet.add(d);
    });
    return Array.from(distSet).sort();
  }, [selectedState, patients]);

  // Compute list of unique ASHA Workers in the records
  const uniqueAshaWorkers = useMemo(() => {
    const map = new Map();
    patients.forEach(p => {
      if (p.operator?.ashaId) {
        map.set(p.operator.ashaId, {
          ashaId: p.operator.ashaId,
          name: p.operator.name || 'ASHA Worker',
          hospital: p.operator.hospital || ''
        });
      }
    });
    return Array.from(map.values());
  }, [patients]);

  const handleStateFilterChange = (e) => {
    const s = e.target.value;
    setSelectedState(s);
    setSelectedDistrict('');
    setOnlyMyRegion(false);
  };

  const handleToggleMyRegion = () => {
    if (!operator?.district && !operator?.state) {
      alert("No region is configured in your current ASHA profile. Please update profile with your state and district.");
      return;
    }
    if (onlyMyRegion) {
      setOnlyMyRegion(false);
      setSelectedState('');
      setSelectedDistrict('');
    } else {
      setOnlyMyRegion(true);
      if (operator.state) setSelectedState(operator.state);
      if (operator.district) setSelectedDistrict(operator.district);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedAsha('');
    setOnlyMyRegion(false);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || selectedState || selectedDistrict || selectedAsha || onlyMyRegion;

  // Filtered patients list
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const phoneMatch = (p.phone || p.mobile || '').includes(q);
      const scanIdMatch = (p.scan_id || '').toLowerCase().includes(q);
      const blockMatch = (p.location?.block || '').toLowerCase().includes(q);
      const ashaMatch = (p.operator?.ashaId || '').toLowerCase().includes(q) || (p.operator?.name || '').toLowerCase().includes(q);

      const matchesSearch = !q || nameMatch || phoneMatch || scanIdMatch || blockMatch || ashaMatch;

      // Status Filter
      let matchesStatus = true;
      if (statusFilter === 'positive') {
        matchesStatus = p.cataract_status === 'Positive';
      } else if (statusFilter === 'negative') {
        matchesStatus = p.cataract_status === 'Negative' || p.cataract_status === 'Normal';
      } else if (statusFilter === 'pending') {
        matchesStatus = !p.is_analyzed;
      }

      // State Filter
      let matchesState = true;
      if (selectedState) {
        const pState = typeof p.location === 'object' ? p.location?.state : '';
        matchesState = (pState || '').toLowerCase() === selectedState.toLowerCase() ||
          (typeof p.location === 'string' && p.location.toLowerCase().includes(selectedState.toLowerCase()));
      }

      // District Filter
      let matchesDistrict = true;
      if (selectedDistrict) {
        const pDist = typeof p.location === 'object' ? p.location?.district : '';
        matchesDistrict = (pDist || '').toLowerCase() === selectedDistrict.toLowerCase() ||
          (typeof p.location === 'string' && p.location.toLowerCase().includes(selectedDistrict.toLowerCase()));
      }

      // ASHA Worker Filter
      let matchesAshaWorker = true;
      if (selectedAsha) {
        matchesAshaWorker = p.operator?.ashaId === selectedAsha;
      }

      return matchesSearch && matchesStatus && matchesState && matchesDistrict && matchesAshaWorker;
    });
  }, [patients, searchQuery, statusFilter, selectedState, selectedDistrict, selectedAsha]);

  // Statistics for currently filtered dataset
  const filteredStats = useMemo(() => {
    const total = filteredPatients.length;
    const positive = filteredPatients.filter(p => p.cataract_status === 'Positive').length;
    const normal = filteredPatients.filter(p => p.cataract_status === 'Negative' || p.cataract_status === 'Normal').length;
    return { total, positive, normal };
  }, [filteredPatients]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this patient record?")) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'patients', id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Could not delete record from database.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadPDF = async (patient) => {
    const diagnostic = {
      condition: patient.diagnostic_result || (patient.cataract_status === 'Positive' ? 'Cataract Detected' : 'Normal Eye Health'),
      confidence: patient.cataract_value || 85,
      status: patient.cataract_status || 'Positive',
      severity: patient.severity || 'Moderate',
      scanId: patient.scan_id || `DX${new Date().getFullYear()}0001`
    };

    await downloadMedicalReportPDF(patient, diagnostic, null, patient.operator || operator || {});
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 0 60px 0' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#091E3A', margin: 0 }}>
              Combined Patient Triage & Diagnostic Registry
            </h2>
            <span className="badge badge-cyan" style={{ fontSize: '11px' }}>
              Multi-Region Cloud
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Unified field registry across all ASHA health workers with instant jurisdictional and regional filtration
          </p>
        </div>

        <button 
          onClick={onStartNewScan}
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '13px' }}
        >
          <Plus size={16} />
          <span>New Patient Scan</span>
        </button>
      </div>

      {/* Regional Filtering Hub & Controls */}
      <div 
        className="glass-panel"
        style={{
          padding: '22px 24px',
          marginBottom: '20px',
          background: 'rgba(255, 255, 255, 0.98)',
          border: '1.5px solid rgba(186, 230, 253, 0.95)',
          boxShadow: '0 8px 24px rgba(2, 132, 199, 0.05)'
        }}
      >
        {/* Top Filter Row: Search Bar & My Region Quick Action */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1', minWidth: '280px' }}>
            <Search size={16} color="#0284C7" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by patient name, phone, village, scan ID, or ASHA ID..."
              className="input-field"
              style={{ paddingLeft: '40px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
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
                <X size={15} />
              </button>
            )}
          </div>

          {/* Quick "My Region Only" Button */}
          {operator && (
            <button
              onClick={handleToggleMyRegion}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 18px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                background: onlyMyRegion ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : '#F0F9FF',
                color: onlyMyRegion ? '#FFFFFF' : '#0284C7',
                border: `1.5px solid ${onlyMyRegion ? '#0284C7' : '#BAE6FD'}`,
                transition: 'all 0.2s ease',
                boxShadow: onlyMyRegion ? '0 4px 14px rgba(2, 132, 199, 0.28)' : 'none'
              }}
              title="Filter records matching your assigned district and state"
            >
              <MapPin size={16} />
              <span>{onlyMyRegion ? `My Region: ${operator.district || 'Assigned'}` : `Filter My Region (${operator.district || 'Local'})`}</span>
            </button>
          )}

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
                background: '#FFF1F2',
                color: '#E11D48',
                border: '1px solid #FECDD3',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Second Row: Specific Region & Dropdown Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          alignItems: 'center',
          paddingTop: '14px',
          borderTop: '1px solid rgba(186, 230, 253, 0.6)'
        }}>
          {/* State Dropdown Filter */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#0284C7', marginBottom: '4px', textTransform: 'uppercase' }}>
              Filter by State / UT
            </label>
            <select
              className="input-field"
              value={selectedState}
              onChange={handleStateFilterChange}
              style={{ fontSize: '13px', padding: '8px 12px' }}
            >
              <option value="">🌐 All Indian States & UTs</option>
              {ALL_INDIAN_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* District Dropdown Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#0284C7', marginBottom: '4px', textTransform: 'uppercase' }}>
              Filter by District
            </label>
            <select
              className="input-field"
              value={selectedDistrict}
              onChange={(e) => { setSelectedDistrict(e.target.value); setOnlyMyRegion(false); }}
              style={{ fontSize: '13px', padding: '8px 12px' }}
            >
              <option value="">📍 All Districts {selectedState ? `in ${selectedState}` : ''}</option>
              {availableDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* ASHA Karmi Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#0284C7', marginBottom: '4px', textTransform: 'uppercase' }}>
              Filter by ASHA Karmi
            </label>
            <select
              className="input-field"
              value={selectedAsha}
              onChange={(e) => setSelectedAsha(e.target.value)}
              style={{ fontSize: '13px', padding: '8px 12px' }}
            >
              <option value="">👩‍⚕️ All ASHA Workers</option>
              {uniqueAshaWorkers.map(w => (
                <option key={w.ashaId} value={w.ashaId}>
                  {w.name} ({w.ashaId})
                </option>
              ))}
            </select>
          </div>

          {/* Cataract Diagnosis Status */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#0284C7', marginBottom: '4px', textTransform: 'uppercase' }}>
              Diagnostic Status
            </label>
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '13px', padding: '8px 12px' }}
            >
              <option value="all">All Diagnostic Results</option>
              <option value="positive">🚨 Cataract Positive</option>
              <option value="negative">✅ Normal / Healthy</option>
              <option value="pending">⏳ Pending Analysis</option>
            </select>
          </div>
        </div>

        {/* Live Filter Stats & Active Tag Indicators */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid #F0F8FE',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <div>
            Showing <strong style={{ color: '#091E3A' }}>{filteredStats.total}</strong> records
            {(selectedDistrict || selectedState) && (
              <span> in <strong style={{ color: '#0284C7' }}>{selectedDistrict ? `${selectedDistrict}, ` : ''}{selectedState}</strong></span>
            )}
            {` • `}
            <span style={{ color: '#E11D48', fontWeight: '700' }}>{filteredStats.positive} Cataract</span>
            {` • `}
            <span style={{ color: '#059669', fontWeight: '700' }}>{filteredStats.normal} Normal</span>
          </div>

          {hasActiveFilters && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {selectedState && (
                <span className="badge badge-cyan" style={{ fontSize: '11px', cursor: 'pointer' }} onClick={() => setSelectedState('')}>
                  State: {selectedState} ✕
                </span>
              )}
              {selectedDistrict && (
                <span className="badge badge-cyan" style={{ fontSize: '11px', cursor: 'pointer' }} onClick={() => setSelectedDistrict('')}>
                  District: {selectedDistrict} ✕
                </span>
              )}
              {selectedAsha && (
                <span className="badge" style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', fontSize: '11px', cursor: 'pointer' }} onClick={() => setSelectedAsha('')}>
                  ASHA: {selectedAsha} ✕
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="badge badge-warning" style={{ fontSize: '11px', cursor: 'pointer' }} onClick={() => setStatusFilter('all')}>
                  Status: {statusFilter} ✕
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Patient Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#0284C7' }}>
          <Clock size={36} style={{ animation: 'spinSlow 2s linear infinite', margin: '0 auto 12px auto' }} />
          <p>Synchronizing patient records from cloud database...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', background: '#FFFFFF' }}>
          <Eye size={48} style={{ opacity: 0.3, margin: '0 auto 16px auto', color: '#0284C7' }} />
          <h3 style={{ color: '#091E3A', margin: '0 0 8px 0', fontSize: '18px' }}>
            No patient records match the selected region or criteria
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '14px' }}>
            {hasActiveFilters ? 'Try resetting region filters or clearing search terms.' : 'Begin scanning patients in your assigned area.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {hasActiveFilters && (
              <button onClick={handleResetFilters} className="btn-secondary" style={{ padding: '10px 20px' }}>
                Clear All Filters
              </button>
            )}
            <button onClick={onStartNewScan} className="btn-primary" style={{ padding: '10px 20px' }}>
              Start New Patient Scan
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))', gap: '20px' }}>
          {filteredPatients.map((p, idx) => {
            const isPos = p.cataract_status === 'Positive';
            const isAnalyzed = p.is_analyzed;
            const dateStr = p.createdAt?.seconds 
              ? new Date(p.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'Recent';

            const stateName = p.location?.state || (typeof p.location === 'string' ? p.location : '');
            const distName = p.location?.district || '';
            const blockName = p.location?.block || '';
            const loc = distName ? `${distName}, ${stateName}` : (stateName || 'Assigned PHC');

            const screenerName = p.operator?.name || 'ASHA Field Worker';
            const screenerId = p.operator?.ashaId || 'ASHA-GEN';
            const hospitalName = p.operator?.hospital || '';

            return (
              <div 
                key={`${p.id || 'pat'}-${idx}`}
                className="glass-panel"
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: isAnalyzed 
                    ? (isPos ? '1.5px solid #FECDD3' : '1.5px solid #A7F3D0') 
                    : '1.5px solid rgba(186, 230, 253, 0.95)',
                  boxShadow: '0 4px 16px rgba(2, 132, 199, 0.04)'
                }}
              >
                <div>
                  {/* Top Status & Date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    {isAnalyzed ? (
                      <span className={isPos ? 'badge badge-danger' : 'badge badge-success'}>
                        {isPos ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                        {isPos ? 'Cataract Detected' : 'Normal / Clear Lens'}
                      </span>
                    ) : (
                      <span className="badge badge-cyan">
                        Awaiting Camera Scan
                      </span>
                    )}

                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {dateStr}
                    </span>
                  </div>

                  {/* Patient Name */}
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#091E3A', margin: '0 0 6px 0' }}>
                    {p.name || 'Unnamed Patient'}
                  </h3>

                  {/* Demographics details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={13} color="#0284C7" />
                      <span>{p.age ? `${p.age} yrs` : 'Age N/A'} • {p.gender || 'Not specified'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={13} color="#0284C7" />
                      <span>{p.phone || p.mobile || 'No contact number'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={13} color="#0284C7" />
                      <span style={{ fontWeight: '600', color: '#091E3A' }}>
                        {loc} {blockName && blockName !== 'N/A' ? `(${blockName})` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Screener ASHA Worker Attribution Badge */}
                  <div style={{
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '14px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369A1' }}>
                      <ShieldCheck size={13} />
                      <span>Screener: <strong>{screenerName}</strong></span>
                    </div>
                    <span style={{ color: '#0284C7', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                      {screenerId}
                    </span>
                  </div>

                  {/* Diagnostic Findings */}
                  {isAnalyzed && (
                    <div style={{
                      background: '#F8FBFE',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                      border: '1.5px solid rgba(186, 230, 253, 0.85)'
                    }}>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>
                          Model Confidence
                        </span>
                        <strong style={{ fontSize: '15px', color: isPos ? '#E11D48' : '#059669', fontFamily: 'var(--font-mono)' }}>
                          {p.cataract_value || '--'}%
                        </strong>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>
                          Clinical Severity
                        </span>
                        <strong style={{ fontSize: '13px', color: '#091E3A' }}>
                          {p.severity || (isPos ? 'Moderate' : 'Optimal')}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '14px',
                  borderTop: '1px solid #E8F2FC'
                }}>
                  {isAnalyzed ? (
                    <button
                      onClick={() => handleDownloadPDF(p)}
                      style={{
                        background: '#E0F2FE',
                        border: '1.5px solid #BAE6FD',
                        color: '#0284C7',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <FileDown size={14} /> PDF Report
                    </button>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending scan</span>
                  )}

                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.2s ease'
                    }}
                    title="Delete patient record"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
