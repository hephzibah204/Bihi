export function getSubjectDomainPresets(subjectName: string, classLevel: string, term?: string): string[] {
  const s = (subjectName || '').toLowerCase();
  const t = term || '';
  const cl = (classLevel || '').toLowerCase();
  const map: Record<string, { any: string[]; first?: string[]; second?: string[]; third?: string[]; pri1?: string[]; pri2?: string[]; pri3?: string[]; pri4?: string[]; pri5?: string[]; pri6?: string[]; jss1?: string[]; jss2?: string[]; jss3?: string[] }> = {
    mathematics: {
      any: ['Number & numeration','Basic operations','Measurement & time','Geometry & shapes','Data handling'],
      first: ['Number lines 0–20','Basic addition/subtraction','Place value (tens/ones)','Skip counting by 2s/5s/10s'],
      second: ['Time to hour/half-hour','Length and mass (informal units)','2D shapes and properties','Fractions: halves/quarters'],
      third: ['Word problems (2-step)','Money: values and change','Bar charts: reading simple data','Patterns and sequences'],
      pri1: ['Counting 1–20','Compare more/less','Shapes: circle/square/triangle'],
      pri2: ['Place value tens/ones','Add/sub within 50','Time: hour/half-hour'],
      pri3: ['Multiplication facts','Fractions halves/quarters','Bar charts (intro)'],
      pri4: ['Place value to 1,000','Area/perimeter (intro)','Angles types'],
      pri5: ['Decimals tenths/hundredths','Symmetry & mirror lines','Word problems multi-step'],
      pri6: ['Averages (mean)','Data interpretation','Rates and ratios'],
      jss1: ['Integers and number line','Fractions & decimals','Algebraic expressions (intro)'],
      jss2: ['Linear equations','Geometry: triangles','Statistics: bar/pie charts'],
      jss3: ['Simultaneous equations (intro)','Mensuration','Probability (intro)']
    },
    english: {
      any: ['Phonological awareness','Reading comprehension','Writing and handwriting','Grammar and vocabulary'],
      first: ['CVC blending (satpin)','Sight words set A','Sentence building','Listening and speaking'],
      second: ['Paragraph basics','Comprehension strategies','Punctuation & capitalization','Story sequencing'],
      third: ['Parts of speech','Summarizing texts','Creative writing','Dictation and spelling'],
      pri1: ['Letter sounds','Sight words A','Simple sentences'],
      pri2: ['Short passages','Story retell','Basic grammar'],
      pri3: ['Paragraph writing','Comprehension questions','Parts of speech'],
      pri4: ['Narrative writing','Reading fluency','Grammar: tenses'],
      pri5: ['Expository writing','Summarizing','Punctuation & clauses'],
      pri6: ['Argumentative writing','Vocabulary development','Comprehension inference'],
      jss1: ['Reading strategies','Formal letters','Summary skills'],
      jss2: ['Speech writing','Literary devices (intro)','Comprehension analysis'],
      jss3: ['Report writing','Debate techniques','Grammar mastery']
    },
    science: {
      any: ['Living vs non‑living','Materials & energy (intro)','Technology & simple tools','Safety & senses'],
      first: ['Parts of a plant','Habitats: garden/home','Safety rules at school','Observations and records'],
      second: ['States of matter (intro)','Sources of energy (sun)','Simple machines (lever)','Materials: sink or float'],
      third: ['Human body basics','Food and nutrients','Weather and seasons','Record observations'],
      pri1: ['Animals vs plants','Senses & safety','Weather: sunny/rainy'],
      pri2: ['Plant parts & functions','Habitat basics','Energy: sun'],
      pri3: ['States of matter','Simple machines','Materials test'],
      pri4: ['Human body systems','Food & nutrition','Earth & environment'],
      pri5: ['Electricity (intro)','Heat & temperature','Microorganisms'],
      pri6: ['Ecology basics','Energy forms','Simple experiments'],
      jss1: ['Cell & living things','Matter & change','Forces & motion'],
      jss2: ['Energy transformations','Human physiology','Materials & mixtures'],
      jss3: ['Electric circuits','Heat transfer','Environmental science']
    },
    agricultural: {
      any: ['Importance of agriculture','Types of crops','Soil & tools','Animal husbandry (intro)'],
      first: ['Farm tools names','Planting seeds','Care of seedlings','Simple garden'],
      second: ['Soil types','Crop care','Weeds & pests (intro)','Harvest basics'],
      third: ['Livestock basics','Storage & preservation','Agric products','Farm safety'],
      pri1: ['Garden & crops','Tools & uses','Watering & care'],
      pri2: ['Soil & planting','Compost basics','Pests & simple control'],
      pri3: ['Crop varieties','Harvest & storage','Animal care basics'],
      jss1: ['Agric ecology','Soil science','Crop production (intro)'],
      jss2: ['Livestock production','Farm management','Pest & disease control'],
      jss3: ['Agric economics','Processing & storage','Marketing (intro)']
    },
    home_economics: {
      any: ['Personal hygiene','Food & nutrition','Clothing & textiles','Home safety'],
      first: ['Cleanliness routines','Simple meals','Clothes care','Kitchen safety'],
      second: ['Balanced diet (intro)','Meal planning','Sewing basics','Household chores'],
      third: ['Food preservation','Textile crafts','First aid (intro)','Family roles'],
      pri1: ['Hygiene basics','Healthy foods','Clothing care'],
      pri2: ['Simple recipes','Serving & manners','Laundry basics'],
      pri3: ['Meal planning','Food groups','Sewing practice'],
      jss1: ['Nutrition science','Food preparation','Home management'],
      jss2: ['Textiles & clothing','Food preservation','Household budgeting'],
      jss3: ['Catering basics','Family welfare','Entrepreneurship (intro)']
    },
    business_studies: {
      any: ['Commerce basics','Office practice','Entrepreneurship (intro)','Record keeping'],
      first: ['Buying & selling','Simple records','Goods & services','Pocket money'],
      second: ['Simple budgeting','Stores & inventory','Business roles','Customer service'],
      third: ['Entrepreneur ideas','Sales records','Receipts & invoices','Market survey'],
      pri3: ['Saving & spending','Goods vs services','Simple records'],
      pri4: ['Budget & plan','Mini projects','Basic marketing'],
      pri5: ['Profit/loss (intro)','Record books','Business plan (mini)'],
      pri6: ['Market research','Advertising basics','Entrepreneur showcase'],
      jss1: ['Commerce & trade','Office equipment','Filing & records'],
      jss2: ['Accounting basics','Banking & money','Sales processes'],
      jss3: ['Entrepreneurship','Marketing mix','Business plan']
    },
    civic: {
      any: ['Values & rights','Rules & responsibilities','Community & helpers','Environment & safety'],
      first: ['Honesty & respect','Roles in family','Rules at home/school','Safety and kindness'],
      second: ['Rights and responsibilities','Community helpers','Public property','Courtesy and manners'],
      third: ['Leadership & teamwork','Conflict resolution','Clean environment','Citizenship basics']
    },
    cca: {
      any: ['Drawing & painting','Music & rhythm','Drama & role play','Crafts & collage'],
      first: ['Primary colours','Pattern making','Paper craft basics','Puppet play'],
      second: ['Rhythm and clapping','Local songs','Clay modelling','Role‑play scenes'],
      third: ['Collage art','Simple ensemble','Storytelling and drama','Poster design']
    },
    computer: {
      any: ['Algorithms basics','Data types','Networking intro','Spreadsheets','Databases basics']
    }
  };
  const pickTerm = (m: { any: string[]; first?: string[]; second?: string[]; third?: string[]; [k: string]: any }) => {
    const base = m.any || [];
    const termKey = t.toLowerCase().includes('first') ? 'first' : t.toLowerCase().includes('second') ? 'second' : t.toLowerCase().includes('third') ? 'third' : undefined;
    const extraTerm = termKey ? (m as any)[termKey] || [] : [];
    const classKey = cl.includes('primary 1') || cl.includes('basic 1') ? 'pri1'
      : cl.includes('primary 2') || cl.includes('basic 2') ? 'pri2'
      : cl.includes('primary 3') || cl.includes('basic 3') ? 'pri3'
      : cl.includes('primary 4') || cl.includes('basic 4') ? 'pri4'
      : cl.includes('primary 5') || cl.includes('basic 5') ? 'pri5'
      : cl.includes('primary 6') || cl.includes('basic 6') ? 'pri6'
      : cl.includes('jss 1') || cl.includes('js 1') ? 'jss1'
      : cl.includes('jss 2') || cl.includes('js 2') ? 'jss2'
      : cl.includes('jss 3') || cl.includes('js 3') ? 'jss3'
      : undefined;
    const extraClass = classKey ? (m as any)[classKey] || [] : [];
    return Array.from(new Set([...(extraClass || []), ...(extraTerm || []), ...base])).slice(0, 12);
  };
  if (/math/.test(s)) return pickTerm(map.mathematics);
  if (/english|literacy|language/.test(s)) return pickTerm(map.english);
  if (/science|basic\s*science|technology|bst/.test(s)) return pickTerm(map.science);
  if (/agric/.test(s)) return pickTerm(map.agricultural);
  if (/home\s*economics|home\s*eco/.test(s)) return pickTerm(map.home_economics);
  if (/business|commerce/.test(s)) return pickTerm(map.business_studies);
  if (/civic/.test(s)) return pickTerm(map.civic);
  if (/creative|arts|cca/.test(s)) return pickTerm(map.cca);
  if (/computer|ict/.test(s)) return pickTerm(map.computer);
  return [];
}

export function getCurriculumSubjectPresets(subjectName: string, classLevel: string, curriculum: string, term?: string): string[] {
  const curr = (curriculum || '').toLowerCase();
  const cl = (classLevel || '').toLowerCase();
  if (/british/.test(curr)) {
    const ks = cl.includes('primary 1') || cl.includes('primary 2') || cl.includes('primary 3') || cl.includes('basic 1') || cl.includes('basic 2') || cl.includes('basic 3') ? 'ks1'
      : cl.includes('primary 4') || cl.includes('primary 5') || cl.includes('primary 6') || cl.includes('basic 4') || cl.includes('basic 5') || cl.includes('basic 6') ? 'ks2'
      : (cl.includes('jss') || cl.includes('js')) ? 'ks3' : 'any';
    const s = (subjectName || '').toLowerCase();
    const british: Record<string, { any: string[]; ks1?: string[]; ks2?: string[]; ks3?: string[] }> = {
      mathematics: {
        any: ['Number & place value','Addition & subtraction','Measurement','Geometry','Statistics'],
        ks1: ['Number bonds','Place value to 100','Time (o’clock/half past)','Shapes: 2D/3D'],
        ks2: ['Fractions & decimals','Area & perimeter','Angles and symmetry','Data interpretation'],
        ks3: ['Ratios & proportion','Algebra (intro)','Probability (intro)','Graphs']
      },
      english: {
        any: ['Reading comprehension','Writing composition','Grammar & punctuation','Spelling & vocabulary'],
        ks1: ['Phonics phases','Simple sentences','Punctuation basics','Story retelling'],
        ks2: ['Paragraph writing','Complex sentences','Summarising texts','Formal/informal writing'],
        ks3: ['Argumentative writing','Literary analysis','Note making','Report writing']
      },
      science: {
        any: ['Plants & animals','Materials & states','Forces & motion','Earth & space'],
        ks1: ['Seasonal changes','Everyday materials','Parts of plants','Animals & habitats'],
        ks2: ['States of matter','Electricity (intro)','Forces & magnets','Earth & space'],
        ks3: ['Cells & systems','Chemical changes','Energy transfers','Ecology']
      }
    };
    const key = /math/.test(s) ? 'mathematics' : /english|literacy|language/.test(s) ? 'english' : /science|basic\s*science|technology|bst/.test(s) ? 'science' : '';
    const m = key ? british[key] : undefined;
    if (!m) return [];
    const base = m.any || [];
    const extra = (m as any)[ks] || [];
    return Array.from(new Set([...(extra || []), ...base])).slice(0, 12);
  }
  // For NERDC and state schemes (Lagos/Ogun/NAPPS), reuse NERDC-aligned presets
  if (/nerdc|lagos|ogun|napps|scheme/.test(curr) || !curr) {
    return getSubjectDomainPresets(subjectName, classLevel, term);
  }
  // Default fallback
  return getSubjectDomainPresets(subjectName, classLevel, term);
}