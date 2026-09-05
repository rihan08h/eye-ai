const mongoose = require('mongoose');
const axios = require('axios');
const Screening = require('../models/Screening');
const devStore = require('../utils/devStore');

/**
 * Curated clinical knowledge base for educational queries
 */
const KNOWLEDGE_RESPONSES = [
  {
    keywords: ['what is diabetic retinopathy', 'diabetic retinopathy meaning', 'dr meaning', 'explain dr'],
    response: `**Diabetic Retinopathy (DR)** is an eye condition that can cause vision loss and blindness in people with diabetes.

It occurs when high blood sugar levels damage the tiny blood vessels inside the retina (the light-sensitive tissue at the back of the eye). In the early stages, these vessels may swell and leak fluid. In advanced stages, abnormal new blood vessels grow on the retina and bleed.

*Key takeaway:* Early detection through regular retinal screening can prevent up to 90% of diabetes-related vision loss!`,
  },
  {
    keywords: ['moderate', 'moderate dr', 'moderate non-proliferative'],
    response: `**Moderate Diabetic Retinopathy** is an intermediate stage where blood vessels in the retina are noticeably damaged, swollen, and distorted, potentially leading to microaneurysms and hemorrhages.

**Recommended Action:**
1. Specialist referral to an ophthalmologist within 1–3 months.
2. Strict blood sugar (HbA1c < 7%) and blood pressure control.
3. Follow-up eye examination as advised by your eye doctor.`,
  },
  {
    keywords: ['proliferative', 'pdr', 'severe'],
    response: `**Proliferative Diabetic Retinopathy (PDR)** is an advanced, high-risk stage where fragile new blood vessels (neovascularization) grow across the retina. These vessels can leak blood into the vitreous fluid, causing cloudiness, dark floaters, or retinal detachment.

**URGENT Recommendation:**
• Immediate specialist examination by an ophthalmologist/retina specialist.
• Treatments such as laser photocoagulation or anti-VEGF injections may be required to protect vision.`,
  },
  {
    keywords: ['no dr', 'normal', 'routine'],
    response: `**No Diabetic Retinopathy Detected** means no diabetic blood vessel abnormalities were identified in the retinal image at this time.

**Next Steps:**
• Maintain optimal glycemic and blood pressure management.
• Schedule a routine annual diabetic eye screening in 12 months.`,
  },
  {
    keywords: ['grad-cam', 'heatmap', 'xai', 'explainable'],
    response: `**Grad-CAM (Gradient-weighted Class Activation Mapping)** is an Explainable AI (XAI) technique.

It highlights the exact regions in the retinal fundus image that influenced the AI model's prediction the most (shown as yellow, orange, and red highlight zones). This helps clinicians verify whether the model is focusing on genuine pathological signs like microaneurysms, hemorrhages, or exudates.`,
  },
  {
    keywords: ['prevention', 'prevent', 'diet', 'lifestyle', 'control'],
    response: `**Preventing & Slowing Diabetic Retinopathy:**
1. **Target Blood Glucose:** Keep your HbA1c levels below 7% (or target set by your physician).
2. **Blood Pressure Control:** Keep blood pressure below 130/80 mmHg.
3. **Cholesterol Management:** Maintain healthy lipid levels to reduce hard exudates in the retina.
4. **Annual Screening:** Get a dilated eye exam or fundus screening at least once a year.
5. **No Smoking:** Smoking accelerates diabetic vascular complications.`,
  },
];

/**
 * Handle educational eye health chat
 */
const getEducationalChatResponse = async (message, screeningId, userId) => {
  let screeningContext = '';

  if (screeningId && userId) {
    try {
      let screening;
      if (mongoose.connection.readyState === 1) {
        screening = await Screening.findOne({ _id: screeningId, screenedBy: userId }).populate('patient', 'name age gender');
      } else {
        const s = devStore.screenings.find(
          (sc) =>
            sc._id === screeningId &&
            String(sc.screenedBy?._id || sc.screenedBy) === String(userId)
        );
        if (s) screening = s;
      }

      if (screening) {
        screeningContext = `\n\nPatient Screening Context:\n• Patient: ${screening.patient?.name || 'Patient'} (${screening.patient?.age || 'N/A'} yo ${screening.patient?.gender || ''})\n• Prediction: ${screening.prediction}\n• Confidence: ${(screening.confidence * 100).toFixed(1)}%\n• Risk Level: ${screening.riskLevel?.toUpperCase()}\n• Image Quality: ${screening.imageQuality?.status}`;
      }
    } catch {
      // Continue without context if lookup fails
    }
  }

  // Check if external LLM API key is configured (OpenAI/Gemini/Anthropic compatible)
  const apiKey = process.env.LLM_API_KEY;
  if (apiKey) {
    try {
      const prompt = `You are RetinaAI Assistant, an educational eye health AI for rural screening workers and patients.
Explain diabetic retinopathy clearly in simple terms.
Never prescribe medication or give definitive clinical medical diagnoses.
Always emphasize that the final diagnosis must be confirmed by a licensed ophthalmologist.${screeningContext}

User Query: ${message}`;

      // Example standard LLM completion call
      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'system', content: prompt }, { role: 'user', content: message }],
          temperature: 0.3,
          max_tokens: 300,
        },
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );

      return res.data.choices[0].message.content;
    } catch {
      // Fallback to internal knowledge base
    }
  }

  // Built-in intelligent rule-based knowledge matching
  const lower = message.toLowerCase();
  for (const item of KNOWLEDGE_RESPONSES) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      return item.response + (screeningContext ? `\n\n---\n${screeningContext}` : '');
    }
  }

  return `Thank you for asking about diabetic eye care.

Diabetic Retinopathy occurs when prolonged high blood sugar damages blood vessels in the retina. Regular fundus screening helps detect changes before vision is permanently lost.

For specific symptoms, changes in vision, or individualized medical advice, please consult an ophthalmologist immediately.

*Disclaimer: RetinaAI Assistant is for educational purposes only and does not replace medical consultation.*`;
};

module.exports = {
  getEducationalChatResponse,
};
