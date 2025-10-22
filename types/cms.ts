// CMS and Content Management Types

export interface MenuItem {
  id: string;
  label: string;
  url: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  avatar: string;
  name: string;
  role: string;
  school: string;
}

export interface LandingPageContent {
  hero: { title: string; subtitle: string };
  problem: { title: string; points: string[]; extraText?: string };
  solution: { title: string; features: { icon: string; title: string; desc: string }[] };
  testimonials: { title: string; items: Testimonial[] };
  pricing: { title: string; subtitle: string };
  comparison: { title: string; features: { name: string; regular: string; reportsheet: string }[] };
  faq: { title: string; items: { q: string; a: string }[] };
  finalCta: { title: string; subtitle: string; tagline?: string };
  promoBanner?: { enabled: boolean; text: string; endDate: string };
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published';
  lastUpdated: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface Event {
  id: string;
  date: string;
  title: string;
}