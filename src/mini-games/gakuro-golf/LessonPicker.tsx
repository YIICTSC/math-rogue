import React from 'react';
import OnlineLessonPicker from '../shared/OnlineLessonPicker';
export default function LessonPicker(props:Omit<React.ComponentProps<typeof OnlineLessonPicker>,'activity'>){return <OnlineLessonPicker {...props} activity="golf"/>;}
