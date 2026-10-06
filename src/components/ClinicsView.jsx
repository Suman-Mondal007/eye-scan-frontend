import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Phone, 
  ExternalLink, 
  Compass, 
  Clock,
  ShieldCheck
} from 'lucide-react';

const LOCATIONIQ_API_KEY = 'pk.9e06d6e9bb4da4893cb1263be3d62248';

// Fallback verified ophthalmology centers in major hubs if Overpass has delay
const DEFAULT_EYE_HOSPITALS = [
  {
    name: "Regional Institute of Ophthalmology (RIO)",
    address: "Medical College Hospital Campus, 88 College Street, Kolkata, West Bengal 700073",
    phone: "+91 33 2255 1621",
    speciality: "Super-Specialty Tertiary Eye Center & Cataract Microsurgery",
    lat: 22.5744,
    lon: 88.3629,
    distanceKm: 2.4
  },
  {
    name: "Sankara Nethralaya Eye Hospital",
    address: "No. 147, Mukundapur, E.M. Bypass, Kolkata, West Bengal 700099",
    phone: "+91 33 4401 3000",
    speciality: "Comprehensive Ophthalmology, Phaco & Glaucoma",
    lat: 22.4891,
    lon: 88.3976,
    distanceKm: 5.1
  },
  {
    name: "Susrut Eye Foundation & Research Centre",
    address: "HB-36/A/1, Sector-III, Salt Lake City, Kolkata, West Bengal 700106",
    phone: "+91 33 4032 5000",
    speciality: "Cornea, Cataract & Rural Community Outreach",
    lat: 22.5705,
    lon: 88.4110,
    distanceKm: 4.8
  },
  {
    name: "Disha Eye Hospital",
    address: "88 Ghoshpara Road, Barrackpore, Kolkata, West Bengal 700120",
    phone: "+91 33 6636 0000",
    speciality: "Advanced Femto-Cataract & Retina Diagnostic Center",
    lat: 22.7562,
    lon: 88.3615,
    distanceKm: 12.3
  }
];

export default function ClinicsView() {
  const [loading, setLoading] = useState(false);
  const [clinics, setClinics] = useState(DEFAULT_EYE_HOSPITALS);
  const [manualQuery, setManualQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [locationStatus, setLocationStatus] = useState('');

  // Fetch from Overpass API
  const fetchNearbyClinics = async (lat, lon) => {
    setLoading(true);
    setLocationStatus(`Searching medical facilities within 12km of (${lat.toFixed(3)}, ${lon.toFixed(3)})...`);

    try {
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:12000,${lat},${lon});
          node["amenity"="clinic"](around:12000,${lat},${lon});
          node["healthcare"="ophthalmologist"](around:12000,${lat},${lon});
          way["amenity"="hospital"](around:12000,${lat},${lon});
        );
        out center 15;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });

      const data = await response.json();
      if (data && data.elements && data.elements.length > 0) {
        const mapped = data.elements.map(item => {
          const itemLat = item.lat || item.center?.lat;
          const itemLon = item.lon || item.center?.lon;
          const tags = item.tags || {};

          const dLat = (itemLat - lat) * 111;
          const dLon = (itemLon - lon) * 111 * Math.cos(lat * (Math.PI / 180));
          const dist = Math.sqrt(dLat * dLat + dLon * dLon);

          return {
            name: tags.name || tags['name:en'] || "Ophthalmology / Health Center",
            address: tags['addr:street'] ? `${tags['addr:street']}, ${tags['addr:city'] || ''}` : (tags['addr:full'] || "District Healthcare Center"),
            phone: tags.phone || tags['contact:phone'] || "Call Local 108 Emergency / PHC",
            speciality: tags.healthcare || tags.amenity === 'hospital' ? "Government / General Eye Services" : "Community Eye Clinic",
            lat: itemLat,
            lon: itemLon,
            distanceKm: Number(dist.toFixed(1))
          };
        }).sort((a, b) => a.distanceKm - b.distanceKm);

        setClinics(mapped);
        setLocationStatus(`Found ${mapped.length} nearby centers.`);
      } else {
        setLocationStatus("No specific OSM nodes returned. Displaying verified regional tertiary centers.");
        setClinics(DEFAULT_EYE_HOSPITALS);
      }
    } catch (err) {
      console.warn("Overpass fetch error:", err);
      setLocationStatus("OpenStreetMap timeout. Displaying verified regional eye hospitals.");
      setClinics(DEFAULT_EYE_HOSPITALS);
    } finally {
      setLoading(false);
    }
  };

  // Device GPS Location
  const handleGetDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setLocationStatus("Accessing GPS satellite coordinates...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchNearbyClinics(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn("GPS error:", err);
        setLocationStatus("GPS access denied. You can search by city or district name.");
        setLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Autocomplete search via LocationIQ
  const handleInputChange = async (e) => {
    const text = e.target.value;
    setManualQuery(text);

    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const url = `https://us1.locationiq.com/v1/autocomplete.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(text)}&limit=5&format=json`;
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (item) => {
    setManualQuery(item.display_name);
    setSuggestions([]);
    fetchNearbyClinics(parseFloat(item.lat), parseFloat(item.lon));
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '36px 0 60px 0' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#091E3A', margin: '0 0 6px 0' }}>
            Ophthalmology Clinics & Cataract Centers Locator
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Connect positive cataract patients with certified eye surgery centers and government hospitals
          </p>
        </div>

        {/* GPS Button */}
        <button
          onClick={handleGetDeviceLocation}
          className="btn-primary"
          style={{ padding: '12px 24px' }}
        >
          <Compass size={18} />
          <span>Use Current GPS Location</span>
        </button>
      </div>

      {/* Search Bar & Auto-Complete */}
      <div 
        className="glass-panel"
        style={{
          padding: '20px 24px',
          marginBottom: '28px',
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.95)'
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search size={18} color="#0284C7" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Type city, district, or sub-division (e.g. Kolkata, Barasat, Pune, Bengaluru)..."
            className="input-field"
            style={{ paddingLeft: '46px', fontSize: '15px' }}
            value={manualQuery}
            onChange={handleInputChange}
          />
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '74px',
            left: '24px',
            right: '24px',
            background: '#FFFFFF',
            border: '1.5px solid #BAE6FD',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(2, 132, 199, 0.15)',
            zIndex: 30,
            overflow: 'hidden'
          }}>
            {suggestions.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSuggestion(item)}
                style={{
                  padding: '12px 18px',
                  borderBottom: '1px solid #E8F2FC',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  color: '#091E3A',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F0F8FE'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <MapPin size={16} color="#0284C7" style={{ flexShrink: 0 }} />
                <span>{item.display_name}</span>
              </div>
            ))}
          </div>
        )}

        {locationStatus && (
          <div style={{ fontSize: '12px', color: '#0284C7', marginTop: '10px', fontWeight: '700' }}>
            {locationStatus}
          </div>
        )}
      </div>

      {/* Clinics Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#0284C7' }}>
          <Clock size={36} style={{ animation: 'spinSlow 2s linear infinite', margin: '0 auto 12px auto' }} />
          <p>Querying hospital database and satellite nodes...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
          {clinics.map((clinic, index) => (
            <div 
              key={index}
              className="glass-panel"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: '#FFFFFF',
                border: '1.5px solid rgba(186, 230, 253, 0.95)'
              }}
            >
              <div>
                {/* Distance & Tag */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge badge-cyan">
                    <Navigation size={11} /> {clinic.distanceKm} km away
                  </span>
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800' }}>
                    Open For Referrals
                  </span>
                </div>

                {/* Name */}
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#091E3A', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                  {clinic.name}
                </h3>

                {/* Speciality Badge */}
                <div style={{
                  background: '#F0F8FE',
                  border: '1px solid #BAE6FD',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  color: '#0284C7',
                  fontWeight: '700',
                  marginBottom: '14px'
                }}>
                  {clinic.speciality}
                </div>

                {/* Address & Contact */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <MapPin size={14} color="#0284C7" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ lineHeight: 1.4 }}>{clinic.address}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} color="#0284C7" style={{ flexShrink: 0 }} />
                    <a href={`tel:${clinic.phone}`} style={{ color: '#0284C7', textDecoration: 'none', fontWeight: '700' }}>
                      {clinic.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Get Directions Button */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '13px',
                  textDecoration: 'none'
                }}
              >
                <Navigation size={15} />
                <span>Navigate via Google Maps</span>
                <ExternalLink size={14} />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Emergency & National Health Line Notice */}
      <div 
        className="glass-panel"
        style={{
          marginTop: '36px',
          padding: '24px 30px',
          borderLeft: '4px solid #0284C7',
          background: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div>
          <h4 style={{ color: '#091E3A', fontSize: '16px', fontWeight: '800', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#0284C7" />
            National Blindness Control Program (NPCB) Support
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            Under the Ayushman Bharat / National Eye Health Initiative, free or subsidized cataract surgeries (IOL implants) are provided at designated district hospitals.
          </p>
        </div>

        <div style={{
          background: '#E0F2FE',
          border: '1.5px solid #BAE6FD',
          borderRadius: '12px',
          padding: '10px 18px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>
            National Health Helpline
          </span>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#0284C7', fontFamily: 'var(--font-mono)' }}>
            104 / 1075
          </div>
        </div>
      </div>
    </div>
  );
}
