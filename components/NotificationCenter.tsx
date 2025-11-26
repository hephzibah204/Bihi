import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import Modal from './Modal';
import { format, formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'admission' | 'payment' | 'interview';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  expiresAt?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId?: string;
  userId?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  schoolId,
  userId
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'admission' | 'payment' | 'interview'>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      // Set up real-time subscription
      const subscription = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: schoolId ? `school_id=eq.${schoolId}` : `user_id=eq.${userId}`
          }, 
          (payload) => {
            handleRealtimeUpdate(payload);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isOpen, schoolId, userId]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      } else if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Add demo notifications for testing
      const demoNotifications: Notification[] = [
        {
          id: 'demo_1',
          title: 'New Application Received',
          message: 'A new admission application has been submitted by Sarah Johnson for Grade 7.',
          type: 'admission',
          priority: 'medium',
          read: false,
          actionUrl: '/admin/admissions',
          actionText: 'Review Application',
          metadata: { applicationId: 'app_001', studentName: 'Sarah Johnson' },
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        {
          id: 'demo_2',
          title: 'Payment Received',
          message: 'Application fee payment of ₦50,000 has been confirmed for John Doe.',
          type: 'payment',
          priority: 'low',
          read: false,
          actionUrl: '/admin/payments',
          actionText: 'View Payment',
          metadata: { amount: 50000, paymentId: 'pay_001' },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        {
          id: 'demo_3',
          title: 'Interview Scheduled',
          message: 'Interview has been scheduled for Emma Wilson on March 15, 2024 at 10:00 AM.',
          type: 'interview',
          priority: 'high',
          read: true,
          actionUrl: '/admin/interviews',
          actionText: 'View Schedule',
          metadata: { studentName: 'Emma Wilson', interviewDate: '2024-03-15T10:00:00Z' },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
        },
        {
          id: 'demo_4',
          title: 'System Maintenance',
          message: 'Scheduled system maintenance will occur on Sunday, March 17, 2024 from 2:00 AM to 4:00 AM.',
          type: 'warning',
          priority: 'medium',
          read: false,
          metadata: { maintenanceDate: '2024-03-17T02:00:00Z' },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString() // Expires in 1 week
        },
        {
          id: 'demo_5',
          title: 'Bulk Email Sent',
          message: 'Successfully sent admission updates to 45 parents.',
          type: 'success',
          priority: 'low',
          read: true,
          actionUrl: '/admin/communications',
          actionText: 'View Report',
          metadata: { recipientCount: 45, campaignType: 'admission_update' },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() // 3 days ago
        }
      ];

      setNotifications([...demoNotifications, ...(data || [])]);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setNotifications(prev => {
      switch (eventType) {
        case 'INSERT':
          return [newRecord, ...prev];
        case 'UPDATE':
          return prev.map(n => n.id === newRecord.id ? newRecord : n);
        case 'DELETE':
          return prev.filter(n => n.id !== oldRecord.id);
        default:
          return prev;
      }
    });
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length > 0) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .in('id', unreadIds);

        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'admission': return '📝';
      case 'payment': return '💳';
      case 'interview': return '🗓️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': 
      default: return 'ℹ️';
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': 
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notifications" size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              Mark all as read
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {[
            { value: 'all', label: 'All', count: notifications.length },
            { value: 'unread', label: 'Unread', count: unreadCount },
            { value: 'admission', label: 'Admissions', count: notifications.filter(n => n.type === 'admission').length },
            { value: 'payment', label: 'Payments', count: notifications.filter(n => n.type === 'payment').length },
            { value: 'interview', label: 'Interviews', count: notifications.filter(n => n.type === 'interview').length }
          ].map((filterOption) => (
            <button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value as any)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                filter === filterOption.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{filterOption.label}</span>
              {filterOption.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === filterOption.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {filterOption.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📭</div>
              <p>No notifications found</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 transition-colors ${
                  notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                } hover:shadow-md cursor-pointer`}
                onClick={() => setSelectedNotification(notification)}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-medium ${notification.read ? 'text-gray-900' : 'text-blue-900'}`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                      
                      <div className="flex space-x-2">
                        {notification.actionUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle navigation
                              window.location.href = notification.actionUrl!;
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {notification.actionText || 'View'}
                          </button>
                        )}
                        
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-xs text-gray-600 hover:text-gray-800"
                          >
                            Mark as read
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Notification Settings */}
        <div className="border-t pt-4 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Notification Preferences</h4>
              <p className="text-sm text-gray-600">Manage how you receive notifications</p>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedNotification(null)}
          title="Notification Details"
          size="md"
        >
          <div className="p-6">
            <div className="flex items-start space-x-3 mb-4">
              <div className="text-3xl">{getNotificationIcon(selectedNotification.type)}</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedNotification.title}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(selectedNotification.priority)}`}>
                    {selectedNotification.priority} priority
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(selectedNotification.createdAt), 'PPpp')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700">{selectedNotification.message}</p>
            </div>

            {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Details</h4>
                <dl className="text-sm space-y-1">
                  {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <dt className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</dt>
                      <dd className="text-gray-900 font-medium">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
              
              {selectedNotification.actionUrl && (
                <button
                  onClick={() => {
                    window.location.href = selectedNotification.actionUrl!;
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedNotification.actionText || 'Take Action'}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};

export default NotificationCenter;
