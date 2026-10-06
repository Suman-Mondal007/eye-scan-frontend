/**
 * translations.js
 * Multi-language dictionary for English (en) and Bengali (bn / বাংলা)
 */

export const translations = {
  en: {
    // Brand & Header
    brandTitle: "OphthalmoScan",
    brandSubtitle: "Cataract Detection & Tele-Ophthalmology",
    backendOnline: "AI Backend 8000 Online",
    backendConnecting: "Connecting Model...",
    
    // Navigation
    navDashboard: "Dashboard",
    navNewScan: "New Patient Scan",
    navHistory: "Combined History",
    navClinics: "Eye Clinics",
    navProfile: "ASHA Profile",
    navSignIn: "ASHA Karmi Login / Sign Up",
    navSignOut: "Log Out",
    
    // Landing View Hero
    heroBadge1: "CNN Deep Learning v2.4",
    heroBadge2: "ASHA Karmi Diagnostic Portal",
    heroBadge3: "Pan-India District Support",
    heroTitle: "Intelligent Cataract Detection & Rural Eye Triage Platform",
    heroSubtitle: "Empowering ASHA Health Workers across all Indian districts with optical AI screening to detect cataracts early, prevent avoidable blindness, and automate surgical referrals in under 3 seconds.",
    heroCta: "Sign In / Register as ASHA Karmi",
    heroNotice: "Patient scanning requires authorized ASHA Karmi login to preserve diagnostic data integrity.",

    // Pipeline
    pipelineTitle: "Four-Step Community Screening Pipeline",
    pipelineSubtitle: "Designed for rapid triage in village outreach camps, sub-centres, and rural primary health posts.",
    step1Title: "ASHA Karmi Login",
    step1Desc: "Sign in with ASHA ID, affiliated PHC, state and district to activate the workstation.",
    step2Title: "Patient Demographic Intake",
    step2Desc: "Record patient identity, mobile, age, and select state & district from pan-India directory.",
    step3Title: "Optical Camera Capture",
    step3Desc: "Capture anterior eye photo using smartphone or USB macro camera with alignment guides.",
    step4Title: "AI Inference & PDF Referral",
    step4Desc: "CNN model generates instant cataract classification with confidence score and printable PDF report.",

    // Auth Form
    authSectionBadge: "ASHA KARMI AUTHENTICATION",
    authLoginTitle: "ASHA Karmi Sign In",
    authRegisterTitle: "Register New ASHA Karmi",
    authSubtitle: "Log in with your ASHA credentials or register your region to unlock the patient scanning workstation and referral dashboard.",
    portalLoginSubtitle: "Enter your registered details to access workstation",
    portalRegisterSubtitle: "Enter your clinical details & assigned district",
    tabSignIn: "ASHA Sign In",
    tabRegister: "Register ASHA Karmi",
    btnAutoFillDemo: "Auto-fill Demo ASHA Karmi Credentials",
    
    // Form Inputs
    labelFullName: "Full Name *",
    labelAshaId: "ASHA Worker ID *",
    labelHospital: "Sub-centre / PHC Hospital *",
    labelMobile: "Mobile Number *",
    labelState: "State / UT *",
    labelDistrict: "District *",
    labelVillage: "Gram Panchayat / Village / Ward",
    labelEmail: "Work Email *",
    labelPassword: "Password *",
    labelConfirmPassword: "Confirm Password *",
    labelSecurityCalc: "Security Verification",
    verifiedBadge: "Verified",
    btnSubmitLogin: "Sign In to Main Workstation",
    btnSubmitRegister: "Complete Registration & Open Dashboard",
    btnForgotPassword: "Forgot your password?",
    authenticating: "Authenticating...",

    // Platform Features
    feature1Title: "Pan-India District & Region Filtration",
    feature1Subtitle: "Centralized registry with localized jurisdictional controls",
    feature1Desc: "All ASHA workers record patient triage to a synchronised cloud database. Workers can filter combined history by State, District, or ASHA ID instantly.",
    feature1Bullet1: "All 28 States & 8 UTs: Complete district catalog pre-loaded.",
    feature1Bullet2: "One-Click 'My Region' Toggle: Instant filter matching assigned block.",
    feature1Bullet3: "Multi-Parameter Search: By name, phone, scan ID, or clinical risk.",

    feature2Title: "Ophthalmic Accuracy & Clinical Reports",
    feature2Subtitle: "Deep learning trained on anterior slit-lamp & diffuse ocular datasets",
    feature2Desc: "TensorFlow CNN evaluates crystalline cloudiness, distinguishing normal lenses from nuclear sclerosis, cortical opacity, and posterior subcapsular lesions in under 3 seconds.",
    feature2Bullet1: "Clinical PDF Referral: Ready-to-print with patient demographics.",
    feature2Bullet2: "Confidence & Severity Index: Mild → Moderate → Advanced grading.",
    feature2Bullet3: "Eye Clinic Directory: Government & free surgery centre locator.",

    // Cataract Types
    cataractTypesTitle: "Clinical Types Screened by the Model",
    cataractTypesSubtitle: "Primary pathologies identified during anterior optical examination",
    type1Title: "Nuclear Sclerosis",
    type1Badge: "High Prevalence",
    type1Desc: "Central lens nucleus discolouration causing amber-brown opacification and nearsighted shifts.",
    type2Title: "Cortical Cataract",
    type2Badge: "Peripheral",
    type2Desc: "White spoke-like opacities radiating inwards from the cortical edges, producing headlight glare.",
    type3Title: "Posterior Subcapsular",
    type3Badge: "Rapid Progression",
    type3Desc: "Beneath the posterior capsule on the visual axis. Common in diabetics and steroid users.",

    // Mission Banner
    missionTitle: "Empowering Grassroots ASHA Health Warriors",
    missionDesc: "Over 66% of preventable blindness in India is caused by untreated cataracts. By placing this AI tool in the hands of accredited ASHA workers, we eliminate long journeys for rural villagers and ensure prompt surgical referrals.",

    // Bot Strings
    botTitle: "NetraBot AI",
    botSubtitle: "Clinical & Data Copilot",
    botPlaceholder: "Ask stats, patient name, or medical question...",
    botChipStats: "📊 How many positive & negative?",
    botChipSearch: "🔍 Search patient records",
    botChipDistricts: "📍 District breakdown",
    botChipSurgical: "💡 Surgical advice for ASHA",
    botChipTriage: "⚡ Fast triage tips",
    botLiveTotal: "Total",
    botLivePos: "Pos",
    botLiveNeg: "Neg",
    botAskTooltip: "Ask NetraBot • Gemini AI"
  },

  bn: {
    // Brand & Header
    brandTitle: "অপথ্যালমোস্ক্যান",
    brandSubtitle: "ছানি শনাক্তকরণ ও টেলি-চক্ষুবিজ্ঞান",
    backendOnline: "এআই ব্যাকএন্ড ৮০০০ সক্রিয়",
    backendConnecting: "মডেল সংযোগ হচ্ছে...",
    
    // Navigation
    navDashboard: "ড্যাশবোর্ড",
    navNewScan: "নতুন রোগীর স্ক্যান",
    navHistory: "সম্মিলিত ইতিহাস",
    navClinics: "চক্ষু ক্লিনিক",
    navProfile: "আশা প্রোফাইল",
    navSignIn: "আশা কর্মী লগইন / নিবন্ধন",
    navSignOut: "লগআউট",

    // Landing View Hero
    heroBadge1: "সিএনএন ডিপ লার্নিং v2.4",
    heroBadge2: "আশা কর্মী ডায়াগনস্টিক পোর্টাল",
    heroBadge3: "সর্বভারতীয় জেলা সহায়তা",
    heroTitle: "বুদ্ধিমান ছানি শনাক্তকরণ ও গ্রামীণ চক্ষু ট্রায়াজ প্ল্যাটফর্ম",
    heroSubtitle: "ভারতের সকল জেলার আশা স্বাস্থ্যকর্মীদের অপটিক্যাল এআই স্ক্রিনিংয়ের মাধ্যমে দ্রুত ছানি শনাক্ত করা, অন্ধত্ব প্রতিরোধ করা এবং ৩ সেকেন্ডের মধ্যে অস্ত্রোপচারের রেফারেল তৈরি করা।",
    heroCta: "আশা কর্মী হিসেবে সাইন ইন / নিবন্ধন করুন",
    heroNotice: "ডায়াগনস্টিক তথ্যের নিরাপত্তা ও নির্ভুলতা বজায় রাখতে আশা কর্মী লগইন বাধ্যতামূলক।",

    // Pipeline
    pipelineTitle: "চার-ধাপের কমিউনিটি স্ক্রিনিং প্রক্রিয়া",
    pipelineSubtitle: "গ্রামের ক্যাম্প, উপ-স্বাস্থ্যকেন্দ্র ও প্রাথমিক স্বাস্থ্যকেন্দ্রে দ্রুত চক্ষু পরীক্ষার জন্য তৈরি।",
    step1Title: "১. আশা কর্মী লগইন",
    step1Desc: "ওয়ার্কস্টেশন সক্রিয় করতে আশা আইডি, সংশ্লিষ্ট স্বাস্থ্যকেন্দ্র ও জেলা দিয়ে লগইন করুন।",
    step2Title: "২. রোগীর তথ্য সংগ্রহ",
    step2Desc: "রোগীর নাম, বয়স, মোবাইল নম্বর এবং তালিকা থেকে রাজ্য ও জেলা নির্বাচন করুন।",
    step3Title: "৩. চোখের ছবি গ্রহণ",
    step3Desc: "স্মার্টফোন বা ইউএসবি ক্যামেরার মাধ্যমে চোখের সামনের অংশের স্পষ্ট ছবি তুলুন।",
    step4Title: "৪. এআই ফলাফল ও পিডিএফ রেফারেল",
    step4Desc: "এআই মডেল তাত্ক্ষণিকভাবে ছানির ধরন ও শতকরা নির্ভুলতাসহ প্রিন্টযোগ্য রিপোর্ট তৈরি করে।",

    // Auth Form
    authSectionBadge: "আশা কর্মী প্রমাণীকরণ",
    authLoginTitle: "আশা কর্মী সাইন ইন",
    authRegisterTitle: "নতুন আশা কর্মী নিবন্ধন",
    authSubtitle: "রোগী স্ক্রিনিং ওয়ার্কস্টেশন এবং রেফারেল ড্যাশবোর্ড ব্যবহারের জন্য আপনার বিবরণ দিন।",
    portalLoginSubtitle: "ওয়ার্কস্টেশনে প্রবেশ করতে আপনার নিবন্ধিত তথ্য দিন",
    portalRegisterSubtitle: "আপনার ক্লিনিকাল বিবরণ ও নির্ধারিত জেলা প্রদান করুন",
    tabSignIn: "আশা সাইন ইন",
    tabRegister: "আশা কর্মী নিবন্ধন",
    btnAutoFillDemo: "ডেমো আশা কর্মী তথ্য পূরণ করুন",

    // Form Inputs
    labelFullName: "সম্পূর্ণ নাম *",
    labelAshaId: "আশা কর্মী আইডি *",
    labelHospital: "উপ-স্বাস্থ্যকেন্দ্র / পিএইচসি হাসপাতাল *",
    labelMobile: "মোবাইল নম্বর *",
    labelState: "রাজ্য / কেন্দ্রশাসিত অঞ্চল *",
    labelDistrict: "জেলা *",
    labelVillage: "গ্রাম পঞ্চায়েত / গ্রাম / ওয়ার্ড",
    labelEmail: "অফিসিয়াল ইমেইল *",
    labelPassword: "পাসওয়ার্ড *",
    labelConfirmPassword: "পাসওয়ার্ড নিশ্চিত করুন *",
    labelSecurityCalc: "নিরাপত্তা যাচাইকরণ",
    verifiedBadge: "যাচাইকৃত",
    btnSubmitLogin: "প্রধান ওয়ার্কস্টেশনে সাইন ইন করুন",
    btnSubmitRegister: "নিবন্ধন সম্পন্ন করে ড্যাশবোর্ড খুলুন",
    btnForgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
    authenticating: "যাচাই করা হচ্ছে...",

    // Platform Features
    feature1Title: "সর্বভারতীয় জেলা ও আঞ্চলিক ফিল্টারিং",
    feature1Subtitle: "স্থানীয় প্রশাসনিক নিয়ন্ত্রণের সাথে কেন্দ্রীয় তথ্যভান্ডার",
    feature1Desc: "সকল আশা কর্মী ক্লাউড ডাটাবেসে রোগীর তথ্য সংরক্ষণ করেন। রাজ্য, জেলা বা আশা কর্মী আইডি দিয়ে মুহূর্তেই ইতিহাস ফিল্টার করা যায়।",
    feature1Bullet1: "২৮টি রাজ্য ও ৮টি কেন্দ্রশাসিত অঞ্চল: সম্পূর্ণ জেলা তালিকা যুক্ত।",
    feature1Bullet2: "এক ক্লিকে 'আমার অঞ্চল' ফিল্টার: নিজের এলাকার রোগীদের দেখার সুবিধা।",
    feature1Bullet3: "বহুমুখী অনুসন্ধান: নাম, ফোন নম্বর বা ঝুঁকি অনুযায়ী তাৎক্ষণিক সার্চ।",

    feature2Title: "চক্ষু চিকিৎসার নির্ভুলতা ও ক্লিনিকাল রিপোর্ট",
    feature2Subtitle: "হাজারো চোখের স্লিট-ল্যাম্প ইমেজের ওপর প্রশিক্ষিত ডিপ লার্নিং",
    feature2Desc: "টেনসরফ্লো সিএনএন মডেল চোখের লেন্সের ঘোলাটে ভাব বিশ্লেষণ করে ৩ সেকেন্ডের মধ্যে স্বাভাবিক ও ছানি আক্রান্ত চোখের পার্থক্য চিহ্নিত করে।",
    feature2Bullet1: "ক্লিনিকাল পিডিএফ রেফারেল: রোগীর তথ্যসহ তাৎক্ষণিক প্রিন্টযোগ্য কাগজ।",
    feature2Bullet2: "নির্ভুলতা ও তীব্রতা সূচক: মৃদু → মাঝারি → তীব্র ধাপ বিভাজন।",
    feature2Bullet3: "চক্ষু ক্লিনিক ডিরেক্টরি: নিকটস্থ সরকারি ও বিনামূল্যে অস্ত্রোপচার কেন্দ্র সন্ধান।",

    // Cataract Types
    cataractTypesTitle: "এআই মডেল দ্বারা চিহ্নিত ছানির প্রধান প্রকারভেদ",
    cataractTypesSubtitle: "চক্ষু পরীক্ষায় চিহ্নিত প্রধান প্যাথলজিক্যাল অবস্থা",
    type1Title: "নিউক্লিয়ার স্ক্লেরোসিস (Nuclear)",
    type1Badge: "সবচেয়ে বেশি দেখা যায়",
    type1Desc: "লেন্সের কেন্দ্রীয় অংশ শক্ত ও বাদামী হয়ে দৃষ্টিশক্তি ঘোলাটে করে তোলে।",
    type2Title: "কর্টিক্যাল ছানি (Cortical)",
    type2Badge: "লেন্সের প্রান্তে",
    type2Desc: "লেন্সের প্রান্তভাগ থেকে চাকার স্পোকের মতো সাদা দাগ তৈরি হয়ে আলোর ঝলকানি সৃষ্টি করে।",
    type3Title: "পোস্টেরিয়র সাবক্যাপসুলার (PSC)",
    type3Badge: "দ্রুত অগ্রগতি",
    type3Desc: "লেন্সের পেছনের স্তরে তৈরি হয়। ডায়াবেটিস রোগীদের ক্ষেত্রে বেশি দেখা যায়।",

    // Mission Banner
    missionTitle: "তৃণমূলের আশা স্বাস্থ্য যোদ্ধাদের ক্ষমতায়ন",
    missionDesc: "ভারতে প্রতিরোধযোগ্য অন্ধত্বের ৬৬%-এর বেশি ঘটে সঠিক সময়ে ছানি চিকিৎসা না হওয়ার কারণে। আশা কর্মীদের হাতে এই এআই প্রযুক্তি তুলে দিয়ে আমরা গ্রামীণ মানুষের চোখের আলো ফেরাতে কাজ করছি।",

    // Bot Strings
    botTitle: "নেত্রবট এআই",
    botSubtitle: "ক্লিনিকাল ও ডাটা সহকারী",
    botPlaceholder: "রোগীর তথ্য, পজিটিভ/নেগেটিভ সংখ্যা বা প্রশ্ন লিখুন...",
    botChipStats: "📊 কতজন পজিটিভ ও নেগেটিভ?",
    botChipSearch: "🔍 সাম্প্রতিক রোগী খুঁজুন",
    botChipDistricts: "📍 জেলাভিত্তিক পরিসংখ্যান",
    botChipSurgical: "💡 অস্ত্রোপচার সংক্রান্ত পরামর্শ",
    botChipTriage: "⚡ দ্রুত স্ক্রিনিংয়ের টিপস",
    botLiveTotal: "মোট",
    botLivePos: "পজিটিভ",
    botLiveNeg: "নেগেটিভ",
    botAskTooltip: "নেত্রবট এআই-কে জিজ্ঞাসা করুন"
  }
};
