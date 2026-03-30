import { createSlice } from "@reduxjs/toolkit";

// Persist token to localStorage so page refresh keeps user logged in
const tokenFromStorage = localStorage.getItem("accessToken") || null;
const userFromStorage = JSON.parse(localStorage.getItem("user")) || null;

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: userFromStorage,
    accessToken: tokenFromStorage,
    isLoggedIn: !!tokenFromStorage,
    loading: false,
    error: null,
  },
  reducers: {
    loginSuccess(state, action) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isLoggedIn = true;
      state.error = null;
      localStorage.setItem("accessToken", action.payload.accessToken);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.isLoggedIn = false;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    },
    tokenRefreshed(state, action) {
      state.accessToken = action.payload;
      localStorage.setItem("accessToken", action.payload);
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
  },
});

export const { loginSuccess, logout, tokenRefreshed, updateUser } =
  authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectRole = (state) => state.auth.user?.role;
export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
export const selectToken = (state) => state.auth.accessToken;
