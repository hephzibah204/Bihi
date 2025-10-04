import React from 'react';
import ReportCardHeader from './ReportCardHeader';

const StarRating = ({ rating }) => {
    const totalStars = 5;
    return (
        <div className="flex">
            {[...Array(totalStars)].map((_, i) => (
                <svg key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
};

const assessmentAreas = {
    cognitive: [
        { skill: "Identifies letters & numbers", rating: 4 },
        { skill: "Shows interest in books", rating: 5 },
        { skill: "Problem-solving skills", rating: 3 },
    ],
    psychomotor: [
        { skill: "Hand-eye coordination", rating: 5 },
        { skill: "Fine motor skills (drawing, etc.)", rating: 4 },
        { skill: "Gross motor skills (running, jumping)", rating: 5 },
    ],
    affective: [
        { skill: "Social interaction with peers", rating: 4 },
        { skill: "Follows instructions", rating: 3 },
        { skill: "Shows respect for others", rating: 5 },
    ]
};

const NurseryReportCard = ({ student, settings, students, scores, subjects, term, session, remarks, attendance }) => {
  return (
    <div className="bg-white p-6 shadow-lg" id={`report-card-${student.id}`}>
      <ReportCardHeader settings={settings} />
      <div className="flex items-center space-x-4 my-4 text-sm">
         <img 
            src={student.photo || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(student.name)}`} 
            alt="Student" 
            className="w-20 h-20 object-cover rounded-md border"
        />
        <div className="grid grid-cols-2 gap-4">
            <div><strong>Name:</strong> {student.name}</div>
            <div><strong>Class:</strong> {student.class}</div>
            <div><strong>Session:</strong> {session}</div>
            <div><strong>Term:</strong> {term}</div>
        </div>
      </div>
      
      <h3 className="font-bold text-md mt-6 mb-2 border-b">Cognitive Development</h3>
      <table className="w-full text-sm">
          <tbody>{assessmentAreas.cognitive.map(item => <tr key={item.skill}><td className="py-1">{item.skill}</td><td className="py-1"><StarRating rating={item.rating}/></td></tr>)}</tbody>
      </table>

      <h3 className="font-bold text-md mt-6 mb-2 border-b">Psychomotor Skills</h3>
      <table className="w-full text-sm">
          <tbody>{assessmentAreas.psychomotor.map(item => <tr key={item.skill}><td className="py-1">{item.skill}</td><td className="py-1"><StarRating rating={item.rating}/></td></tr>)}</tbody>
      </table>

      <h3 className="font-bold text-md mt-6 mb-2 border-b">Affective & Social Skills</h3>
       <table className="w-full text-sm">
          <tbody>{assessmentAreas.affective.map(item => <tr key={item.skill}><td className="py-1">{item.skill}</td><td className="py-1"><StarRating rating={item.rating}/></td></tr>)}</tbody>
      </table>

      <div className="mt-6">
          <h3 className="font-bold text-md mb-2">Teacher's Comment</h3>
          <p className="text-sm p-2 border rounded-md">
              {student.name} is a cheerful and enthusiastic learner. He/she has shown great improvement in social interaction this term.
          </p>
      </div>

    </div>
  );
};

export default NurseryReportCard;