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
    <div className="space-y-6 relative">
      <button title="Add" className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center">+</button>
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-base font-semibold">Recent Students</div>
        </div>
        <div className="text-xs text-gray-500 mb-2">You have {students.length} students</div>
        <div className="space-y-2">
          {students.map(s => <RecentStudentItem key={s.id} item={s} />)}
        </div>
        <button className="mt-3 w-full rounded-full bg-white border border-gray-200 px-3 py-2 text-sm">View More</button>
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
