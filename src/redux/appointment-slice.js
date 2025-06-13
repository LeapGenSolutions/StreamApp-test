// src/redux/appointmentSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  appointments: [],
};

const appointmentSlice = createSlice({
  name: 'appointment',
  initialState,
  reducers: {
    setAppointments: (state, action) => {
      // Flatten and normalize if needed
      state.appointments = action.payload;
    },
    updateAppointmentStatus: (state, action) => {
      const { id, status } = action.payload;
      const appt = state.appointments.find(a => a.id === id);
      if (appt) {
        appt.status = status;
      }
    },
  },
});

export const appointmentActions = appointmentSlice.actions;
export default appointmentSlice;