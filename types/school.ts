// School Configuration and Settings Types

export interface ReportCardSkill {
  id: string;
  label: string;
}

export interface ClassSection {
  id: string;
  name: string;
}

export interface ClassLevel {
  id: string;
  name: string;
  classes: { id: string; name: string }[];
}

export interface SchoolSettings {
  schoolName: string;
  schoolAddress?: string;
  schoolLogo?: string;
  schoolType?: string;
  session: string;
  term: string;
  gradingSystem: { grade: string; from: number; to: number; remark: string }[];
  maxCa1: number;
  maxCa2: number;
  maxExam: number;
  reportCardSettings: {
    principalName: string;
    schoolMotto?: string;
    sections: { id: string; title: string; enabled: boolean }[];
    affectiveSkills: ReportCardSkill[];
    psychomotorSkills: ReportCardSkill[];
    // Added: Admin-configurable format and layout controls
    templateVariant?: 'format1' | 'format2' | 'format3';
    primaryTemplate?: 'primary_default' | 'modern' | 'classic' | 'minimalist';
    termColors?: { first?: string; second?: string; third?: string };
    watermarkEnabled?: boolean;
    watermarkOpacity?: number; // 0.0 - 1.0
    showStudentPhoto?: boolean;
    subjectsTable?: {
      zebra?: boolean;
      showCA1?: boolean;
      showCA2?: boolean;
      showExam?: boolean;
      showTotal?: boolean;
      showGrade?: boolean;
      remarksWidth?: string; // e.g. '20%'
    };
    sidePanel?: {
      showGradingScale?: boolean;
      showAffectiveSkills?: boolean;
      showPsychomotorSkills?: boolean;
      showAttendance?: boolean;
    };
    summaryBar?: {
      showTotal?: boolean;
      showAverage?: boolean;
      showPosition?: boolean;
    };
  };
  features?: Record<string, boolean>;
  roleBasedFeatures?: {
    admin?: Record<string, boolean>;
    teacher?: Record<string, boolean>;
    student?: Record<string, boolean>;
    parent?: Record<string, boolean>;
    bursar?: Record<string, boolean>;
  };
  schoolStructure?: {
    levels: ClassLevel[];
    sections: ClassSection[];
  };
  budgetSettings?: {
    session: string;
    term: string;
    categories: Record<string, number>;
  };
  integrations?: {
    // Payment Gateways
    paystack_public_key?: string;
    paystack_secret_key?: string;
    flutterwave_public_key?: string;
    flutterwave_secret_key?: string;
    flutterwave_encryption_key?: string;

    // Manual Bank Payments
    manual_bank_name?: string;
    manual_bank_account_name?: string;
    manual_bank_account_number?: string;
    manual_payment_instructions?: string;
    
    // AI Services
    gemini_api_key?: string;
    openai_api_key?: string;
    
    // WhatsApp Business
    whatsapp_business_token?: string;
    whatsapp_phone_number_id?: string;
    whatsapp_webhook_verify_token?: string;
    
    // SMS Gateways
    sms_provider?: 'termii' | 'smartsmssolutions' | 'bulk-sms-nigeria' | 'nigeriabulksms' | 'custom';
    sms_api_key?: string;
    sms_sender_id?: string;
    sms_api_url?: string;
    
    // Termii SMS Gateway
    termii_api_key?: string;
    termii_sender_id?: string;
    
    // Smart SMS Solutions
    smartsms_username?: string;
    smartsms_password?: string;
    smartsms_sender?: string;
    
    // Bulk SMS Nigeria
    bulksms_username?: string;
    bulksms_password?: string;
    bulksms_api_token?: string;
    bulksms_sender?: string;
    
    // Nigeria Bulk SMS
    nigeriabulksms_username?: string;
    nigeriabulksms_password?: string;
    nigeriabulksms_sender?: string;
    
    // Email Services
    sendgrid_api_key?: string;
    mailgun_api_key?: string;
    mailgun_domain?: string;
    
    // Cloud Storage
    cloudinary_cloud_name?: string;
    cloudinary_api_key?: string;
    cloudinary_api_secret?: string;
    
    // Analytics
    google_analytics_id?: string;
    mixpanel_token?: string;
    
    // Push Notifications
    firebase_server_key?: string;
    onesignal_app_id?: string;
    onesignal_api_key?: string;
    
    // Social Media
    facebook_app_id?: string;
    facebook_app_secret?: string;
    twitter_api_key?: string;
    twitter_api_secret?: string;
    
    // Other APIs
    google_maps_api_key?: string;
    recaptcha_site_key?: string;
    recaptcha_secret_key?: string;
  };
}