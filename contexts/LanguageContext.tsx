import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (code: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
  languages: Language[];
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

// Supported languages
const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'ha',
    name: 'Hausa',
    nativeName: 'Hausa',
    flag: '🇳🇬'
  },
  {
    code: 'yo',
    name: 'Yoruba',
    nativeName: 'Yorùbá',
    flag: '🇳🇬'
  },
  {
    code: 'ig',
    name: 'Igbo',
    nativeName: 'Igbo',
    flag: '🇳🇬'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷'
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    rtl: true
  }
];

// Translation keys and their values
const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.programs': 'Programs',
    'nav.facilities': 'Facilities',
    'nav.admissions': 'Admissions',
    'nav.contact': 'Contact',
    'nav.apply': 'Apply Now',
    'nav.tour': 'Virtual Tour',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success!',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.submit': 'Submit',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.close': 'Close',
    'common.view': 'View',
    'common.download': 'Download',

    // Admission Form
    'admission.title': 'Admission Application',
    'admission.student_info': 'Student Information',
    'admission.parent_info': 'Parent/Guardian Information',
    'admission.application_details': 'Application Details',
    'admission.documents': 'Required Documents',
    'admission.first_name': 'First Name',
    'admission.last_name': 'Last Name',
    'admission.middle_name': 'Middle Name',
    'admission.date_of_birth': 'Date of Birth',
    'admission.gender': 'Gender',
    'admission.male': 'Male',
    'admission.female': 'Female',
    'admission.class_applying': 'Class Applying For',
    'admission.nationality': 'Nationality',
    'admission.state_of_origin': 'State of Origin',
    'admission.religion': 'Religion',
    'admission.blood_group': 'Blood Group',
    'admission.medical_conditions': 'Medical Conditions',
    'admission.previous_school': 'Previous School',
    'admission.parent_title': 'Title',
    'admission.parent_relationship': 'Relationship to Student',
    'admission.father': 'Father',
    'admission.mother': 'Mother',
    'admission.guardian': 'Guardian',
    'admission.occupation': 'Occupation',
    'admission.employer': 'Employer',
    'admission.phone': 'Phone Number',
    'admission.email': 'Email Address',
    'admission.address': 'Home Address',
    'admission.preferred_start_date': 'Preferred Start Date',
    'admission.how_did_you_hear': 'How did you hear about us?',
    'admission.reason_for_application': 'Why do you want your child to attend our school?',
    'admission.special_needs': 'Does your child have special educational needs?',
    'admission.birth_certificate': 'Birth Certificate',
    'admission.passport_photos': 'Passport Photographs',
    'admission.school_records': 'Previous School Records',
    'admission.medical_records': 'Medical Records',
    'admission.parent_id': 'Parent/Guardian ID',
    'admission.submit_application': 'Submit Application',
    'admission.application_submitted': 'Application submitted successfully!',

    // School Information
    'school.welcome': 'Welcome to {{schoolName}}',
    'school.about_title': 'About {{schoolName}}',
    'school.programs_title': 'Our Academic Programs',
    'school.facilities_title': 'World-Class Facilities',
    'school.testimonials_title': 'What Parents Say',
    'school.contact_title': 'Get in Touch',
    'school.students': 'Students',
    'school.teachers': 'Teachers',
    'school.years_excellence': 'Years of Excellence',
    'school.graduation_rate': 'Graduation Rate',
    'school.age_range': 'Age Range',
    'school.duration': 'Duration',
    'school.tuition_fee': 'Tuition Fee',

    // Payment
    'payment.title': 'Payment',
    'payment.summary': 'Payment Summary',
    'payment.amount': 'Amount',
    'payment.description': 'Description',
    'payment.applicant': 'Applicant',
    'payment.select_method': 'Select Payment Method',
    'payment.card_details': 'Card Details',
    'payment.card_number': 'Card Number',
    'payment.expiry_date': 'Expiry Date',
    'payment.cvv': 'CVV',
    'payment.cardholder_name': 'Cardholder Name',
    'payment.processing': 'Processing...',
    'payment.pay_now': 'Pay Now',
    'payment.secure_notice': 'Your payment information is encrypted and secure.',

    // Interview
    'interview.title': 'Schedule Interview',
    'interview.select_date': 'Select Interview Date',
    'interview.select_time': 'Select Time',
    'interview.interviewer': 'Interviewer',
    'interview.location': 'Location',
    'interview.duration': 'Duration',
    'interview.guidelines': 'Interview Guidelines',
    'interview.arrive_early': 'Please arrive 10 minutes before your scheduled time',
    'interview.bring_documents': 'Bring original copies of all submitted documents',
    'interview.both_attend': 'Both parent and student should attend the interview',
    'interview.schedule': 'Schedule Interview',
    'interview.scheduled': 'Interview scheduled successfully!',

    // Status
    'status.submitted': 'Submitted',
    'status.under_review': 'Under Review',
    'status.interview_scheduled': 'Interview Scheduled',
    'status.accepted': 'Accepted',
    'status.rejected': 'Rejected',
    'status.waitlisted': 'Waitlisted',

    // Virtual Tour
    'tour.title': 'Virtual Tour',
    'tour.guided': 'Guided Tour',
    'tour.self_guided': 'Self-Guided',
    'tour.play': 'Play',
    'tour.pause': 'Pause',
    'tour.next': 'Next',
    'tour.previous': 'Previous',
    'tour.hotspots': 'Hotspots',
    'tour.audio_guide': 'Audio Guide',
    'tour.exit': 'Exit Tour'
  },

  ha: {
    // Navigation
    'nav.home': 'Gida',
    'nav.about': 'Game da mu',
    'nav.programs': 'Shirye-shirye',
    'nav.facilities': 'Kayayyaki',
    'nav.admissions': 'Shigar da ɗalibai',
    'nav.contact': 'Tuntuɓe mu',
    'nav.apply': 'Nemi yanzu',
    'nav.tour': 'Yawon shakatawa',

    // Common
    'common.loading': 'Ana lodawa...',
    'common.error': 'Kuskure ya faru',
    'common.success': 'Nasara!',
    'common.cancel': 'Soke',
    'common.save': 'Ajiye',
    'common.edit': 'Gyara',
    'common.delete': 'Share',
    'common.submit': 'Tura',
    'common.next': 'Na gaba',
    'common.previous': 'Na baya',
    'common.close': 'Rufe',
    'common.view': 'Duba',
    'common.download': 'Sauke',

    // Admission Form
    'admission.title': 'Takardar neman shiga makaranta',
    'admission.student_info': 'Bayanan ɗalibi',
    'admission.parent_info': 'Bayanan iyaye/mai kula',
    'admission.application_details': 'Cikakkun bayanai',
    'admission.documents': 'Takardun da ake bukata',
    'admission.first_name': 'Suna na farko',
    'admission.last_name': 'Suna na ƙarshe',
    'admission.middle_name': 'Suna na tsakiya',
    'admission.date_of_birth': 'Ranar haihuwa',
    'admission.gender': 'Jinsi',
    'admission.male': 'Namiji',
    'admission.female': 'Mace',
    'admission.class_applying': 'Ajin da ake nema',
    'admission.nationality': 'Ƙasa',
    'admission.state_of_origin': 'Jihar asali',
    'admission.religion': 'Addini',
    'admission.blood_group': 'Nau\'in jini',
    'admission.medical_conditions': 'Yanayin lafiya',
    'admission.previous_school': 'Makarantar da ya fita',

    // School Information
    'school.welcome': 'Maraba da zuwa {{schoolName}}',
    'school.about_title': 'Game da {{schoolName}}',
    'school.programs_title': 'Shirye-shiryenmu na ilimi',
    'school.facilities_title': 'Kayayyaki masu kyau',
    'school.testimonials_title': 'Abin da iyaye suke faɗa',
    'school.contact_title': 'Tuntuɓe mu',
    'school.students': 'Ɗalibai',
    'school.teachers': 'Malamai',
    'school.years_excellence': 'Shekarun nagarta',
    'school.graduation_rate': 'Yawan masu kammala karatun'
  },

  yo: {
    // Navigation
    'nav.home': 'Ile',
    'nav.about': 'Nipa wa',
    'nav.programs': 'Awọn eto',
    'nav.facilities': 'Awọn ohun elo',
    'nav.admissions': 'Gbigba wọle',
    'nav.contact': 'Kan si wa',
    'nav.apply': 'Beere bayi',
    'nav.tour': 'Irin-ajo foju',

    // Common
    'common.loading': 'N gbe...',
    'common.error': 'Aṣiṣe kan waye',
    'common.success': 'Aṣeyọri!',
    'common.cancel': 'Fagilee',
    'common.save': 'Fi pamọ',
    'common.edit': 'Ṣatunkọ',
    'common.delete': 'Paarẹ',
    'common.submit': 'Fi silẹ',
    'common.next': 'Tókàn',
    'common.previous': 'Tẹlẹ',
    'common.close': 'Ti',
    'common.view': 'Wo',
    'common.download': 'Gba silẹ',

    // Admission Form
    'admission.title': 'Iwe ibeere wiwọle',
    'admission.student_info': 'Alaye ọmọ ile-iwe',
    'admission.parent_info': 'Alaye obi/olutọju',
    'admission.application_details': 'Awọn alaye ibeere',
    'admission.documents': 'Awọn iwe to nilo',
    'admission.first_name': 'Orukọ akọkọ',
    'admission.last_name': 'Orukọ idile',
    'admission.middle_name': 'Orukọ aarin',
    'admission.date_of_birth': 'Ọjọ ibi',
    'admission.gender': 'Abo',
    'admission.male': 'Ọkunrin',
    'admission.female': 'Obinrin',
    'admission.class_applying': 'Kilasi ti o beere',
    'admission.nationality': 'Orilẹ-ede',
    'admission.state_of_origin': 'Ipinlẹ ibi',
    'admission.religion': 'Esin',
    'admission.blood_group': 'Iru ẹjẹ',
    'admission.medical_conditions': 'Ipo ilera',
    'admission.previous_school': 'Ile-iwe iṣaaju',

    // School Information
    'school.welcome': 'Kaabo si {{schoolName}}',
    'school.about_title': 'Nipa {{schoolName}}',
    'school.programs_title': 'Awọn eto ẹkọ wa',
    'school.facilities_title': 'Awọn ohun elo to dara',
    'school.testimonials_title': 'Ohun ti awọn obi sọ',
    'school.contact_title': 'Kan si wa',
    'school.students': 'Awọn ọmọ ile-iwe',
    'school.teachers': 'Awọn olukọ',
    'school.years_excellence': 'Ọdun didara',
    'school.graduation_rate': 'Oṣuwọn ipari'
  },

  ig: {
    // Navigation
    'nav.home': 'Ụlọ',
    'nav.about': 'Maka anyị',
    'nav.programs': 'Mmemme',
    'nav.facilities': 'Akụrụngwa',
    'nav.admissions': 'Nnabata',
    'nav.contact': 'Kpọtụrụ anyị',
    'nav.apply': 'Tinye akwụkwọ ugbu a',
    'nav.tour': 'Nleta anya',

    // Common
    'common.loading': 'Na-ebu...',
    'common.error': 'Njehie mere',
    'common.success': 'Ihe ọma!',
    'common.cancel': 'Kagbuo',
    'common.save': 'Chekwaa',
    'common.edit': 'Dezie',
    'common.delete': 'Hichapụ',
    'common.submit': 'Ziga',
    'common.next': 'Ọzọ',
    'common.previous': 'Nke gara aga',
    'common.close': 'Mechie',
    'common.view': 'Lee',
    'common.download': 'Budata',

    // Admission Form
    'admission.title': 'Akwụkwọ arịrịọ nnabata',
    'admission.student_info': 'Ozi nwa akwụkwọ',
    'admission.parent_info': 'Ozi nne na nna/onye nlekọta',
    'admission.application_details': 'Nkọwa arịrịọ',
    'admission.documents': 'Akwụkwọ ndị achọrọ',
    'admission.first_name': 'Aha mbụ',
    'admission.last_name': 'Aha ikpeazụ',
    'admission.middle_name': 'Aha etiti',
    'admission.date_of_birth': 'Ụbọchị ọmụmụ',
    'admission.gender': 'Okike',
    'admission.male': 'Nwoke',
    'admission.female': 'Nwanyị',
    'admission.class_applying': 'Klaasị ị na-arịọ',
    'admission.nationality': 'Mba',
    'admission.state_of_origin': 'Steeti ọmụmụ',
    'admission.religion': 'Okpukpe',
    'admission.blood_group': 'Ụdị ọbara',
    'admission.medical_conditions': 'Ọnọdụ ahụike',
    'admission.previous_school': 'Ụlọ akwụkwọ gara aga',

    // School Information
    'school.welcome': 'Nnọọ na {{schoolName}}',
    'school.about_title': 'Maka {{schoolName}}',
    'school.programs_title': 'Mmemme mmụta anyị',
    'school.facilities_title': 'Akụrụngwa dị mma',
    'school.testimonials_title': 'Ihe ndị nne na nna kwuru',
    'school.contact_title': 'Kpọtụrụ anyị',
    'school.students': 'Ụmụ akwụkwọ',
    'school.teachers': 'Ndị nkuzi',
    'school.years_excellence': 'Afọ nke ịdị mma',
    'school.graduation_rate': 'Ọnụọgụ mmecha'
  },

  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.about': 'À propos',
    'nav.programs': 'Programmes',
    'nav.facilities': 'Installations',
    'nav.admissions': 'Admissions',
    'nav.contact': 'Contact',
    'nav.apply': 'Postuler maintenant',
    'nav.tour': 'Visite virtuelle',

    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Une erreur s\'est produite',
    'common.success': 'Succès!',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.submit': 'Soumettre',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    'common.close': 'Fermer',
    'common.view': 'Voir',
    'common.download': 'Télécharger',

    // Admission Form
    'admission.title': 'Demande d\'admission',
    'admission.student_info': 'Informations sur l\'étudiant',
    'admission.parent_info': 'Informations sur les parents/tuteur',
    'admission.application_details': 'Détails de la demande',
    'admission.documents': 'Documents requis',
    'admission.first_name': 'Prénom',
    'admission.last_name': 'Nom de famille',
    'admission.middle_name': 'Deuxième prénom',
    'admission.date_of_birth': 'Date de naissance',
    'admission.gender': 'Genre',
    'admission.male': 'Masculin',
    'admission.female': 'Féminin',
    'admission.class_applying': 'Classe demandée',
    'admission.nationality': 'Nationalité',
    'admission.state_of_origin': 'État d\'origine',
    'admission.religion': 'Religion',
    'admission.blood_group': 'Groupe sanguin',
    'admission.medical_conditions': 'Conditions médicales',
    'admission.previous_school': 'École précédente',

    // School Information
    'school.welcome': 'Bienvenue à {{schoolName}}',
    'school.about_title': 'À propos de {{schoolName}}',
    'school.programs_title': 'Nos programmes académiques',
    'school.facilities_title': 'Installations de classe mondiale',
    'school.testimonials_title': 'Ce que disent les parents',
    'school.contact_title': 'Contactez-nous',
    'school.students': 'Étudiants',
    'school.teachers': 'Enseignants',
    'school.years_excellence': 'Années d\'excellence',
    'school.graduation_rate': 'Taux de diplomation'
  },

  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.about': 'حولنا',
    'nav.programs': 'البرامج',
    'nav.facilities': 'المرافق',
    'nav.admissions': 'القبول',
    'nav.contact': 'اتصل بنا',
    'nav.apply': 'تقدم الآن',
    'nav.tour': 'جولة افتراضية',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ',
    'common.success': 'نجح!',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.submit': 'إرسال',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.close': 'إغلاق',
    'common.view': 'عرض',
    'common.download': 'تحميل',

    // Admission Form
    'admission.title': 'طلب القبول',
    'admission.student_info': 'معلومات الطالب',
    'admission.parent_info': 'معلومات الوالدين/الوصي',
    'admission.application_details': 'تفاصيل الطلب',
    'admission.documents': 'الوثائق المطلوبة',
    'admission.first_name': 'الاسم الأول',
    'admission.last_name': 'اسم العائلة',
    'admission.middle_name': 'الاسم الأوسط',
    'admission.date_of_birth': 'تاريخ الميلاد',
    'admission.gender': 'الجنس',
    'admission.male': 'ذكر',
    'admission.female': 'أنثى',
    'admission.class_applying': 'الصف المطلوب',
    'admission.nationality': 'الجنسية',
    'admission.state_of_origin': 'الولاية الأصلية',
    'admission.religion': 'الديانة',
    'admission.blood_group': 'فصيلة الدم',
    'admission.medical_conditions': 'الحالات الطبية',
    'admission.previous_school': 'المدرسة السابقة',

    // School Information
    'school.welcome': 'مرحباً بكم في {{schoolName}}',
    'school.about_title': 'حول {{schoolName}}',
    'school.programs_title': 'برامجنا الأكاديمية',
    'school.facilities_title': 'مرافق عالمية المستوى',
    'school.testimonials_title': 'ماذا يقول الآباء',
    'school.contact_title': 'تواصل معنا',
    'school.students': 'الطلاب',
    'school.teachers': 'المعلمون',
    'school.years_excellence': 'سنوات التميز',
    'school.graduation_rate': 'معدل التخرج'
  }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && SUPPORTED_LANGUAGES.find(lang => lang.code === savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (SUPPORTED_LANGUAGES.find(lang => lang.code === browserLang)) {
        setCurrentLanguage(browserLang);
      }
    }
  }, []);

  useEffect(() => {
    // Apply RTL styles for Arabic
    const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage);
    if (currentLang?.rtl) {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = currentLanguage;
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage]);

  const setLanguage = (code: string) => {
    if (SUPPORTED_LANGUAGES.find(lang => lang.code === code)) {
      setCurrentLanguage(code);
      localStorage.setItem('preferredLanguage', code);
    }
  };

  const t = (key: string, params?: Record<string, string>): string => {
    const translation = TRANSLATIONS[currentLanguage]?.[key] || TRANSLATIONS['en']?.[key] || key;
    
    if (params) {
      return Object.entries(params).reduce((text, [param, value]) => {
        return text.replace(new RegExp(`{{${param}}}`, 'g'), value);
      }, translation);
    }
    
    return translation;
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    languages: SUPPORTED_LANGUAGES,
    isLoading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;
