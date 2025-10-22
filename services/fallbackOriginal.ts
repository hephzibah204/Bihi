// This file contains the original, simple fallback logic before the major overhaul.
// It is imported by the new `fallbackAiService.ts` to maintain backward compatibility for specific functions.

interface CommentContext {
    studentName: string;
    performanceSummary: string;
}

// Enhanced fallback responses with comprehensive school management training data
export const generateFallbackComment = (studentName: string, subject: string, performance: string): string => {
  const subjectSpecificInsights = {
    mathematics: {
      excellent: [`${studentName} demonstrates exceptional mathematical reasoning and problem-solving skills. Their ability to apply complex formulas and understand abstract concepts is outstanding.`],
      good: [`${studentName} shows solid mathematical foundation. Encourage them to tackle more challenging word problems to further develop analytical thinking.`],
      average: [`${studentName} grasps basic mathematical concepts but needs more practice with problem-solving strategies and formula applications.`],
      poor: [`${studentName} struggles with fundamental mathematical concepts. Recommend starting with basic arithmetic review and using visual aids for better understanding.`]
    },
    english: {
      excellent: [`${studentName} exhibits exceptional reading comprehension and writing skills. Their vocabulary and analytical thinking in literature discussions are impressive.`],
      good: [`${studentName} demonstrates good language skills. Encourage more creative writing and advanced reading to enhance their literary analysis abilities.`],
      average: [`${studentName} shows adequate language skills but could benefit from more reading practice and vocabulary building exercises.`],
      poor: [`${studentName} needs significant support in language arts. Recommend phonics review, guided reading sessions, and basic grammar practice.`]
    },
    science: {
      excellent: [`${studentName} shows remarkable scientific curiosity and understanding. Their ability to conduct experiments and analyze results is exemplary.`],
      good: [`${studentName} demonstrates solid scientific thinking. Encourage them to participate in science fairs and hands-on experiments.`],
      average: [`${studentName} understands basic scientific concepts but needs more practice with scientific method and critical analysis.`],
      poor: [`${studentName} struggles with scientific concepts. Recommend more hands-on activities and visual demonstrations to improve understanding.`]
    }
  };

  const generalComments = {
    excellent: [
      `${studentName} demonstrates exceptional understanding in ${subject}. Their consistent high performance and active participation make them a role model for other students.`,
      `Outstanding work by ${studentName} in ${subject}. They show remarkable analytical skills and consistently exceed expectations.`,
      `${studentName} exhibits mastery of ${subject} concepts. Their dedication and excellent work ethic are truly commendable.`,
      `Exceptional performance by ${studentName} in ${subject}. They demonstrate leadership qualities and help peers understand difficult concepts.`
    ],
    good: [
      `${studentName} shows solid understanding of ${subject} concepts. With continued effort, they can achieve even greater success.`,
      `Good progress by ${studentName} in ${subject}. They demonstrate consistent effort and understanding of key concepts.`,
      `${studentName} is performing well in ${subject}. Their steady improvement and positive attitude are encouraging.`,
      `${studentName} displays good comprehension in ${subject}. Encourage them to take on more challenging tasks to reach their full potential.`
    ],
    average: [
      `${studentName} shows adequate understanding of ${subject}. Additional practice and focus could help improve their performance.`,
      `${studentName} demonstrates basic competency in ${subject}. Encouraging more active participation could enhance their learning.`,
      `${studentName} is making steady progress in ${subject}. With more consistent effort, they can achieve better results.`,
      `${studentName} meets basic expectations in ${subject}. Consider providing additional resources and practice opportunities for improvement.`
    ],
    poor: [
      `${studentName} needs additional support in ${subject}. Recommend extra tutoring and practice to strengthen foundational concepts.`,
      `${studentName} is struggling with ${subject} concepts. Suggest one-on-one assistance and additional practice materials.`,
      `${studentName} requires intervention in ${subject}. Consider alternative teaching methods and extra support to help them succeed.`,
      `${studentName} faces significant challenges in ${subject}. Immediate intervention with specialized teaching methods and peer support is recommended.`
    ]
  };

  const performanceLevel = performance.toLowerCase();
  const subjectKey = subject.toLowerCase();
  
  // Use subject-specific comments if available, otherwise use general comments
  const relevantComments = subjectSpecificInsights[subjectKey]?.[performanceLevel] || 
                           generalComments[performanceLevel] || 
                           generalComments.average;
  
  return relevantComments[Math.floor(Math.random() * relevantComments.length)];
};

export const getFallbackLessonPlan = (subject: string, topic: string): string => {
  const subjectSpecificPlans = {
    mathematics: {
      objectives: [
        "Students will solve problems using mathematical reasoning",
        "Students will apply formulas and concepts to real-world scenarios",
        "Students will demonstrate computational fluency"
      ],
      materials: ["Calculator", "Graph paper", "Manipulatives", "Interactive whiteboard"],
      activities: [
        "Problem-solving warm-up",
        "Guided practice with step-by-step examples",
        "Collaborative group work on challenging problems",
        "Individual practice with immediate feedback"
      ]
    },
    english: {
      objectives: [
        "Students will analyze text for meaning and literary devices",
        "Students will improve reading comprehension skills",
        "Students will express ideas clearly in writing"
      ],
      materials: ["Literature texts", "Writing journals", "Vocabulary cards", "Audio recordings"],
      activities: [
        "Reading comprehension exercises",
        "Vocabulary building games",
        "Creative writing prompts",
        "Group discussions and presentations"
      ]
    },
    science: {
      objectives: [
        "Students will conduct scientific investigations",
        "Students will understand scientific concepts through experimentation",
        "Students will develop critical thinking skills"
      ],
      materials: ["Laboratory equipment", "Safety goggles", "Experiment worksheets", "Digital microscope"],
      activities: [
        "Hands-on experiments",
        "Data collection and analysis",
        "Scientific method practice",
        "Hypothesis testing and conclusion drawing"
      ]
    }
  };

  const subjectKey = subject.toLowerCase();
  const subjectData = subjectSpecificPlans[subjectKey];

  const objectives = subjectData?.objectives || ["Students will understand key concepts", "Students will apply knowledge effectively"];
  const materials = subjectData?.materials || ["Textbook", "Whiteboard", "Handouts"];
  const activities = subjectData?.activities || ["Interactive discussion", "Guided practice", "Group work"];

  return `
**Lesson Plan: ${topic} (${subject})**

**Learning Objectives:**
${objectives.map(obj => `- ${obj} related to ${topic}`).join('\n')}

**Materials and Resources:**
${materials.map(material => `- ${material}`).join('\n')}
- Supplementary materials for ${topic}

**Lesson Structure (50 minutes):**

1. **Opening & Review (8 minutes)**
   - Quick review of previous concepts
   - Connect to today's topic: ${topic}
   - Share learning objectives with students

2. **Introduction to ${topic} (12 minutes)**
   - Present key concepts with real-world examples
   - Use visual aids and interactive demonstrations
   - Check for initial understanding

3. **Guided Practice (15 minutes)**
   ${activities.map(activity => `   - ${activity} focused on ${topic}`).join('\n')}

4. **Independent/Group Work (10 minutes)**
   - Students apply concepts through structured activities
   - Teacher provides individual support as needed
   - Peer collaboration encouraged

5. **Wrap-up & Assessment (5 minutes)**
   - Quick formative assessment (exit ticket/quiz)
   - Summarize key learning points
   - Preview next lesson connection

**Differentiation Strategies:**
- Visual learners: Diagrams and charts for ${topic}
- Kinesthetic learners: Hands-on activities
- Advanced students: Extension problems
- Struggling students: Additional scaffolding and support

**Assessment Methods:**
- Formative: Observation, questioning, exit tickets
- Summative: Quiz on ${topic} concepts
- Peer assessment during group activities

**Homework Assignment:**
- Practice problems related to ${topic}
- Reading assignment to prepare for next lesson
- Optional: Research project on real-world applications

**Extension Activities:**
- Cross-curricular connections with other subjects
- Technology integration opportunities
- Community connections related to ${topic}
  `;
};

export const getFallbackTutorResponse = (question: string): string => {
  const questionLower = question.toLowerCase();
  
  // Mathematics help
  if (questionLower.includes('math') || questionLower.includes('calculate') || questionLower.includes('solve') || 
      questionLower.includes('algebra') || questionLower.includes('geometry') || questionLower.includes('fraction')) {
    const mathTips = [
      "Break complex problems into smaller, manageable steps",
      "Draw diagrams or use visual aids to understand the problem better",
      "Check your work by substituting answers back into the original equation",
      "Practice similar problems to reinforce the concept",
      "Don't hesitate to ask your teacher for clarification on confusing concepts"
    ];
    const randomTip = mathTips[Math.floor(Math.random() * mathTips.length)];
    return `I'd be happy to help with math! Here's a helpful strategy: ${randomTip}. What specific math concept or problem are you working on? I can provide step-by-step guidance even in offline mode.`;
  }
  
  // English and writing help
  if (questionLower.includes('essay') || questionLower.includes('write') || questionLower.includes('english') || 
      questionLower.includes('grammar') || questionLower.includes('paragraph')) {
    const writingTips = [
      "Start with a clear thesis statement that outlines your main argument",
      "Use the PEEL method: Point, Evidence, Explain, Link for each paragraph",
      "Read your work aloud to catch awkward phrasing and errors",
      "Vary your sentence structure to make your writing more engaging",
      "Always plan your essay with an outline before you start writing"
    ];
    const randomTip = writingTips[Math.floor(Math.random() * writingTips.length)];
    return `Great question about writing! Here's a useful tip: ${randomTip}. What type of writing assignment are you working on? I can provide structure guidance and general writing strategies.`;
  }
  
  // Science help
  if (questionLower.includes('science') || questionLower.includes('experiment') || questionLower.includes('biology') || 
      questionLower.includes('chemistry') || questionLower.includes('physics')) {
    const scienceTips = [
      "Always start with the scientific method: observe, hypothesize, test, analyze",
      "Make sure to record all observations during experiments",
      "Connect new concepts to real-world examples you can relate to",
      "Use mnemonics to remember complex scientific terms and processes",
      "Practice explaining concepts in your own words to test understanding"
    ];
    const randomTip = scienceTips[Math.floor(Math.random() * scienceTips.length)];
    return `Science can be fascinating! Here's a helpful approach: ${randomTip}. What specific science topic or concept are you studying? I can provide explanations and study strategies.`;
  }
  
  // Study strategies and general help
  if (questionLower.includes('study') || questionLower.includes('exam') || questionLower.includes('test') || 
      questionLower.includes('homework')) {
    const studyTips = [
      "Create a study schedule and stick to it - consistency is key",
      "Use active recall: test yourself instead of just re-reading notes",
      "Form study groups with classmates to discuss difficult concepts",
      "Take regular breaks using the Pomodoro Technique (25 min study, 5 min break)",
      "Teach concepts to someone else - it's the best way to test your understanding"
    ];
    const randomTip = studyTips[Math.floor(Math.random() * studyTips.length)];
    return `Excellent question about studying! Here's a proven strategy: ${randomTip}. What subject are you preparing for? I can suggest specific study techniques for different types of material.`;
  }
  
  // Default response with encouragement
  const encouragingResponses = [
    "I'm here to support your learning journey! While in offline mode, I can still provide helpful study strategies and explanations.",
    "Great that you're seeking help with your studies! Even offline, I can offer guidance and learning tips.",
    "Learning is a process, and asking questions shows you're engaged! I'm here to help however I can in offline mode."
  ];
  
  const randomResponse = encouragingResponses[Math.floor(Math.random() * encouragingResponses.length)];
  return `${randomResponse} Could you tell me more about the specific subject or topic you need help with? The more details you provide, the better I can assist you.`;
};

export const getFallbackParentChatResponse = (message: string): string => {
  const messageLower = message.toLowerCase();
  
  // Academic performance and grades
  if (messageLower.includes('grade') || messageLower.includes('score') || messageLower.includes('performance') || 
      messageLower.includes('report card') || messageLower.includes('marks')) {
    const academicAdvice = [
      "Regular communication with teachers helps track your child's progress throughout the term",
      "Consider setting up a reward system for academic achievements to motivate your child",
      "Create a quiet, dedicated study space at home to support learning",
      "Encourage your child to ask questions in class and seek help when needed",
      "Review homework and assignments together to identify areas needing improvement"
    ];
    const randomAdvice = academicAdvice[Math.floor(Math.random() * academicAdvice.length)];
    return `I understand your concern about your child's academic performance. Here's a helpful tip: ${randomAdvice}. For detailed discussions about specific grades or subjects, I recommend scheduling a parent-teacher conference. What specific subject or area would you like to focus on supporting at home?`;
  }
  
  // Homework and assignments
  if (messageLower.includes('homework') || messageLower.includes('assignment') || messageLower.includes('study')) {
    const homeworkTips = [
      "Establish a consistent homework routine with set times and breaks",
      "Help your child break large assignments into smaller, manageable tasks",
      "Encourage independence while being available for guidance when needed",
      "Create a homework checklist to help your child stay organized",
      "Communicate with teachers if homework consistently takes too long"
    ];
    const randomTip = homeworkTips[Math.floor(Math.random() * homeworkTips.length)];
    return `Homework support is crucial for academic success! Here's a strategy that works well: ${randomTip}. Remember, the goal is to help your child develop independent study skills. What specific homework challenges is your child facing?`;
  }
  
  // Behavioral concerns
  if (messageLower.includes('behavior') || messageLower.includes('discipline') || messageLower.includes('attitude') || 
      messageLower.includes('respect') || messageLower.includes('attention')) {
    const behaviorStrategies = [
      "Consistent expectations between home and school help reinforce positive behavior",
      "Positive reinforcement often works better than punishment for lasting change",
      "Regular check-ins with your child about their school day can prevent issues",
      "Collaborate with teachers to understand triggers and develop coping strategies",
      "Model the behavior you want to see - children learn by example"
    ];
    const randomStrategy = behaviorStrategies[Math.floor(Math.random() * behaviorStrategies.length)];
    return `Addressing behavioral concerns early is important. Here's an effective approach: ${randomStrategy}. I recommend scheduling a meeting with your child's teacher and possibly the school counselor to develop a consistent plan. What specific behaviors are you concerned about?`;
  }
  
  // Social and friendship issues
  if (messageLower.includes('friend') || messageLower.includes('social') || messageLower.includes('bullying') || 
      messageLower.includes('peer') || messageLower.includes('lonely')) {
    const socialAdvice = [
      "Encourage your child to join extracurricular activities to meet like-minded peers",
      "Role-play social situations at home to build confidence",
      "Teach empathy and kindness through your own actions and discussions",
      "Monitor social media and online interactions appropriately for their age",
      "Contact the school immediately if bullying is suspected"
    ];
    const randomAdvice = socialAdvice[Math.floor(Math.random() * socialAdvice.length)];
    return `Social development is just as important as academic growth. Here's something that can help: ${randomAdvice}. If you're concerned about bullying or serious social issues, please contact the school counselor immediately. How can I help you support your child's social development?`;
  }
  
  // Communication with school
  if (messageLower.includes('teacher') || messageLower.includes('school') || messageLower.includes('principal') || 
      messageLower.includes('meeting') || messageLower.includes('conference')) {
    const communicationTips = [
      "Prepare specific questions and concerns before parent-teacher conferences",
      "Maintain regular email communication with teachers throughout the term",
      "Attend school events and activities to stay connected with the school community",
      "Be proactive in addressing concerns rather than waiting for problems to escalate",
      "Always approach school staff with a collaborative, solution-focused mindset"
    ];
    const randomTip = communicationTips[Math.floor(Math.random() * communicationTips.length)];
    return `Effective communication with school staff is key to your child's success. Here's a helpful approach: ${randomTip}. Building positive relationships with teachers and staff benefits everyone involved. What specific school-related matter would you like guidance on?`;
  }
  
  // General parenting and support
  if (messageLower.includes('help') || messageLower.includes('support') || messageLower.includes('advice') || 
      messageLower.includes('worried') || messageLower.includes('concerned')) {
    const parentingAdvice = [
      "Trust your instincts as a parent while remaining open to professional guidance",
      "Celebrate small victories and progress, not just major achievements",
      "Maintain open, non-judgmental communication with your child",
      "Remember that every child develops at their own pace",
      "Take care of your own well-being so you can better support your child"
    ];
    const randomAdvice = parentingAdvice[Math.floor(Math.random() * parentingAdvice.length)];
    return `Parenting can be challenging, and seeking support shows you care deeply about your child's well-being. Here's an important reminder: ${randomAdvice}. While I'm in offline mode, I can provide general guidance. For specific concerns, don't hesitate to reach out to school counselors or educational professionals. What area would you like to discuss further?`;
  }
  
  // Default response with empathy and guidance
  const supportiveResponses = [
    "Thank you for reaching out about your child's education. Your involvement makes a real difference in their success.",
    "I appreciate your concern for your child's well-being. Engaged parents like you are crucial for student success.",
    "It's wonderful that you're actively involved in your child's education. This support is invaluable for their development."
  ];
  
  const randomResponse = supportiveResponses[Math.floor(Math.random() * supportiveResponses.length)];
  return `${randomResponse} While I'm in offline mode, I can still provide general guidance and strategies. For specific concerns about your child, I recommend contacting their teacher or school counselor directly. What particular aspect of your child's education would you like to discuss?`;
};
