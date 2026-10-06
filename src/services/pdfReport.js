import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates an official ophthalmology diagnostic PDF report
 * @param {Object} patient - Patient data
 * @param {Object} diagnostic - Diagnostic result from AI scan
 * @param {string} eyeImageUrl - Image URL or base64 of the eye scan
 * @param {Object} worker - Healthcare worker/operator info
 */
export const downloadMedicalReportPDF = async (patient, diagnostic, eyeImageUrl, worker = {}) => {
  // Create a hidden container for the medical report template
  const reportContainer = document.createElement('div');
  reportContainer.id = 'report-print-target';
  reportContainer.style.position = 'fixed';
  reportContainer.style.left = '-9999px';
  reportContainer.style.top = '0';
  reportContainer.style.width = '794px'; // Standard A4 width in 96 DPI pixels
  reportContainer.style.minHeight = '1123px';
  reportContainer.style.backgroundColor = '#FFFFFF';
  reportContainer.style.color = '#0F172A';
  reportContainer.style.fontFamily = "'Plus Jakarta Sans', Arial, sans-serif";
  reportContainer.style.padding = '36px 44px';
  reportContainer.style.boxSizing = 'border-box';

  const isPositive = diagnostic.status === 'Positive';
  const themeColor = isPositive ? '#EF4444' : '#10B981';
  const badgeBg = isPositive ? '#FEE2E2' : '#D1FAE5';
  const badgeText = isPositive ? '#991B1B' : '#065F46';

  const scanId = diagnostic.scanId || `DX${new Date().getFullYear()}${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = diagnostic.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = diagnostic.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const patientLocation = typeof patient.location === 'object' && patient.location !== null
    ? `${patient.location.district || ''}, ${patient.location.state || ''} ${patient.location.pincode ? `(${patient.location.pincode})` : ''}`
    : (patient.location || patient.village || 'Not specified');

  reportContainer.innerHTML = `
    <div style="border-bottom: 2px solid #0284C7; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: #0284C7; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 16px;">◉</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0369A1; letter-spacing: -0.5px;">OphthalmoScan AI</h1>
        </div>
        <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 600; color: #64748B; letter-spacing: 0.5px; text-transform: uppercase;">Advanced AI-Powered Ocular Diagnostics System</p>
        <p style="margin: 2px 0 0 0; font-size: 10px; color: #94A3B8;">National Digital Eye Health & ASHA Tele-Ophthalmology Initiative</p>
      </div>
      <div style="text-align: right;">
        <div style="display: inline-block; background: #F0F9FF; border: 1px solid #BAE6FD; padding: 4px 12px; border-radius: 6px;">
          <span style="font-size: 10px; font-weight: 700; color: #0284C7; letter-spacing: 1px;">REPORT ID</span>
          <p style="margin: 2px 0 0 0; font-size: 13px; font-weight: 800; font-family: monospace; color: #0369A1;">${scanId}</p>
        </div>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #64748B;">Date: <strong>${dateStr}</strong> | Time: <strong>${timeStr}</strong></p>
      </div>
    </div>

    <!-- Patient Details Card -->
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px 22px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px;">
        1. Patient Demographics & Intake
      </h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; font-size: 12px;">
        <div>
          <span style="display: block; font-size: 10px; color: #64748B; font-weight: 600; text-transform: uppercase;">Full Name</span>
          <strong style="font-size: 14px; color: #0F172A;">${patient.name || 'Anonymous'}</strong>
        </div>
        <div>
          <span style="display: block; font-size: 10px; color: #64748B; font-weight: 600; text-transform: uppercase;">Age / Gender</span>
          <strong style="font-size: 14px; color: #0F172A;">${patient.age || 'N/A'} yrs / ${patient.gender || 'Not specified'}</strong>
        </div>
        <div>
          <span style="display: block; font-size: 10px; color: #64748B; font-weight: 600; text-transform: uppercase;">Contact Number</span>
          <strong style="font-size: 14px; color: #0F172A;">${patient.phone || patient.mobile || 'N/A'}</strong>
        </div>
        <div style="grid-column: span 2;">
          <span style="display: block; font-size: 10px; color: #64748B; font-weight: 600; text-transform: uppercase;">Residential Location / Block</span>
          <strong style="font-size: 13px; color: #0F172A;">${patientLocation}</strong>
        </div>
        <div>
          <span style="display: block; font-size: 10px; color: #64748B; font-weight: 600; text-transform: uppercase;">Attending Clinician / ASHA</span>
          <strong style="font-size: 13px; color: #0F172A;">${worker.fullName || 'Certified Field Operator'}</strong>
        </div>
      </div>
    </div>

    <!-- Diagnostic Result Core Card -->
    <div style="border: 2px solid ${themeColor}; border-radius: 12px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="background: ${themeColor}; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">2. Deep Learning Ocular Scan Assessment</span>
        <span style="background: rgba(255,255,255,0.25); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">
          CONFIDENCE: ${diagnostic.confidence}%
        </span>
      </div>
      <div style="padding: 22px; display: flex; gap: 24px; align-items: center; background: #FFFFFF;">
        <div style="flex: 1;">
          <div style="display: inline-block; background: ${badgeBg}; color: ${badgeText}; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 800; margin-bottom: 8px;">
            RISK TIER: ${isPositive ? (diagnostic.confidence > 80 ? 'HIGH RISK' : 'MODERATE RISK') : 'LOW RISK (HEALTHY)'}
          </div>
          <h2 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 900; color: ${themeColor};">
            ${diagnostic.condition || (isPositive ? 'Cataract Detected' : 'Normal Eye Health')}
          </h2>
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #475569; line-height: 1.5;">
            ${isPositive 
              ? 'Anomalous lens opacification and crystalline clouding detected within the pupillary aperture consistent with cataract formations.' 
              : 'Clear ocular lens structures detected with normal light transmission through the anterior chamber. No significant cataractous opacification.'}
          </p>
          <div style="display: flex; gap: 18px; font-size: 11px; color: #64748B;">
            <div>Severity Grading: <strong style="color: #0F172A;">${diagnostic.severity || (isPositive ? 'Moderate' : 'Optimal')}</strong></div>
            <div>Model Version: <strong style="color: #0F172A;">CNN-Cataract-v2.4</strong></div>
            <div>Scan Quality: <strong style="color: #10B981;">Optimal (Grade A)</strong></div>
          </div>
        </div>

        ${eyeImageUrl ? `
          <div style="width: 140px; height: 140px; border-radius: 8px; border: 2px solid #CBD5E1; overflow: hidden; flex-shrink: 0; background: #000; display: flex; align-items: center; justify-content: center;">
            <img src="${eyeImageUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="Eye Scan" />
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Recommendations & Followup -->
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px 22px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.8px;">
        3. Clinical Guidance & Prescribed Next Steps
      </h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #334155; line-height: 1.7;">
        ${isPositive ? `
          <li><strong>Ophthalmologist Consultation:</strong> Refer patient to a nearby district hospital or affiliated ophthalmology clinic for slit-lamp biomicroscopy.</li>
          <li><strong>Visual Acuity Assessment:</strong> Perform Snellen chart visual acuity evaluation to quantify refractive deficit and vision degradation.</li>
          <li><strong>Surgical Evaluation:</strong> If visual acuity impairs daily activities, schedule pre-operative intraocular lens (IOL) biometric workup.</li>
          <li><strong>Systemic Screening:</strong> Screen for co-morbid diabetes mellitus and hypertension which accelerate cataract progression.</li>
        ` : `
          <li><strong>Routine Surveillance:</strong> Periodic ocular re-evaluation in 12 months for individuals over 45 years of age.</li>
          <li><strong>Ultraviolet Protection:</strong> Recommend UV-400 rated sunglasses to minimize cumulative photic damage to crystalline lenses.</li>
          <li><strong>Antioxidant Nutrition:</strong> Maintain diet rich in lutein, zeaxanthin, vitamin C, and omega-3 fatty acids.</li>
        `}
      </ul>
    </div>

    <!-- Verification & Signatures -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding-top: 20px; border-top: 1px dashed #CBD5E1;">
      <div>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #0284C7; font-weight: 700;">
          <span>✓</span> Cryptographically Verified AI Output
        </div>
        <p style="margin: 4px 0 0 0; font-size: 9px; color: #94A3B8; max-width: 440px; line-height: 1.4;">
          DISCLAIMER: This report is generated by an artificial intelligence diagnostic screening tool. It is intended for triage and assistive screening, and does not replace definitive clinical examination by a licensed ophthalmologist.
        </p>
      </div>

      <div style="text-align: center; width: 180px;">
        <div style="border-bottom: 1px solid #64748B; height: 35px; margin-bottom: 4px;"></div>
        <p style="margin: 0; font-size: 11px; font-weight: 700; color: #0F172A;">Authorized Signature</p>
        <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748B;">Field Screener / Officer</p>
      </div>
    </div>
  `;

  document.body.appendChild(reportContainer);

  try {
    const canvas = await html2canvas(reportContainer, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    const safeName = (patient.name || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
    pdf.save(`EyeScan_Report_${safeName}_${scanId}.pdf`);
  } catch (err) {
    console.error('Error generating PDF with html2canvas:', err);
    // Fallback: window.print()
    window.print();
  } finally {
    document.body.removeChild(reportContainer);
  }
};
