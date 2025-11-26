import { SchoolInfo, SchoolLandingPageContent, AdmissionSettings } from '../types/school';

// Demo school data for different types of schools
export const DEMO_SCHOOLS: SchoolInfo[] = [
  {
    id: 'school_1',
    name: 'Greenwood International Academy',
    slug: 'greenwood-academy',
    motto: 'Excellence Through Innovation',
    description: 'A premier international school committed to nurturing global citizens through innovative education and character development.',
    logo: '/demo/schools/greenwood-logo.png',
    address: '123 Education Drive, Victoria Island, Lagos, Nigeria',
    phone: '+234 801 234 5678',
    email: 'info@greenwoodacademy.edu.ng',
    website: 'https://greenwoodacademy.edu.ng',
    established: '1995',
    principalName: 'Dr. Adaora Okafor',
    principalMessage: 'Welcome to Greenwood International Academy, where we believe every child has the potential to excel. Our commitment to academic excellence, character development, and global citizenship prepares our students for success in an interconnected world.',
    stats: {
      students: '850+',
      teachers: '65+',
      yearsOfExcellence: '28+',
      graduationRate: '98%',
      achievements: [
        'Top 10 International Schools in Nigeria',
        'Cambridge International School Certification',
        'Winner - National Science Competition 2023',
        'Best ICT Integration Award 2022'
      ]
    },
    socialMedia: {
      facebook: 'https://facebook.com/greenwoodacademy',
      twitter: 'https://twitter.com/greenwoodacademy',
      instagram: 'https://instagram.com/greenwoodacademy',
      linkedin: 'https://linkedin.com/company/greenwood-academy',
      youtube: 'https://youtube.com/greenwoodacademy'
    },
    landing_page_content: {
      hero: {
        title: 'Shaping Tomorrow\'s Global Leaders Today',
        subtitle: 'At Greenwood International Academy, we provide world-class education that prepares students for success in a rapidly changing world. Join our community of learners, innovators, and future leaders.',
        backgroundImage: '/demo/schools/greenwood-hero.jpg',
        ctaText: 'Apply for Admission',
        secondaryCtaText: 'Schedule a Tour'
      },
      about: {
        title: 'About Greenwood International Academy',
        description: 'Founded in 1995, Greenwood International Academy has been at the forefront of educational excellence in Nigeria. We combine the best of international curricula with local values to create well-rounded global citizens.',
        image: '/demo/schools/greenwood-about.jpg',
        mission: 'To provide exceptional education that develops critical thinking, creativity, and character in every student.',
        vision: 'To be the leading international school in Africa, known for academic excellence and character development.',
        values: ['Excellence', 'Integrity', 'Innovation', 'Respect', 'Responsibility']
      },
      programs: {
        title: 'Our Academic Programs',
        subtitle: 'Comprehensive education from Early Years to A-Levels',
        programs: [
          {
            name: 'Early Years Foundation Stage',
            description: 'A nurturing environment for children aged 3-5, focusing on play-based learning and development.',
            ageRange: '3-5 years',
            duration: '2 years',
            image: '/demo/schools/greenwood-eyfs.jpg',
            subjects: ['Literacy', 'Numeracy', 'Creative Arts', 'Physical Development'],
            features: ['Small class sizes', 'Qualified EYFS teachers', 'Safe playground', 'Nutritious meals'],
            tuitionFee: '₦1,200,000/year'
          },
          {
            name: 'Primary School (Key Stage 1 & 2)',
            description: 'Cambridge Primary curriculum with strong foundation in core subjects and character development.',
            ageRange: '6-11 years',
            duration: '6 years',
            image: '/demo/schools/greenwood-primary.jpg',
            subjects: ['English', 'Mathematics', 'Science', 'ICT', 'Art', 'Music', 'PE'],
            features: ['Cambridge curriculum', 'STEM focus', 'Language programs', 'Sports activities'],
            tuitionFee: '₦1,500,000/year'
          },
          {
            name: 'Secondary School (IGCSE)',
            description: 'Cambridge IGCSE program preparing students for international qualifications.',
            ageRange: '12-16 years',
            duration: '5 years',
            image: '/demo/schools/greenwood-secondary.jpg',
            subjects: ['Core subjects', 'Sciences', 'Humanities', 'Languages', 'Arts', 'Technology'],
            features: ['IGCSE certification', 'University preparation', 'Career guidance', 'Leadership programs'],
            tuitionFee: '₦2,000,000/year'
          },
          {
            name: 'Sixth Form (A-Levels)',
            description: 'Cambridge A-Level program for university preparation and career specialization.',
            ageRange: '17-18 years',
            duration: '2 years',
            image: '/demo/schools/greenwood-alevel.jpg',
            subjects: ['Sciences', 'Mathematics', 'Business', 'Economics', 'Literature', 'Psychology'],
            features: ['A-Level certification', 'University applications support', 'Research projects', 'Internships'],
            tuitionFee: '₦2,500,000/year'
          }
        ]
      },
      facilities: {
        title: 'World-Class Facilities',
        subtitle: 'State-of-the-art infrastructure supporting 21st-century learning',
        facilities: [
          { name: 'Science Laboratories', description: 'Fully equipped physics, chemistry, and biology labs', icon: '🔬' },
          { name: 'ICT Center', description: 'Modern computer lab with high-speed internet', icon: '💻' },
          { name: 'Library & Media Center', description: 'Extensive collection of books and digital resources', icon: '📚' },
          { name: 'Sports Complex', description: 'Football field, basketball court, swimming pool', icon: '⚽' },
          { name: 'Arts Studio', description: 'Creative spaces for music, drama, and visual arts', icon: '🎨' },
          { name: 'Cafeteria', description: 'Nutritious meals prepared by qualified nutritionists', icon: '🍽️' },
          { name: 'Medical Center', description: 'On-site clinic with qualified medical staff', icon: '🏥' },
          { name: 'Transportation', description: 'Safe and reliable school bus service', icon: '🚌' }
        ]
      },
      testimonials: {
        title: 'What Our Community Says',
        testimonials: [
          {
            name: 'Mrs. Funmi Adebayo',
            role: 'Parent of Kemi (Year 10)',
            content: 'Greenwood has transformed my daughter into a confident, well-rounded young lady. The teachers are exceptional and truly care about each student\'s success.',
            avatar: '/demo/testimonials/parent1.jpg',
            rating: 5
          },
          {
            name: 'David Okonkwo',
            role: 'Alumni, Class of 2020',
            content: 'The education I received at Greenwood prepared me excellently for university. I\'m now studying Engineering at Imperial College London.',
            avatar: '/demo/testimonials/alumni1.jpg',
            rating: 5,
            graduationYear: '2020'
          },
          {
            name: 'Mr. James Thompson',
            role: 'Parent of twins (Year 7)',
            content: 'The international curriculum and diverse community at Greenwood have given my children a global perspective that will serve them well in life.',
            avatar: '/demo/testimonials/parent2.jpg',
            rating: 5
          }
        ]
      },
      contact: {
        title: 'Visit Our Campus',
        subtitle: 'Experience the Greenwood difference firsthand. Schedule a tour today!',
        mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.7234567890123!2d3.4205678901234567!3d6.4234567890123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMjUnMjQuNCJOIDPCsDI1JzE0LjAiRQ!5e0!3m2!1sen!2sng!4v1234567890123'
      }
    },
    admission_settings: {
      isOpen: true,
      applicationDeadline: '2024-06-30',
      academicYear: '2024/2025',
      availableClasses: ['Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13'],
      requirements: [
        {
          class: 'Reception - Year 2',
          ageRange: '3-7 years',
          requirements: ['Birth certificate', 'Passport photographs', 'Previous school report (if applicable)', 'Medical records'],
          entrance_exam: false,
          interview: true
        },
        {
          class: 'Year 3 - Year 6',
          ageRange: '8-11 years',
          requirements: ['Birth certificate', 'Previous school reports', 'Passport photographs', 'Medical records'],
          entrance_exam: true,
          interview: true
        },
        {
          class: 'Year 7 - Year 11',
          ageRange: '12-16 years',
          requirements: ['Birth certificate', 'Previous school reports', 'Passport photographs', 'Medical records', 'IGCSE results (if applicable)'],
          entrance_exam: true,
          interview: true
        }
      ],
      fees: [
        {
          class: 'Reception - Year 2',
          registrationFee: 50000,
          tuitionFee: 1200000,
          developmentFee: 100000,
          uniformFee: 75000,
          booksFee: 50000,
          totalFee: 1475000
        },
        {
          class: 'Year 3 - Year 6',
          registrationFee: 50000,
          tuitionFee: 1500000,
          developmentFee: 100000,
          uniformFee: 75000,
          booksFee: 60000,
          totalFee: 1785000
        },
        {
          class: 'Year 7 - Year 11',
          registrationFee: 75000,
          tuitionFee: 2000000,
          developmentFee: 150000,
          uniformFee: 85000,
          booksFee: 80000,
          totalFee: 2390000
        }
      ],
      documents: [
        { name: 'Birth Certificate', description: 'Official birth certificate or age declaration', required: true, applicableClasses: ['All'] },
        { name: 'Passport Photographs', description: '4 recent passport-sized photographs', required: true, applicableClasses: ['All'] },
        { name: 'Previous School Records', description: 'Report cards and transcripts from previous school', required: true, applicableClasses: ['Year 1 and above'] },
        { name: 'Medical Records', description: 'Medical examination report and immunization records', required: true, applicableClasses: ['All'] },
        { name: 'Parent/Guardian ID', description: 'Valid identification of parent or guardian', required: true, applicableClasses: ['All'] }
      ],
      process: [
        { step: 1, title: 'Submit Application', description: 'Complete and submit the online application form with required documents', duration: '1 day' },
        { step: 2, title: 'Application Review', description: 'Our admissions team reviews your application and documents', duration: '3-5 days' },
        { step: 3, title: 'Entrance Assessment', description: 'Student takes age-appropriate entrance assessment (if required)', duration: '1 day' },
        { step: 4, title: 'Interview', description: 'Student and parent interview with admissions team', duration: '30 minutes' },
        { step: 5, title: 'Admission Decision', description: 'Receive admission decision and enrollment information', duration: '2-3 days' }
      ],
      contactInfo: {
        admissionOfficer: 'Mrs. Chioma Nwankwo',
        phone: '+234 801 234 5679',
        email: 'admissions@greenwoodacademy.edu.ng',
        officeHours: 'Monday - Friday: 8:00 AM - 4:00 PM'
      }
    }
  },
  {
    id: 'school_2',
    name: 'Heritage Grammar School',
    slug: 'heritage-grammar',
    motto: 'Tradition, Excellence, Character',
    description: 'A distinguished grammar school with over 50 years of academic excellence, combining traditional values with modern educational approaches.',
    logo: '/demo/schools/heritage-logo.png',
    address: '45 Heritage Avenue, Ikeja, Lagos, Nigeria',
    phone: '+234 802 345 6789',
    email: 'info@heritagegrammar.edu.ng',
    website: 'https://heritagegrammar.edu.ng',
    established: '1970',
    principalName: 'Mr. Olumide Fashola',
    principalMessage: 'At Heritage Grammar School, we uphold the finest traditions of academic excellence while preparing our students for the challenges of tomorrow. Our commitment to character development and scholarly achievement has remained unwavering for over five decades.',
    stats: {
      students: '1,200+',
      teachers: '85+',
      yearsOfExcellence: '53+',
      graduationRate: '99%',
      achievements: [
        'Best Secondary School in Lagos State 2023',
        'National Mathematics Competition Champions',
        'Outstanding WAEC Results - 15 years running',
        'Alumni in Top Universities Worldwide'
      ]
    },
    socialMedia: {
      facebook: 'https://facebook.com/heritagegrammar',
      twitter: 'https://twitter.com/heritagegrammar',
      instagram: 'https://instagram.com/heritagegrammar'
    },
    landing_page_content: {
      hero: {
        title: 'Where Tradition Meets Excellence',
        subtitle: 'For over 50 years, Heritage Grammar School has been nurturing young minds and building character. Join our legacy of academic excellence and moral integrity.',
        backgroundImage: '/demo/schools/heritage-hero.jpg',
        ctaText: 'Apply Now',
        secondaryCtaText: 'Learn More'
      },
      about: {
        title: 'Our Rich Heritage',
        description: 'Established in 1970, Heritage Grammar School has maintained its position as one of Nigeria\'s premier educational institutions. We combine time-tested educational principles with innovative teaching methods.',
        image: '/demo/schools/heritage-about.jpg',
        mission: 'To provide excellent education rooted in strong moral values and academic rigor.',
        vision: 'To be the leading grammar school in Nigeria, known for producing leaders of integrity.',
        values: ['Integrity', 'Excellence', 'Discipline', 'Service', 'Innovation']
      },
      programs: {
        title: 'Academic Excellence Programs',
        subtitle: 'Comprehensive education from JSS1 to SS3',
        programs: [
          {
            name: 'Junior Secondary School',
            description: 'Strong foundation in core subjects with emphasis on character development.',
            ageRange: '11-14 years',
            duration: '3 years',
            image: '/demo/schools/heritage-jss.jpg',
            subjects: ['English', 'Mathematics', 'Sciences', 'Social Studies', 'Languages', 'Arts'],
            features: ['Small class sizes', 'Experienced teachers', 'Character education', 'Sports programs'],
            tuitionFee: '₦800,000/year'
          },
          {
            name: 'Senior Secondary School',
            description: 'Specialized tracks in Sciences, Arts, and Commercial subjects for WAEC/NECO preparation.',
            ageRange: '15-18 years',
            duration: '3 years',
            image: '/demo/schools/heritage-sss.jpg',
            subjects: ['Core subjects', 'Science track', 'Arts track', 'Commercial track'],
            features: ['WAEC/NECO preparation', 'University guidance', 'Leadership training', 'Career counseling'],
            tuitionFee: '₦1,000,000/year'
          }
        ]
      },
      facilities: {
        title: 'Excellent Facilities',
        subtitle: 'Modern facilities supporting comprehensive education',
        facilities: [
          { name: 'Science Laboratories', description: 'Well-equipped labs for Physics, Chemistry, and Biology', icon: '🔬' },
          { name: 'Computer Laboratory', description: 'Modern ICT center with internet connectivity', icon: '💻' },
          { name: 'Library', description: 'Extensive collection of academic and literary works', icon: '📚' },
          { name: 'Sports Facilities', description: 'Football field, basketball court, and athletics track', icon: '⚽' },
          { name: 'Assembly Hall', description: 'Large hall for assemblies and cultural events', icon: '🏛️' },
          { name: 'Hostel Accommodation', description: 'Safe and comfortable boarding facilities', icon: '🏠' }
        ]
      },
      testimonials: {
        title: 'Testimonials',
        testimonials: [
          {
            name: 'Dr. Bola Tinubu',
            role: 'Alumni, Class of 1985',
            content: 'Heritage Grammar School shaped my character and gave me the foundation for success. The values I learned here have guided me throughout my career.',
            avatar: '/demo/testimonials/alumni2.jpg',
            rating: 5,
            graduationYear: '1985'
          },
          {
            name: 'Mrs. Adunni Bankole',
            role: 'Parent',
            content: 'The discipline and academic excellence at Heritage is unmatched. My son has grown tremendously in character and knowledge.',
            avatar: '/demo/testimonials/parent3.jpg',
            rating: 5
          }
        ]
      },
      contact: {
        title: 'Contact Us',
        subtitle: 'Visit our historic campus and experience our tradition of excellence'
      }
    },
    admission_settings: {
      isOpen: true,
      applicationDeadline: '2024-05-31',
      academicYear: '2024/2025',
      availableClasses: ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2'],
      requirements: [
        {
          class: 'JSS1',
          ageRange: '11-12 years',
          requirements: ['Primary school certificate', 'Birth certificate', 'Medical report'],
          entrance_exam: true,
          interview: true
        }
      ],
      fees: [
        {
          class: 'JSS1-JSS3',
          registrationFee: 25000,
          tuitionFee: 800000,
          developmentFee: 50000,
          uniformFee: 40000,
          booksFee: 35000,
          totalFee: 950000
        }
      ],
      documents: [
        { name: 'Primary School Certificate', description: 'Certificate of completion from primary school', required: true, applicableClasses: ['JSS1'] },
        { name: 'Birth Certificate', description: 'Official birth certificate', required: true, applicableClasses: ['All'] },
        { name: 'Medical Report', description: 'Recent medical examination report', required: true, applicableClasses: ['All'] }
      ],
      process: [
        { step: 1, title: 'Application Submission', description: 'Submit completed application form', duration: '1 day' },
        { step: 2, title: 'Entrance Examination', description: 'Take entrance examination', duration: '2 hours' },
        { step: 3, title: 'Interview', description: 'Student and parent interview', duration: '30 minutes' },
        { step: 4, title: 'Admission Decision', description: 'Receive admission result', duration: '1 week' }
      ],
      contactInfo: {
        admissionOfficer: 'Mr. Tunde Adeyemi',
        phone: '+234 802 345 6790',
        email: 'admissions@heritagegrammar.edu.ng',
        officeHours: 'Monday - Friday: 9:00 AM - 3:00 PM'
      }
    }
  },
  {
    id: 'school_3',
    name: 'Bright Stars Montessori',
    slug: 'bright-stars-montessori',
    motto: 'Nurturing Young Minds',
    description: 'A child-centered Montessori school focusing on individualized learning and holistic development for children aged 2-12 years.',
    logo: '/demo/schools/brightstars-logo.png',
    address: '78 Child Development Close, Lekki, Lagos, Nigeria',
    phone: '+234 803 456 7890',
    email: 'info@brightstars.edu.ng',
    website: 'https://brightstars.edu.ng',
    established: '2010',
    principalName: 'Mrs. Sarah Okafor',
    principalMessage: 'At Bright Stars Montessori, we believe in the natural curiosity and potential of every child. Our Montessori approach allows children to learn at their own pace in a prepared environment that fosters independence, creativity, and love for learning.',
    stats: {
      students: '180+',
      teachers: '25+',
      yearsOfExcellence: '13+',
      graduationRate: '100%',
      achievements: [
        'Certified Montessori School',
        'Best Early Years Education 2022',
        'Outstanding Child Development Program',
        'Parent Choice Award 2023'
      ]
    },
    socialMedia: {
      facebook: 'https://facebook.com/brightstars',
      instagram: 'https://instagram.com/brightstars'
    },
    landing_page_content: {
      hero: {
        title: 'Where Every Child Shines Bright',
        subtitle: 'Discover the joy of learning through our authentic Montessori approach. We nurture independence, creativity, and a lifelong love for learning in every child.',
        backgroundImage: '/demo/schools/brightstars-hero.jpg',
        ctaText: 'Schedule a Visit',
        secondaryCtaText: 'Learn About Montessori'
      },
      about: {
        title: 'The Montessori Difference',
        description: 'Founded in 2010, Bright Stars Montessori provides an authentic Montessori education that respects the natural development of children. Our prepared environments and trained guides support each child\'s unique learning journey.',
        image: '/demo/schools/brightstars-about.jpg',
        mission: 'To provide an authentic Montessori education that develops independent, confident, and caring individuals.',
        vision: 'To be the leading Montessori school in Nigeria, known for excellence in early childhood education.',
        values: ['Respect', 'Independence', 'Peace', 'Joy', 'Community']
      },
      programs: {
        title: 'Our Montessori Programs',
        subtitle: 'Age-appropriate environments designed for optimal development',
        programs: [
          {
            name: 'Toddler Community',
            description: 'A nurturing environment for toddlers to develop independence and social skills.',
            ageRange: '18 months - 3 years',
            duration: 'Flexible',
            image: '/demo/schools/brightstars-toddler.jpg',
            subjects: ['Practical Life', 'Language', 'Movement', 'Sensorial'],
            features: ['Low child-to-teacher ratio', 'Toilet learning support', 'Outdoor exploration', 'Parent partnership'],
            tuitionFee: '₦600,000/year'
          },
          {
            name: 'Children\'s House',
            description: 'The classic Montessori environment for preschool and kindergarten children.',
            ageRange: '3-6 years',
            duration: '3 years',
            image: '/demo/schools/brightstars-casa.jpg',
            subjects: ['Practical Life', 'Sensorial', 'Mathematics', 'Language', 'Cultural Studies'],
            features: ['Mixed-age classrooms', 'Self-directed learning', 'Montessori materials', 'Peace education'],
            tuitionFee: '₦750,000/year'
          },
          {
            name: 'Elementary',
            description: 'Continuing the Montessori journey with cosmic education and research-based learning.',
            ageRange: '6-12 years',
            duration: '6 years',
            image: '/demo/schools/brightstars-elementary.jpg',
            subjects: ['Language Arts', 'Mathematics', 'Science', 'History', 'Geography', 'Arts'],
            features: ['Cosmic curriculum', 'Research projects', 'Field trips', 'Community service'],
            tuitionFee: '₦900,000/year'
          }
        ]
      },
      facilities: {
        title: 'Child-Centered Environment',
        subtitle: 'Specially designed spaces that support natural development',
        facilities: [
          { name: 'Prepared Classrooms', description: 'Beautiful, ordered environments with Montessori materials', icon: '🏫' },
          { name: 'Outdoor Playground', description: 'Natural playground with gardens and exploration areas', icon: '🌳' },
          { name: 'Art Studio', description: 'Creative space for artistic expression and exploration', icon: '🎨' },
          { name: 'Library Corner', description: 'Cozy reading spaces with age-appropriate books', icon: '📚' },
          { name: 'Kitchen Area', description: 'Child-sized kitchen for practical life activities', icon: '🍳' },
          { name: 'Peace Garden', description: 'Quiet outdoor space for reflection and nature study', icon: '🌸' }
        ]
      },
      testimonials: {
        title: 'Parent Testimonials',
        testimonials: [
          {
            name: 'Mrs. Kemi Adebayo',
            role: 'Parent of Temi (Age 5)',
            content: 'The Montessori approach at Bright Stars has helped my daughter become confident, independent, and curious about the world around her.',
            avatar: '/demo/testimonials/parent4.jpg',
            rating: 5
          },
          {
            name: 'Mr. John Okafor',
            role: 'Parent of twins (Age 4)',
            content: 'The teachers truly understand child development. My twins have thrived in this nurturing environment.',
            avatar: '/demo/testimonials/parent5.jpg',
            rating: 5
          }
        ]
      },
      contact: {
        title: 'Visit Our School',
        subtitle: 'Experience the Montessori difference. Schedule a tour to see our children at work.'
      }
    },
    admission_settings: {
      isOpen: true,
      applicationDeadline: '2024-07-15',
      academicYear: '2024/2025',
      availableClasses: ['Toddler Community', 'Children\'s House', 'Elementary Lower', 'Elementary Upper'],
      requirements: [
        {
          class: 'All Programs',
          ageRange: '18 months - 12 years',
          requirements: ['Birth certificate', 'Medical records', 'Previous school report (if applicable)'],
          entrance_exam: false,
          interview: true
        }
      ],
      fees: [
        {
          class: 'Toddler Community',
          registrationFee: 30000,
          tuitionFee: 600000,
          developmentFee: 40000,
          uniformFee: 25000,
          booksFee: 15000,
          totalFee: 710000
        },
        {
          class: 'Children\'s House',
          registrationFee: 35000,
          tuitionFee: 750000,
          developmentFee: 50000,
          uniformFee: 30000,
          booksFee: 20000,
          totalFee: 885000
        }
      ],
      documents: [
        { name: 'Birth Certificate', description: 'Official birth certificate', required: true, applicableClasses: ['All'] },
        { name: 'Medical Records', description: 'Immunization records and health report', required: true, applicableClasses: ['All'] },
        { name: 'Passport Photographs', description: '2 recent passport photographs', required: true, applicableClasses: ['All'] }
      ],
      process: [
        { step: 1, title: 'School Visit', description: 'Schedule a visit to observe our classrooms', duration: '1 hour' },
        { step: 2, title: 'Application', description: 'Submit completed application form', duration: '1 day' },
        { step: 3, title: 'Child Observation', description: 'Child spends time in the classroom', duration: '2 hours' },
        { step: 4, title: 'Parent Conference', description: 'Discussion with head of school', duration: '45 minutes' },
        { step: 5, title: 'Enrollment', description: 'Complete enrollment process', duration: '1 day' }
      ],
      contactInfo: {
        admissionOfficer: 'Mrs. Grace Okonkwo',
        phone: '+234 803 456 7891',
        email: 'admissions@brightstars.edu.ng',
        officeHours: 'Monday - Friday: 8:30 AM - 3:30 PM'
      }
    }
  }
];

// Sample admission applications for demo
export const DEMO_ADMISSION_APPLICATIONS = [
  {
    id: 'app_001',
    school_id: 'school_1',
    student: {
      firstName: 'Adaeze',
      lastName: 'Okafor',
      middleName: 'Chioma',
      dateOfBirth: '2010-03-15',
      gender: 'Female' as const,
      nationality: 'Nigerian',
      stateOfOrigin: 'Anambra',
      religion: 'Christianity',
      bloodGroup: 'O+',
      medicalConditions: '',
      previousSchool: 'Little Angels Primary School',
      classApplyingFor: 'Year 7'
    },
    parent: {
      title: 'Mrs.',
      firstName: 'Ngozi',
      lastName: 'Okafor',
      relationship: 'Mother' as const,
      occupation: 'Lawyer',
      employer: 'Okafor & Associates',
      phone: '+234 803 123 4567',
      email: 'ngozi.okafor@email.com',
      address: '15 Admiralty Way, Lekki Phase 1, Lagos',
      alternativeContact: {
        name: 'Dr. Emeka Okafor',
        phone: '+234 802 987 6543',
        relationship: 'Father'
      }
    },
    applicationDetails: {
      preferredStartDate: '2024-09-01',
      hasSpecialNeeds: false,
      specialNeedsDescription: '',
      previousSchoolRecords: true,
      reasonForApplication: 'We are impressed by Greenwood\'s international curriculum and excellent reputation.',
      howDidYouHearAboutUs: 'Friend/Family',
      referredBy: 'Mrs. Adunni Bankole'
    },
    documents: {
      birthCertificate: '/demo/documents/birth-cert-001.pdf',
      passportPhotograph: '/demo/documents/passport-001.jpg',
      previousSchoolRecords: '/demo/documents/school-records-001.pdf',
      medicalRecords: '/demo/documents/medical-001.pdf',
      parentId: '/demo/documents/parent-id-001.pdf'
    },
    status: 'submitted' as const,
    submissionDate: '2024-01-15T10:30:00Z',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 'app_002',
    school_id: 'school_1',
    student: {
      firstName: 'Kemi',
      lastName: 'Johnson',
      middleName: '',
      dateOfBirth: '2012-07-22',
      gender: 'Female' as const,
      nationality: 'Nigerian',
      stateOfOrigin: 'Lagos',
      religion: 'Christianity',
      bloodGroup: 'A+',
      medicalConditions: 'Mild asthma',
      previousSchool: 'Corona School',
      classApplyingFor: 'Year 5'
    },
    parent: {
      title: 'Dr.',
      firstName: 'Funmi',
      lastName: 'Johnson',
      relationship: 'Mother' as const,
      occupation: 'Medical Doctor',
      employer: 'Lagos University Teaching Hospital',
      phone: '+234 805 234 5678',
      email: 'funmi.johnson@email.com',
      address: '42 Banana Island Road, Ikoyi, Lagos'
    },
    applicationDetails: {
      preferredStartDate: '2024-09-01',
      hasSpecialNeeds: false,
      specialNeedsDescription: '',
      previousSchoolRecords: true,
      reasonForApplication: 'Seeking a school with strong STEM programs and international exposure.',
      howDidYouHearAboutUs: 'Website',
      referredBy: ''
    },
    documents: {
      birthCertificate: '/demo/documents/birth-cert-002.pdf',
      passportPhotograph: '/demo/documents/passport-002.jpg',
      previousSchoolRecords: '/demo/documents/school-records-002.pdf',
      medicalRecords: '/demo/documents/medical-002.pdf'
    },
    status: 'under_review' as const,
    submissionDate: '2024-01-20T14:15:00Z',
    reviewDate: '2024-01-22T09:00:00Z',
    notes: 'Excellent academic records. Scheduled for interview.',
    created_at: '2024-01-20T14:15:00Z'
  },
  {
    id: 'app_003',
    school_id: 'school_2',
    student: {
      firstName: 'Tunde',
      lastName: 'Adeyemi',
      middleName: 'Olumide',
      dateOfBirth: '2011-11-08',
      gender: 'Male' as const,
      nationality: 'Nigerian',
      stateOfOrigin: 'Ogun',
      religion: 'Islam',
      bloodGroup: 'B+',
      medicalConditions: '',
      previousSchool: 'St. Gregory\'s College',
      classApplyingFor: 'JSS2'
    },
    parent: {
      title: 'Alhaji',
      firstName: 'Rasheed',
      lastName: 'Adeyemi',
      relationship: 'Father' as const,
      occupation: 'Business Owner',
      employer: 'Adeyemi Trading Company',
      phone: '+234 807 345 6789',
      email: 'rasheed.adeyemi@email.com',
      address: '28 Allen Avenue, Ikeja, Lagos'
    },
    applicationDetails: {
      preferredStartDate: '2024-09-01',
      hasSpecialNeeds: false,
      specialNeedsDescription: '',
      previousSchoolRecords: true,
      reasonForApplication: 'Heritage Grammar School has an excellent reputation for discipline and academic excellence.',
      howDidYouHearAboutUs: 'Advertisement',
      referredBy: ''
    },
    documents: {
      birthCertificate: '/demo/documents/birth-cert-003.pdf',
      passportPhotograph: '/demo/documents/passport-003.jpg',
      previousSchoolRecords: '/demo/documents/school-records-003.pdf'
    },
    status: 'accepted' as const,
    submissionDate: '2024-01-10T11:45:00Z',
    reviewDate: '2024-01-12T10:30:00Z',
    decisionDate: '2024-01-18T16:00:00Z',
    notes: 'Excellent performance in entrance exam and interview. Accepted for JSS2.',
    created_at: '2024-01-10T11:45:00Z'
  }
];

// Function to seed demo data
export const seedDemoSchoolData = async () => {
  try {
    // Insert demo schools
    const { error: schoolsError } = await supabase
      .from('schools')
      .upsert(DEMO_SCHOOLS, { onConflict: 'id' });

    if (schoolsError) {
      console.error('Error seeding schools:', schoolsError);
      return false;
    }

    // Insert demo admission applications
    const { error: applicationsError } = await supabase
      .from('admission_applications')
      .upsert(DEMO_ADMISSION_APPLICATIONS, { onConflict: 'id' });

    if (applicationsError) {
      console.error('Error seeding applications:', applicationsError);
      return false;
    }

    console.log('Demo school data seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return false;
  }
};

// Helper function to get demo school by slug
export const getDemoSchoolBySlug = (slug: string): SchoolInfo | null => {
  return DEMO_SCHOOLS.find(school => school.slug === slug) || null;
};

// Helper function to get demo applications for a school
export const getDemoApplicationsForSchool = (schoolId: string) => {
  return DEMO_ADMISSION_APPLICATIONS.filter(app => app.school_id === schoolId);
};
