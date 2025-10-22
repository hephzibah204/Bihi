// Communication and Messaging Types

import type { UserRole } from './user';

export interface CommunicationLog {
  id: string;
  type: 'announcement' | 'reminder' | 'direct';
  channel: 'sms' | 'email';
  content: string;
  recipients: string[] | 'all';
  sentAt: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  type: 'sms' | 'email';
  // Optional subject line for email templates
  subject?: string;
}

export interface ScheduledReminder {
  id: string;
  name: string;
  type: 'overdue_fees';
  templateId: string;
  days_after_due: number;
  enabled: boolean;
}

// Scheduled email/newsletter campaigns with a specific send date/time
export interface ScheduledCampaign {
  id: string;
  name: string;
  templateId: string;
  channel: 'email';
  target: 'all' | 'class';
  className?: string;
  sendAt: string; // ISO datetime
  enabled: boolean;
}

export interface Conversation {
  id: string;
  otherParticipant: { id: string; name: string; role: UserRole };
  lastMessage: { content: string; timestamp: string };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}