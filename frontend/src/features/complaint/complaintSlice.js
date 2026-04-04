import { createSlice } from "@reduxjs/toolkit";

const complaintSlice = createSlice({
  name: "complaint",
  initialState: {
    complaints: [],
    loading: false,
    error: null,
  },
  reducers: {},
});

export default complaintSlice.reducer;
