import { LandingPageContent, MenuItem } from '../types';

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
    { id: 'menu_1', label: 'Features', url: '#features' },
    { id: 'menu_2', label: 'Pricing', url: '/signup' },
    { id: 'menu_3', label: 'Demo', url: '/demo' },
    { id: 'menu_4', label: 'Blog', url: '/blog' },
];

export const DEFAULT_LANDING_PAGE_CONTENT: LandingPageContent = {
  hero: {
    title: "Unlock Your School's Potential. The All-in-One AI Platform.",
    subtitle: "Automate results, generate insightful reports, and empower your teachers with cutting-edge AI tools. Go from tedious paperwork to data-driven excellence in minutes."
  },
  problem: {
    title: "Buried in Paperwork? There's a Smarter Way.",
    points: [
      "Countless hours spent manually calculating results and typing comments.",
      "Inconsistent report cards that fail to impress parents.",
      "No clear view of student performance trends across terms.",
      "Communication with parents is slow, expensive, and ineffective."
    ],
    extraText: "Traditional school management is holding you back. It's time-consuming, prone to errors, and keeps you from focusing on what truly matters: your students' success."
  },
  solution: {
    title: "Welcome to ReportSheet: Your School's AI Co-Pilot",
    features: [
      { icon: 'ClockIcon', title: 'Instant Result Automation', desc: 'Enter scores once. ReportSheet handles all calculations, grading, class positions, and subject averages in the blink of an eye. Free your teachers from manual work.' },
      { icon: 'SparklesIcon', title: 'AI-Powered Comments', desc: 'Generate unique, insightful, and personalized report card comments for every student in seconds, reflecting their actual performance.' },
      { icon: 'ChartBarIcon', title: 'Deep Performance Analytics', desc: 'Visualize academic trends, identify at-risk students, and spot your star performers with beautiful, easy-to-understand charts.' },
      { icon: 'DocumentArrowDownIcon', title: 'Professional Report Cards', desc: 'Design and generate stunning, professional report cards for your entire school with a single click. Print-ready and parent-approved.' },
      { icon: 'BrainCircuitIcon', title: 'Teacher Empowerment Suite', desc: 'Equip your teachers with AI tools to create lesson plans, practice quizzes, and personalized learning pathways for students.' },
      { icon: 'ChatBubbleLeftRightIcon', title: 'Effortless Parent Communication', desc: 'Keep parents informed with integrated SMS/Email announcements, automated fee reminders, and secure direct messaging.' }
    ]
  },
  testimonials: {
    title: "Why School Leaders in Nigeria Love ReportSheet",
    items: [
        { id: 'test_1', quote: "ReportSheet cut our result processing time by over 80%. The AI comments are a lifesaver, and our parents are more engaged than ever. It's a total game-changer for us.", avatar: 'https://i.pravatar.cc/150?img=1', name: 'Mrs. Funke Adebayo', role: 'Proprietress', school: 'Bright Minds Academy, Lagos' },
        { id: 'test_2', quote: "As an admin, the analytics dashboard is my favorite feature. I can see a complete overview of the school's performance at a glance. We're making smarter decisions now.", avatar: 'https://i.pravatar.cc/150?img=2', name: 'Mr. Chinedu Eze', role: 'Head of School', school: 'Innovate Scholars, Abuja' },
        { id: 'test_3', quote: "My teachers are happier and more productive. They spend less time on admin and more time teaching. The parent communication tools have been invaluable.", avatar: 'https://i.pravatar.cc/150?img=3', name: 'Hajia Aisha Bello', role: 'Principal', school: 'Crestview International, Port Harcourt' }
    ]
  },
  pricing: {
    title: "Simple, Transparent Pricing for Every School Size",
    subtitle: "No hidden fees. No long-term contracts. Just powerful features that fit your budget. Start with a 14-day free trial on any plan."
  },
  comparison: {
      title: "The ReportSheet Advantage",
      features: [
          { name: "AI-Powered Insights", regular: "Manual Data Entry", reportsheet: "Automated Analytics & Comments" },
          { name: "Result Processing", regular: "Days of Spreadsheet Hell", reportsheet: "Instant & Error-Free" },
          { name: "Parent Engagement", regular: "Occasional Newsletters", reportsheet: "Real-time Communication & Portal" },
          { name: "Teacher Workflow", regular: "Overloaded with Admin Tasks", reportsheet: "Streamlined & AI-Assisted" }
      ]
  },
  faq: {
    title: "Your Questions, Answered",
    items: [
      { q: "Is our school's data secure with ReportSheet?", a: "Absolutely. We use bank-grade encryption and best-in-class security protocols. Your data is yours alone, and we are committed to keeping it safe." },
      { q: "How long does it take to set up?", a: "You can create your school portal and be ready to go in less than 5 minutes. Our intuitive interface and bulk import tools make migrating your data a breeze." },
      { q: "Can we try it before committing?", a: "Yes! Every new school gets a 14-day free trial with full access to all features. No credit card required to get started." },
      { q: "Is it suitable for my school type?", a: "ReportSheet is built to be flexible. It's perfect for nursery, primary, and secondary schools, and can be customized to fit your specific academic structure." }
    ]
  },
  finalCta: {
    title: "Ready to Upgrade Your School's Operating System?",
    subtitle: "Join the growing community of forward-thinking schools in Nigeria. Give your teachers the tools they deserve and give your parents the experience they expect."
  },
  promoBanner: {
      enabled: false,
      text: "",
      endDate: ""
  }
};