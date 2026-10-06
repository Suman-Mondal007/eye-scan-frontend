import axios from 'axios';

// Backend URLs to try in order (supports production Vercel env variable)
const BACKEND_URLS = [
  import.meta.env.VITE_BACKEND_URL,
  import.meta.env.VITE_API_URL,
  'https://eye-scan-backend.onrender.com',
  'http://127.0.0.1:8000',
  'http://localhost:8000',
  'http://172.20.10.2:8000'
].filter(Boolean);

let cachedWorkingUrl = null;

/**
 * Check if the FastAPI backend is online.
 */
export const checkBackendHealth = async () => {
  for (const url of BACKEND_URLS) {
    try {
      const res = await axios.get(`${url}/`, { timeout: 2500 });
      if (res.data) {
        cachedWorkingUrl = url;
        return { isOnline: true, url };
      }
    } catch {
      // try next url
    }
  }
  return { isOnline: false, url: BACKEND_URLS[0] };
};

/**
 * Send eye scan image to FastAPI /predict endpoint.
 * Returns real model inference — NOT simulated results.
 *
 * Backend response shape:
 *   { prediction: "Positive Cataract" | "No Cataract",
 *     confidence: 0.0-1.0 (raw model output),
 *     confidence_pct: 0-100,
 *     is_positive: bool }
 *
 * @param {File|Blob|string} imageSource - File object or base64 data URL
 */
export const predictEyeScan = async (imageSource) => {
  // ── Step 1: Convert image source to a Blob ──────────────────────────────
  let fileBlob = null;

  if (imageSource instanceof File || imageSource instanceof Blob) {
    fileBlob = imageSource;
  } else if (typeof imageSource === 'string') {
    try {
      // Fetch the data URL or remote URL and convert to blob
      const fetchRes = await fetch(imageSource);
      if (!fetchRes.ok) throw new Error(`Fetch failed: ${fetchRes.status}`);
      fileBlob = await fetchRes.blob();
    } catch (e) {
      console.error('[api.js] Could not convert image source to Blob:', e);
    }
  }

  if (!fileBlob || fileBlob.size === 0) {
    throw new Error('Could not prepare image for upload. Please try a different image.');
  }

  // ── Step 2: Build FormData ────────────────────────────────────────────
  const formData = new FormData();
  // The FastAPI endpoint reads from field named 'file'
  formData.append('file', fileBlob, 'eyescan.jpg');

  // ── Step 3: Try each backend URL until one succeeds ───────────────────
  const urlsToTry = cachedWorkingUrl
    ? [cachedWorkingUrl, ...BACKEND_URLS.filter(u => u !== cachedWorkingUrl)]
    : BACKEND_URLS;

  let lastError = null;

  for (const url of urlsToTry) {
    try {
      console.log(`[api.js] Sending image to ${url}/predict ...`);

      const response = await axios.post(`${url}/predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000  // 30s to allow TensorFlow inference time
      });

      cachedWorkingUrl = url;
      const data = response.data;

      console.log('[api.js] Raw backend response:', data);

      // ── Step 4: Parse the real model result ───────────────────────────
      // Backend now returns is_positive boolean directly
      const isPositive = data.is_positive === true;

      // confidence_pct is already a 0-100 percentage for the predicted class
      // If the older backend doesn't have it, compute from raw confidence
      let displayConfidencePct;

      if (typeof data.confidence_pct === 'number') {
        displayConfidencePct = data.confidence_pct;
      } else if (typeof data.confidence === 'number') {
        // Old backend: confidence is raw 0-1 float
        const raw = data.confidence;
        const inFraction = raw <= 1.0;
        const rawPct = inFraction ? raw * 100 : raw;
        // Display confidence = confidence in the PREDICTED class
        displayConfidencePct = isPositive ? rawPct : (100 - rawPct);
      } else {
        displayConfidencePct = 50;  // fallback if completely unknown
      }

      // Clamp to 0-100
      displayConfidencePct = Math.max(0, Math.min(100, displayConfidencePct));

      const status = isPositive ? 'Positive' : 'Negative';

      let severity = 'Optimal';
      if (isPositive) {
        if (displayConfidencePct > 80) severity = 'Advanced';
        else if (displayConfidencePct > 70) severity = 'Moderate';
        else severity = 'Mild';
      }

      const result = {
        condition: isPositive ? 'Cataract Detected' : 'Normal Eye Health',
        confidence: Number(displayConfidencePct.toFixed(1)),
        rawConfidence: data.confidence,  // keep raw for debugging
        status,
        severity,
        isSimulated: false,
        backendUrl: url
      };

      console.log('[api.js] Parsed result:', result);
      return result;

    } catch (err) {
      lastError = err;
      console.warn(`[api.js] Backend at ${url} failed:`, err.message);
    }
  }

  // ── Step 5: Backend not reachable — show clear offline error ──────────
  // Do NOT silently fall back to fake results that look real.
  // Instead, throw an error so the UI can display a clear "Backend Offline" message.
  console.error('[api.js] All backend URLs failed. Last error:', lastError);

  throw new Error(
    'Cannot reach the FastAPI backend (tried localhost:8000 and 127.0.0.1:8000).\n\n' +
    'Please start the backend server:\n' +
    '  cd backend\n' +
    '  .\\venv\\Scripts\\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload\n\n' +
    `Technical detail: ${lastError?.message || 'Network error'}`
  );
};
