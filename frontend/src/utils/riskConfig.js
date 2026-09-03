export const RISK_CONFIG = {
  'No DR': {
    riskLevel: 'low',
    riskLabel: 'Routine',
    referralRequired: false,
    referralNote: 'Annual routine follow-up recommended.',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    colorHex: '#10b981',
    severityIndex: 0,
  },
  Mild: {
    riskLevel: 'low',
    riskLabel: 'Follow-up',
    referralRequired: false,
    referralNote: 'Follow-up exam recommended in 6–12 months.',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    colorHex: '#f59e0b',
    severityIndex: 1,
  },
  Moderate: {
    riskLevel: 'medium',
    riskLabel: 'Specialist Referral',
    referralRequired: true,
    referralNote: 'Referral to ophthalmologist within 1–3 months.',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    colorHex: '#f97316',
    severityIndex: 2,
  },
  Severe: {
    riskLevel: 'high',
    riskLabel: 'Urgent Referral',
    referralRequired: true,
    referralNote: 'Urgent ophthalmologist consultation within 1–2 weeks.',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    colorHex: '#ef4444',
    severityIndex: 3,
  },
  'Proliferative DR': {
    riskLevel: 'critical',
    riskLabel: 'Immediate Review',
    referralRequired: true,
    referralNote: 'Immediate specialist review required for sight preservation.',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    colorHex: '#a855f7',
    severityIndex: 4,
  },
};

export const getRiskMeta = (prediction) => {
  return RISK_CONFIG[prediction] || RISK_CONFIG['No DR'];
};
