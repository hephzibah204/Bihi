import React from 'react';
import StudentResults from './StudentResults';

// The ParentResults component can re-use the StudentResults component,
// as they display the same information. The demoUserId prop will ensure
// the correct student's data is shown.
const ParentResults = ({ demoUserId }) => {
    return <StudentResults demoUserId={demoUserId} />;
};

export default ParentResults;
