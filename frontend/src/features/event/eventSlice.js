import { createSlice } from "@reduxjs/toolkit";

const eventSlice = createSlice({
  name: "event",
  initialState: {
    events: [],
    loading: false,
    error: null,
  },
  reducers: {},
});

export default eventSlice.reducer;
