// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import appointmentSlice from './appointment-slice';
import patientSlice from './patients-slice';
import mySlice from './me-slice';

export const store = configureStore({
  reducer: {
    appointments: appointmentSlice.reducer,
    patients: patientSlice.reducer,
    me: mySlice.reducer
  },
});
