'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export type Language = 'English' | 'मराठी' | 'हिंदी'

export const labels = {
  English: {
    dashboard: 'Dashboard',
    crop: 'Crop',
    quantity: 'Quantity',
    location: 'Location',
    markets: 'Markets',
    net: 'Net Return',
    recommendation: 'Recommendation',
    trends: 'Price Trends',
    sell: 'Sell Now',
    wait: 'Wait',
    offers: 'Buyer Offers',
    offline: 'Offline',
    cached: 'Cached Data',
    comparisonTag: 'Market comparison',
    comparisonTitlePrefix: 'Where should you sell your',
    comparisonSubtitlePrefix: 'Sorted by highest estimated net return for',
    comparisonSubtitleSuffix: 'quintals.',
    backToDashboard: '← Back to dashboard',
    bestNetReturn: 'Best net return',
    kmAway: 'km away',
    demandSuffix: 'DEMAND',
    priceLabel: 'Price',
    transportLabel: 'Transport',
    handlingLabel: 'Handling',
    netReturnLabel: 'Net return',
    viewDetails: 'View details →',
    sampleDataFooter: 'Sample / Historical Data · All values are estimates for prototype demonstration.',

    // marketplace.tsx
    buyerMarketplaceTag: 'Buyer marketplace',
    findBuyers: 'Find buyers',
    findBuyersSubtitle: 'Connect your produce with buyers offering competitive prices.',
    myOffers: 'My Offers',
    filterCrop: 'Crop',
    filterLocation: 'Location',
    minPrice: 'Minimum price',
    offerSubmittedTitle: 'Offer Submitted',
    pendingFarmerResponse: 'Pending Farmer Response',
    farmerDecisionsTag: 'Farmer decisions',
    buyerOffersTitle: 'Buyer offers',
    buyerOffersSubtitle: 'Review every detail and make the final decision.',
    findMoreBuyers: 'Find more buyers',
    currentContextTitle: 'Your current selling context',
    offerComparisonTitle: 'Offer comparison',

    // grading screen (marketplace.tsx)
    gradingTag: 'Quality grading',
    gradeThisProduce: 'Grade this produce',
    assignGrade: 'Assign quality grade',
    gradeALabel: 'Grade A · Premium',
    gradeANote: 'Minimal defects, uniform size/color.',
    gradeBLabel: 'Grade B · Standard',
    gradeBNote: 'Minor defects, market-acceptable.',
    gradeCLabel: 'Grade C · Below standard',
    gradeCNote: 'Visible defects or damage.',
    finalPriceLabel: 'Final price after grading (₹/quintal)',
    totalAtPricePrefix: 'Total at this price:',
    finalizeGradingBtn: 'Finalize Grading & Price',
    offerAcceptedTitle: 'Offer Accepted',
    offerAcceptedGradeNote: 'Buyer connection established in prototype. Next step: buyer grades quality and sets the final price.',
    gradeSetPriceBtn: 'Grade & Set Final Price',
    gradedByBuyerNote: 'Graded and priced by the buyer. Next step: arrange transport for the accepted quantity.',
    planTransportBtn: 'Plan Transport for This Offer',

    // logistics.tsx
    logisticsTag: 'Logistics',
    moveProduce: 'Move your produce',
    transportOptionsTag: 'Transport options',
    chooseTransport: 'Choose how to transport',
    schedulePickupTitle: 'Schedule pickup',
    pickupDateLabel: 'Pickup date',
    pickupTimeLabel: 'Pickup time',
    schedulePickupBtn: 'Schedule Pickup',

    // phase4.tsx
    accessKrishiSetu: 'Access KrishiSetu',

    // page.tsx Header + Recommendation
    startDemo: 'Start SIH Demo',
    backToComparison: '← Back to comparison',
    recommendationTag: 'KrishiSetu recommendation',
    sellAt: 'Sell at',
    marketSuffix: 'Market',
    highestReturnNote: 'Highest estimated net return after transport cost.',
    expectedPriceLabel: 'Expected price',
    estimatedTransportLabel: 'Estimated transport',
    expectedNetReturnLabel: 'Expected net return',
    whyLabel: 'Why?',
    impactBannerTag: 'Illustrative impact (sample cohort)',
    impactBannerBadge: 'Demo numbers — not measured yet',
    impactFarmersHelped: 'Farmers helped (demo cohort)',
    impactReturnLift: 'Avg. net return lift vs. nearest mandi',
    impactMarketsCompared: 'Markets compared per decision',
  },

  'मराठी': {
    dashboard: 'डॅशबोर्ड',
    crop: 'पीक',
    quantity: 'प्रमाण',
    location: 'ठिकाण',
    markets: 'बाजार',
    net: 'निव्वळ परतावा',
    recommendation: 'शिफारस',
    trends: 'किंमत कल',
    sell: 'आता विका',
    wait: 'थांबा',
    offers: 'खरेदीदार ऑफर',
    offline: 'ऑफलाइन',
    cached: 'कॅश केलेला डेटा',
    comparisonTag: 'बाजार तुलना',
    comparisonTitlePrefix: 'तुमचा',
    comparisonSubtitlePrefix: 'साठी सर्वाधिक अंदाजित निव्वळ परताव्यानुसार क्रमवारी',
    comparisonSubtitleSuffix: 'क्विंटल.',
    backToDashboard: '← डॅशबोर्डकडे परत जा',
    bestNetReturn: 'सर्वोत्तम निव्वळ परतावा',
    kmAway: 'किमी अंतर',
    demandSuffix: 'मागणी',
    priceLabel: 'किंमत',
    transportLabel: 'वाहतूक',
    handlingLabel: 'हाताळणी',
    netReturnLabel: 'निव्वळ परतावा',
    viewDetails: 'तपशील पहा →',
    sampleDataFooter: 'नमुना / ऐतिहासिक डेटा · सर्व मूल्ये प्रोटोटाइप प्रात्यक्षिकासाठी अंदाजित आहेत.',

    buyerMarketplaceTag: 'खरेदीदार बाजारपेठ',
    findBuyers: 'खरेदीदार शोधा',
    findBuyersSubtitle: 'स्पर्धात्मक किंमत देणाऱ्या खरेदीदारांशी तुमचा माल जोडा.',
    myOffers: 'माझ्या ऑफर',
    filterCrop: 'पीक',
    filterLocation: 'ठिकाण',
    minPrice: 'किमान किंमत',
    offerSubmittedTitle: 'ऑफर सादर केली',
    pendingFarmerResponse: 'शेतकऱ्याच्या प्रतिसादाच्या प्रतीक्षेत',
    farmerDecisionsTag: 'शेतकरी निर्णय',
    buyerOffersTitle: 'खरेदीदार ऑफर',
    buyerOffersSubtitle: 'प्रत्येक तपशील तपासा आणि अंतिम निर्णय घ्या.',
    findMoreBuyers: 'अधिक खरेदीदार शोधा',
    currentContextTitle: 'तुमचा सध्याचा विक्री संदर्भ',
    offerComparisonTitle: 'ऑफर तुलना',

    gradingTag: 'गुणवत्ता श्रेणीकरण',
    gradeThisProduce: 'या मालाचे श्रेणीकरण करा',
    assignGrade: 'गुणवत्ता श्रेणी नियुक्त करा',
    gradeALabel: 'श्रेणी अ · प्रीमियम',
    gradeANote: 'किमान दोष, एकसमान आकार/रंग.',
    gradeBLabel: 'श्रेणी ब · मानक',
    gradeBNote: 'किरकोळ दोष, बाजारात स्वीकार्य.',
    gradeCLabel: 'श्रेणी क · मानकाखाली',
    gradeCNote: 'स्पष्ट दोष किंवा नुकसान.',
    finalPriceLabel: 'श्रेणीकरणानंतरची अंतिम किंमत (₹/क्विंटल)',
    totalAtPricePrefix: 'या किंमतीत एकूण:',
    finalizeGradingBtn: 'श्रेणीकरण व किंमत निश्चित करा',
    offerAcceptedTitle: 'ऑफर स्वीकारली',
    offerAcceptedGradeNote: 'प्रोटोटाइपमध्ये खरेदीदार संपर्क स्थापित. पुढील पायरी: खरेदीदार गुणवत्तेचे श्रेणीकरण करून अंतिम किंमत ठरवेल.',
    gradeSetPriceBtn: 'श्रेणीकरण करा व अंतिम किंमत ठरवा',
    gradedByBuyerNote: 'खरेदीदाराने श्रेणीकरण व किंमत निश्चित केली. पुढील पायरी: स्वीकारलेल्या प्रमाणासाठी वाहतूक आयोजित करा.',
    planTransportBtn: 'या ऑफरसाठी वाहतूक आयोजित करा',

    logisticsTag: 'वाहतूक',
    moveProduce: 'तुमचा माल हलवा',
    transportOptionsTag: 'वाहतूक पर्याय',
    chooseTransport: 'वाहतूक कशी करायची निवडा',
    schedulePickupTitle: 'पिकअप वेळ ठरवा',
    pickupDateLabel: 'पिकअप तारीख',
    pickupTimeLabel: 'पिकअप वेळ',
    schedulePickupBtn: 'पिकअप ठरवा',

    accessKrishiSetu: 'कृषीसेतू वापरा',

    startDemo: 'SIH डेमो सुरू करा',
    backToComparison: '← तुलनेकडे परत जा',
    recommendationTag: 'कृषीसेतू शिफारस',
    sellAt: 'येथे विका:',
    marketSuffix: 'बाजार',
    highestReturnNote: 'वाहतूक खर्चानंतर सर्वाधिक अंदाजित निव्वळ परतावा.',
    expectedPriceLabel: 'अपेक्षित किंमत',
    estimatedTransportLabel: 'अंदाजित वाहतूक खर्च',
    expectedNetReturnLabel: 'अपेक्षित निव्वळ परतावा',
    whyLabel: 'का?',
    impactBannerTag: 'अंदाजित परिणाम (नमुना गट)',
    impactBannerBadge: 'डेमो आकडे — अजून मोजलेले नाही',
    impactFarmersHelped: 'मदत झालेले शेतकरी (डेमो गट)',
    impactReturnLift: 'जवळच्या बाजारापेक्षा सरासरी परतावा वाढ',
    impactMarketsCompared: 'प्रत्येक निर्णयासाठी तुलना केलेले बाजार',
  },

  'हिंदी': {
    dashboard: 'डैशबोर्ड',
    crop: 'फसल',
    quantity: 'मात्रा',
    location: 'स्थान',
    markets: 'बाज़ार',
    net: 'शुद्ध रिटर्न',
    recommendation: 'सिफारिश',
    trends: 'कीमत रुझान',
    sell: 'अभी बेचें',
    wait: 'प्रतीक्षा करें',
    offers: 'खरीदार ऑफर',
    offline: 'ऑफ़लाइन',
    cached: 'कैश डेटा',
    comparisonTag: 'बाज़ार तुलना',
    comparisonTitlePrefix: 'आप अपनी',
    comparisonSubtitlePrefix: 'के लिए सर्वाधिक अनुमानित शुद्ध रिटर्न के अनुसार क्रमबद्ध',
    comparisonSubtitleSuffix: 'क्विंटल.',
    backToDashboard: '← डैशबोर्ड पर वापस जाएं',
    bestNetReturn: 'सर्वश्रेष्ठ शुद्ध रिटर्न',
    kmAway: 'किमी दूर',
    demandSuffix: 'मांग',
    priceLabel: 'कीमत',
    transportLabel: 'परिवहन',
    handlingLabel: 'हैंडलिंग',
    netReturnLabel: 'शुद्ध रिटर्न',
    viewDetails: 'विवरण देखें →',
    sampleDataFooter: 'नमूना / ऐतिहासिक डेटा · सभी मान प्रोटोटाइप प्रदर्शन हेतु अनुमानित हैं।',

    buyerMarketplaceTag: 'खरीदार बाज़ार',
    findBuyers: 'खरीदार खोजें',
    findBuyersSubtitle: 'प्रतिस्पर्धी कीमत देने वाले खरीदारों से अपनी फसल जोड़ें।',
    myOffers: 'मेरी ऑफ़र',
    filterCrop: 'फसल',
    filterLocation: 'स्थान',
    minPrice: 'न्यूनतम कीमत',
    offerSubmittedTitle: 'ऑफ़र सबमिट हुई',
    pendingFarmerResponse: 'किसान की प्रतिक्रिया की प्रतीक्षा में',
    farmerDecisionsTag: 'किसान निर्णय',
    buyerOffersTitle: 'खरीदार ऑफ़र',
    buyerOffersSubtitle: 'हर विवरण देखें और अंतिम निर्णय लें।',
    findMoreBuyers: 'और खरीदार खोजें',
    currentContextTitle: 'आपका वर्तमान बिक्री संदर्भ',
    offerComparisonTitle: 'ऑफ़र तुलना',

    gradingTag: 'गुणवत्ता श्रेणीकरण',
    gradeThisProduce: 'इस फसल का श्रेणीकरण करें',
    assignGrade: 'गुणवत्ता श्रेणी निर्धारित करें',
    gradeALabel: 'श्रेणी A · प्रीमियम',
    gradeANote: 'न्यूनतम दोष, समान आकार/रंग।',
    gradeBLabel: 'श्रेणी B · मानक',
    gradeBNote: 'मामूली दोष, बाज़ार में स्वीकार्य।',
    gradeCLabel: 'श्रेणी C · मानक से नीचे',
    gradeCNote: 'स्पष्ट दोष या नुकसान।',
    finalPriceLabel: 'श्रेणीकरण के बाद अंतिम कीमत (₹/क्विंटल)',
    totalAtPricePrefix: 'इस कीमत पर कुल:',
    finalizeGradingBtn: 'श्रेणीकरण व कीमत सुनिश्चित करें',
    offerAcceptedTitle: 'ऑफ़र स्वीकृत',
    offerAcceptedGradeNote: 'प्रोटोटाइप में खरीदार संपर्क स्थापित। अगला चरण: खरीदार गुणवत्ता का श्रेणीकरण कर अंतिम कीमत तय करेगा।',
    gradeSetPriceBtn: 'श्रेणीकरण करें व अंतिम कीमत तय करें',
    gradedByBuyerNote: 'खरीदार द्वारा श्रेणीकरण व कीमत तय की गई। अगला चरण: स्वीकृत मात्रा के लिए परिवहन की व्यवस्था करें।',
    planTransportBtn: 'इस ऑफ़र के लिए परिवहन की योजना बनाएं',

    logisticsTag: 'लॉजिस्टिक्स',
    moveProduce: 'अपनी फसल भेजें',
    transportOptionsTag: 'परिवहन विकल्प',
    chooseTransport: 'परिवहन कैसे करें चुनें',
    schedulePickupTitle: 'पिकअप शेड्यूल करें',
    pickupDateLabel: 'पिकअप तारीख',
    pickupTimeLabel: 'पिकअप समय',
    schedulePickupBtn: 'पिकअप शेड्यूल करें',

    accessKrishiSetu: 'कृषीसेतु का उपयोग करें',

    startDemo: 'SIH डेमो शुरू करें',
    backToComparison: '← तुलना पर वापस जाएं',
    recommendationTag: 'कृषीसेतु सिफारिश',
    sellAt: 'यहां बेचें:',
    marketSuffix: 'बाज़ार',
    highestReturnNote: 'परिवहन लागत के बाद सबसे अधिक अनुमानित शुद्ध रिटर्न।',
    expectedPriceLabel: 'अनुमानित कीमत',
    estimatedTransportLabel: 'अनुमानित परिवहन लागत',
    expectedNetReturnLabel: 'अनुमानित शुद्ध रिटर्न',
    whyLabel: 'क्यों?',
    impactBannerTag: 'अनुमानित प्रभाव (नमूना समूह)',
    impactBannerBadge: 'डेमो आंकड़े — अभी मापे नहीं गए',
    impactFarmersHelped: 'मदद पाए किसान (डेमो समूह)',
    impactReturnLift: 'निकटतम मंडी की तुलना में औसत रिटर्न वृद्धि',
    impactMarketsCompared: 'प्रति निर्णय तुलना किए गए बाज़ार',
  },
} as const

export type Labels = { [K in keyof typeof labels.English]: string }

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: Labels
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('English')

  const value: LanguageContextValue = {
    language,
    setLanguage,
    t: labels[language],
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)

  if (!ctx) {
    throw new Error('useLanguage must be used inside <LanguageProvider>');
  }

  return ctx
}