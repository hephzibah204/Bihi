import React from 'react';
import StudentAssignments from './StudentAssignments';

// The ParentAssignments component can re-use the StudentAssignments component,
// as they display the same information. The demoUserId prop will ensure
// the correct student's data is shown.
const ParentAssignments = ({ demoUserId }) => {
    return <StudentAssignments demoUserId={demoUserId} />;
};

export default ParentAssignments;
