
import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';

// Format appointment time for display
export const formatAppointmentTime = (time) => {
  return time;
};

// Format appointment date for display
export const formatAppointmentDate = (dateStr) => {
  try {
    const date = parseISO(dateStr);
    
    if (isToday(date)) {
      return `Today, ${format(date, 'MMMM d, yyyy')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, 'MMMM d, yyyy')}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'MMMM d, yyyy')}`;
    }
    
    return format(date, 'EEEE, MMMM d, yyyy');
  } catch (e) {
    return dateStr;
  }
};

// Get appropriate color class based on appointment method and status
export const getAppointmentColorClass = (method, status) => {
  if (status === 'waiting') return 'bg-yellow-50 border-warning-500';
  if (status === 'no-show') return 'bg-red-50 border-danger-500';
  if (status === 'completed') return 'bg-green-50 border-success-500';
  
  if (method === 'video') return 'bg-blue-50 border-primary-500';
  return 'bg-green-50 border-success-500';
};

// Get appointment type badge color
export const getAppointmentBadgeClass = (method) => {
  return method === 'video' ? 'bg-primary-500' : 'bg-success-500';
};

// Get display name for appointment status
export const getStatusDisplayName = (status) => {
  const statusMap = {
    'waiting': 'Waiting',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'no-show': 'No Show',
    'cancelled': 'Cancelled',
    'rescheduled': 'Rescheduled'
  };
  
  return statusMap[status] || status;
};

// Filter appointments by provider
export const filterAppointmentsByProvider = (appointments, providerId) => {
  if (!providerId) return appointments;
  return appointments.filter(appointment => appointment.providerId.toString() === providerId);
};

// Group appointments by time
export const groupAppointmentsByTime = (appointments) => {
  return appointments.reduce((groups, appointment) => {
    const timeSlot = appointment.time;
    if (!groups[timeSlot]) {
      groups[timeSlot] = [];
    }
    groups[timeSlot].push(appointment);
    return groups;
  }, {});
};

// Get appropriate badge text for appointment method
export const getMethodDisplayText = (method) => {
  const methodMap = {
    'video': 'Video Call',
    'in-person': 'In-Person',
    'phone': 'Phone Call'
  };
  
  return methodMap[method] || method;
};
