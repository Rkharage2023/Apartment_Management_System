import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    sidebarOpen: false, // mobile drawer
    activeModal: null, // 'payBill' | 'assignComplaint' | null
    modalData: null,
  },
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    closeSidebar(state) {
      state.sidebarOpen = false;
    },
    openModal(state, action) {
      state.activeModal = action.payload.modal;
      state.modalData = action.payload.data || null;
    },
    closeModal(state) {
      state.activeModal = null;
      state.modalData = null;
    },
  },
});

export const { toggleSidebar, closeSidebar, openModal, closeModal } =
  uiSlice.actions;
export default uiSlice.reducer;
