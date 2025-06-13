
import { format, parse, addDays, subDays, isValid, parseISO } from 'date-fns';

export const formatDate = (date) => {
  return format(date, 'MMMM d, yyyy');
};

export const formatDateForApi = (date) => {
  return format(date, 'yyyy-MM-dd');
};

export const parseDate = (dateStr) => {
  try {
    const date = parseISO(dateStr);
    if (isValid(date)) return date;
    
    return parse(dateStr, 'MM/dd/yyyy', new Date());
  } catch (e) {
    return new Date();
  }
};

export const addDaysToDate = (date, days) => {
  return addDays(date, days);
};

export const subtractDaysFromDate = (date, days) => {
  return subDays(date, days);
};

export const today = () => {
  return new Date();
};

export const tomorrow = () => {
  return addDays(new Date(), 1);
};

export const yesterday = () => {
  return subDays(new Date(), 1);
};

export const getCurrentWeekDates = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  
  const monday = new Date(today.setDate(diff));
  
  const weekDates = [];
  for(let i = 0; i < 7; i++) {
    weekDates.push(addDays(new Date(monday), i));
  }
  
  return weekDates;
};

export const formatTimeString = (time) => {
  return time;
};

export const generateTimeSlots = () => {
  return [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];
};
