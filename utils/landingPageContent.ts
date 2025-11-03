import { LandingPageContent, MenuItem } from '../types';

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
    { id: 'menu_1', label: 'Features', url: '#features' },
    { id: 'menu_2', label: 'Pricing', url: '/signup' },
    { id: 'menu_3', label: 'Demo', url: '/demo' },
    { id: 'menu_4', label: 'Blog', url: '/blog' },
];

export const DEFAULT_LANDING_PAGE_CONTENT: LandingPageContent = {
  hero: {
    title: "Nigeria’s First AI-Powered School Performance & Finance Suite — Now 21st-Century Compliant.",
    subtitle: "Dossier.ng transforms ordinary schools into innovation hubs. It doesn’t just manage your school — it modernizes how you teach, learn, and grow.<br/>From classrooms to cashflows, Dossier.ng empowers teachers, delights parents, and drives student performance through intelligence, not infrastructure."
  },
  problem: {
    title: "The Hidden Truth About Education in the 21st Century.",
    points: [
      "Most classrooms still teach like it’s 1980.",
      "Parents are frustrated with poor feedback and late results.",
      "Teachers are drowning in paperwork instead of creativity.",
      "Students memorize facts instead of building skills.",
      "School owners chase debt and data instead of innovation."
    ],
    extraText: "You’ve tried portals. You’ve tried spreadsheets. Now, it’s time to try intelligence that transforms mindsets."
  },
  solution: {
    title: "The Future of Smart, 21st-Century Schooling Has Arrived.",
    features: [
      // Financial Intelligence
      { icon: 'WalletIcon', title: 'Smart Fee Management', desc: 'Automates billing, receipts, and reminders. <em>→ Frees administrators to focus on learning, not chasing payments.</em>' },
      { icon: 'ChartBarIcon', title: 'AI-Powered Debt Prediction', desc: 'Detects risky accounts early and recommends action. <em>→ Promotes data-driven leadership and accountability.</em>' },
      { icon: 'DocumentArrowDownIcon', title: 'Bank Reconciliation', desc: 'Syncs effortlessly with accounts and ledgers.' },
      { icon: 'BriefcaseIcon', title: 'Payroll Management', desc: 'Track staff payments and performance incentives.' },
      // Academic Intelligence
      { icon: 'ClockIcon', title: 'Automated Grading & Reporting', desc: 'Reduce teacher stress with one-click precision. <em>→ Encourages formative feedback, not just final scores.</em>' },
      { icon: 'BrainCircuitIcon', title: 'AI Lesson Planner', desc: 'Aligns objectives with Bloom’s Taxonomy and 21st-century competencies. <em>→ Transforms rote teaching into project-based learning.</em>' },
      { icon: 'ChartBarIcon', title: 'Performance Analytics', desc: 'Visualize trends and identify at-risk students early.' },
      { icon: 'AcademicCapIcon', title: 'Class & Subject Trends', desc: 'Discover where your learners excel or need intervention.' },
      // AI Insights & Leadership
      { icon: 'SparklesIcon', title: 'Real-Time Analytics Dashboard', desc: 'See everything that matters in one place.' },
      { icon: 'ChatBubbleLeftRightIcon', title: 'AI Chat Assistant', desc: 'Ask “How can we improve STEM results this term?” and get intelligent answers.' },
      { icon: 'BeakerIcon', title: 'Automated Action Suggestions', desc: 'Turns insights into concrete next steps.' },
      { icon: 'ChartPieIcon', title: 'Predictive Leadership Reports', desc: 'Track growth, engagement, and 21st-century readiness.' },
      // Communication & Engagement
      { icon: 'UsersIcon', title: 'Parent Portal', desc: 'Parents get live academic and behavioral updates. <em>→ Builds partnership, not tension.</em>' },
      { icon: 'MegaphoneIcon', title: 'Targeted SMS & Email Reminders', desc: 'Communicate smarter, faster.' },
      { icon: 'EnvelopeIcon', title: 'AI-Generated Announcements', desc: 'Save time with intelligent communication templates.' },
      { icon: 'MicrophoneIcon', title: 'Student Portfolios & Voice Submissions', desc: 'Let students showcase creativity and communication skills digitally.' }
    ]
  },
  testimonials: {
    title: "Schools Across Nigeria Are Seeing Real Results",
    items: [
        { id: 'test_1', quote: "We recovered ₦1.2m in unpaid fees within one term using Dossier. But more importantly, our teachers now think differently — lessons are creative, data is alive.", avatar: 'https://i.pravatar.cc/150?img=12', name: 'Mr. Femi Adeboye', role: 'Principal', school: 'Gracefield High School' },
        { id: 'test_2', quote: "Before Dossier, we focused on grades. Now we measure engagement, collaboration, and confidence.", avatar: 'https://i.pravatar.cc/150?img=22', name: 'Mrs. Uche Nwosu', role: 'Director', school: 'Brilliance Academy' },
        { id: 'test_3', quote: "Parents say our reports finally make sense. Dossier helps them see growth, not just numbers.", avatar: 'https://i.pravatar.cc/150?img=32', name: 'Mr. Yusuf Bamidele', role: 'Headteacher', school: 'OliveSpring Schools' }
    ]
  },
  pricing: {
    title: "Affordable. Scalable. Revolutionary.",
    subtitle: "Monthly · Termly · Yearly (Save 20%)"
  },
  comparison: {
      title: "Why Dossier.ng is in a Class of Its Own",
      features: [
          { name: "Focus", regular: "Record & Store Data", reportsheet: "Predict, Analyze & Optimize" },
          { name: "21st-Century Learning", regular: "Not Supported", reportsheet: "Built into Every Module" },
          { name: "AI-Powered", regular: "No", reportsheet: "Deep AI Core" },
          { name: "Debt Recovery", regular: "Manual Follow-up", reportsheet: "Automated AI Nudging" },
          { name: "Academic + Financial Link", regular: "Disconnected", reportsheet: "Unified Intelligence" },
          { name: "Teacher Development", regular: "Optional", reportsheet: "Built-in Micro-Learning" },
          { name: "Reporting", regular: "Static", reportsheet: "Smart, Auto-Narrated Insights" },
          { name: "Leadership Dashboard", regular: "Absent", reportsheet: "Visionary & Predictive" }
      ]
  },
  faq: {
    title: "Security & Setup",
    items: [
      { q: "Is our school's data secure with Dossier.ng?", a: "Yes. Your data stays encrypted, backed up, and protected with enterprise-grade security — built on Supabase and Cloudflare infrastructure." },
      { q: "Do we need an IT department?", a: "No. Launch your 21st-century classroom suite in minutes — guided onboarding included." }
    ]
  },
  finalCta: {
    title: "Join the Next Generation of Smart, 21st-Century Schools.",
    subtitle: "Over 2,000 Nigerian schools are transforming academic and financial performance with Dossier.ng. You don’t need expensive classrooms — just a smarter way to teach and lead.",
    tagline: "Dossier.ng by Hephzibah Edutech — AI-Powered Performance Suite for 21st-Century Schools"
  },
  promoBanner: {
      enabled: false,
      text: "",
      endDate: ""
  }
};
