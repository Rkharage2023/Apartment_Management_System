import { createSlice } from "@reduxjs/toolkit";

const flatSlice = createSlice({
  name: "flat",
  initialState: {
    flats: [],
    loading: false,
    error: null,
  },
  reducers: {},
});

export default flatSlice.reducer;