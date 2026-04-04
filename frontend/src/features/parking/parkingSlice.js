import { createSlice } from "@reduxjs/toolkit";

const parkingSlice = createSlice({
  name: "parking",
  initialState: {
    slots: [],
    loading: false,
    error: null,
  },
  reducers: {},
});

export default parkingSlice.reducer;
