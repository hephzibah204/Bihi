import React from 'react';

interface RecentStudent { id: string; name: string; className: string; avatarUrl?: string }
interface Message { id: string; sender: string; snippet: string; time: string; avatarUrl?: string }

const RecentStudentItem: React.FC<{ item: RecentStudent }> = ({ item }) => (
  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
    <div className="h-8 w-8 rounded-full bg-gray-200" />
    <div>
      <div className="text-sm font-medium text-[#0F172A]">{item.name}</div>
      <div className="text-xs text-gray-500">{item.className}</div>
    </div>
    <button className="ml-auto h-7 w-7 rounded-full bg-gray-100" />
  </div>
);

const MessageItem: React.FC<{ item: Message }> = ({ item }) => (
  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
    <div className="h-8 w-8 rounded-full bg-gray-200" />
    <div className="min-w-0">
      <div className="text-sm font-medium text-[#0F172A]">{item.sender}</div>
      <div className="text-xs text-gray-500 truncate">{item.snippet}</div>
    </div>
    <div className="text-[11px] text-gray-400 ml-auto">{item.time}</div>
  </div>
);

const RightPanel: React.FC<{ students: RecentStudent[]; messages: Message[] }> = ({ students, messages }) => {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-base font-semibold mb-2">Recent Students</div>
        <div className="text-xs text-gray-500 mb-2">You have {students.length} students</div>
        <div className="space-y-2">
          {students.map(s => <RecentStudentItem key={s.id} item={s} />)}
        </div>
        <button className="mt-2 btn btn-primary w-full">View more</button>
      </div>
      <div>
        <div className="text-base font-semibold mb-2">Messages</div>
        <div className="space-y-2">
          {messages.map(m => <MessageItem key={m.id} item={m} />)}
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
