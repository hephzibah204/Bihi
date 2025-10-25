// services/semanticSearchUtils.ts
// Utility functions for working with semantic search

import { getSemanticSearchEngine } from './semanticSearch';

/**
 * Pre-index common educational templates and responses
 * Call this during app initialization to populate the semantic search cache
 */
export function initializeSemanticCache(): void {
    const searchEngine = getSemanticSearchEngine();
    
    // Check if cache already initialized
    const stats = searchEngine.getStats();
    if (stats.documentCount > 0) {
        console.log(`Semantic cache already initialized with ${stats.documentCount} documents`);
        return;
    }
    
    console.log('Initializing semantic search cache with common templates...');
    
    const commonTemplates = [
        // Lesson Plans
        {
            id: 'lesson_math_fractions',
            prompt: 'Create a lesson plan for teaching fractions to primary 5 students',
            response: `**Lesson Plan: Introduction to Fractions**
**Grade Level:** Primary 5
**Duration:** 45 minutes
**Subject:** Mathematics

**Learning Objectives:**
• Understand what fractions represent
• Identify numerator and denominator
• Compare simple fractions
• Apply fractions to real-world scenarios

**Materials:**
• Paper circles for demonstration
• Colored markers
• Fraction cards
• Worksheets

**Introduction (10 minutes):**
Show a pizza and ask students how to share it equally among friends.

**Main Content (25 minutes):**
1. Define fractions with visual aids
2. Demonstrate numerator and denominator
3. Practice identifying fractions
4. Compare fractions using diagrams

**Assessment (8 minutes):**
Quick quiz with fraction identification and comparison

**Conclusion (2 minutes):**
Review key concepts and assign homework`,
            metadata: { confidence: 0.85, subject: 'mathematics', grade: 'primary5' }
        },
        {
            id: 'lesson_english_grammar',
            prompt: 'Lesson plan for teaching parts of speech to JSS1 students',
            response: `**Lesson Plan: Parts of Speech**
**Grade Level:** JSS1
**Duration:** 45 minutes
**Subject:** English Language

**Learning Objectives:**
• Identify 8 parts of speech
• Recognize parts of speech in sentences
• Use parts of speech correctly in writing

**Materials:**
• Sentence strips
• Word cards
• Grammar charts
• Practice worksheets

**Introduction (10 minutes):**
Play word classification game

**Main Content (25 minutes):**
1. Introduce nouns, verbs, adjectives, adverbs
2. Explain pronouns, prepositions, conjunctions, interjections
3. Give examples from familiar contexts
4. Group practice with sentence analysis

**Assessment (8 minutes):**
Identify parts of speech in sample sentences

**Conclusion (2 minutes):**
Summarize and assign homework`,
            metadata: { confidence: 0.85, subject: 'english', grade: 'jss1' }
        },
        
        // Report Card Comments
        {
            id: 'comment_excellent',
            prompt: 'Write a report card comment for excellent student performance',
            response: `[Student Name] has demonstrated exceptional academic excellence this term. Shows outstanding understanding of all subjects with consistent high-quality work. Actively participates in class discussions and serves as a positive role model for peers. Displays excellent time management and study habits. Continue this exemplary performance and consider taking on leadership responsibilities.`,
            metadata: { confidence: 0.9, category: 'report_comment' }
        },
        {
            id: 'comment_good',
            prompt: 'Report card comment for good student performance',
            response: `[Student Name] has shown commendable progress this term. Demonstrates solid understanding of course material with good class participation. Works well independently and collaborates effectively with classmates. With continued dedication and focus, has the potential to achieve even higher standards. Keep up the good work!`,
            metadata: { confidence: 0.85, category: 'report_comment' }
        },
        
        // Tutoring Responses
        {
            id: 'tutor_photosynthesis',
            prompt: 'Explain photosynthesis to a JSS2 student',
            response: `**Understanding Photosynthesis**

Photosynthesis is how plants make their own food using sunlight! Think of it like a cooking recipe:

**Ingredients needed:**
• Sunlight (energy source)
• Water (from roots)
• Carbon dioxide (from air)
• Chlorophyll (green pigment in leaves)

**The Process:**
1. Leaves absorb sunlight through chlorophyll
2. Roots absorb water from soil
3. Leaves take in carbon dioxide from air
4. These combine to produce glucose (food) and oxygen

**Simple Equation:**
Water + Carbon Dioxide + Sunlight → Glucose + Oxygen

**Why it matters:**
• Plants get food to grow
• We get oxygen to breathe
• Plants are the foundation of food chains

Would you like me to explain any part in more detail?`,
            metadata: { confidence: 0.9, category: 'tutoring', subject: 'biology' }
        },
        
        // Parent Chat Responses
        {
            id: 'parent_homework_help',
            prompt: 'How can I help my child with homework?',
            response: `**Supporting Your Child with Homework**

Here are effective strategies:

**Create a Good Environment:**
• Quiet, well-lit study space
• Remove distractions (TV, phone)
• Keep supplies readily available

**Establish Routine:**
• Set consistent homework time
• Break tasks into manageable chunks
• Schedule short breaks

**Provide Support:**
• Be available for questions
• Guide, don't do the work for them
• Encourage problem-solving
• Check completed work together

**Stay Connected:**
• Communicate with teachers
• Monitor assignment notebook
• Praise effort and improvement

**When to Seek Help:**
• If consistently struggling
• If homework takes excessive time
• If showing signs of stress

Remember, the goal is to develop independent learning skills!`,
            metadata: { confidence: 0.88, category: 'parent_advice' }
        },
        
        // Financial Analysis
        {
            id: 'finance_debt_analysis',
            prompt: 'Analyze school debt and payment patterns',
            response: `**School Debt Analysis**

**Key Metrics to Monitor:**
• Total outstanding fees
• Payment collection rate
• Average debt per student
• Overdue accounts (30, 60, 90+ days)

**Collection Strategies:**
• Send timely reminders before due dates
• Offer payment plans for families in need
• Implement early payment incentives
• Follow up promptly on overdue accounts

**Communication Approach:**
• Professional and respectful tone
• Clear payment information
• Multiple payment options
• Private discussions about financial difficulties

**Reporting:**
• Monthly debt summary reports
• Track payment trends
• Identify at-risk accounts early
• Maintain accurate records

Regular monitoring and proactive communication improve payment rates while maintaining positive relationships with families.`,
            metadata: { confidence: 0.82, category: 'financial_analysis' }
        },
        
        // Nigerian Curriculum Specific
        {
            id: 'nigeria_waec_prep',
            prompt: 'How to prepare students for WAEC examinations',
            response: `**WAEC Examination Preparation Strategy**

**Start Early (6 months before):**
• Review complete syllabus for each subject
• Identify weak areas needing focus
• Create study timetable

**Use Past Questions:**
• Practice with previous years' papers
• Understand question patterns
• Time yourself during practice

**Key Subjects Focus:**
• English Language (compulsory)
• Mathematics (compulsory)
• Subject-specific requirements

**Study Techniques:**
• Regular revision sessions
• Form study groups
• Use approved textbooks
• Practice essay writing
• Master objective question strategies

**Exam Tips:**
• Read instructions carefully
• Manage time wisely
• Answer all compulsory questions
• Check work before submitting

**School Support:**
• Organize extra lessons
• Mock examinations
• Provide past questions
• Counseling for exam anxiety

Consistent preparation and practice are keys to WAEC success!`,
            metadata: { confidence: 0.9, category: 'exam_prep', region: 'nigeria' }
        },
        {
            id: 'nigeria_curriculum_primary',
            prompt: 'Nigerian primary school curriculum overview',
            response: `**Nigerian Primary School Curriculum**

**Core Subjects:**
• English Language
• Mathematics
• Basic Science and Technology
• Social Studies
• Religious Studies (CRS/IRS)
• Creative Arts
• Physical and Health Education

**Language Studies:**
• Nigerian Languages (Hausa/Igbo/Yoruba)
• French (in some schools)

**Key Features:**
• Age-appropriate content
• Progressive skill development
• Practical, hands-on learning
• Nigerian cultural integration
• Character development

**Assessment:**
• Continuous assessment (40%)
• Terminal examinations (60%)
• Practical evaluations
• Project work

**Primary Leaving Examination:**
Administered at end of Primary 6 for transition to secondary school.

**Learning Objectives:**
• Literacy and numeracy foundations
• Critical thinking skills
• Nigerian values and culture
• Practical life skills`,
            metadata: { confidence: 0.88, category: 'curriculum', region: 'nigeria', level: 'primary' }
        }
    ];
    
    // Bulk index all templates
    searchEngine.bulkIndex(commonTemplates);
    
    const finalStats = searchEngine.getStats();
    // logger.info(`Semantic cache initialized with ${finalStats.documentCount} templates`);
}

/**
 * Search for similar prompts and responses
 */
export function findSimilarResponses(query: string, minSimilarity: number = 0.5, limit: number = 5) {
    const searchEngine = getSemanticSearchEngine();
    return searchEngine.search(query, limit, minSimilarity);
}

/**
 * Add a new response to the semantic cache
 */
export function cacheNewResponse(prompt: string, response: string, metadata?: any) {
    const searchEngine = getSemanticSearchEngine();
    const id = `cached_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    searchEngine.indexDocument(id, prompt, response, metadata);
}

/**
 * Get statistics about the semantic search cache
 */
export function getCacheStats() {
    const searchEngine = getSemanticSearchEngine();
    return searchEngine.getStats();
}

/**
 * Clear the semantic search cache
 */
export function clearSemanticCache() {
    const searchEngine = getSemanticSearchEngine();
    searchEngine.clear();
    // logger.info('Semantic cache cleared');
}

/**
 * Export cache for backup or transfer
 */
export function exportSemanticCache() {
    const searchEngine = getSemanticSearchEngine();
    return searchEngine.export();
}

/**
 * Import cache from backup
 */
export function importSemanticCache(data: any) {
    const searchEngine = getSemanticSearchEngine();
    searchEngine.import(data);
    // logger.info('Semantic cache imported successfully');
}

/**
 * Quality score a response based on various factors
 */
export function scoreResponseQuality(response: string): number {
    let score = 0.5; // Base score
    
    // Length scoring
    if (response.length > 500) score += 0.15;
    else if (response.length > 300) score += 0.1;
    else if (response.length < 100) score -= 0.15;
    
    // Structure scoring
    const hasHeaders = /#{1,6}|^\*\*.*\*\*$/m.test(response);
    const hasBullets = /^[-•*]\s/m.test(response);
    const hasNumbering = /^\d+\.\s/m.test(response);
    
    if (hasHeaders) score += 0.1;
    if (hasBullets || hasNumbering) score += 0.1;
    
    // Content quality indicators
    const hasExamples = /example|for instance|such as/i.test(response);
    const hasExplanation = /because|therefore|this means|in other words/i.test(response);
    
    if (hasExamples) score += 0.05;
    if (hasExplanation) score += 0.05;
    
    // Negative indicators
    if (/sorry|cannot|unable to/i.test(response)) score -= 0.2;
    if (/offline mode|basic template|limited/i.test(response)) score -= 0.15;
    
    return Math.max(0, Math.min(1, score));
}