/**
 * geminiService.js
 * Google Gemini AI Integration for OphthalmoScan AI Bot (NetraBot / Dr. Drishti)
 * Powered by Gemini 3.5 Flash / Flash Lite for fast clinical decision support and data analytics.
 * Supports English and Bengali (বাংলা) responses.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Candidate models in order of priority
const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash'
];

/**
 * Generate an answer from Gemini AI with full system, language, and page data context
 */
export async function askGeminiAI({
  userPrompt,
  chatHistory = [],
  patients = [],
  currentTab = 'home',
  activePatient = null,
  operator = null,
  language = 'en'
}) {
  // 1. Calculate live page & system statistics
  const total = patients.length;
  const positiveList = patients.filter(
    p => (p.cataract_status || p.status || '').toLowerCase() === 'positive'
  );
  const negativeList = patients.filter(
    p => {
      const s = (p.cataract_status || p.status || '').toLowerCase();
      return s === 'negative' || s === 'normal';
    }
  );
  const positiveCount = positiveList.length;
  const negativeCount = negativeList.length;
  const otherCount = total - positiveCount - negativeCount;
  const positivePercentage = total > 0 ? ((positiveCount / total) * 100).toFixed(1) : '0';

  // Group by district / state
  const districtCounts = {};
  patients.forEach(p => {
    const loc = p.district ? `${p.district} (${p.state || 'India'})` : (p.state || 'Unspecified');
    if (!districtCounts[loc]) districtCounts[loc] = { total: 0, positive: 0, negative: 0 };
    districtCounts[loc].total++;
    const s = (p.cataract_status || p.status || '').toLowerCase();
    if (s === 'positive') districtCounts[loc].positive++;
    else if (s === 'negative' || s === 'normal') districtCounts[loc].negative++;
  });

  // Recent patients summary for search and context (up to 30 most recent)
  const patientRoster = patients.slice(0, 30).map((p, idx) => ({
    index: idx + 1,
    id: p.id || p.scan_id || `P-${idx + 1}`,
    name: p.fullName || p.name || 'Anonymous',
    age: p.age || 'N/A',
    gender: p.gender || 'N/A',
    phone: p.phoneNumber || p.phone || 'N/A',
    state: p.state || 'N/A',
    district: p.district || 'N/A',
    status: p.cataract_status || p.status || 'Pending',
    confidence: p.confidence ? `${(p.confidence * (p.confidence <= 1 ? 100 : 1)).toFixed(1)}%` : 'N/A',
    severity: p.severity || 'N/A',
    operator: p.scanned_by_asha || p.asha_name || (operator?.fullName || 'ASHA Worker'),
    hospital: p.hospital_name || p.hospital || 'District Hospital'
  }));

  const isBengali = language === 'bn';

  // Build System Prompt
  const systemInstruction = `
You are "NetraBot AI" (also known as Dr. Drishti), an intelligent clinical ophthalmology assistant and data intelligence copilot integrated into the OphthalmoScan AI Cataract Screening platform for ASHA Karmi health workers across India.

LANGUAGE REQUIREMENT:
${isBengali 
  ? 'CRITICAL: The user has selected BENGALI (বাংলা) as the active language. You MUST generate your response entirely in natural, polite, and fluent Bengali (বাংলা ভাষায় উত্তর দিন). Use clear Bengali terminology and numerals where helpful (or English in parentheses if needed).' 
  : 'The active language is English. Respond in clear, professional English.'}

YOUR ROLE & CAPABILITIES:
1. DATA SEARCH & ANALYTICS:
   - You have direct real-time access to all current patient screening records and metrics in the database.
   - Current Database Summary:
     * Total Scanned Patients: ${total}
     * Total POSITIVE Cataract Cases: ${positiveCount} (${positivePercentage}%)
     * Total NEGATIVE / Normal Cases: ${negativeCount}
     * Unclassified / Pending: ${otherCount}
   - Regional Hotspots / District Summary:
     ${JSON.stringify(districtCounts, null, 2)}
   - Recent Patient Database Sample (First 30 Records):
     ${JSON.stringify(patientRoster, null, 2)}
   - When asked about patient numbers, positive/negative cases, specific patients, or regional data, use this exact database info. Provide clear, accurate numbers and highlights.

2. ACTIVE SESSION CONTEXT:
   - Current App View/Tab: "${currentTab}"
   - Active ASHA Karmi Operator: ${operator ? `${operator.fullName || 'Sunita Mondal'} (${operator.ashaId || 'ASHA'}, ${operator.hospitalName || 'Sub-centre'}, ${operator.district || 'District'}, ${operator.state || 'State'})` : 'ASHA Health Worker'}
   - Active Patient in Session: ${activePatient ? JSON.stringify(activePatient) : 'None currently selected'}

3. CLINICAL & RANDOM SEARCH DECISION SUPPORT:
   - You can answer ANY question about ophthalmology, eye anatomy, cataract types (Nuclear Sclerosis, Cortical, Posterior Subcapsular, Traumatic, Congenital), surgery (Phacoemulsification, SICS, ECCE, IOL implantation), post-op care, diabetes-related cataracts, and Indian government health schemes (NPCBVI, Ayushman Bharat PM-JAY, Swasthya Sathi).
   - You can also answer random clinical questions, provide smart screening decisions, guidance on camera angles, lighting conditions, and how ASHA workers should counsel anxious elderly patients.
   - Tone: Professional, warm, empowering, highly encouraging to grassroots ASHA workers. Keep answers crisp with bullet points where helpful.
`.trim();

  // Prepare messages for Gemini API
  const contents = [
    {
      role: 'user',
      parts: [{ text: `SYSTEM INSTRUCTION:\n${systemInstruction}\n\nUSER QUERY:\n${userPrompt}` }]
    }
  ];

  // Try candidate models in sequence
  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1000
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.warn(`Model ${model} returned ${response.status}:`, errData);
        lastError = new Error(errData.error?.message || `HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        return {
          success: true,
          text: reply,
          modelUsed: model
        };
      }
    } catch (err) {
      console.warn(`Fetch error with model ${model}:`, err);
      lastError = err;
    }
  }

  // Fallback to local intelligent rule-based engine if offline
  console.warn("Gemini API fallback to local parser:", lastError);
  const localReply = generateLocalSmartReply(userPrompt, {
    total,
    positiveCount,
    negativeCount,
    positivePercentage,
    patientRoster,
    districtCounts
  }, isBengali);

  return {
    success: true,
    text: localReply,
    modelUsed: 'local-analytics-engine'
  };
}

/**
 * High-speed local analytics fallback with English & Bengali responses
 */
function generateLocalSmartReply(query, data, isBengali = false) {
  const q = query.toLowerCase();

  if (isBengali) {
    if (q.includes('positive') || q.includes('negative') || q.includes('কত') || q.includes('পজিটিভ') || q.includes('নেগেটিভ') || q.includes('সংখ্যা')) {
      return `📊 **বর্তমান স্ক্রিনিং ডাটাবেস পরিসংখ্যান:**
• **মোট স্ক্রিন করা রোগী:** ${data.total} জন
• **ছানি পজিটিভ কেস:** ${data.positiveCount} জন (${data.positivePercentage}%)
• **ছানি নেগেটিভ / স্বাভাবিক:** ${data.negativeCount} জন
• **ক্লিনিকাল পদক্ষেপ:** সকল পজিটিভ রোগীদের নিকটস্থ চক্ষু হাসপাতালে স্লিট-ল্যাম্প ও লেন্স প্রতিস্থাপন (IOL) মূল্যায়নের জন্য পাঠাতে হবে।`;
    }

    return `🤖 **নেত্রবট এআই পরামর্শ:**
আপনার প্রশ্ন: "${query}"

**আশা কর্মীদের জন্য মূল নির্দেশিকা:**
1. চোখের পিউপিল ঘোলাটে হওয়া বা আলোতে চোখ ঝলসে যাওয়া ছানির লক্ষণ।
2. বর্তমানে মোট **${data.total}** জনের মধ্যে **${data.positiveCount}** জনের ছানি শনাক্ত হয়েছে।
3. সরকারি প্রকল্পের আওতায় বিনামূল্যে অস্ত্রোপচারের জন্য রোগীকে স্বাস্থ্যকেন্দ্রে রেফার করুন।`;
  }

  // English fallback
  if (q.includes('positive') || q.includes('negative') || q.includes('how many') || q.includes('stats') || q.includes('count')) {
    return `📊 **Current Screening Database Statistics:**
• **Total Screened Patients:** ${data.total}
• **Cataract Positive Cases:** ${data.positiveCount} (${data.positivePercentage}%)
• **Cataract Negative / Normal:** ${data.negativeCount}
• **Clinical Action:** All positive patients should be expedited to the nearest district ophthalmic surgical center for slit-lamp evaluation and IOL planning.`;
  }

  return `🤖 **NetraBot Clinical Insight:**
I analyzed your query: "${query}".

**Key Cataract Guidance for ASHA Workers:**
1. **Detection:** Clouding in the pupil, blurred vision, or halo effects indicate cataracts.
2. **Current Registry:** ${data.positiveCount} out of ${data.total} patients have tested positive.
3. **Next Steps:** Ensure positive patients are referred to PHC/CHC for free surgical intervention under the National Blindness Control Programme.`;
}
