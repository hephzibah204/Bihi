import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { AdmissionApplication } from '../types/school';
import Modal from './Modal';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';

interface InterviewSlot {
  id: string;
  date: string;
  time: string;
  duration: number;
  interviewer: string;
  location: string;
  available: boolean;
  application_id?: string;
  created_at?: string;
}

interface InterviewSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  application: AdmissionApplication;
  onScheduled: (slot: InterviewSlot) => void;
}

const InterviewScheduler: React.FC<InterviewSchedulerProps> = ({
  isOpen,
  onClose,
  application,
  onScheduled
}) => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<InterviewSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<InterviewSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [interviewers, setInterviewers] = useState([
    { id: '1', name: 'Dr. Sarah Johnson', title: 'Principal' },
    { id: '2', name: 'Mr. David Okafor', title: 'Vice Principal' },
    { id: '3', name: 'Mrs. Grace Adebayo', title: 'Admissions Officer' }
  ]);

  useEffect(() => {
    if (isOpen) {
      loadAvailableSlots();
    }
  }, [isOpen, selectedWeek]);

  const loadAvailableSlots = async () => {
    setLoading(true);
    try {
      const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });

      // Load existing slots from database
      const { data: existingSlots, error } = await supabase
        .from('interview_slots')
        .select('*')
        .eq('school_id', application.school_id)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;

      // Generate default slots if none exist
      if (!existingSlots || existingSlots.length === 0) {
        const generatedSlots = generateWeeklySlots(weekStart, weekEnd);
        setAvailableSlots(generatedSlots);
      } else {
        setAvailableSlots(existingSlots);
      }
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklySlots = (weekStart: Date, weekEnd: Date): InterviewSlot[] => {
    const slots: InterviewSlot[] = [];
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    // Skip weekends
    const workDays = days.filter(day => day.getDay() !== 0 && day.getDay() !== 6);
    
    const timeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
    ];

    workDays.forEach(day => {
      timeSlots.forEach(time => {
        const randomInterviewer = interviewers[Math.floor(Math.random() * interviewers.length)];
        slots.push({
          id: `slot_${format(day, 'yyyy-MM-dd')}_${time}`,
          date: format(day, 'yyyy-MM-dd'),
          time,
          duration: 30,
          interviewer: randomInterviewer.name,
          location: 'Principal\'s Office',
          available: true
        });
      });
    });

    return slots;
  };

  const handleScheduleInterview = async () => {
    if (!selectedSlot) return;

    setLoading(true);
    try {
      // Create or update the interview slot
      const slotData = {
        ...selectedSlot,
        application_id: application.id,
        school_id: application.school_id,
        available: false,
        scheduled_at: new Date().toISOString()
      };

      const { error: slotError } = await supabase
        .from('interview_slots')
        .upsert([slotData]);

      if (slotError) throw slotError;

      // Update application status
      const { error: appError } = await supabase
        .from('admission_applications')
        .update({
          status: 'interview_scheduled',
          interview_date: `${selectedSlot.date}T${selectedSlot.time}:00Z`,
          notes: `Interview scheduled with ${selectedSlot.interviewer} at ${selectedSlot.location}`
        })
        .eq('id', application.id);

      if (appError) throw appError;

      // Send notification email
      await supabase.functions.invoke('send-interview-notification', {
        body: {
          applicationId: application.id,
          parentEmail: application.parent?.email,
          studentName: `${application.student?.firstName} ${application.student?.lastName}`,
          interviewDate: selectedSlot.date,
          interviewTime: selectedSlot.time,
          interviewer: selectedSlot.interviewer,
          location: selectedSlot.location
        }
      });

      onScheduled(selectedSlot);
      onClose();
    } catch (error) {
      console.error('Error scheduling interview:', error);
      alert('Failed to schedule interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'next' 
      ? addDays(selectedWeek, 7)
      : addDays(selectedWeek, -7);
    setSelectedWeek(newWeek);
  };

  const groupSlotsByDay = () => {
    const grouped: Record<string, InterviewSlot[]> = {};
    availableSlots.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });
    return grouped;
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'EEEE, MMMM d');
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const groupedSlots = groupSlotsByDay();
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Interview" size="xl">
      <div className="p-6">
        {/* Application Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">Interview for:</h3>
          <div className="text-sm space-y-1">
            <p><strong>Student:</strong> {application.student?.firstName} {application.student?.lastName}</p>
            <p><strong>Class:</strong> {application.student?.classApplyingFor}</p>
            <p><strong>Parent:</strong> {application.parent?.firstName} {application.parent?.lastName}</p>
            <p><strong>Email:</strong> {application.parent?.email}</p>
            <p><strong>Phone:</strong> {application.parent?.phone}</p>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigateWeek('prev')}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <span>←</span>
            <span>Previous Week</span>
          </button>
          
          <h3 className="text-lg font-semibold">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h3>
          
          <button
            onClick={() => navigateWeek('next')}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <span>Next Week</span>
            <span>→</span>
          </button>
        </div>

        {/* Available Slots */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {Object.keys(groupedSlots).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No available slots for this week
              </div>
            ) : (
              Object.entries(groupedSlots).map(([date, slots]) => (
                <div key={date} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">{formatDate(date)}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {slots
                      .filter(slot => slot.available)
                      .map(slot => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 border rounded-lg text-left transition-colors ${
                            selectedSlot?.id === slot.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium">{formatTime(slot.time)}</div>
                          <div className="text-xs text-gray-600">{slot.interviewer}</div>
                          <div className="text-xs text-gray-500">{slot.location}</div>
                        </button>
                      ))}
                  </div>
                  {slots.filter(slot => slot.available).length === 0 && (
                    <p className="text-gray-500 text-sm">No available slots</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Selected Slot Details */}
        {selectedSlot && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Selected Interview Slot</h4>
            <div className="text-sm space-y-1">
              <p><strong>Date:</strong> {formatDate(selectedSlot.date)}</p>
              <p><strong>Time:</strong> {formatTime(selectedSlot.time)}</p>
              <p><strong>Duration:</strong> {selectedSlot.duration} minutes</p>
              <p><strong>Interviewer:</strong> {selectedSlot.interviewer}</p>
              <p><strong>Location:</strong> {selectedSlot.location}</p>
            </div>
          </div>
        )}

        {/* Interview Guidelines */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Interview Guidelines</h4>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>• Please arrive 10 minutes before your scheduled time</li>
            <li>• Bring original copies of all submitted documents</li>
            <li>• Both parent and student should attend the interview</li>
            <li>• The interview will last approximately 30 minutes</li>
            <li>• You will receive a confirmation email with detailed instructions</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleScheduleInterview}
            disabled={!selectedSlot || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{loading ? 'Scheduling...' : 'Schedule Interview'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InterviewScheduler;
