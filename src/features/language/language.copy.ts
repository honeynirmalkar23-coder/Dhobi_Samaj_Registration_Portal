export type AppLanguage = "hi" | "en";

export const languageStorageKey = "dhobi-portal-language";

export const languageCopy = {
  hi: {
    app: {
      name: "धोबी समाज पंजीकरण पोर्टल",
      subtitle: "Dhobi Samaj Registration Portal",
      footerDescription: "समाज के सदस्यों के लिए सरल, सुरक्षित और डिजिटल पंजीकरण सुविधा।"
    },
    common: {
      closeLargeImage: "बड़ा चित्र बंद करें",
      english: "Eng",
      hindi: "हिंदी",
      languageToggleLabel: "भाषा बदलें",
      mainNavigation: "मुख्य नेविगेशन",
      mobileMainNavigation: "मोबाइल मुख्य नेविगेशन",
      mobileMenu: "मुख्य मेनू",
      nextImage: "अगला चित्र",
      openMobileMenu: "मोबाइल मेनू खोलें",
      previousImage: "पिछला चित्र",
      skipToContent: "मुख्य सामग्री पर जाएं",
      viewLargeImage: "बड़ा चित्र देखें"
    },
    navigation: {
      adminLogin: "प्रशासन लॉगिन",
      home: "होम",
      registration: "नया पंजीकरण",
      status: "पंजीकरण खोजें"
    },
    footer: {
      adminLogin: "प्रशासन लॉगिन",
      contactHeading: "संपर्क जानकारी",
      contactPlaceholder: "संपर्क: +91 7869806660",
      copyrightSuffix: "सभी अधिकार सुरक्षित।",
      portalInfoHeading: "पोर्टल जानकारी",
      privacyPlaceholder: "गोपनीयता सूचना आगामी चरण में जोड़ी जाएगी।",
      termsPlaceholder: "नियम एवं शर्तें आगामी चरण में जोड़ी जाएंगी।"
    },
    home: {
      metadataDescription: "धोबी समाज के सदस्यों के लिए डिजिटल पंजीकरण, भुगतान प्रमाण जमा करने और पंजीकरण स्थिति देखने की सरल सुविधा।",
      metadataTitle: "धोबी समाज पंजीकरण पोर्टल | डिजिटल सदस्य पंजीकरण",
      hero: {
        alt: "संत गाडगे बाबा",
        ctaRegistration: "नया पंजीकरण करें",
        ctaStatus: "पंजीकरण स्थिति देखें",
        eyebrow: "डिजिटल समाज सेवा की ओर एक कदम",
        privacy: "आपकी व्यक्तिगत जानकारी केवल पंजीकरण एवं प्रशासनिक सत्यापन के लिए उपयोग की जाएगी।",
        supportingText: "अपना विवरण दर्ज करें, पंजीकरण शुल्क का प्रमाण जमा करें और अपनी पंजीकरण स्थिति ऑनलाइन देखें।",
        tagline: "समाज के सदस्यों के लिए सरल, सुरक्षित और पारदर्शी डिजिटल पंजीकरण सुविधा।",
        titleLineOne: "धोबी समाज",
        titleLineTwo: "पंजीकरण पोर्टल"
      },
      search: {
        button: "स्थिति खोजें",
        description: "अपनी पंजीकरण आईडी दर्ज करके आवेदन और भुगतान सत्यापन की वर्तमान स्थिति देखें।",
        helperPrefix: "पंजीकरण आईडी का प्रारूप",
        helperSuffix: "होना चाहिए।",
        invalidId: "मान्य पंजीकरण आईडी दर्ज करें।",
        label: "पंजीकरण आईडी",
        placeholder: "उदाहरण: DS-2026-000001",
        privacyNote: "सार्वजनिक खोज में केवल सीमित स्थिति जानकारी दिखाई जाएगी।",
        title: "अपना पंजीकरण खोजें"
      },
      process: {
        description: "चार सरल चरणों में अपना डिजिटल पंजीकरण पूरा करें।",
        steps: [
          {
            description: "अपनी व्यक्तिगत, शैक्षणिक, पारिवारिक और पते की जानकारी दर्ज करें।",
            title: "विवरण भरें"
          },
          {
            description: "फॉर्म जमा होने के बाद आपको एक विशिष्ट पंजीकरण आईडी प्राप्त होगी।",
            title: "पंजीकरण आईडी प्राप्त करें"
          },
          {
            description: "प्रदर्शित QR कोड या UPI विवरण से भुगतान करके उसका स्क्रीनशॉट अपलोड करें।",
            title: "भुगतान प्रमाण जमा करें"
          },
          {
            description: "पावती डाउनलोड करें और पंजीकरण आईडी से सत्यापन की स्थिति देखें।",
            title: "पावती और स्थिति प्राप्त करें"
          }
        ],
        title: "पंजीकरण कैसे पूरा करें?"
      },
      about: {
        alt: "सामुदायिक धुलाई कार्य का एक दृश्य",
        features: [
          "सरल और मोबाइल-अनुकूल पंजीकरण",
          "सुरक्षित जानकारी और सीमित सार्वजनिक प्रदर्शन",
          "प्रशासनिक समीक्षा और भुगतान सत्यापन"
        ],
        paragraphs: [
          "यह पोर्टल समाज के सदस्यों की जानकारी को व्यवस्थित रूप से एकत्रित करने, पंजीकरण प्रक्रिया को सरल बनाने और प्रशासनिक सत्यापन को पारदर्शी बनाने के उद्देश्य से तैयार किया जा रहा है।",
          "डिजिटल व्यवस्था के माध्यम से सदस्य अपनी पंजीकरण आईडी सुरक्षित रख सकते हैं, आवेदन की स्थिति देख सकते हैं और प्रशासन के साथ आवश्यक जानकारी साझा कर सकते हैं।"
        ],
        title: "हमारे समाज के लिए डिजिटल पंजीकरण"
      },
      inspiration: {
        cards: [
          {
            alt: "एक प्रेरणादायक वरिष्ठ व्यक्तित्व का चित्र",
            description: "समाज के वरिष्ठ और प्रेरणादायक व्यक्तित्व नई पीढ़ी को परिश्रम, अनुशासन और सामाजिक दायित्व का संदेश देते हैं।",
            title: "प्रेरणादायक व्यक्तित्व"
          },
          {
            alt: "मानवीय सेवा दर्शाने वाली एक कलात्मक छवि",
            description: "सामुदायिक सेवा का उद्देश्य सम्मान, सहयोग और जरूरतमंद लोगों की सहायता की भावना को आगे बढ़ाना है।",
            title: "सेवा और मानवीय संवेदना"
          }
        ],
        description: "हमारी सामुदायिक विरासत परिश्रम, आत्मसम्मान, शिक्षा, सेवा और सामाजिक सहयोग के मूल्यों से जुड़ी है।",
        title: "समाज सेवा, परिश्रम और प्रेरणा"
      },
      education: {
        images: [
          {
            alt: "शिक्षा का संदेश दर्शाती छवि",
            caption: "शिक्षा का संदेश"
          },
          {
            alt: "शिक्षा से समाज सशक्तिकरण का संदेश दर्शाती छवि",
            caption: "शिक्षा से समाज का सशक्तिकरण"
          }
        ],
        lightboxTitle: "शिक्षा का संदेश",
        note: "पोर्टल में शैक्षणिक जानकारी शामिल करने का उद्देश्य समाज की शिक्षा संबंधी स्थिति को बेहतर ढंग से समझना और भविष्य में उपयोगी सामाजिक एवं शैक्षणिक योजनाओं के लिए आधार तैयार करना है।",
        description: "शिक्षा परिवार, समाज और आने वाली पीढ़ियों के बेहतर भविष्य की नींव है।",
        title: "शिक्षा से समाज का सशक्तिकरण"
      },
      gallery: {
        images: [
          {
            alt: "सामुदायिक जीवन की एक ऐतिहासिक झलक",
            caption: "सामुदायिक जीवन की एक ऐतिहासिक झलक"
          },
          {
            alt: "संत गाडगे बाबा का चित्र",
            caption: "संत गाडगे बाबा",
            description: "खास जानकारी: संत गाडगे बाबा (जन्म: शेंडगाँव ता-दरियापुर जिला-अमरावती 23 फरवरी 1876; मृत्यु - 20 दिसंबर 1956 वलगाँव के पास अमरावती) को महाराष्ट्र राज्य में \"गाडगे बाबा\" के रूप में जाना जाता है। कीर्तनकार, संत और समाज सुधारक। उन्होंने स्वेच्छा से निर्धन जीवन स्वीकार किया था। वह सामाजिक न्याय देने के लिए अलग-अलग गांवों में घूमते थे। गाडगे महाराज की सामाजिक न्याय, सुधार और स्वच्छता में बहुत रुचि थी। 20वीं शताब्दी के सामाजिक सुधार आंदोलनों में शामिल महान पुरुषों में से एक गाडगे बाबा हैं।",
            source: "स्रोत: विकिपीडिया"
          },
          {
            alt: "सेवा और मानवीय संवाद का दृश्य",
            caption: "सेवा और मानवीय संवाद का दृश्य"
          },
          {
            alt: "माता नतिन धोबिन दाई का चित्र",
            caption: "माता नतिन धोबिन दाई"
          }
        ],
        lightboxTitle: "समाज की विरासत और स्मृतियां",
        notes: [
          "नोट: चित्रों से संबंधित नाम, स्थान और ऐतिहासिक विवरण प्रशासन द्वारा सत्यापन के बाद जोड़े जाएंगे।",
          "चित्रों के प्रकाशन और उपयोग के अधिकार प्रशासन द्वारा सत्यापित किए जाएंगे।"
        ],
        description: "ये चित्र सामुदायिक जीवन, सेवा, परिश्रम और ऐतिहासिक स्मृतियों की झलक प्रस्तुत करते हैं।",
        title: "समाज की विरासत और स्मृतियां"
      },
      privacy: {
        cards: [
          {
            text: "पता, फोटो और भुगतान प्रमाण जैसी संवेदनशील जानकारी सार्वजनिक रूप से प्रदर्शित नहीं की जाएगी।",
            title: "व्यक्तिगत जानकारी की सुरक्षा"
          },
          {
            text: "स्क्रीनशॉट जमा करना भुगतान की अंतिम पुष्टि नहीं है। भुगतान का सत्यापन प्रशासन द्वारा किया जाएगा।",
            title: "प्रशासनिक भुगतान सत्यापन"
          },
          {
            text: "पंजीकरण आईडी से केवल सीमित और गोपनीयता-सुरक्षित स्थिति जानकारी दिखाई जाएगी।",
            title: "पंजीकरण स्थिति की जानकारी"
          }
        ],
        title: "सुरक्षित और पारदर्शी प्रक्रिया"
      },
      cta: {
        description: "आवश्यक जानकारी तैयार रखें और कुछ सरल चरणों में अपना पंजीकरण पूरा करें।",
        registrationButton: "नया पंजीकरण करें",
        statusButton: "पंजीकरण खोजें",
        note: "पंजीकरण शुरू करने से पहले अपना फोटो और आवश्यक व्यक्तिगत जानकारी तैयार रखें।",
        title: "आज ही अपना डिजिटल पंजीकरण शुरू करें"
      }
    },
    admin: {
      administration: "प्रशासन",
      auditLogs: "ऑडिट लॉग",
      dashboard: "डैशबोर्ड",
      logout: "लॉगआउट",
      logoutLoading: "लॉगआउट…",
      menu: "प्रशासन मेनू",
      openMenu: "प्रशासन मेनू खोलें",
      paymentSettings: "भुगतान सेटिंग्स",
      profile: "प्रशासन प्रोफाइल",
      registrations: "सभी पंजीकरण",
      registrationDetail: "पंजीकरण विवरण",
      returnToPortal: "पोर्टल पर वापस जाएं"
    }
  },
  en: {
    app: {
      name: "Dhobi Samaj Registration Portal",
      subtitle: "धोबी समाज पंजीकरण पोर्टल",
      footerDescription: "A simple, secure and digital registration service for community members."
    },
    common: {
      closeLargeImage: "Close large image",
      english: "Eng",
      hindi: "हिंदी",
      languageToggleLabel: "Change language",
      mainNavigation: "Main navigation",
      mobileMainNavigation: "Mobile main navigation",
      mobileMenu: "Main menu",
      nextImage: "Next image",
      openMobileMenu: "Open mobile menu",
      previousImage: "Previous image",
      skipToContent: "Skip to main content",
      viewLargeImage: "View larger image"
    },
    navigation: {
      adminLogin: "Admin login",
      home: "Home",
      registration: "New registration",
      status: "Find registration"
    },
    footer: {
      adminLogin: "Admin login",
      contactHeading: "Contact information",
      contactPlaceholder: "Contact: +91 7869806660",
      copyrightSuffix: "All rights reserved.",
      portalInfoHeading: "Portal information",
      privacyPlaceholder: "Privacy notice will be added later.",
      termsPlaceholder: "Terms and conditions will be added later."
    },
    home: {
      metadataDescription: "A simple way for Dhobi Samaj members to register digitally, submit payment proof and check registration status.",
      metadataTitle: "Dhobi Samaj Registration Portal | Digital Member Registration",
      hero: {
        alt: "Sant Gadge Baba",
        ctaRegistration: "Start registration",
        ctaStatus: "Check registration status",
        eyebrow: "One step toward digital community service",
        privacy: "Your personal information will be used only for registration and administrative verification.",
        supportingText: "Enter your details, submit registration-fee proof and track your registration status online.",
        tagline: "A simple, secure and transparent digital registration service for community members.",
        titleLineOne: "Dhobi Samaj",
        titleLineTwo: "Registration Portal"
      },
      search: {
        button: "Search status",
        description: "Enter your registration ID to check the current application and payment-verification status.",
        helperPrefix: "Registration ID format should be",
        helperSuffix: "",
        invalidId: "Enter a valid registration ID.",
        label: "Registration ID",
        placeholder: "Example: DS-2026-000001",
        privacyNote: "Only limited status information will be shown in public search.",
        title: "Find your registration"
      },
      process: {
        description: "Complete your digital registration in four simple steps.",
        steps: [
          {
            description: "Enter your personal, education, family and address information.",
            title: "Fill details"
          },
          {
            description: "After the form is submitted, you will receive a unique registration ID.",
            title: "Receive registration ID"
          },
          {
            description: "Pay using the displayed QR code or UPI details and upload the screenshot.",
            title: "Submit payment proof"
          },
          {
            description: "Download the acknowledgement and check verification status with your registration ID.",
            title: "Get acknowledgement and status"
          }
        ],
        title: "How to complete registration"
      },
      about: {
        alt: "A community washing-work scene",
        features: [
          "Simple, mobile-friendly registration",
          "Secure information with limited public display",
          "Administrative review and payment verification"
        ],
        paragraphs: [
          "This portal is being built to collect community-member information in an organized way, simplify registration and make administrative verification transparent.",
          "Through the digital system, members can keep their registration ID safely, check application status and share required information with administrators."
        ],
        title: "Digital registration for our community"
      },
      inspiration: {
        cards: [
          {
            alt: "Portrait of an inspiring elder personality",
            description: "Senior and inspiring personalities of the community guide the next generation toward hard work, discipline and social responsibility.",
            title: "Inspiring personalities"
          },
          {
            alt: "An artistic image showing humanitarian service",
            description: "Community service carries forward dignity, cooperation and the spirit of helping people in need.",
            title: "Service and human sensitivity"
          }
        ],
        description: "Our community heritage is connected with hard work, self-respect, education, service and social cooperation.",
        title: "Service, hard work and inspiration"
      },
      education: {
        images: [
          {
            alt: "Image showing an education message",
            caption: "Message of education"
          },
          {
            alt: "Image showing education and community empowerment",
            caption: "Community empowerment through education"
          }
        ],
        lightboxTitle: "Message of education",
        note: "Including education information in the portal helps understand the community's education status and prepare a foundation for useful social and educational plans in the future.",
        description: "Education is the foundation for a better future for families, society and coming generations.",
        title: "Community empowerment through education"
      },
      gallery: {
        images: [
          {
            alt: "A historical glimpse of community life",
            caption: "A historical glimpse of community life"
          },
          {
            alt: "Portrait of Sant Gadge Baba",
            caption: "Sant Gadge Baba",
            description: "Special information: Sant Gadge Baba (born: Shendgaon, Taluka Daryapur, District Amravati, 23 February 1876; died: 20 December 1956 near Walgaon, Amravati) is known in Maharashtra as \"Gadge Baba\". He was a kirtankar, saint and social reformer. He voluntarily accepted a life of poverty. He travelled from village to village to promote social justice. Gadge Maharaj had a deep interest in social justice, reform and cleanliness. Gadge Baba is one of the great figures associated with the social reform movements of the 20th century.",
            source: "Source: Wikipedia"
          },
          {
            alt: "A scene of service and human connection",
            caption: "A scene of service and human connection"
          },
          {
            alt: "Image of Mata Natin Dhobin Dai",
            caption: "Mata Natin Dhobin Dai"
          }
        ],
        lightboxTitle: "Community heritage and memories",
        notes: [
          "Note: Names, places and historical details related to images will be added after administrative verification.",
          "Publication and usage rights for images will be verified by administration."
        ],
        description: "These images present glimpses of community life, service, hard work and historical memories.",
        title: "Community heritage and memories"
      },
      privacy: {
        cards: [
          {
            text: "Sensitive information such as address, photo and payment proof will not be displayed publicly.",
            title: "Personal information protection"
          },
          {
            text: "Submitting a screenshot is not final payment confirmation. Payment will be verified by administration.",
            title: "Administrative payment verification"
          },
          {
            text: "Only limited, privacy-safe status information will be shown with a registration ID.",
            title: "Registration status information"
          }
        ],
        title: "Secure and transparent process"
      },
      cta: {
        description: "Keep the required information ready and complete your registration in a few simple steps.",
        registrationButton: "Start registration",
        statusButton: "Find registration",
        note: "Keep your photo and required personal information ready before starting registration.",
        title: "Start your digital registration today"
      }
    },
    admin: {
      administration: "Administration",
      auditLogs: "Audit logs",
      dashboard: "Dashboard",
      logout: "Logout",
      logoutLoading: "Logging out…",
      menu: "Admin menu",
      openMenu: "Open admin menu",
      paymentSettings: "Payment Settings",
      profile: "Admin Profile",
      registrations: "All registrations",
      registrationDetail: "Registration details",
      returnToPortal: "Go back to the portal"
    }
  }
} as const;
