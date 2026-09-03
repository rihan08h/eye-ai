const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const ApiError = require('../utils/apiError');

/**
 * Bridge to the Python inference service (ml_service/main.py, port 8001).
 *
 * DESIGN RULE: this module never invents a clinical result.
 *
 * The previous version returned a randomly chosen diagnosis from six
 * hardcoded scenarios whenever the ML service was unreachable, and wrote it
 * to the database as an ordinary screening. A network blip produced
 * "Proliferative DR, 89% confidence" on a patient record with nothing to
 * distinguish it from a real reading. That path is gone.
 *
 * Now: if inference cannot run, the request fails and the user is told.
 * A dev-mode stub still exists for UI work, but it is opt-in, it is loudly
 * labelled, and every result it produces carries isMock: true all the way
 * into MongoDB and onto the screen.
 */

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const ML_TIMEOUT_MS = Number(process.env.ML_TIMEOUT_MS) || 45000;

/**
 * Persist a base64 PNG returned by the inference service and return the URL
 * the frontend should load it from.
 *
 * The Python service is stateless and returns image bytes rather than paths,
 * so Node stays the single owner of image storage.
 */
const saveHeatmapImage = (base64Data, sourceFilename) => {
  if (!base64Data) return '';

  try {
    const cleaned = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const base = path.basename(sourceFilename, path.extname(sourceFilename));
    const filename = `heatmap-${base}-${Date.now()}.png`;

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(cleaned, 'base64'));
    return `/uploads/${filename}`;
  } catch (error) {
    // A heatmap that fails to save degrades the result but does not
    // invalidate the classification. Return empty and let the UI say so.
    console.error('[ML Service] Failed to save heatmap:', error.message);
    return '';
  }
};

/**
 * Development stub. Returns a fixed, obviously-synthetic result.
 *
 * Not randomised: random output taught the team to read variety as evidence
 * the model was working. One constant, clearly-labelled result cannot be
 * mistaken for a reading.
 */
const getDevStubResult = () => ({
  status: 'ok',
  prediction: 'Moderate',
  confidence: 0.5,
  probabilities: { noDR: 0.2, mild: 0.15, moderate: 0.5, severe: 0.1, proliferative: 0.05 },
  imageQuality: { status: 'adequate', score: 0.75, gradable: true, issues: [], metrics: {} },
  uncertainty: {
    level: 'CRITICAL',
    entropy: 0,
    margin: 0,
    isBorderline: true,
    reviewRequired: true,
    message: 'Synthetic development placeholder. Not a model output.',
  },
  explainability: null,
  heatmapUrl: '',
  modelVersion: 'DEV-STUB-NOT-A-MODEL',
  processingTimeMs: 0,
  isMock: true,
});

/**
 * Send a fundus image to the inference service.
 *
 * @param {string} filePath Absolute path to the uploaded image
 * @returns {Promise<object>} Analysis result
 * @throws {ApiError} 503 if the service is unreachable, 502 on a bad response
 */
const analyzeRetinalImage = async (filePath) => {
  const mlApiUrl = process.env.ML_API_URL || 'http://localhost:8001';

  if (process.env.USE_MOCK_ML === 'true') {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(
        500,
        'USE_MOCK_ML is enabled in production. Refusing to generate synthetic screening results.'
      );
    }
    console.warn(
      '\x1b[33m%s\x1b[0m',
      '[ML Service] USE_MOCK_ML=true — returning a SYNTHETIC result. Not a real analysis.'
    );
    return getDevStubResult();
  }

  if (!fs.existsSync(filePath)) {
    throw new ApiError(400, 'The uploaded image could not be read from disk.');
  }

  let response;
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    response = await axios.post(`${mlApiUrl}/predict`, formData, {
      headers: formData.getHeaders(),
      timeout: ML_TIMEOUT_MS,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
  } catch (error) {
    // Every branch below fails the request. None of them fabricate a result.
    const detail = error.response?.data?.detail;

    if (error.response?.status === 503) {
      throw new ApiError(
        503,
        `The AI model is not available: ${detail?.reason || 'model not loaded'}. ` +
          'No analysis was performed.'
      );
    }

    if (error.response) {
      throw new ApiError(
        502,
        detail?.message ||
          `The AI service rejected the image (HTTP ${error.response.status}). No analysis was performed.`
      );
    }

    if (error.code === 'ECONNABORTED') {
      throw new ApiError(
        504,
        `Analysis timed out after ${ML_TIMEOUT_MS / 1000}s. No result was produced — please retry.`
      );
    }

    throw new ApiError(
      503,
      `Cannot reach the AI service at ${mlApiUrl}. No analysis was performed. ` +
        'Start it with: uvicorn ml_service.main:app --port 8001'
    );
  }

  const data = response.data;

  if (!data || typeof data !== 'object') {
    throw new ApiError(502, 'The AI service returned an unreadable response.');
  }

  // Ungradable: a valid clinical outcome, but not a prediction.
  if (data.status === 'ungradable') {
    return {
      status: 'ungradable',
      prediction: null,
      confidence: null,
      probabilities: null,
      imageQuality: data.imageQuality,
      uncertainty: null,
      explainability: null,
      heatmapUrl: '',
      modelVersion: data.modelVersion,
      processingTimeMs: data.processingTimeMs,
      isMock: false,
    };
  }

  // Validate rather than defaulting. The old code did
  // `Number(data.confidence) || 0.85`, which invented a confidence value
  // whenever the service returned something unexpected.
  if (!data.prediction || typeof data.confidence !== 'number') {
    throw new ApiError(502, 'The AI service returned an incomplete result. Nothing was saved.');
  }

  // Save the standalone colored heatmap rather than the pre-blended overlay.
  // The frontend composites it over the original image, so the opacity
  // slider adjusts a real heatmap instead of a decorative gradient.
  const heatmapUrl = saveHeatmapImage(
    data.explainability?.heatmapBase64 || data.explainability?.overlayBase64,
    path.basename(filePath)
  );

  return {
    status: 'ok',
    prediction: data.prediction,
    confidence: data.confidence,
    probabilities: data.probabilities,
    imageQuality: data.imageQuality,
    uncertainty: data.uncertainty,
    explainability: data.explainability
      ? {
          attentionScore: data.explainability.attentionScore,
          regions: data.explainability.regions,
          method: data.explainability.method,
          available: true,
        }
      : { available: false },
    heatmapUrl,
    modelVersion: data.modelVersion,
    processingTimeMs: data.processingTimeMs,
    isMock: false,
  };
};

/**
 * Check whether the inference service is up. Used by /api/health so the
 * dashboard can warn before an operator uploads an image.
 */
const checkMLServiceHealth = async () => {
  const mlApiUrl = process.env.ML_API_URL || 'http://localhost:8001';

  if (process.env.USE_MOCK_ML === 'true') {
    return { available: false, mockMode: true, message: 'Mock mode — no real model in use.' };
  }

  try {
    const { data } = await axios.get(`${mlApiUrl}/health`, { timeout: 5000 });
    return {
      available: Boolean(data.modelLoaded),
      mockMode: false,
      modelVersion: data.modelVersion,
      architecture: data.architecture,
    };
  } catch (error) {
    return {
      available: false,
      mockMode: false,
      message: error.response?.data?.reason || `Unreachable at ${mlApiUrl}`,
    };
  }
};

module.exports = {
  analyzeRetinalImage,
  checkMLServiceHealth,
};
