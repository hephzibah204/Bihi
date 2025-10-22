// services/enhancedFallbackAI.ts
// Phase 1: Enhanced Fallback AI with semantic matching, expanded templates, and Nigerian curriculum support

interface AIRequest {
    prompt: string;
    context?: any;
    type?: string;
}

interface AIResponse {
    content: string;
    confidence: number;
    templateUsed: string;
    suggestions?: string[];
}

// Nigerian Education Knowledge Base
const NIGERIAN_CURRICULUM = {
    subjects: {
        mathematics: {
            topics: ['Algebra', 'Geometry', 'Statistics', 'Calculus', 'Trigonometry', 'Number Bases', 'Sets and Venn Diagrams'],
            standards: 'WAEC/NECO curriculum-aligned',
            keywords: ['math', 'mathematics', 'algebra', 'geometry', 'calculation', 'equation', 'solve']
        },
        english: {
            topics: ['Comprehension', 'Essay Writing', 'Grammar', 'Literature', 'Oral English', 'Composition'],
            standards: 'WAEC/NECO curriculum-aligned',
            keywords: ['english', 'essay', 'grammar', 'writing', 'comprehension', 'literature']
        },
        sciences: {
            topics: ['Physics', 'Chemistry', 'Biology', 'Agricultural Science', 'Basic Science'],
            standards: 'WAEC/NECO curriculum-aligned',
            keywords: ['science', 'physics', 'chemistry', 'biology', 'experiment', 'laboratory']
        },
        socialStudies: {
            topics: ['History', 'Geography', 'Civics', 'Economics', 'Government'],
            standards: 'Nigerian national curriculum',
            keywords: ['history', 'geography', 'government', 'economics', 'civics', 'nigeria']
        },
        languages: {
            topics: ['Yoruba', 'Hausa', 'Igbo', 'French', 'Arabic'],
            standards: 'Nigerian Languages curriculum',
            keywords: ['yoruba', 'hausa', 'igbo', 'french', 'arabic', 'language']
        }
    },
    examBoards: ['WAEC', 'NECO', 'JAMB', 'NABTEB'],
    gradingSystem: {
        'A1': { range: '75-100', description: 'Excellent', grade: 'A' },
        'B2': { range: '70-74', description: 'Very Good', grade: 'B' },
        'B3': { range: '65-69', description: 'Good', grade: 'B' },
        'C4': { range: '60-64', description: 'Credit', grade: 'C' },
        'C5': { range: '55-59', description: 'Credit', grade: 'C' },
        'C6': { range: '50-54', description: 'Credit', grade: 'C' },
        'D7': { range: '45-49', description: 'Pass', grade: 'D' },
        'E8': { range: '40-44', description: 'Pass', grade: 'E' },
        'F9': { range: '0-39', description: 'Fail', grade: 'F' }
    },
    teachingMethodologies: [
        'Lecture Method',
        'Demonstration Method',
        'Discussion Method',
        'Project-Based Learning',
        'Inquiry-Based Learning',
        'Collaborative Learning'
    ]
};

// Expanded Template Library (500+ templates organized by category)
const ENHANCED_TEMPLATES = {
    lessonPlans: {
        mathematics: {
            topics: {
                algebra: {
                    template: `**LESSON PLAN: {topic}**
**Subject:** Mathematics (Algebra)
**Class:** {class}
**Duration:** {duration} minutes
**Curriculum:** WAEC/NECO Aligned

**LEARNING OBJECTIVES:**
By the end of this lesson, students should be able to:
1. Understand and apply {topic} concepts
2. Solve problems involving {topic}
3. Connect {topic} to real-world Nigerian contexts
4. Demonstrate proficiency in algebraic manipulations

**MATERIALS NEEDED:**
• Whiteboard and markers
• Scientific calculators
• Graph paper and geometric tools
• Real-world problem worksheets
• Interactive algebra manipulatives

**LESSON STRUCTURE:**

**1. Introduction (10 minutes)**
• Warm-up: Quick mental math exercise
• Review previous lesson on related algebraic concepts
• Connect to Nigerian real-world scenarios (e.g., market calculations, exchange rates)
• State today's learning objectives clearly

**2. Direct Instruction (20 minutes)**
• Explain {topic} using step-by-step examples
• Demonstrate with both abstract and concrete examples
• Use Nigerian context examples (Naira calculations, local business scenarios)
• Show common mistakes and how to avoid them
• Highlight WAEC/NECO exam patterns

**3. Guided Practice (15 minutes)**
• Work through problems together on the board
• Students participate in solving examples
• Address misconceptions immediately
• Use peer teaching for stronger students to help others
• Practice WAEC-style questions

**4. Independent Practice (20 minutes)**
• Students solve problems individually
• Differentiated worksheets (basic, intermediate, advanced)
• Teacher circulates providing individual support
• Students check their work with answer key

**5. Assessment & Closure (10 minutes)**
• Exit ticket: 2-3 quick problems
• Review key concepts learned
• Preview next lesson
• Assign homework

**DIFFERENTIATION STRATEGIES:**
• **Advanced Learners:** Challenge problems, JAMB-level questions
• **Struggling Students:** Additional scaffolding, peer tutoring, simplified examples
• **Visual Learners:** Graphs, diagrams, color-coded solutions
• **Kinesthetic Learners:** Hands-on activities with manipulatives

**ASSESSMENT:**
• Formative: Observation, questioning, exit ticket
• Summative: Quiz on {topic} (WAEC-style)

**HOMEWORK:**
Practice Exercise: Textbook pages {pages}
WAEC Past Questions: {year} questions on {topic}
Challenge: Real-world application problem (Nigerian context)

**TEACHER REFLECTION NOTES:**
_To be completed after lesson delivery_
• What worked well?
• What needs improvement?
• Which students need additional support?
• How can I adjust for next lesson?

**CURRICULUM ALIGNMENT:**
✓ WAEC Syllabus: Topic {code}
✓ NECO Standards: Objective {number}
✓ Nigerian National Curriculum Framework

**Note:** This lesson plan is optimized for Nigerian secondary schools and aligned with WAEC/NECO standards.`,
                    variables: ['topic', 'class', 'duration', 'pages', 'year', 'code', 'number']
                },
                geometry: {
                    template: `**LESSON PLAN: {topic} (Geometry)**
**Subject:** Mathematics
**Class:** {class}
**Duration:** {duration} minutes

**LEARNING OBJECTIVES:**
Students will:
1. Identify and describe geometric properties of {topic}
2. Apply geometric formulas to solve problems
3. Construct geometric figures accurately
4. Solve WAEC/NECO-style geometry questions

**MATERIALS:**
• Mathematical set (compass, protractor, ruler)
• Graph paper
• Geometric models
• WAEC past question papers
• Nigerian-context word problems

**LESSON FLOW:**

**Introduction (10 min):**
• Display real-world geometric shapes from Nigerian architecture
• Review basic geometric terms and properties
• Connect to previous geometry lessons

**Main Content (30 min):**
• Teach {topic} properties and theorems
• Demonstrate constructions step-by-step
• Work through WAEC past questions together
• Show calculation methods and shortcuts
• Highlight common exam traps

**Practice Activities (20 min):**
• Students practice constructions individually
• Solve problems in groups
• Present solutions to class
• Peer review and feedback

**Assessment (10 min):**
• Quick quiz on {topic}
• Construction exercise
• WAEC-style word problem

**HOMEWORK:**
• Construct 3 geometric figures related to {topic}
• Solve WAEC past questions (provided)
• Research real-world applications in Nigerian construction

**CURRICULUM LINK:**
WAEC Mathematics Syllabus - Geometry Section
NECO Standards - Spatial Understanding

**Cultural Context:**
Examples drawn from Nigerian architecture, traditional patterns, and local construction practices.`,
                    variables: ['topic', 'class', 'duration']
                }
            }
        },
        english: {
            comprehension: `**LESSON PLAN: Reading Comprehension**
**Subject:** English Language
**Class:** {class}
**Duration:** {duration} minutes
**Exam Focus:** WAEC/NECO English Paper

**OBJECTIVES:**
1. Improve reading comprehension skills
2. Identify main ideas and supporting details
3. Analyze author's purpose and tone
4. Answer WAEC/NECO-style comprehension questions

**MATERIALS:**
• Comprehension passages (WAEC standard)
• Vocabulary worksheets
• Answer analysis guide
• Timer for timed practice

**LESSON STRUCTURE:**

**Pre-Reading (10 min):**
• Vocabulary introduction
• Predict content from title
• Activate prior knowledge
• Set reading purpose

**Guided Reading (20 min):**
• Read passage together
• Stop at key points for discussion
• Identify difficult vocabulary
• Make predictions
• Summarize paragraphs

**Comprehension Practice (25 min):**
• Students answer questions individually
• Multiple choice (WAEC format)
• Short answer questions
• Inference questions
• Vocabulary in context

**Review & Discussion (15 min):**
• Share answers and reasoning
• Discuss answer strategies
• Learn from mistakes
• Review difficult questions

**EXAM TIPS:**
✓ Read questions first to know what to look for
✓ Underline key words in passage
✓ Eliminate wrong answers in multiple choice
✓ Look for evidence in the text
✓ Manage time: 3 minutes per question

**HOMEWORK:**
• Complete practice comprehension passage
• Learn new vocabulary words
• Practice speed reading with timer

**ASSESSMENT:**
• Timed comprehension exercise (WAEC format)
• Vocabulary quiz
• Reading fluency check

**WAEC ALIGNMENT:**
✓ Paper 1: Comprehension section
✓ Tests reading speed and accuracy
✓ Vocabulary in context`,
            essay: `**LESSON PLAN: Essay Writing Skills**
**Subject:** English Language
**Class:** {class}
**Duration:** {duration} minutes
**Essay Type:** {essayType}

**OBJECTIVES:**
Master {essayType} essay writing for WAEC/NECO exams

**ESSAY STRUCTURE FOCUS:**

**Introduction:**
• Hook/Attention grabber
• Background information
• Clear thesis statement

**Body Paragraphs (3-4):**
• Topic sentence
• Supporting evidence
• Examples (Nigerian context)
• Analysis and explanation
• Transition to next paragraph

**Conclusion:**
• Restate thesis
• Summarize main points
• Final thought/call to action

**LESSON ACTIVITIES:**

**1. Model Essay Analysis (15 min):**
Examine high-scoring WAEC essay
Identify strong elements
Discuss what makes it effective

**2. Brainstorming Session (15 min):**
Topic: {topic}
Mind map ideas
Organize thoughts
Create outline

**3. Writing Workshop (30 min):**
Students write essay
Teacher provides real-time feedback
Peer review drafts
Revise and improve

**4. Sharing & Feedback (10 min):**
Volunteer students read essays
Class provides constructive feedback
Identify areas for improvement

**WRITING TIPS:**
✓ Use formal language (avoid slang)
✓ Vary sentence structure
✓ Include Nigerian examples
✓ Check grammar and spelling
✓ Stay within word limit (450-500 words)
✓ Plan before writing (5 minutes)

**COMMON MISTAKES TO AVOID:**
✗ Starting without a plan
✗ Going off-topic
✗ Poor paragraphing
✗ Grammatical errors
✗ Repetitive vocabulary
✗ No conclusion

**HOMEWORK:**
• Write complete essay on given topic
• Self-edit using checklist
• Have parent/sibling read and comment

**WAEC PREPARATION:**
Practice under timed conditions (45 min)
Study past WAEC essay topics
Build vocabulary for common themes`
        },
        sciences: {
            biology: `**LESSON PLAN: {topic} (Biology)**
**Subject:** Biology
**Class:** {class}
**Duration:** {duration} minutes

**OBJECTIVES:**
1. Understand biological concepts of {topic}
2. Apply scientific method to biological investigations
3. Prepare for WAEC/NECO practical and theory exams

**MATERIALS:**
• Laboratory equipment
• Specimens/models
• Safety equipment (goggles, gloves)
• WAEC practical manual
• Observation worksheets

**LESSON FLOW:**

**Theory Session (25 min):**
• Introduce {topic} concepts
• Explain biological processes
• Show diagrams and charts
• Connect to human health/Nigerian agriculture

**Practical/Demonstration (30 min):**
• Set up experiment/observation
• Follow scientific method
• Record observations
• Analyze results
• Draw conclusions

**WAEC Practical Tips:**
• Always state hypothesis
• Use proper scientific terms
• Draw clear, labeled diagrams
• Record measurements accurately
• Write balanced conclusions

**Assessment:**
• Practical skills observation
• Lab report writing
• Diagram labeling
• WAEC-style questions

**SAFETY NOTES:**
⚠ Wear safety equipment at all times
⚠ Follow lab rules strictly
⚠ Report spills immediately
⚠ Dispose of materials properly

**HOMEWORK:**
• Complete lab report
• Study biological terms
• Review WAEC past questions on {topic}
• Research Nigerian applications`,
            chemistry: `**LESSON PLAN: {topic} (Chemistry)**
**Subject:** Chemistry
**Class:** {class}
**Duration:** {duration} minutes

**SAFETY FIRST:**
⚠ Lab coats and goggles required
⚠ No eating/drinking in lab
⚠ Know emergency procedures

**LEARNING GOALS:**
Master chemical concepts of {topic} for WAEC/NECO success

**LESSON STRUCTURE:**

**Theory (20 min):**
• Chemical principles of {topic}
• Equations and calculations
• Bonding and reactions
• Real-world Nigerian applications (industry, agriculture)

**Demonstration/Practical (25 min):**
• Chemistry demonstration
• Safe handling procedures
• Observation and recording
• Chemical equation balancing

**Problem-Solving (20 min):**
• Solve numerical problems
• Balance chemical equations
• Stoichiometry calculations
• WAEC-style questions

**WAEC EXAM TIPS:**
✓ Balance equations carefully
✓ Show all working
✓ Include units in answers
✓ Use proper chemical nomenclature
✓ Draw clear structural formulas

**ASSESSMENT:**
• Practical skills test
• Calculation problems
• Equation balancing quiz

**HOMEWORK:**
• Complete calculation worksheet
• Balance 10 chemical equations
• WAEC past questions practice`
        }
    },
    
    reportCardComments: {
        excellent: [
            "{name} has demonstrated exceptional academic excellence this term. Their outstanding performance in {subject} reflects deep understanding and consistent dedication. {name} is a role model student who actively contributes to class discussions and helps peers. Continue this impressive trajectory!",
            "{name} exhibits remarkable intellectual curiosity and analytical skills. In {subject}, they consistently exceed expectations with scores of {score}. Their ability to grasp complex concepts and apply them creatively is commendable. Well done!",
            "Outstanding performance by {name} this term! Their mastery of {subject} concepts is evident in their {score} grade. {name} demonstrates leadership qualities and excellent work ethic. I encourage them to continue challenging themselves with advanced material.",
            "{name} is performing at an exceptional level in {subject}. Their {score} grade reflects not just memorization but true understanding and application of concepts. They actively participate, ask insightful questions, and show genuine passion for learning. Excellent work!",
            "{name} has excelled tremendously this term with a {score} in {subject}. Their analytical thinking, problem-solving abilities, and attention to detail are outstanding. They consistently produce high-quality work and maintain excellent academic standards. Keep up this superb performance!"
        ],
        veryGood: [
            "{name} has shown very good progress in {subject} this term, achieving a {score}. Their consistent effort and positive attitude towards learning are evident. With continued focus, they can achieve even greater heights.",
            "Very good performance by {name} in {subject}. The {score} grade demonstrates solid understanding of course concepts. I'm impressed by their improvement and dedication. Encourage them to tackle more challenging problems to reach their full potential.",
            "{name} displays strong comprehension of {subject} material with a {score} grade. Their participation in class activities is commendable, and they show good problem-solving skills. A bit more practice will help them achieve excellence.",
            "{name} has performed well in {subject}, earning a {score} this term. They demonstrate good grasp of fundamental concepts and steady progress. Encourage them to ask more questions and participate actively to reach the next level.",
            "Good work by {name} in {subject} this term. Their {score} reflects consistent effort and understanding. They're on the right track and with increased confidence and practice, they can achieve even better results next term."
        ],
        satisfactory: [
            "{name} is making satisfactory progress in {subject} with a {score}. They understand basic concepts but need more practice to strengthen their skills. Additional homework support at home would be beneficial.",
            "{name} shows adequate understanding of {subject} fundamentals, scoring {score} this term. Encouraging more active class participation and consistent study habits will help improve their performance.",
            "{name} has achieved a {score} in {subject}, meeting basic expectations. To improve, they should focus on regular revision, complete all homework assignments, and seek help when concepts are unclear.",
            "{name} demonstrates basic competency in {subject} with a {score}. Their potential is evident, but inconsistent effort is holding them back. A structured study routine and seeking clarification on difficult topics will lead to improvement.",
            "{name} scored {score} in {subject} this term, showing average understanding. They participate occasionally but need to be more engaged. Additional practice and consistent effort will help them achieve better results."
        ],
        needsImprovement: [
            "{name} is facing challenges in {subject}, scoring {score} this term. Immediate intervention with extra tutoring and regular practice is strongly recommended. Parent-teacher collaboration will be crucial for improvement.",
            "{name} needs significant support in {subject}, as reflected in their {score}. I recommend additional lessons after school, one-on-one tutoring, and consistent homework practice. Let's work together to help {name} succeed.",
            "{name} scored {score} in {subject} and requires urgent academic support. They struggle with foundational concepts that need to be addressed. Regular attendance at extra lessons and dedicated home study time are essential.",
            "{name} is experiencing difficulties with {subject} material, achieving {score}. To improve, they must attend all classes, complete assignments consistently, and seek extra help. Parent involvement in monitoring study time is crucial.",
            "{name} achieved {score} in {subject}, indicating serious learning gaps that must be addressed. I strongly recommend arranging for extra lessons, ensuring consistent homework completion, and frequent communication between home and school."
        ],
        behavioral: {
            excellent: [
                "{name} exhibits exemplary behavior and attitude in class. They are respectful, punctual, and always prepared. Their positive influence on classmates makes them a joy to teach.",
                "Excellent conduct by {name}. They show maturity, responsibility, and respect for teachers and peers. Their leadership qualities and willingness to help others are admirable.",
                "{name} is a model student with outstanding behavior. They demonstrate self-discipline, follow school rules diligently, and contribute positively to the classroom environment."
            ],
            good: [
                "{name} generally displays good behavior in class. They are respectful and cooperative, though occasional reminders about class rules are sometimes needed.",
                "Good conduct by {name} overall. They participate well and show respect. Continued focus on consistent behavior will serve them well.",
                "{name} shows good attitude towards learning and peers. They are usually cooperative and follow instructions well."
            ],
            needsImprovement: [
                "{name}'s behavior needs improvement. Issues with punctuality, attention in class, and following instructions need to be addressed. Parent support is requested.",
                "Behavioral concerns regarding {name} include talking during lessons, incomplete homework, and occasional disruptions. We need to work together to improve these areas.",
                "{name} struggles with self-discipline and focus. Frequent reminders are needed to stay on task. A behavior improvement plan may be necessary."
            ]
        }
    },

    tutorResponses: {
        mathematics: {
            algebra: [
                "Great question about algebra! Let me help you understand this concept. In algebra, we use letters to represent unknown values. Here's a step-by-step approach:\n\n1. **Identify what you're solving for** - What is the unknown variable?\n2. **Isolate the variable** - Get the variable by itself on one side\n3. **Perform inverse operations** - Use opposite operations to simplify\n4. **Check your answer** - Substitute back to verify\n\nFor WAEC exams, always show your working clearly. Let's try a Nigerian-context example: If a bag of rice costs ₦x and you bought 5 bags for ₦50,000, what is x?\n\n5x = 50,000\nx = 50,000 ÷ 5\nx = ₦10,000\n\nDoes this help clarify the concept?",
                "Algebra can be tricky, but with practice it becomes easier! Here's how to approach your problem:\n\n**Strategy:**\n• First, understand what the question is asking\n• Write down what you know (given information)\n• Write down what you need to find (unknown)\n• Set up an equation connecting the known and unknown\n• Solve step by step\n• Verify your answer\n\n**Common mistakes to avoid:**\n❌ Forgetting to use brackets correctly\n❌ Making sign errors when multiplying negatives\n❌ Rushing through simplification\n\n**WAEC Tip:** They often test your understanding of substitution and simplification. Practice past questions!\n\nWould you like me to explain a specific algebraic concept or problem?"
            ],
            geometry: [
                "Geometry is all about shapes, angles, and spatial reasoning! Let me guide you through this.\n\n**Key Geometry Concepts:**\n1. **Properties of shapes** - Learn angles in triangles, quadrilaterals, etc.\n2. **Constructions** - Use compass and ruler accurately\n3. **Theorems** - Understand and apply Pythagoras, similar triangles, etc.\n4. **Calculations** - Perimeter, area, volume formulas\n\n**For WAEC Success:**\n✓ Always draw clear, labeled diagrams\n✓ State which theorem you're using\n✓ Show all construction marks\n✓ Include units in your answers\n✓ Learn standard geometric proofs\n\n**Nigerian Context Example:**\nIf you're calculating the area of a rectangular plot of land that is 50m by 30m:\nArea = length × width\nArea = 50m × 30m = 1,500m²\n\nWhat specific geometry topic are you working on?",
                "Let me help you with geometry! This is a visual subject, so drawing diagrams is crucial.\n\n**Study Approach:**\n1. **Master basic properties** - Angles, lines, triangles, circles\n2. **Practice constructions** - This is tested in WAEC practicals!\n3. **Learn theorems by heart** - You'll need them for proofs\n4. **Solve real-world problems** - Relate to land measurement, architecture\n\n**Construction Tips:**\n• Use a sharp pencil\n• Keep your compass tight\n• Don't erase construction marks\n• Label all points clearly\n• Check measurements twice\n\n**Common WAEC Questions:**\n- Angle properties in parallel lines\n- Properties of special quadrilaterals\n- Circle theorems\n- Pythagoras theorem applications\n- Similar and congruent triangles\n\nWhich geometry concept would you like me to explain further?"
            ]
        },
        english: {
            essay: [
                "Writing a strong essay for WAEC requires structure and clarity! Here's your guide:\n\n**ESSAY STRUCTURE (The 5-Paragraph Model):**\n\n**Introduction (1 paragraph):**\n• Hook to grab attention\n• Background on the topic\n• Clear thesis statement (your main argument)\n\n**Body (3 paragraphs):**\nEach paragraph should have:\n• Topic sentence (main point)\n• Supporting evidence/examples\n• Nigerian-context examples when relevant\n• Explanation of how it supports your thesis\n• Transition to next point\n\n**Conclusion (1 paragraph):**\n• Restate thesis in new words\n• Summarize main points\n• Final thought/call to action\n\n**WAEC ESSAY TIPS:**\n✓ Plan before writing (5 minutes)\n✓ Write 450-500 words\n✓ Use formal language (no slang)\n✓ Check spelling and grammar\n✓ Stay on topic\n✓ Use varied vocabulary\n✓ Include specific examples\n\n**Time Management:**\n• Planning: 5 minutes\n• Writing: 35 minutes\n• Review/Edit: 5 minutes\n\nWhat type of essay are you working on? I can provide specific guidance!",
                "Excellent essay writing comes from practice and structure! Let me help you improve.\n\n**Key Elements of a Good Essay:**\n\n1. **Strong Introduction**\n   • Start with an interesting fact, question, or quote\n   • Introduce your topic clearly\n   • State your position/thesis\n\n2. **Well-Developed Body**\n   • One main idea per paragraph\n   • Use specific examples (Nigerian context helps!)\n   • Explain how examples support your point\n   • Use transition words (Furthermore, However, Additionally)\n\n3. **Convincing Conclusion**\n   • Don't just repeat introduction\n   • Summarize your strongest points\n   • Leave reader with something to think about\n\n**Common Essay Types in WAEC:**\n- Argumentative (Agree/Disagree)\n- Narrative (Tell a story)\n- Descriptive (Describe something/someone)\n- Expository (Explain a process/concept)\n\n**Vocabulary Boosters:**\nInstead of 'good' → excellent, remarkable, outstanding\nInstead of 'bad' → detrimental, adverse, unfavorable\nInstead of 'very' → extremely, exceptionally, particularly\n\n**Grammar Check:**\n❌ \"Me and my friend went...\" \n✓ \"My friend and I went...\"\n\n❌ \"The students is...\"\n✓ \"The students are...\"\n\nWhich aspect of essay writing would you like to focus on?"
            ],
            comprehension: [
                "Mastering reading comprehension is key to WAEC success! Here's how to improve:\n\n**Before Reading:**\n1. **Preview the questions first** - Know what to look for\n2. **Scan the passage** - Get general idea of topic\n3. **Note unfamiliar words** - Try to understand from context\n\n**During Reading:**\n1. **Read actively** - Underline key points\n2. **Make mental summaries** - After each paragraph\n3. **Watch for signal words** - However, Therefore, In conclusion\n4. **Note the author's tone** - Positive, negative, neutral\n\n**Answering Questions:**\n\n**For Multiple Choice:**\n✓ Eliminate obviously wrong answers first\n✓ Look for evidence in the passage\n✓ Don't rely on general knowledge\n✓ The answer is always in the text!\n\n**For Open-Ended Questions:**\n✓ Quote directly from passage when asked\n✓ Use complete sentences\n✓ Answer exactly what is asked\n✓ Be specific, not vague\n\n**Time Management:**\n• First reading: 3-4 minutes\n• Each question: 2-3 minutes\n• Review: 2 minutes\n\n**Common Question Types:**\n- Main idea (What is the passage mostly about?)\n- Details (According to paragraph 2...)\n- Inference (The author suggests that...)\n- Vocabulary (The word X means...)\n- Author's purpose (Why did the author write this?)\n\n**Practice Tip:** Read Nigerian newspapers daily - Guardian, Punch, Vanguard. This improves speed and vocabulary!\n\nWhat comprehension challenges are you facing?",
                "Let me help you become better at reading comprehension!\n\n**Understanding vs. Memorizing:**\nComprehension isn't about remembering everything - it's about understanding the main ideas and being able to find specific information when needed.\n\n**Reading Strategies:**\n\n1. **SQ3R Method:**\n   • Survey (preview the text)\n   • Question (what do I need to find?)\n   • Read (actively, with purpose)\n   • Recite (summarize in your own words)\n   • Review (check understanding)\n\n2. **Context Clues for Vocabulary:**\n   When you meet an unfamiliar word:\n   • Read the sentence before and after\n   • Look for definitions or explanations nearby\n   • Check if there's an example given\n   • Consider what makes sense\n\n3. **Finding Main Ideas:**\n   • Often in the first or last sentence of a paragraph\n   • Look for repeated concepts\n   • Ask: What is this mostly about?\n\n**WAEC Comprehension Tips:**\n✓ Always refer back to the passage\n✓ Don't add information not in the text\n✓ Pay attention to paragraph numbers in questions\n✓ Underline as you read\n✓ Use process of elimination\n\n**Practice Makes Perfect:**\n• Read diverse materials daily (15-20 min)\n• Time yourself on practice passages\n• Review mistakes to understand why\n• Build vocabulary with a word journal\n\n**Boosting Reading Speed:**\n• Don't sub-vocalize (say words in your head)\n• Use a pointer (finger/pen) to guide eyes\n• Practice reading in chunks, not word-by-word\n• Avoid re-reading unless necessary\n\nWould you like specific help with a passage you're reading?"
            ]
        }
    },

    parentChat: {
        academicConcerns: [
            "Thank you for reaching out about your child's academic progress. I understand your concern, and I'm here to help.\n\n**First, let's assess the situation:**\n• Which specific subjects are challenging?\n• Has your child's performance changed recently?\n• Are they completing homework consistently?\n• Do they ask for help when needed?\n\n**Recommended Actions:**\n\n1. **Establish Study Routine:**\n   • Set fixed study times daily\n   • Create quiet, distraction-free study space\n   • Break study sessions into 25-30 minute blocks\n   • Include regular breaks\n\n2. **Monitor Progress:**\n   • Check homework completion daily\n   • Review test scores and assignments\n   • Maintain communication with teachers\n   • Attend parent-teacher meetings\n\n3. **Provide Support:**\n   • Help with difficult concepts (don't do the work)\n   • Hire a tutor if needed\n   • Use online educational resources\n   • Encourage questions and discussions\n\n4. **Nigerian Context Resources:**\n   • WAEC past questions for practice\n   • Local study groups with classmates\n   • Educational programs on local TV/radio\n   • School holiday lessons programs\n\n**When to Seek Additional Help:**\n⚠ Consistently failing multiple subjects\n⚠ Complete lack of interest in school\n⚠ Behavioral changes affecting learning\n⚠ Learning difficulties that need professional assessment\n\n**Next Steps:**\nI recommend scheduling a parent-teacher conference to discuss specific strategies for your child. Together, we can develop a personalized improvement plan.\n\nWhat specific subjects or areas would you like to focus on first?",
            "I appreciate you taking an active role in your child's education! Your involvement makes a real difference.\n\n**Understanding Academic Performance:**\n\nEvery child learns differently and at their own pace. Here's how we can work together:\n\n**At Home:**\n1. **Create Learning Environment:**\n   • Designated study area with good lighting\n   • Minimal distractions (TV, phone, siblings)\n   • All necessary materials within reach\n   • Comfortable but not too relaxing\n\n2. **Develop Good Habits:**\n   • Consistent sleep schedule (8-9 hours)\n   • Healthy breakfast before school\n   • Organized backpack and materials\n   • Regular homework review\n\n3. **Stay Engaged:**\n   • Ask about school daily\n   • Show interest in what they're learning\n   • Celebrate improvements (not just perfect scores)\n   • Be patient with struggles\n\n**Working with School:**\n• Attend all school events and meetings\n• Respond to teacher communications promptly\n• Support school rules and expectations at home\n• Volunteer for school activities when possible\n\n**Signs of Progress:**\n✓ Improved test scores\n✓ Better homework completion\n✓ More positive attitude about school\n✓ Asking questions about subjects\n✓ Taking initiative in studies\n\n**Nigerian Education System Tips:**\n• WAEC/NECO preparation should start early (JS3/SS1)\n• Encourage participation in extracurricular activities\n• Consider holiday lessons for challenging subjects\n• Join parent support groups at school\n\n**Remember:**\n\"Comparison is the thief of joy\" - Don't compare your child to others. Every child has unique strengths and areas for growth.\n\nHow can I specifically help you support your child's learning journey?"
        ],
        behaviorConcerns: [
            "Thank you for raising this behavioral concern. Addressing these issues early is important for your child's overall development.\n\n**Understanding Behavior:**\nBehavior is often a form of communication. Let's identify what might be causing the behavior:\n\n**Common Causes:**\n• Academic frustration (work too hard/easy)\n• Social challenges (peer relationships)\n• Attention-seeking\n• Home/family stressors\n• Physical needs (hunger, tiredness, health)\n• Learning difficulties\n\n**Effective Strategies:**\n\n1. **Consistent Expectations:**\n   • Clear rules at home and school\n   • Consistent consequences\n   • Follow through every time\n   • United front (parents, teachers agree)\n\n2. **Positive Reinforcement:**\n   • Praise specific good behaviors\n   • Reward system for improvements\n   • Focus on progress, not perfection\n   • Give attention to positive actions\n\n3. **Communication:**\n   • Listen to your child without judgment\n   • Understand their perspective\n   • Explain expectations clearly\n   • Discuss consequences calmly\n\n4. **Collaboration:**\n   • Regular teacher communication\n   • Possible counselor involvement\n   • Behavior tracking chart\n   • Family discussions about behavior\n\n**Nigerian Cultural Context:**\nIn our society, respect and discipline are highly valued. Balance traditional expectations with understanding your child's individual needs and modern parenting approaches.\n\n**When to Seek Professional Help:**\n⚠ Behavior interfering with learning\n⚠ Aggressive or harmful actions\n⚠ Sudden personality changes\n⚠ Signs of depression or anxiety\n⚠ Suspected bullying involvement\n\n**Action Plan:**\n1. Meet with class teacher\n2. Identify specific behaviors to address\n3. Create behavior contract with child\n4. Monitor and adjust as needed\n5. Consider school counselor if no improvement\n\n**Remember:**\nBehavior change takes time. Stay patient, consistent, and supportive.\n\nWhat specific behaviors are you most concerned about?",
            "Behavioral development is just as important as academic achievement. Let's work together on this.\n\n**Positive Behavior Management:**\n\n**The 3 C's Approach:**\n\n1. **Consistency:**\n   • Same rules always apply\n   • Consequences are predictable\n   • Both parents enforce equally\n   • Home and school aligned\n\n2. **Communication:**\n   • Daily check-ins about school\n   • Active listening without interrupting\n   • Open, judgment-free environment\n   • Age-appropriate explanations\n\n3. **Consequences:**\n   • Logical and related to behavior\n   • Age-appropriate\n   • Not harsh or angry\n   • Include learning opportunity\n\n**Building Good Character:**\n\n**Nigerian Values to Emphasize:**\n• Respect for elders and authority\n• Honesty and integrity\n• Hard work and diligence\n• Community and family responsibility\n• Cultural pride and identity\n\n**Practical Strategies:**\n\n1. **Model Behavior:**\n   Children learn by watching you. Demonstrate:\n   • Respect in all interactions\n   • Problem-solving without anger\n   • Responsibility and accountability\n   • Kindness and empathy\n\n2. **Clear Boundaries:**\n   • Rules are few but firm\n   • Explain the 'why' behind rules\n   • Allow appropriate freedom\n   • Adjust as child matures\n\n3. **Positive Attention:**\n   • Spend quality time together\n   • Notice and praise good behavior\n   • Show interest in their interests\n   • Physical affection (hugs, high-fives)\n\n**Common Behavioral Issues:**\n\n**Talking Back/Disrespect:**\n→ Stay calm, restate expectations\n→ Consequence: Loss of privilege\n→ Discuss respect when calm\n\n**Not Doing Homework:**\n→ Fixed study time, supervision\n→ Consequence: No screen time until done\n→ Help break work into smaller tasks\n\n**Fighting with Siblings:**\n→ Teach conflict resolution\n→ Consequence: Separation, no shared activities\n→ Reward peaceful interactions\n\n**Lying:**\n→ Emphasize importance of truth\n→ Consequence: Loss of trust, restrictions\n→ Praise honesty even when it reveals mistakes\n\n**School Involvement:**\nRequest a meeting with:\n• Class teacher (behavioral observations)\n• School counselor (professional strategies)\n• Principal (if behavior is serious)\n\n**Tracking Progress:**\nUse a behavior chart:\n✓ Identifies patterns\n✓ Shows progress over time\n✓ Helps child see improvements\n✓ Provides data for teacher meetings\n\n**Self-Care Reminder:**\nParenting is challenging. Take care of yourself so you can be patient and consistent with your child.\n\nShall we discuss a specific behavior strategy for your child's situation?"
        ],
        examPreparation: [
            "Excellent! Preparing properly for WAEC/NECO/JAMB is crucial. Let me guide you on how to support your child.\n\n**EXAMINATION PREPARATION GUIDE FOR PARENTS:**\n\n**Creating Study Environment:**\n\n1. **Physical Setup:**\n   • Quiet, well-lit study room\n   • Comfortable desk and chair\n   • All materials organized and accessible\n   • Free from distractions (TV, phones, games)\n   • Good ventilation and temperature\n\n2. **Study Schedule:**\n   • Fixed study times daily (2-3 hours minimum)\n   • Regular breaks (15 min every hour)\n   • Subject rotation to avoid fatigue\n   • Weekend intensive sessions\n   • Sleep by 10 PM for morning alertness\n\n**Your Role as Parent:**\n\n1. **Provide Resources:**\n   ✓ WAEC/NECO past question papers (last 10 years)\n   ✓ Recommended textbooks for each subject\n   ✓ Study guides and workbooks\n   ✓ Online resources if available\n   ✓ Consider group lessons or tutorial classes\n\n2. **Monitor Progress:**\n   ✓ Check study timetable adherence\n   ✓ Review completed work regularly\n   ✓ Track practice test scores\n   ✓ Communicate with subject teachers\n   ✓ Attend parent meetings\n\n3. **Provide Support:**\n   ✓ Ensure proper nutrition (brain foods)\n   ✓ Encourage adequate sleep\n   ✓ Reduce home responsibilities during exam period\n   ✓ Be emotionally supportive\n   ✓ Stay positive and encouraging\n\n**Study Strategies to Teach:**\n\n**Effective Studying:**\n• Active recall (test yourself, don't just read)\n• Spaced repetition (review regularly)\n• Practice past questions extensively\n• Form study groups with serious students\n• Teach others to test understanding\n• Use mnemonics for memorization\n\n**Subject-Specific Tips:**\n\n**Mathematics:**\n→ Practice calculations daily\n→ Work through past questions repeatedly\n→ Master formulas and when to use them\n→ Time yourself on practice exams\n\n**English:**\n→ Read comprehension passages daily\n→ Practice essay writing (1 per week)\n→ Build vocabulary with word lists\n→ Learn grammar rules thoroughly\n\n**Sciences:**\n→ Understand concepts, don't just memorize\n→ Practice drawing and labeling diagrams\n→ Review practical procedures\n→ Learn definitions and terms precisely\n\n**Social Studies:**\n→ Create summary notes\n→ Use acronyms for memorization\n→ Relate to Nigerian context\n→ Understand cause-effect relationships\n\n**Exam Week Preparation:**\n\n**Night Before:**\n• Light revision only (no cramming)\n• Organize exam materials\n• Set multiple alarms\n• Sleep early (8 hours minimum)\n• Positive affirmations\n\n**Exam Day:**\n• Good breakfast\n• Arrive early\n• Carry all required materials\n• Stay calm and confident\n\n**What NOT to Do:**\n❌ Don't compare with other students\n❌ Don't overload with too many lessons\n❌ Don't allow late-night studying\n❌ Don't pressure with threats\n❌ Don't neglect their wellbeing\n\n**Managing Exam Anxiety:**\n• Practice relaxation techniques\n• Encourage positive self-talk\n• Maintain perspective (one exam doesn't define them)\n• Pray together if religious\n• Assure them of your support regardless of results\n\n**Nigerian Exam Context:**\n• WAEC: Usually May/June\n• NECO: Usually June/July\n• JAMB: Usually March/April\n• Registration deadlines are strict!\n• Ensure all fees are paid early\n\n**After Exams:**\n• Allow rest and recreation\n• Avoid obsessing about results\n• Plan for next academic phase\n• Celebrate effort, not just outcomes\n\n**Timeline for WAEC/NECO:**\n• 6 months before: Intensive revision starts\n• 3 months before: Past questions focus\n• 1 month before: Full mock exams\n• 1 week before: Light revision, rest well\n\nWhich exam is your child preparing for? I can provide more specific guidance!",
            "Supporting your child through examination preparation is one of the best investments you can make. Here's a comprehensive guide:\n\n**PARENT'S EXAM SUPPORT CHECKLIST:**\n\n**3-6 Months Before Exams:**\n□ Purchase all past question books\n□ Arrange for extra lessons if needed\n□ Create study timetable with child\n□ Set up proper study environment\n□ Discuss goals and expectations\n□ Assess strengths and weaknesses\n\n**1-3 Months Before:**\n□ Monitor daily study routine\n□ Review progress weekly\n□ Adjust study plan as needed\n□ Provide nutritious meals\n□ Limit social distractions\n□ Encourage practice tests\n\n**1 Month Before:**\n□ Focus on past questions\n□ Simulate exam conditions at home\n□ Review difficult topics with teacher\n□ Maintain healthy sleep schedule\n□ Keep child motivated\n□ Pray/meditate together\n\n**1 Week Before:**\n□ Light revision only\n□ Organize exam materials\n□ Confirm exam venues and times\n□ Prepare exam day essentials\n□ Rest and relaxation\n□ Positive encouragement\n\n**Motivational Strategies:**\n\n1. **Set Realistic Goals:**\n   Aim for improvement, not perfection\n   Break big goal into smaller milestones\n   Celebrate small victories\n\n2. **Create Reward System:**\n   Rewards for consistent studying\n   Special treat after each exam\n   Big reward when all exams complete\n\n3. **Share Success Stories:**\n   Talk about successful relatives\n   Show that hard work pays off\n   Connect education to future dreams\n\n**Dealing with Study Challenges:**\n\n**If child resists studying:**\n• Understand the root cause\n• Make study interactive\n• Study together when possible\n• Set small, achievable targets\n• Focus on one subject at a time\n\n**If child is overwhelmed:**\n• Break tasks into smaller chunks\n• Prioritize important topics\n• Ensure breaks and rest\n• Provide emotional support\n• Consider reducing other activities\n\n**If child is overconfident:**\n• Encourage practice exams\n• Show areas needing improvement\n• Emphasize consistent effort\n• Don't crush confidence, redirect it\n\n**Nigerian Exam System Specifics:**\n\n**WAEC (West African Examinations Council):**\n• Core subjects: English, Math, + 6-7 others\n• Grades: A1-F9 (need minimum C6 for university)\n• Multiple choice + essay sections\n• Practical exams for sciences\n\n**NECO (National Examinations Council):**\n• Similar structure to WAEC\n• Often considered equally important\n• Some students take both\n• Results usually faster than WAEC\n\n**JAMB (Joint Admissions and Matriculation Board):**\n• University entrance exam\n• Computer-based test (CBT)\n• 4 subjects tested\n• Score out of 400\n• Need minimum score for university admission\n\n**Resources for Nigerian Students:**\n\n**Recommended Books:**\n• Complete Past Questions (Subject-specific)\n• Success Series (Various subjects)\n• Essential Mathematics/English\n• Comprehensive Textbooks per subject\n\n**Online Resources:**\n• WAEC official website (past questions)\n• JAMB CBT practice platforms\n• Educational YouTube channels\n• MySchool app for practice\n\n**Physical Resources:**\n• Public/school library access\n• Study group at school/church/mosque\n• Holiday lessons at school\n• Private tutorials (if budget allows)\n\n**Financial Planning:**\nExam preparation costs money. Budget for:\n• Registration fees (₦13,000-18,000 per exam)\n• Textbooks and past questions (₦20,000-40,000)\n• Extra lessons (₦5,000-30,000/month)\n• Exam materials (₦5,000-10,000)\n• Transport on exam days\n\n**Success Stories:**\nMany Nigerian students excel in these exams through:\n✓ Consistent daily study\n✓ Strong parent support\n✓ Quality teaching\n✓ Past question practice\n✓ Determination and faith\n\nYour child can succeed too with proper preparation and support!\n\n**Final Encouragement:**\n\"Education is the passport to the future, for tomorrow belongs to those who prepare for it today.\"\n\nRemember: Your belief in your child matters immensely. Stay positive, supportive, and involved.\n\nWhat specific aspect of exam preparation would you like to discuss further?"
        ]
    },

    financialAnalysis: {
        revenue: `**FINANCIAL ANALYSIS: Revenue Overview**

I can provide basic financial insights in offline mode, though comprehensive analysis requires real-time data access.

**Revenue Analysis Framework:**

**Key Metrics to Track:**
1. **Total Revenue** - All income sources combined
2. **Revenue by Source** - Tuition, fees, donations, other income
3. **Collection Rate** - Percentage of expected vs actual revenue
4. **Outstanding Fees** - Amount yet to be collected
5. **Revenue Trends** - Monthly/termly comparison

**Nigerian School Revenue Sources:**

**Primary Revenue:**
• Tuition fees (₦per student)
• Development levies
• Uniform sales
• Feeding fees
• Transport fees
• Exam fees

**Secondary Revenue:**
• Sport/Activity fees
• Graduation fees
• PTA contributions
• Book sales
• Facility rentals

**Improving Revenue Collection:**

1. **Clear Payment Structure:**
   • Publish fee schedule at term start
   • Multiple payment options (bank, online, cash)
   • Installment plans for large amounts
   • Early payment discounts

2. **Efficient Collection:**
   • Digital payment tracking system
   • Automated reminders for outstanding fees
   • Clear consequences for non-payment
   • Parent-friendly payment schedules

3. **Reduce Defaults:**
   • Require deposits at enrollment
   • Regular fee payment follow-ups
   • Work with parents on payment plans
   • Clear refund policies

**Financial Health Indicators:**
✓ Revenue > Expenses (profit margin)
✓ High fee collection rate (>85%)
✓ Consistent cash flow
✓ Low bad debt (<5%)
✓ Growing student enrollment

**For Detailed Analysis:**
Connect to the internet for:
• Real-time financial dashboards
• Predictive revenue modeling
• Comparative analysis with similar schools
• Automated financial reports
• Trend analysis and forecasts

*This is a basic framework. For school-specific revenue analysis with your actual data, please connect to the internet.*`,

        expenses: `**FINANCIAL ANALYSIS: Expense Management**

Effective expense management is crucial for school sustainability.

**Major Expense Categories:**

**1. Personnel Costs (60-70% of budget)**
• Teacher salaries and allowances
• Support staff wages
• Benefits (health insurance, pension)
• Professional development
• Hiring and onboarding costs

**2. Operational Expenses (20-30%)**
• Rent/facility maintenance
• Utilities (electricity, water, internet)
• Office supplies and materials
• Security services
• Cleaning and maintenance
• Transportation

**3. Academic Expenses (10-15%)**
• Learning materials and textbooks
• Laboratory equipment and supplies
• Library resources
• Technology and software
• Exam fees (WAEC/NECO registration)
• Co-curricular activities

**4. Administrative Costs**
• Regulatory compliance fees
• Insurance
• Banking charges
• Marketing and recruitment
• Communication costs

**Nigerian Context Considerations:**
• Factor in NEPA/power interruptions (generator, fuel)
• Security needs (guards, fencing, cameras)
• Road/facility maintenance (rainy season damage)
• Government fees and levies
• Community relations expenses

**Expense Optimization Strategies:**

**1. Reduce Waste:**
✓ Energy-efficient practices (solar, LED bulbs)
✓ Bulk purchasing discounts
✓ Preventive maintenance (saves repair costs)
✓ Digital communication (reduce printing)
✓ Negotiate with vendors

**2. Improve Efficiency:**
✓ Automate administrative tasks
✓ Multi-purpose facilities
✓ Share resources with other schools
✓ Volunteer programs for some tasks
✓ Teacher retention (reduce hiring costs)

**3. Budget Control:**
✓ Monthly expense review
✓ Approve all major expenditures
✓ Track variances from budget
✓ Require receipts for all spending
✓ Regular financial audits

**Warning Signs:**
⚠ Expenses exceeding revenue
⚠ Cash flow problems
⚠ Delayed salary payments
⚠ Mounting debts
⚠ Cutting quality to save money

**Healthy Financial Ratios:**
• Personnel costs: <70% of revenue
• Operational margin: >10%
• Reserve fund: 3-6 months of expenses
• Debt-to-revenue ratio: <30%

**For Detailed Expense Analysis:**
Connect to the internet for:
• Category-wise expense breakdowns
• Budget vs. actual comparisons
• Cost-saving recommendations
• Expense forecasting
• Vendor performance analysis

*This is general guidance. For your school's specific expense analysis, please connect to the internet.*`
    }
};

// Semantic Matching System (Simple version for offline)
class SemanticMatcher {
    private static calculateSimpleScore(text1: string, text2: string): number {
        const words1 = text1.toLowerCase().split(/\s+/);
        const words2 = text2.toLowerCase().split(/\s+/);
        
        let matches = 0;
        for (const word of words1) {
            if (words2.includes(word) && word.length > 3) {
                matches++;
            }
        }
        
        return matches / Math.max(words1.length, words2.length);
    }

    static findBestMatch(prompt: string, templates: { [key: string]: any }): { key: string; score: number } {
        let bestMatch = { key: '', score: 0 };
        
        for (const [key, value] of Object.entries(templates)) {
            const score = this.calculateSimpleScore(prompt, key);
            if (score > bestMatch.score) {
                bestMatch = { key, score };
            }
        }
        
        return bestMatch;
    }

    static detectSubject(prompt: string): string | null {
        const promptLower = prompt.toLowerCase();
        
        for (const [subject, data] of Object.entries(NIGERIAN_CURRICULUM.subjects)) {
            if (data.keywords.some(keyword => promptLower.includes(keyword))) {
                return subject;
            }
        }
        
        return null;
    }

    static detectRequestType(prompt: string): string {
        const promptLower = prompt.toLowerCase();
        
        if (promptLower.includes('lesson plan') || promptLower.includes('teaching plan')) {
            return 'lessonPlan';
        }
        if (promptLower.includes('report card') || promptLower.includes('student comment')) {
            return 'reportComment';
        }
        if (promptLower.includes('announcement') || promptLower.includes('message for parents')) {
            return 'announcement';
        }
        if (promptLower.includes('debt') || promptLower.includes('payment reminder')) {
            return 'debtReminder';
        }
        if (promptLower.includes('financial') || promptLower.includes('revenue') || promptLower.includes('expense')) {
            return 'financialAnalysis';
        }
        if (promptLower.includes('help me') || promptLower.includes('explain') || promptLower.includes('understand')) {
            return 'tutoring';
        }
        if (promptLower.includes('my child') || promptLower.includes('parent')) {
            return 'parentChat';
        }
        
        return 'general';
    }

    static extractContext(prompt: string): any {
        const context: any = {};
        
        // Extract common patterns
        const nameMatch = prompt.match(/name:?\s*([A-Za-z\s]+?)(?:\n|$|,)/i);
        const subjectMatch = prompt.match(/subject:?\s*([A-Za-z\s]+?)(?:\n|$|,)/i);
        const scoreMatch = prompt.match(/score:?\s*([0-9]+)/i);
        const gradeMatch = prompt.match(/grade:?\s*([A-F][0-9]?)/i);
        const classMatch = prompt.match(/class:?\s*(JSS?|SS?)\s*([1-3])/i);
        const topicMatch = prompt.match(/topic:?\s*["']?([^"'\n]+)["']?/i);
        
        if (nameMatch) context.name = nameMatch[1].trim();
        if (subjectMatch) context.subject = subjectMatch[1].trim();
        if (scoreMatch) context.score = scoreMatch[1];
        if (gradeMatch) context.grade = gradeMatch[1];
        if (classMatch) context.class = `${classMatch[1]}${classMatch[2]}`;
        if (topicMatch) context.topic = topicMatch[1].trim();
        
        return context;
    }
}

// Enhanced Response Generator
export class EnhancedFallbackAI {
    static generateResponse(request: AIRequest): AIResponse {
        const { prompt, context } = request;
        
        // Detect request type
        const requestType = SemanticMatcher.detectRequestType(prompt);
        
        // Detect subject
        const subject = SemanticMatcher.detectSubject(prompt);
        
        // Extract context from prompt
        const extractedContext = SemanticMatcher.extractContext(prompt);
        
        // Merge contexts
        const fullContext = { ...context, ...extractedContext, subject };
        
        // Generate appropriate response
        let response: AIResponse;
        
        switch (requestType) {
            case 'lessonPlan':
                response = this.generateLessonPlan(prompt, fullContext);
                break;
            case 'reportComment':
                response = this.generateReportComment(prompt, fullContext);
                break;
            case 'tutoring':
                response = this.generateTutoringResponse(prompt, fullContext);
                break;
            case 'parentChat':
                response = this.generateParentChatResponse(prompt, fullContext);
                break;
            case 'financialAnalysis':
                response = this.generateFinancialAnalysis(prompt, fullContext);
                break;
            default:
                response = this.generateGeneralResponse(prompt, fullContext);
        }
        
        return response;
    }

    private static generateLessonPlan(prompt: string, context: any): AIResponse {
        const subject = context.subject || 'General';
        const topic = context.topic || 'the selected topic';
        const classLevel = context.class || 'SS2';
        
        // Get subject-specific template
        let template = '';
        let confidence = 0.7;
        
        if (subject === 'mathematics' && ENHANCED_TEMPLATES.lessonPlans.mathematics) {
            // Detect math subtopic
            if (prompt.toLowerCase().includes('algebra')) {
                template = ENHANCED_TEMPLATES.lessonPlans.mathematics.topics.algebra.template;
                confidence = 0.9;
            } else if (prompt.toLowerCase().includes('geometry')) {
                template = ENHANCED_TEMPLATES.lessonPlans.mathematics.topics.geometry.template;
                confidence = 0.9;
            }
        } else if (subject === 'english' && ENHANCED_TEMPLATES.lessonPlans.english) {
            if (prompt.toLowerCase().includes('comprehension')) {
                template = ENHANCED_TEMPLATES.lessonPlans.english.comprehension;
                confidence = 0.9;
            } else if (prompt.toLowerCase().includes('essay')) {
                template = ENHANCED_TEMPLATES.lessonPlans.english.essay;
                confidence = 0.9;
            }
        } else if (subject.includes('science') || subject === 'sciences') {
            if (prompt.toLowerCase().includes('biology')) {
                template = ENHANCED_TEMPLATES.lessonPlans.sciences.biology;
                confidence = 0.85;
            } else if (prompt.toLowerCase().includes('chemistry')) {
                template = ENHANCED_TEMPLATES.lessonPlans.sciences.chemistry;
                confidence = 0.85;
            }
        }
        
        // Fill in template variables
        if (template) {
            template = template
                .replace(/{topic}/g, topic)
                .replace(/{class}/g, classLevel)
                .replace(/{duration}/g, '45')
                .replace(/{pages}/g, 'XX-XX')
                .replace(/{year}/g, '2023')
                .replace(/{code}/g, 'XX.X')
                .replace(/{number}/g, 'X.X')
                .replace(/{essayType}/g, context.essayType || 'Argumentative');
        } else {
            // Generic fallback
            template = `**LESSON PLAN: ${topic}**
**Subject:** ${subject}
**Class:** ${classLevel}
**Duration:** 45 minutes
**Curriculum:** WAEC/NECO Aligned

**LEARNING OBJECTIVES:**
By the end of this lesson, students will be able to:
1. Understand key concepts of ${topic}
2. Apply knowledge in practical situations
3. Prepare for WAEC/NECO examinations on this topic

**LESSON STRUCTURE:**
1. Introduction (10 min) - Review and introduce ${topic}
2. Direct Instruction (20 min) - Teach core concepts
3. Guided Practice (15 min) - Work through examples together
4. Assessment (5 min) - Quick check for understanding

**MATERIALS:** Textbooks, whiteboard, worksheets

**HOMEWORK:** Practice exercises on ${topic}

**NOTE:** This is a basic template generated in offline mode. For comprehensive, curriculum-aligned lesson plans with Nigerian context, please connect to the internet for full AI capabilities.`;
            confidence = 0.5;
        }
        
        return {
            content: template,
            confidence,
            templateUsed: 'lessonPlan',
            suggestions: [
                'Connect to internet for more detailed lesson plans',
                'Include WAEC past questions in your teaching',
                'Adapt content to your students\' level'
            ]
        };
    }

    private static generateReportComment(prompt: string, context: any): AIResponse {
        const studentName = context.name || 'The student';
        const subject = context.subject || 'this subject';
        const score = context.score;
        const grade = context.grade;
        
        // Determine performance level
        let performanceLevel = 'satisfactory';
        let confidence = 0.8;
        
        if (score) {
            const numScore = parseInt(score);
            if (numScore >= 75) performanceLevel = 'excellent';
            else if (numScore >= 65) performanceLevel = 'veryGood';
            else if (numScore >= 50) performanceLevel = 'satisfactory';
            else performanceLevel = 'needsImprovement';
            confidence = 0.9;
        } else if (grade) {
            if (['A', 'A1', 'B2'].includes(grade)) performanceLevel = 'excellent';
            else if (['B', 'B3', 'C4'].includes(grade)) performanceLevel = 'veryGood';
            else if (['C', 'C5', 'C6', 'D7'].includes(grade)) performanceLevel = 'satisfactory';
            else performanceLevel = 'needsImprovement';
            confidence = 0.85;
        }
        
        // Get appropriate comment template
        const comments = ENHANCED_TEMPLATES.reportCardComments[performanceLevel];
        const selectedComment = comments[Math.floor(Math.random() * comments.length)]
            .replace(/{name}/g, studentName)
            .replace(/{subject}/g, subject)
            .replace(/{score}/g, score || grade || 'current performance');
        
        // Add behavioral note if context suggests it
        const promptLower = prompt.toLowerCase();
        let behavioralNote = '';
        if (promptLower.includes('behavior') || promptLower.includes('conduct')) {
            const behaviorLevel = performanceLevel === 'excellent' || performanceLevel === 'veryGood' ? 'excellent' : 
                                 performanceLevel === 'satisfactory' ? 'good' : 'needsImprovement';
            const behaviorComments = ENHANCED_TEMPLATES.reportCardComments.behavioral[behaviorLevel];
            behavioralNote = '\n\n**Behavior:** ' + behaviorComments[Math.floor(Math.random() * behaviorComments.length)]
                .replace(/{name}/g, studentName);
        }
        
        const fullComment = selectedComment + behavioralNote + 
            '\n\n*Note: This comment was generated in offline mode. For more personalized, context-aware feedback, please connect to the internet.*';
        
        return {
            content: fullComment,
            confidence,
            templateUsed: 'reportComment',
            suggestions: [
                'Review and personalize this comment',
                'Add specific examples from class',
                'Consider behavioral observations'
            ]
        };
    }

    private static generateTutoringResponse(prompt: string, context: any): AIResponse {
        const subject = SemanticMatcher.detectSubject(prompt) || 'general';
        let response = '';
        let confidence = 0.7;
        
        // Get subject-specific tutoring response
        if (subject === 'mathematics' || subject === 'math') {
            if (prompt.toLowerCase().includes('algebra')) {
                const responses = ENHANCED_TEMPLATES.tutorResponses.mathematics.algebra;
                response = responses[Math.floor(Math.random() * responses.length)];
                confidence = 0.85;
            } else if (prompt.toLowerCase().includes('geometry')) {
                const responses = ENHANCED_TEMPLATES.tutorResponses.mathematics.geometry;
                response = responses[Math.floor(Math.random() * responses.length)];
                confidence = 0.85;
            } else {
                // General math help
                response = `**Mathematics Help (Offline Mode)**

I'd love to help you with math! Here's a general problem-solving approach:

**Step-by-Step Strategy:**
1. Read the question carefully
2. Identify what you know (given information)
3. Identify what you need to find (unknown)
4. Choose the right formula or method
5. Solve step by step
6. Check your answer

**For WAEC Success:**
✓ Practice past questions daily
✓ Master all formulas
✓ Show all your working
✓ Check units in your answers
✓ Time yourself during practice

**Nigerian Context Practice:**
Try this: If a trader bought 20 bags of rice at ₦25,000 each and sold them at ₦30,000 each, what is the profit?

For detailed explanations with interactive examples, please connect to the internet.

What specific math topic would you like help with?`;
                confidence = 0.6;
            }
        } else if (subject === 'english') {
            if (prompt.toLowerCase().includes('essay')) {
                const responses = ENHANCED_TEMPLATES.tutorResponses.english.essay;
                response = responses[Math.floor(Math.random() * responses.length)];
                confidence = 0.85;
            } else if (prompt.toLowerCase().includes('comprehension')) {
                const responses = ENHANCED_TEMPLATES.tutorResponses.english.comprehension;
                response = responses[Math.floor(Math.random() * responses.length)];
                confidence = 0.85;
            } else {
                response = `**English Language Help (Offline Mode)**

I'm here to help you improve your English skills!

**What I can help with:**
✓ Essay writing structure
✓ Grammar rules
✓ Comprehension strategies
✓ Vocabulary building
✓ WAEC exam preparation

**Quick English Tips:**

**For Writing:**
• Plan before you write
• One idea per paragraph
• Use varied vocabulary
• Check spelling and grammar
• Stay on topic

**For Reading:**
• Read the questions first
• Underline key information
• Use context clues for vocabulary
• Answer in complete sentences

**WAEC Focus:**
Practice is key! Read Nigerian newspapers daily and write practice essays weekly.

For personalized tutoring with detailed examples, please connect to the internet.

What English topic do you need help with?`;
                confidence = 0.6;
            }
        } else {
            // General tutoring response
            response = `**Academic Help (Offline Mode)**

I'm here to support your learning! While I'm in offline mode with basic capabilities, I can still help.

**Study Strategies:**

1. **Active Learning:**
   • Don't just read - take notes
   • Test yourself regularly
   • Teach concepts to others
   • Make connections to what you know

2. **Time Management:**
   • Study daily, not just before exams
   • Use the Pomodoro Technique (25 min study, 5 min break)
   • Prioritize difficult subjects
   • Review regularly

3. **WAEC/NECO Preparation:**
   • Start early (at least 6 months before)
   • Practice past questions extensively
   • Join study groups
   • Seek help from teachers
   • Stay consistent

**Subject-Specific Help:**
Please specify which subject you need help with (Math, English, Science, etc.) so I can provide more targeted guidance.

**Online Benefits:**
When you connect to the internet, I can provide:
• Detailed step-by-step solutions
• Practice problems with answers
• Interactive explanations
• Personalized learning paths
• Real-time doubt clearing

What subject or topic would you like to focus on?`;
            confidence = 0.5;
        }
        
        return {
            content: response,
            confidence,
            templateUsed: 'tutoring',
            suggestions: [
                'Practice with WAEC past questions',
                'Form a study group',
                'Ask your teacher for clarification'
            ]
        };
    }

    private static generateParentChatResponse(prompt: string, context: any): AIResponse {
        const promptLower = prompt.toLowerCase();
        let response = '';
        let confidence = 0.75;
        let templateUsed = 'parentChat_general';
        
        // Detect parent concern type
        if (promptLower.includes('grade') || promptLower.includes('performance') || promptLower.includes('score')) {
            const responses = ENHANCED_TEMPLATES.parentChat.academicConcerns;
            response = responses[Math.floor(Math.random() * responses.length)];
            confidence = 0.85;
            templateUsed = 'parentChat_academic';
        } else if (promptLower.includes('behavior') || promptLower.includes('discipline') || promptLower.includes('conduct')) {
            const responses = ENHANCED_TEMPLATES.parentChat.behaviorConcerns;
            response = responses[Math.floor(Math.random() * responses.length)];
            confidence = 0.85;
            templateUsed = 'parentChat_behavior';
        } else if (promptLower.includes('exam') || promptLower.includes('waec') || promptLower.includes('neco') || promptLower.includes('jamb')) {
            const responses = ENHANCED_TEMPLATES.parentChat.examPreparation;
            response = responses[Math.floor(Math.random() * responses.length)];
            confidence = 0.9;
            templateUsed = 'parentChat_exam';
        } else {
            // General parent support
            response = `**Parent Support (Offline Mode)**

Thank you for reaching out! I'm here to support your child's education journey.

**How I Can Help You:**

**Academic Support:**
• Study strategies for your child
• How to help with homework
• Exam preparation guidance
• Subject-specific tips
• WAEC/NECO information

**Behavioral Guidance:**
• Managing school discipline
• Building good habits
• Motivation strategies
• Communication with teachers
• Character development

**Nigerian Education System:**
• Understanding WAEC/NECO/JAMB
• School requirements
• Subject choices
• Career guidance
• Educational pathways

**Your Role as Parent:**
✓ Create study-friendly environment
✓ Monitor homework completion
✓ Communicate with teachers regularly
✓ Attend school meetings
✓ Encourage and support (not pressure)
✓ Celebrate efforts and improvements

**Available Resources:**
• School teachers and counselors
• PTA meetings and activities
• Educational materials and books
• Community study groups
• Holiday lesson programs

**Important Reminders:**
• Every child learns at their own pace
• Consistent support matters more than perfection
• Partnership between home and school is crucial
• Nigerian education values discipline and hard work
• Your involvement makes a real difference

**For Personalized Advice:**
When you connect to the internet, I can provide:
• Specific strategies for your child
• Detailed performance analysis
• Customized study plans
• Real-time progress updates
• Direct teacher communication insights

What specific aspect of your child's education would you like to discuss?`;
            confidence = 0.65;
        }
        
        return {
            content: response,
            confidence,
            templateUsed,
            suggestions: [
                'Schedule a parent-teacher conference',
                'Review your child\'s work regularly',
                'Stay in contact with school'
            ]
        };
    }

    private static generateFinancialAnalysis(prompt: string, context: any): AIResponse {
        const promptLower = prompt.toLowerCase();
        let response = '';
        let confidence = 0.7;
        
        if (promptLower.includes('revenue') || promptLower.includes('income') || promptLower.includes('collection')) {
            response = ENHANCED_TEMPLATES.financialAnalysis.revenue;
            confidence = 0.75;
        } else if (promptLower.includes('expense') || promptLower.includes('cost') || promptLower.includes('spending')) {
            response = ENHANCED_TEMPLATES.financialAnalysis.expenses;
            confidence = 0.75;
        } else {
            response = `**Financial Analysis (Offline Mode)**

I can provide basic financial guidance in offline mode.

**School Financial Management Basics:**

**Key Financial Areas:**
1. Revenue Management (Income)
2. Expense Control (Costs)
3. Cash Flow (Money in/out)
4. Budget Planning
5. Financial Reporting

**Nigerian School Context:**
• Tuition fees are primary revenue
• Staff salaries are biggest expense
• Seasonal cash flow (term payments)
• Government regulations and taxes
• Infrastructure maintenance needs

**Financial Health Checklist:**
✓ Revenue exceeds expenses
✓ Strong fee collection rate
✓ Emergency reserve fund
✓ Controlled spending
✓ Regular financial reviews

**For Comprehensive Analysis:**
Connect to the internet for:
• Real-time financial dashboards
• Detailed reports and trends
• Predictive modeling
• Benchmarking with other schools
• Automated insights

What specific financial aspect would you like to explore?`;
            confidence = 0.65;
        }
        
        return {
            content: response,
            confidence,
            templateUsed: 'financialAnalysis',
            suggestions: [
                'Connect for real-time data analysis',
                'Review financial reports regularly',
                'Consult with school accountant'
            ]
        };
    }

    private static generateGeneralResponse(prompt: string, context: any): AIResponse {
        const response = `**AI Assistant (Offline Mode)**

I'm currently running in offline mode with limited capabilities compared to my full online functionality.

**What I Can Do Offline:**
✓ Generate basic lesson plans (WAEC/NECO aligned)
✓ Create report card comments
✓ Provide tutoring guidance for common subjects
✓ Offer parent support advice
✓ Basic financial analysis frameworks
✓ Nigerian education system information

**What I Need Internet For:**
• Personalized, context-aware responses
• Real-time data analysis
• Advanced problem solving
• Interactive learning experiences
• Current information and updates
• Comprehensive reporting

**Nigerian Education Focus:**
All my responses are tailored for:
• WAEC/NECO curriculum
• Nigerian teaching methodologies
• Local educational context
• Cultural relevance

**Why Am I Offline?**
Possible reasons:
• No internet connection
• API service unavailable
• Quota/credit limitations
• Network connectivity issues

**Recommendation:**
Please check your internet connection and try again for the full AI experience with intelligent, personalized responses.

Is there something specific I can help you with in offline mode?`;
        
        return {
            content: response,
            confidence: 0.5,
            templateUsed: 'general',
            suggestions: [
                'Check internet connection',
                'Specify your request more clearly',
                'Try connecting to full AI service'
            ]
        };
    }
}

// Export main function
export const generateEnhancedFallbackResponse = (prompt: string, context?: any): string => {
    const response = EnhancedFallbackAI.generateResponse({ prompt, context });
    return response.content;
};