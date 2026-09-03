import { createContext, useContext, useState, useEffect } from 'react';

const TRANSLATIONS = {
  en: {
    appName: 'RetinaAI',
    tagline: 'Diabetic Retinopathy Screening',
    dashboard: 'Dashboard',
    patients: 'Patients',
    newScreening: 'New Screening',
    screenings: 'Screenings',
    referrals: 'Referrals',
    camps: 'Screening Camps',
    analytics: 'Analytics',
    reports: 'Reports',
    assistant: 'AI Assistant',
    settings: 'Settings',
    searchPatient: 'Search by Name, Patient ID, or Phone...',
    uploadRetinalImage: 'Upload Retinal / Fundus Image',
    analyzeRetina: 'Analyze Retina with AI',
    prediction: 'AI Prediction',
    confidence: 'Model Confidence',
    imageQuality: 'Image Quality',
    riskLevel: 'Risk Level',
    createReferral: 'Create Referral',
    generateReport: 'Generate Clinical Report',
    medicalDisclaimer: 'AI-assisted screening result. Final diagnosis must be confirmed by a qualified ophthalmologist.',
    routine: 'Routine',
    followUp: 'Follow-up',
    urgent: 'Urgent',
    critical: 'Immediate Specialist Review',
  },
  hi: {
    appName: 'रेटिना एआई (RetinaAI)',
    tagline: 'डायबिटिक रेटिनोपैथी स्क्रीनिंग',
    dashboard: 'डैशबोर्ड',
    patients: 'मरीज़ (Patients)',
    newScreening: 'नई स्क्रीनिंग',
    screenings: 'स्क्रीनिंग रिकॉर्ड',
    referrals: 'रेफरल (Referrals)',
    camps: 'स्वास्थ्य शिविर (Camps)',
    analytics: 'एनालिटिक्स',
    reports: 'रिपोर्ट',
    assistant: 'एआई सहायक',
    settings: 'सेटिंग्स',
    searchPatient: 'नाम, मरीज़ आईडी या फोन से खोजें...',
    uploadRetinalImage: 'रेटिना / फंडस छवि अपलोड करें',
    analyzeRetina: 'एआई द्वारा रेटिना की जांच करें',
    prediction: 'एआई परिणाम',
    confidence: 'सटीकता विश्वास',
    imageQuality: 'छवि गुणवत्ता',
    riskLevel: 'जोखिम स्तर',
    createReferral: 'डॉक्टर को रेफर करें',
    generateReport: 'रिपोर्ट बनाएं',
    medicalDisclaimer: 'यह एआई-सहायक स्क्रीनिंग परिणाम है। अंतिम निदान केवल नेत्र विशेषज्ञ (ऑप्थल्मोलॉजिस्ट) द्वारा किया जाना चाहिए।',
    routine: 'सामान्य',
    followUp: 'अनुवर्ती जांच',
    urgent: 'तत्काल',
    critical: 'अति आवश्यक विशेषज्ञ परामर्श',
  },
  kn: {
    appName: 'ರೆಟಿನಾ ಎಐ (RetinaAI)',
    tagline: 'ಡಯಾಬಿಟಿಕ್ ರೆಟಿನೋಪತಿ ತಪಾಸಣೆ',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    patients: 'ರೋಗಿಗಳು (Patients)',
    newScreening: 'ಹೊಸ ತಪಾಸಣೆ',
    screenings: 'ತಪಾಸಣೆ ದಾಖಲೆಗಳು',
    referrals: 'ರೆಫರಲ್‌ಗಳು (Referrals)',
    camps: 'ಆರೋಗ್ಯ ಶಿಬಿರಗಳು',
    analytics: 'ವಿಶ್ಲೇಷಣೆ',
    reports: 'ವರದಿಗಳು',
    assistant: 'ಎಐ ಸಹಾಯಕ',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    searchPatient: 'ಹೆಸರು, ರೋಗಿ ಐಡಿ ಅಥವಾ ಫೋನ್ ಮೂಲಕ ಹುಡುಕಿ...',
    uploadRetinalImage: 'ರೆಟಿನಾ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    analyzeRetina: 'ಎಐ ಮೂಲಕ ರೆಟಿನಾ ವಿಶ್ಲೇಷಿಸಿ',
    prediction: 'ಎಐ ಫಲಿತಾಂಶ',
    confidence: 'ವಿಶ್ವಾಸಾರ್ಹತೆ',
    imageQuality: 'ಚಿತ್ರದ ಗುಣಮಟ್ಟ',
    riskLevel: 'ಅಪಾಯದ ಮಟ್ಟ',
    createReferral: 'ತಜ್ಞರಿಗೆ ಕಳುಹಿಸಿ',
    generateReport: 'ವರದಿ ತಯಾರಿಸಿ',
    medicalDisclaimer: 'ಇದು ಎಐ ಆಧಾರಿತ ತಪಾಸಣೆಯಾಗಿದೆ. ಅಂತಿಮ ರೋಗನಿರ್ಣಯವನ್ನು ನೇತ್ರ ತಜ್ಞರಿಂದ ದೃಢೀಕರಿಸಬೇಕು.',
    routine: 'ಸಾಮಾನ್ಯ',
    followUp: 'ಮುಂದಿನ ತಪಾಸಣೆ',
    urgent: 'ತುರ್ತು',
    critical: 'ತಕ್ಷಣದ ತಜ್ಞರ ಪರಿಶೀಲನೆ',
  },
  te: {
    appName: 'రెటీనా ఏఐ (RetinaAI)',
    tagline: 'డయాబెటిక్ రెటినోపతి స్క్రీనింగ్',
    dashboard: 'డాష్‌బోర్డ్',
    patients: 'రోగులు (Patients)',
    newScreening: 'కొత్త స్క్రీనింగ్',
    screenings: 'స్క్రీనింగ్ రికార్డులు',
    referrals: 'రిఫరల్స్',
    camps: 'ఆరోగ్య శిబిరాలు',
    analytics: 'విశ్లేషణలు',
    reports: 'రిపోర్టులు',
    assistant: 'ఏఐ అసిస్టెంట్',
    settings: 'సెట్టింగ్‌లు',
    searchPatient: 'పేరు, రోగి ఐడీ లేదా ఫోన్ ద్వారా వెతకండి...',
    uploadRetinalImage: 'రెటీనా చిత్రాన్ని అప్‌లోడ్ చేయండి',
    analyzeRetina: 'ఏఐ తో విశ్లేషించండి',
    prediction: 'ఏఐ ఫలితం',
    confidence: 'ఖచ్చితత్వ నమ్మకం',
    imageQuality: 'చిత్ర నాణ్యత',
    riskLevel: 'ప్రమాద స్థాయి',
    createReferral: 'స్పెషలిస్ట్‌కు రిఫర్ చేయండి',
    generateReport: 'రిపోర్ట్ రూపొందించండి',
    medicalDisclaimer: 'ఇది ఏఐ-సహాయక స్క్రీనింగ్ ఫలితం. తుది నిర్ధారణ కంటి వైద్యుడిచే ధృవీకరించబడాలి.',
    routine: 'సాధారణం',
    followUp: 'తదుపరి తనిఖీ',
    urgent: 'అత్యవసరం',
    critical: 'తక్షణ స్పెషలిస్ట్ సమీక్ష',
  },
  ta: {
    appName: 'ரெடினா ஏஐ (RetinaAI)',
    tagline: 'நீரிழிவு விழித்திரை பரிசோதனை',
    dashboard: 'டாஷ்போர்டு',
    patients: 'நோயாளிகள்',
    newScreening: 'புதிய பரிசோதனை',
    screenings: 'பரிசோதனைகள்',
    referrals: 'பரிந்துரைகள் (Referrals)',
    camps: 'மருத்துவ முகாம்கள்',
    analytics: 'பகுப்பாய்வு',
    reports: 'அறிக்கைகள்',
    assistant: 'ஏஐ உதவியாளர்',
    settings: 'அமைப்புகள்',
    searchPatient: 'பெயர், நோயாளி எண் அல்லது போன் மூலம் தேடுங்கள்...',
    uploadRetinalImage: 'விழித்திரை படத்தை பதிவேற்றவும்',
    analyzeRetina: 'ஏஐ மூலம் விழித்திரையை ஆராயுங்கள்',
    prediction: 'ஏஐ கணிப்பு',
    confidence: 'நம்பகத்தன்மை',
    imageQuality: 'படத்தின் தரம்',
    riskLevel: 'ஆபத்து நிலை',
    createReferral: 'மருத்துவருக்கு பரிந்துரைக்கவும்',
    generateReport: 'அறிக்கை உருவாக்கவும்',
    medicalDisclaimer: 'இது ஏஐ பரிசோதனை முடிவு மட்டுமே. கண் மருத்துவரிடம் உறுதிப்படுத்தப்பட வேண்டும்.',
    routine: 'வழக்கமான',
    followUp: 'தொடர் கண்காணிப்பு',
    urgent: 'அவசரம்',
    critical: 'உடனடி சிறப்பு மருத்துவர் பார்வை',
  },
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(
    () => localStorage.getItem('retina_lang') || 'en'
  );

  const changeLanguage = (langCode) => {
    if (TRANSLATIONS[langCode]) {
      setCurrentLang(langCode);
      localStorage.setItem('retina_lang', langCode);
    }
  };

  const t = (key) => {
    return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ currentLang, changeLanguage, t, languages: [
      { code: 'en', label: 'English', native: 'English' },
      { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
      { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
      { code: 'te', label: 'Telugu', native: 'తెలుగు' },
      { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    ] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
