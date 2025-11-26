import { LandingPageTemplate, SchoolLandingPageContent, SchoolInfo } from '../types/school';

export const LANDING_PAGE_TEMPLATES: LandingPageTemplate[] = [
  {
    id: 'modern_tech',
    name: 'Modern Tech Academy',
    description: 'Clean, futuristic design perfect for STEM-focused schools',
    thumbnail: '/templates/modern-tech-thumb.jpg',
    category: 'modern',
    sections: ['hero', 'about', 'programs', 'facilities', 'achievements', 'testimonials', 'contact'],
    colorScheme: {
      primary: '#0F172A',
      secondary: '#1E293B',
      accent: '#06B6D4',
      background: '#F8FAFC',
      text: '#0F172A'
    }
  },
  {
    id: 'classic_heritage',
    name: 'Classic Heritage',
    description: 'Traditional, elegant design with serif fonts and warm colors',
    thumbnail: '/templates/classic-heritage-thumb.jpg',
    category: 'classic',
    sections: ['hero', 'about', 'programs', 'facilities', 'staff', 'testimonials', 'contact'],
    colorScheme: {
      primary: '#7C2D12',
      secondary: '#92400E',
      accent: '#D97706',
      background: '#FEF7ED',
      text: '#1C1917'
    }
  },
  {
    id: 'creative_arts',
    name: 'Creative Arts Studio',
    description: 'Vibrant, artistic design for creative and arts-focused institutions',
    thumbnail: '/templates/creative-arts-thumb.jpg',
    category: 'creative',
    sections: ['hero', 'about', 'programs', 'gallery', 'achievements', 'testimonials', 'contact'],
    colorScheme: {
      primary: '#7C3AED',
      secondary: '#5B21B6',
      accent: '#EC4899',
      background: '#FEFBFF',
      text: '#1E1B4B'
    }
  },
  {
    id: 'minimal_zen',
    name: 'Minimal Zen',
    description: 'Clean, minimalist design focusing on content and simplicity',
    thumbnail: '/templates/minimal-zen-thumb.jpg',
    category: 'minimal',
    sections: ['hero', 'about', 'programs', 'testimonials', 'contact'],
    colorScheme: {
      primary: '#374151',
      secondary: '#4B5563',
      accent: '#10B981',
      background: '#FFFFFF',
      text: '#111827'
    }
  },
  {
    id: 'nature_montessori',
    name: 'Nature Montessori',
    description: 'Warm, natural design perfect for Montessori and early childhood schools',
    thumbnail: '/templates/nature-montessori-thumb.jpg',
    category: 'creative',
    sections: ['hero', 'about', 'programs', 'facilities', 'testimonials', 'contact'],
    colorScheme: {
      primary: '#059669',
      secondary: '#047857',
      accent: '#F59E0B',
      background: '#F0FDF4',
      text: '#064E3B'
    }
  },
  {
    id: 'international_global',
    name: 'International Global',
    description: 'Professional design for international schools and global curricula',
    thumbnail: '/templates/international-global-thumb.jpg',
    category: 'modern',
    sections: ['hero', 'about', 'programs', 'facilities', 'achievements', 'testimonials', 'contact'],
    colorScheme: {
      primary: '#1E40AF',
      secondary: '#1D4ED8',
      accent: '#F59E0B',
      background: '#F8FAFC',
      text: '#1E293B'
    }
  },
  {
    id: 'islamic_academy',
    name: 'Islamic Academy',
    description: 'Elegant design with Islamic patterns and cultural elements',
    thumbnail: '/templates/islamic-academy-thumb.jpg',
    category: 'classic',
    sections: ['hero', 'about', 'programs', 'facilities', 'testimonials', 'contact'],
    colorScheme: {
      primary: '#065F46',
      secondary: '#047857',
      accent: '#D97706',
      background: '#ECFDF5',
      text: '#064E3B'
    }
  },
  {
    id: 'sports_academy',
    name: 'Sports Academy',
    description: 'Dynamic, energetic design for sports-focused schools',
    thumbnail: '/templates/sports-academy-thumb.jpg',
    category: 'creative',
    sections: ['hero', 'about', 'programs', 'facilities', 'achievements', 'testimonials', 'contact'],
    colorScheme: {
      primary: '#DC2626',
      secondary: '#B91C1C',
      accent: '#F59E0B',
      background: '#FEF2F2',
      text: '#7F1D1D'
    }
  }
];

export const generateTemplateContent = (template: LandingPageTemplate, schoolInfo: SchoolInfo): SchoolLandingPageContent => {
  const baseContent: SchoolLandingPageContent = {
    hero: {
      title: `Welcome to ${schoolInfo.name}`,
      subtitle: schoolInfo.motto || 'Excellence in Education',
      backgroundImage: '',
      ctaText: 'Apply for Admission',
      secondaryCtaText: 'Schedule a Tour'
    },
    about: {
      title: `About ${schoolInfo.name}`,
      description: schoolInfo.description || 'We are committed to providing quality education.',
      image: '',
      mission: '',
      vision: ''
    },
    programs: {
      title: 'Our Academic Programs',
      subtitle: 'Comprehensive education programs designed to nurture every student\'s potential',
      programs: []
    },
    facilities: {
      title: 'World-Class Facilities',
      subtitle: 'State-of-the-art facilities designed to enhance learning',
      facilities: []
    },
    testimonials: {
      title: 'What Parents Say',
      testimonials: []
    },
    contact: {
      title: 'Get in Touch',
      subtitle: 'Ready to join our school community? Contact us today!'
    }
  };

  // Customize content based on template
  switch (template.id) {
    case 'modern_tech':
      return {
        ...baseContent,
        hero: {
          ...baseContent.hero,
          title: `Future-Ready Education at ${schoolInfo.name}`,
          subtitle: 'Preparing students for tomorrow\'s digital world with cutting-edge technology and innovative teaching methods.',
          ctaText: 'Explore Programs',
          secondaryCtaText: 'Virtual Campus Tour'
        },
        about: {
          ...baseContent.about,
          title: 'Innovation Meets Education',
          description: 'We integrate the latest technology with proven educational methods to create an engaging learning environment.',
          mission: 'To prepare students for success in a rapidly evolving digital world.',
          vision: 'To be the leading technology-integrated educational institution.'
        },
        programs: {
          title: 'STEM-Focused Programs',
          subtitle: 'Cutting-edge curricula designed for the digital age',
          programs: [
            {
              name: 'Digital Literacy Program',
              description: 'Comprehensive computer science and digital skills training',
              ageRange: '6-18 years',
              duration: 'Ongoing',
              image: '',
              subjects: ['Programming', 'Robotics', 'AI Basics', 'Digital Design'],
              features: ['1:1 Device Program', 'Coding Bootcamps', 'Tech Competitions', 'Industry Partnerships']
            },
            {
              name: 'STEM Excellence Track',
              description: 'Advanced Science, Technology, Engineering, and Mathematics',
              ageRange: '12-18 years',
              duration: '6 years',
              image: '',
              subjects: ['Advanced Mathematics', 'Physics', 'Chemistry', 'Engineering Design'],
              features: ['Research Projects', 'Science Fairs', 'University Partnerships', 'Lab Access']
            }
          ]
        },
        facilities: {
          title: 'State-of-the-Art Technology',
          subtitle: 'Modern facilities equipped with the latest educational technology',
          facilities: [
            { name: 'Innovation Lab', description: '3D printing, robotics, and maker space', icon: '🔬' },
            { name: 'Digital Classrooms', description: 'Interactive whiteboards and tablets for every student', icon: '💻' },
            { name: 'Virtual Reality Center', description: 'Immersive learning experiences', icon: '🥽' },
            { name: 'Coding Bootcamp Space', description: 'Dedicated programming and development area', icon: '⌨️' }
          ]
        }
      };

    case 'classic_heritage':
      return {
        ...baseContent,
        hero: {
          ...baseContent.hero,
          title: `${schoolInfo.name}: A Legacy of Excellence`,
          subtitle: 'Upholding tradition while preparing students for the future. Where character meets scholarship.',
          ctaText: 'Begin Your Journey',
          secondaryCtaText: 'Discover Our Heritage'
        },
        about: {
          ...baseContent.about,
          title: 'Our Distinguished Heritage',
          description: 'For generations, we have been nurturing young minds with time-honored values and academic excellence.',
          mission: 'To provide exceptional education rooted in strong moral values and academic rigor.',
          vision: 'To be a beacon of educational excellence and character development.'
        },
        programs: {
          title: 'Classical Education Programs',
          subtitle: 'Time-tested curricula with modern applications',
          programs: [
            {
              name: 'Classical Liberal Arts',
              description: 'Traditional liberal arts education with emphasis on critical thinking',
              ageRange: '14-18 years',
              duration: '4 years',
              image: '',
              subjects: ['Literature', 'Philosophy', 'History', 'Latin', 'Rhetoric'],
              features: ['Socratic Method', 'Great Books Curriculum', 'Debate Society', 'Honor Code']
            },
            {
              name: 'Character Development Program',
              description: 'Comprehensive moral and ethical education',
              ageRange: '6-18 years',
              duration: 'Ongoing',
              image: '',
              subjects: ['Ethics', 'Community Service', 'Leadership', 'Public Speaking'],
              features: ['Mentorship Program', 'Service Learning', 'Student Government', 'Peer Mediation']
            }
          ]
        }
      };

    case 'creative_arts':
      return {
        ...baseContent,
        hero: {
          ...baseContent.hero,
          title: `Unleash Creativity at ${schoolInfo.name}`,
          subtitle: 'Where imagination meets education. Nurturing the next generation of artists, creators, and innovators.',
          ctaText: 'Join Our Community',
          secondaryCtaText: 'View Student Gallery'
        },
        about: {
          ...baseContent.about,
          title: 'Creativity at the Core',
          description: 'We believe every child is an artist. Our programs nurture creativity while building strong academic foundations.',
          mission: 'To inspire and develop creative minds through innovative arts education.',
          vision: 'To be the premier creative arts educational institution.'
        },
        programs: {
          title: 'Creative Arts Programs',
          subtitle: 'Comprehensive arts education across all disciplines',
          programs: [
            {
              name: 'Visual Arts Academy',
              description: 'Comprehensive visual arts education from basics to advanced techniques',
              ageRange: '6-18 years',
              duration: 'Ongoing',
              image: '',
              subjects: ['Drawing', 'Painting', 'Sculpture', 'Digital Art', 'Photography'],
              features: ['Professional Studios', 'Art Exhibitions', 'Artist Residencies', 'Portfolio Development']
            },
            {
              name: 'Performing Arts Conservatory',
              description: 'Music, dance, and theater programs for all skill levels',
              ageRange: '6-18 years',
              duration: 'Ongoing',
              image: '',
              subjects: ['Music Theory', 'Instrumental', 'Vocal', 'Dance', 'Theater'],
              features: ['Performance Opportunities', 'Recording Studio', 'Dance Studios', 'Theater Productions']
            }
          ]
        },
        facilities: {
          title: 'Creative Spaces',
          subtitle: 'Inspiring environments designed to foster creativity',
          facilities: [
            { name: 'Art Studios', description: 'Professional-grade art studios with natural lighting', icon: '🎨' },
            { name: 'Music Conservatory', description: 'Soundproof practice rooms and performance hall', icon: '🎵' },
            { name: 'Dance Studios', description: 'Sprung floors and mirrored walls for dance training', icon: '💃' },
            { name: 'Theater', description: 'Full-scale theater with professional lighting and sound', icon: '🎭' }
          ]
        }
      };

    case 'nature_montessori':
      return {
        ...baseContent,
        hero: {
          ...baseContent.hero,
          title: `Growing Naturally at ${schoolInfo.name}`,
          subtitle: 'Where children learn through exploration, discovery, and connection with nature.',
          ctaText: 'Schedule a Visit',
          secondaryCtaText: 'Learn About Montessori'
        },
        about: {
          ...baseContent.about,
          title: 'The Montessori Difference',
          description: 'We follow the child, respecting their natural development and fostering independence, creativity, and love of learning.',
          mission: 'To provide an authentic Montessori education that develops the whole child.',
          vision: 'To nurture independent, confident, and caring global citizens.'
        },
        programs: {
          title: 'Montessori Programs',
          subtitle: 'Age-appropriate environments designed for natural development',
          programs: [
            {
              name: 'Toddler Community',
              description: 'Nurturing environment for developing independence and social skills',
              ageRange: '18 months - 3 years',
              duration: 'Flexible',
              image: '',
              subjects: ['Practical Life', 'Language', 'Movement', 'Sensorial'],
              features: ['Mixed-age groups', 'Child-sized environment', 'Outdoor exploration', 'Parent partnership']
            },
            {
              name: 'Children\'s House',
              description: 'Classic Montessori environment for preschool and kindergarten',
              ageRange: '3-6 years',
              duration: '3 years',
              image: '',
              subjects: ['Practical Life', 'Sensorial', 'Mathematics', 'Language', 'Cultural Studies'],
              features: ['Self-directed learning', 'Montessori materials', 'Peace education', 'Nature connection']
            }
          ]
        },
        facilities: {
          title: 'Natural Learning Environments',
          subtitle: 'Carefully prepared spaces that connect children with nature',
          facilities: [
            { name: 'Outdoor Classrooms', description: 'Learning spaces integrated with nature', icon: '🌳' },
            { name: 'Garden Spaces', description: 'Hands-on gardening and nature study areas', icon: '🌱' },
            { name: 'Natural Playground', description: 'Wooden structures and natural materials for play', icon: '🏞️' },
            { name: 'Peace Garden', description: 'Quiet spaces for reflection and mindfulness', icon: '🌸' }
          ]
        }
      };

    case 'islamic_academy':
      return {
        ...baseContent,
        hero: {
          ...baseContent.hero,
          title: `${schoolInfo.name}: Excellence in Islamic Education`,
          subtitle: 'Nurturing young Muslims with authentic Islamic values and world-class academic education.',
          ctaText: 'Join Our Ummah',
          secondaryCtaText: 'Learn About Our Values'
        },
        about: {
          ...baseContent.about,
          title: 'Islamic Excellence',
          description: 'We provide comprehensive Islamic education integrated with modern academic curricula.',
          mission: 'To develop confident Muslim leaders with strong Islamic identity and academic excellence.',
          vision: 'To be a center of Islamic learning and character development.'
        },
        programs: {
          title: 'Islamic Education Programs',
          subtitle: 'Comprehensive Islamic and academic education',
          programs: [
            {
              name: 'Quranic Studies',
              description: 'Memorization, recitation, and understanding of the Holy Quran',
              ageRange: '6-18 years',
              duration: 'Ongoing',
              image: '',
              subjects: ['Quran Memorization', 'Tajweed', 'Tafseer', 'Arabic Language'],
              features: ['Qualified Huffaz teachers', 'Individual attention', 'Quranic competitions', 'Graduation ceremonies']
            },
            {
              name: 'Islamic Studies & Modern Curriculum',
              description: 'Integrated Islamic and contemporary academic education',
              ageRange: '6-18 years',
              duration: '12 years',
              image: '',
              subjects: ['Islamic Studies', 'Arabic', 'Mathematics', 'Science', 'English'],
              features: ['Bilingual education', 'Islamic values integration', 'Character development', 'University preparation']
            }
          ]
        },
        facilities: {
          title: 'Islamic Learning Environment',
          subtitle: 'Facilities designed to support Islamic education and values',
          facilities: [
            { name: 'Masjid', description: 'Beautiful prayer hall for daily prayers and Islamic activities', icon: '🕌' },
            { name: 'Islamic Library', description: 'Extensive collection of Islamic books and resources', icon: '📚' },
            { name: 'Arabic Language Lab', description: 'Modern facilities for Arabic language learning', icon: '🔤' },
            { name: 'Halal Cafeteria', description: 'Nutritious halal meals prepared according to Islamic guidelines', icon: '🍽️' }
          ]
        }
      };

    default:
      return baseContent;
  }
};

export const getTemplateById = (id: string): LandingPageTemplate | undefined => {
  return LANDING_PAGE_TEMPLATES.find(template => template.id === id);
};

export const getTemplatesByCategory = (category: string): LandingPageTemplate[] => {
  return LANDING_PAGE_TEMPLATES.filter(template => template.category === category);
};
