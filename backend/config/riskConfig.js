/**
 * DR Severity → Risk Level and Referral Priority mapping.
 * This is the SINGLE SOURCE OF TRUTH for all risk/triage logic.
 * Never scatter this mapping across controllers or frontend components.
 */
const RISK_CONFIG = {
  'No DR': {
    riskLevel: 'low',
    riskLabel: 'Routine',
    referralRequired: false,
    referralNote: 'Annual follow-up recommended.',
    color: 'green',
    priority: 1,
  },
  Mild: {
    riskLevel: 'low',
    riskLabel: 'Follow-up',
    referralRequired: false,
    referralNote: 'Follow-up in 6–12 months.',
    color: 'yellow',
    priority: 2,
  },
  Moderate: {
    riskLevel: 'medium',
    riskLabel: 'Specialist Referral',
    referralRequired: true,
    referralNote: 'Refer to ophthalmologist within 1–3 months.',
    color: 'orange',
    priority: 3,
  },
  Severe: {
    riskLevel: 'high',
    riskLabel: 'Urgent',
    referralRequired: true,
    referralNote: 'Urgent referral to ophthalmologist within 1–2 weeks.',
    color: 'red',
    priority: 4,
  },
  'Proliferative DR': {
    riskLevel: 'critical',
    riskLabel: 'Urgent Specialist Review',
    referralRequired: true,
    referralNote: 'Immediate specialist review required.',
    color: 'purple',
    priority: 5,
  },
};

/**
 * Map a ML prediction string to risk metadata.
 * @param {string} prediction - e.g. "Proliferative DR"
 * @returns {object} risk config object
 */
const getRiskForPrediction = (prediction) => {
  return RISK_CONFIG[prediction] || RISK_CONFIG['No DR'];
};

module.exports = { RISK_CONFIG, getRiskForPrediction };
