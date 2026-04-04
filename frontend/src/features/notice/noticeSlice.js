import { createSlice } from "@reduxjs/toolkit";

const noticeSlice = createSlice({
  name: "notice",
  initialState: {
    notices: [],
    loading: false,
    error: null,
  },
  reducers: {},
});

export default noticeSlice.reducer;
