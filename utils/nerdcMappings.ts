// utils/nerdcMappings.ts
// NERDC-aligned mappings for Nursery/Primary (ECCDE, Lower/Middle Basic) and Phonics scope

export type Stage = 'ECCDE' | 'Lower Basic' | 'Middle Basic';

export const NERDC_MAPPINGS = {
  subjects: {
    english_literacy: {
      display: 'English Studies / Literacy',
      stages: {
        ECCDE: {
          strands: [
            { code: 'LNG-1', name: 'Listening & Speaking' },
            { code: 'LNG-2', name: 'Pre-Reading/Phonics Awareness' },
            { code: 'LNG-3', name: 'Pre-Writing/Fine Motor' }
          ],
          sampleObjectives: [
            'Identify and produce common environmental sounds',
            'Recognize and name selected letter-sound correspondences',
            'Follow simple oral instructions and share materials'
          ],
          bloomVerbs: ['identify', 'repeat', 'match', 'say', 'trace']
        },
        'Lower Basic': {
          strands: [
            { code: 'ENG-LIT-1', name: 'Phonological Awareness & Phonics' },
            { code: 'ENG-LIT-2', name: 'Reading Fluency & Comprehension' },
            { code: 'ENG-LIT-3', name: 'Writing & Handwriting' }
          ],
          sampleObjectives: [
            'Blend CVC words with common graphemes (satpin set)',
            'Read simple sentences with 90–95% accuracy',
            'Write simple sentences using capitalization and full stop'
          ],
          bloomVerbs: ['blend', 'read', 'write', 'compose', 'answer']
        },
        'Middle Basic': {
          strands: [
            { code: 'ENG-READ-1', name: 'Comprehension Strategies' },
            { code: 'ENG-WRITE-1', name: 'Sentence & Paragraph Writing' },
            { code: 'ENG-LANG-1', name: 'Grammar & Vocabulary' }
          ],
          sampleObjectives: [
            'Infer meaning of new words from context',
            'Write a short paragraph with topic sentence and details',
            'Use basic punctuation accurately'
          ],
          bloomVerbs: ['infer', 'summarize', 'compose', 'edit']
        }
      }
    },
    mathematics_numeracy: {
      display: 'Mathematics / Numeracy',
      stages: {
        ECCDE: {
          strands: [
            { code: 'NUM-1', name: 'Counting & Number Sense' },
            { code: 'NUM-2', name: 'Sorting/Patterns' },
            { code: 'NUM-3', name: 'Measurement (informal)' }
          ],
          sampleObjectives: [
            'Count objects 1–20 with 1:1 correspondence',
            'Sort by color/shape/size and copy simple patterns',
            'Compare lengths using terms longer/shorter'
          ],
          bloomVerbs: ['count', 'sort', 'compare', 'match']
        },
        'Lower Basic': {
          strands: [
            { code: 'MTH-NUM-1', name: 'Number & Numeration' },
            { code: 'MTH-OPS-1', name: 'Basic Operations' },
            { code: 'MTH-MEA-1', name: 'Measurement & Time' },
            { code: 'MTH-GEO-1', name: 'Geometry & Shapes' },
            { code: 'MTH-DATA-1', name: 'Data Handling' }
          ],
          sampleObjectives: [
            'Add and subtract within 20 using concrete/pictorial methods',
            'Tell time to the hour and half hour',
            'Identify 2D shapes and their properties'
          ],
          bloomVerbs: ['add', 'subtract', 'tell', 'identify', 'solve']
        },
        'Middle Basic': {
          strands: [
            { code: 'MTH-NUM-2', name: 'Place Value & Fractions' },
            { code: 'MTH-OPS-2', name: 'Multi-step Operations' },
            { code: 'MTH-MEA-2', name: 'Perimeter/Area & Units' },
            { code: 'MTH-GEO-2', name: 'Angles & Symmetry' },
            { code: 'MTH-DATA-2', name: 'Bar Charts & Averages (intro)' }
          ],
          sampleObjectives: [
            'Compare fractions with like denominators',
            'Solve two-step word problems with operations',
            'Calculate perimeter of rectangles from side lengths'
          ],
          bloomVerbs: ['compare', 'calculate', 'solve', 'explain']
        }
      }
    },
    basic_science_technology: {
      display: 'Basic Science & Technology',
      stages: {
        ECCDE: {
          strands: [
            { code: 'BST-1', name: 'Observing Living/Non‑Living' },
            { code: 'BST-2', name: 'Senses & Safety' }
          ],
          sampleObjectives: [
            'Classify items as living/non‑living with reasons',
            'Describe safe behavior in classroom/playground'
          ],
          bloomVerbs: ['observe', 'classify', 'describe']
        },
        'Lower Basic': {
          strands: [
            { code: 'BST-NAT-1', name: 'Living Things & Environment' },
            { code: 'BST-MAT-1', name: 'Materials & Energy (intro)' },
            { code: 'BST-TECH-1', name: 'Technology & Simple Tools' }
          ],
          sampleObjectives: [
            'Identify parts/functions of plants/animals',
            'Test simple material properties (hard/soft, sink/float)',
            'Use simple tools safely for a task'
          ],
          bloomVerbs: ['identify', 'test', 'use', 'record']
        }
      }
    },
    social_studies: {
      display: 'Social Studies',
      stages: {
        'Lower Basic': {
          strands: [
            { code: 'SOS-1', name: 'Family & Community' },
            { code: 'SOS-2', name: 'Culture & Civic Responsibility' },
            { code: 'SOS-3', name: 'Environment & Safety' }
          ],
          sampleObjectives: [
            'Describe roles in the family/community',
            'Demonstrate polite/respectful behaviors',
            'Identify ways to keep the environment clean'
          ],
          bloomVerbs: ['describe', 'demonstrate', 'identify']
        }
      }
    },
    civic_education: {
      display: 'Civic Education',
      stages: {
        'Lower Basic': {
          strands: [
            { code: 'CIV-1', name: 'Values & Rights' },
            { code: 'CIV-2', name: 'Rules & Responsibilities' }
          ],
          sampleObjectives: [
            'Explain why rules are important at home/school',
            'Show ways to respect others in class'
          ],
          bloomVerbs: ['explain', 'show', 'role‑play']
        }
      }
    },
    cultural_creative_arts: {
      display: 'Cultural & Creative Arts (CCA)',
      stages: {
        ECCDE: {
          strands: [
            { code: 'CCA-ART-0', name: 'Free Drawing & Colouring' },
            { code: 'CCA-MOV-0', name: 'Music, Rhythm & Movement' }
          ],
          sampleObjectives: [
            'Express ideas through scribbles/colouring with basic control',
            'Respond to rhythm with simple movements/claps'
          ],
          bloomVerbs: ['draw', 'colour', 'move', 'sing']
        },
        'Lower Basic': {
          strands: [
            { code: 'CCA-ART-1', name: 'Drawing, Painting & Craft' },
            { code: 'CCA-MUS-1', name: 'Singing, Rhythm & Instruments' },
            { code: 'CCA-DRM-1', name: 'Drama & Role Play' }
          ],
          sampleObjectives: [
            'Create simple crafts using paper, clay or found materials',
            'Sing short songs on pitch and keep steady beat',
            'Act short scenes showing emotions and roles'
          ],
          bloomVerbs: ['create', 'perform', 'act', 'compose']
        },
        'Middle Basic': {
          strands: [
            { code: 'CCA-ART-2', name: 'Design & Elements of Art' },
            { code: 'CCA-MUS-2', name: 'Notation (intro) & Ensemble' },
            { code: 'CCA-DRM-2', name: 'Script & Stage Basics' }
          ],
          sampleObjectives: [
            'Use line/shape/colour to design simple posters',
            'Perform as a group maintaining rhythm/entries',
            'Create short scripted skits with cues'
          ],
          bloomVerbs: ['design', 'perform', 'script', 'present']
        }
      }
    },
    physical_health_education: {
      display: 'Physical & Health Education (PHE)',
      stages: {
        ECCDE: {
          strands: [
            { code: 'PHE-GM-0', name: 'Gross Motor & Coordination' },
            { code: 'PHE-HS-0', name: 'Health & Safety Habits' }
          ],
          sampleObjectives: [
            'Run, jump and balance safely during play',
            'Practice hand washing and tidy-up routines'
          ],
          bloomVerbs: ['run', 'jump', 'balance', 'practice']
        },
        'Lower Basic': {
          strands: [
            { code: 'PHE-GM-1', name: 'Games & Fundamental Skills' },
            { code: 'PHE-HS-1', name: 'Personal Hygiene & First Aid (intro)' }
          ],
          sampleObjectives: [
            'Demonstrate throwing, catching and simple game rules',
            'Identify healthy foods and basic first aid steps'
          ],
          bloomVerbs: ['demonstrate', 'identify', 'follow']
        }
      }
    },
    nigerian_languages: {
      display: 'Nigerian Languages (Yorùbá/Hausa/Igbo)',
      stages: {
        ECCDE: {
          strands: [
            { code: 'LAN-ORL-0', name: 'Oral Language & Songs' }
          ],
          sampleObjectives: [
            'Name common objects and greet appropriately in the language'
          ],
          bloomVerbs: ['say', 'greet', 'repeat']
        },
        'Lower Basic': {
          strands: [
            { code: 'LAN-ORL-1', name: 'Listening & Speaking' },
            { code: 'LAN-LIT-1', name: 'Alphabet/Orthography & Reading (intro)' },
            { code: 'LAN-WRT-1', name: 'Copying & Dictation' }
          ],
          sampleObjectives: [
            'Use common phrases for classroom communication',
            'Read simple words/sentences in the language',
            'Copy/dictate short sentences correctly'
          ],
          bloomVerbs: ['use', 'read', 'copy', 'respond']
        }
      }
    },
    computer_studies: {
      display: 'Computer Studies / ICT',
      stages: {
        'Lower Basic': {
          strands: [
            { code: 'ICT-BAS-1', name: 'Computer Parts & Functions' },
            { code: 'ICT-OPS-1', name: 'Basic Operations & Typing' },
            { code: 'ICT-SAFE-1', name: 'Digital Safety & Etiquette' }
          ],
          sampleObjectives: [
            'Identify mouse, keyboard, monitor and their uses',
            'Open/save a file and type short sentences',
            'State rules for safe and polite computer use'
          ],
          bloomVerbs: ['identify', 'operate', 'type', 'state']
        },
        'Middle Basic': {
          strands: [
            { code: 'ICT-PROD-2', name: 'Productivity Tools (Docs/Slides)' },
            { code: 'ICT-CODE-2', name: 'Coding/Logic (intro)' }
          ],
          sampleObjectives: [
            'Create a simple poster or slide deck with text/images',
            'Use block-based coding to follow a sequence'
          ],
          bloomVerbs: ['create', 'edit', 'sequence', 'debug']
        }
      }
    }
  },
  phonicsScope: {
    ECCDE_Phase1: {
      focus: 'Environmental sounds, rhythm & rhyme, alliteration, oral blending/segmenting',
      activities: ['Sound walks', 'Clap syllables', 'Name games', 'I-spy initial sounds']
    },
    LowerBasic_Phase2_3: {
      graphemes: [
        // Phase 2 (example set)
        's','a','t','p','i','n','m','d','g','o','c','k','ck','e','u','r','h','b','f','ff','l','ll','ss',
        // Phase 3 common digraphs
        'sh','ch','th','ng','ai','ee','igh','oa','oo','ar','or','ur','ow','oi','ear','air','ure','er'
      ],
      trickyWords: ['the','to','I','no','go','into','he','she','we','me','be','was','you','they','all','are','my','her'],
      strategies: ['Blend left‑to‑right', 'Segment to spell', 'Grapheme tiles/manipulatives', 'Dictation (CVC to words/sentences)']
    }
  }
} as const;

const SUBJECT_ALIASES: Record<string, keyof typeof NERDC_MAPPINGS.subjects> = {
  english: 'english_literacy',
  literacy: 'english_literacy',
  language: 'english_literacy',
  mathematics: 'mathematics_numeracy',
  numeracy: 'mathematics_numeracy',
  maths: 'mathematics_numeracy',
  'basic science': 'basic_science_technology',
  'basic science & technology': 'basic_science_technology',
  bst: 'basic_science_technology',
  'social studies': 'social_studies',
  civic: 'civic_education',
'civic education': 'civic_education',
  cca: 'cultural_creative_arts',
  'cultural & creative arts': 'cultural_creative_arts',
  'cultural and creative arts': 'cultural_creative_arts',
  cultural: 'cultural_creative_arts',
  'creative arts': 'cultural_creative_arts',
  phe: 'physical_health_education',
  'physical & health education': 'physical_health_education',
  'physical and health education': 'physical_health_education',
  pe: 'physical_health_education',
  ict: 'computer_studies',
  'computer studies': 'computer_studies',
  computer: 'computer_studies',
  yoruba: 'nigerian_languages',
  hausa: 'nigerian_languages',
  igbo: 'nigerian_languages'
};

export function getStageFromClassLevel(classLevel: string): Stage | null {
  if (!classLevel) return null;
  const lc = classLevel.toLowerCase();
  if (/(nursery|pre\s*-?kg|\bkg\b|kindergarten|basic\s*[1-3]|primary\s*[1-3]|lower\s*basic)/i.test(lc)) return 'ECCDE' as Stage || 'Lower Basic';
  if (/(primary\s*[4-6]|basic\s*[4-6]|middle\s*basic)/i.test(lc)) return 'Middle Basic';
  if (/(basic\s*[1-3]|primary\s*[1-3]|lower\s*basic)/i.test(lc)) return 'Lower Basic';
  return null;
}

export function normalizeSubjectKey(subjectName: string): keyof typeof NERDC_MAPPINGS.subjects | null {
  if (!subjectName) return null;
  const key = subjectName.trim().toLowerCase();
  if (SUBJECT_ALIASES[key]) return SUBJECT_ALIASES[key];
  // fuzzy contains
  for (const alias in SUBJECT_ALIASES) {
    if (key.includes(alias)) return SUBJECT_ALIASES[alias];
  }
  return null;
}

// Optional curriculum variants for state schemes (lightweight overlays)
const VARIANTS: Record<string, Partial<typeof NERDC_MAPPINGS.subjects>> = {
  'Lagos State Scheme': {
    basic_science_technology: {
      stages: {
        'Lower Basic': {
          strands: [
            { code: 'LAG-BST-ENV', name: 'Environment & Safety (Lagos emphasis)' }
          ]
        }
      }
    } as any,
    physical_health_education: {
      stages: {
        'Lower Basic': {
          strands: [
            { code: 'LAG-PHE-WATER', name: 'Water Safety & Hygiene' }
          ]
        }
      }
    } as any
  },
  'Ogun State Scheme': {
    cultural_creative_arts: {
      stages: {
        'Lower Basic': {
          strands: [
            { code: 'OGN-CCA-ADIRE', name: 'Adire/Tie-Dye (Local Craft Focus)' }
          ]
        }
      }
    } as any
  }
};

function applyVariant(curriculum: string | undefined, subjectKey: keyof typeof NERDC_MAPPINGS.subjects, stage: Stage, base: any) {
  if (!curriculum) return base;
  const overlay = VARIANTS[curriculum]?.[subjectKey] as any;
  if (!overlay?.stages?.[stage]?.strands) return base;
  const extra = overlay.stages[stage].strands as Array<{code:string;name:string}>;
  const merged = { ...base };
  merged.strands = [...(base.strands || []), ...extra];
  return merged;
}

export function getMappings(subjectName: string, classLevel: string, curriculum?: string): any | null {
  const stage = getStageFromClassLevel(classLevel);
  const subKey = normalizeSubjectKey(subjectName);
  if (!stage || !subKey) return null;
  const subj = (NERDC_MAPPINGS.subjects as any)[subKey];
  let stageMap = subj?.stages?.[stage] || null;
  if (!stageMap) return null;
  stageMap = applyVariant(curriculum, subKey, stage, stageMap);
  return {
    subject: subj.display,
    stage,
    strands: stageMap.strands,
    sampleObjectives: stageMap.sampleObjectives,
    bloomVerbs: stageMap.bloomVerbs
  };
}

export function getPhonicsPlan(classLevel: string): any | null {
  const stage = getStageFromClassLevel(classLevel);
  if (!stage) return null;
  if (stage === 'ECCDE') return (NERDC_MAPPINGS as any).phonicsScope.ECCDE_Phase1;
  if (stage === 'Lower Basic') return (NERDC_MAPPINGS as any).phonicsScope.LowerBasic_Phase2_3;
  return null;
}
