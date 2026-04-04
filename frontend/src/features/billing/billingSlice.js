import { createSlice } from "@reduxjs/toolkit";

const billingSlice = createSlice({
  name: "billing",
  initialState: {
    bills: [],
    loading: false,
    error: null,
  },
  reducers: {},
});

export default billingSlice.reducer;
