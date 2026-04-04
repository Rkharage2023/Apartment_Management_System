import { createSlice } from "@reduxjs/toolkit";

const societySlice = createSlice({
  name: "society",
  initialState: {
    societies: [],
    loading: false,
    error: null,
  },
  reducers: {},
});

export default societySlice.reducer;
