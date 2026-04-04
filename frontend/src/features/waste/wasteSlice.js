import { createSlice } from "@reduxjs/toolkit";

const wasteSlice = createSlice({
  name: "waste",
  initialState: {
    logs: [],
    loading: false,
    error: null,
  },
  reducers: {},
});

export default wasteSlice.reducer;
