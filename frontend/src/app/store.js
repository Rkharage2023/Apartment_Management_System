import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import societyReducer from "../features/society/societySlice";
import flatReducer from "../features/flat/flatSlice";
import billingReducer from "../features/billing/billingSlice";
import complaintReducer from "../features/complaint/complaintSlice";
import noticeReducer from "../features/notice/noticeSlice";
import visitorReducer from "../features/visitor/visitorSlice";
import parkingReducer from "../features/parking/parkingSlice";
import eventReducer from "../features/event/eventSlice";
import wasteReducer from "../features/waste/wasteSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    society: societyReducer,
    flat: flatReducer,
    billing: billingReducer,
    complaint: complaintReducer,
    notice: noticeReducer,
    visitor: visitorReducer,
    parking: parkingReducer,
    event: eventReducer,
    waste: wasteReducer,
  },
});

export default store;
