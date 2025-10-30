import React from 'react';
import ChatbotPanel from './ChatbotPanel';
import { PARENT_VIEWS, USER_ROLES } from '../utils/constants';

interface ParentAIToolsProps {
    demoUserId?: string | null;
}

const ParentAITools: React.FC<ParentAIToolsProps> = ({ demoUserId }) => {
    return (
        <div className="space-y-8">
            <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold">Parent's Coach</h2>
                        <p className="text-sm text-gray-600">Get guidance tailored to your child’s progress and activities.</p>
                    </div>
                </div>
                <ChatbotPanel 
                    isOpen={true}
                    onClose={() => {}}
                    userRole={USER_ROLES.PARENT}
                    demoUserId={demoUserId ?? undefined}
                    activeView={PARENT_VIEWS.AI_TOOLS}
                />
            </div>
        </div>
    );
};

export default ParentAITools;