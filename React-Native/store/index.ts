import { configureStore } from '@reduxjs/toolkit';
import enrollmentReducer from './slices/enrollmentSlice';
import coursePreviewReducer from './slices/coursePreviewSlice';

export const store = configureStore({
  reducer: {
    enrollment: enrollmentReducer,
    coursePreview: coursePreviewReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;