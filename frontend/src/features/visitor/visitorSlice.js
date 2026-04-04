import { createSlice } from "@reduxjs/toolkit";

const visitorSlice = createSlice({
  name: "visitor",
  initialState: {
    visitors: [],
    loading: false,
    error: null,
  },
  reducers: {},
});

export default visitorSlice.reducer;
