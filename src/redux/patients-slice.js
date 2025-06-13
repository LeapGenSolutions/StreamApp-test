// src/redux/appointmentSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  patients: [],
};

const patientSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    setPatients: (state, action) => {
      // Flatten and normalize if needed
      state.patients = action.payload;
    },
    updatePatients: (state, action) => {
      const { id, status } = action.payload;
      const appt = state.patients.find(a => a.id === id);
      if (appt) {
        appt.status = status;
      }
    },
  },
});

export const patientActions = patientSlice.actions;
export default patientSlice;
