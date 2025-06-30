import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  doctors: [],
};

const doctorSlice = createSlice({
  name: 'doctorHistory',
  initialState,
  reducers: {
    setDoctorsFromHistory: (state, action) => {
      state.doctors = action.payload;
    }
  },
});

export const doctorsActions = doctorSlice.actions;
export default doctorSlice;
