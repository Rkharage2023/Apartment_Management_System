import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import notifReducer from './notifSlice'
import uiReducer from './uiSlice'
import billingReducer from './billingSlice'

export const store = configureStore({
  reducer: {
    auth:     authReducer,
    notif:    notifReducer,
    ui:       uiReducer,
    billing:  billingReducer,
  },
  devTools: import.meta.env.DEV,
})

export type RootState    = ReturnType<typeof store.getState>
export type AppDispatch  = typeof store.dispatch