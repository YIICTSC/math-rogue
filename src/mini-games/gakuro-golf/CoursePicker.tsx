import React from 'react';
import {isSideCourse,type CourseId} from './course';
import {SIDE_COLLECTIONS} from './side-golf/courses';
export default function CoursePicker({value,onChange,disabled,t}:{value:CourseId;onChange:(value:CourseId)=>void;disabled:boolean;t:(s:string)=>string}){
 return <><label>{t('コースを選ぶ')}<select aria-label={t('コースを選ぶ')} value={isSideCourse(value)?'side':value} disabled={disabled} onChange={e=>onChange(e.target.value==='side'?'side-1':e.target.value as CourseId)}><option value="classic">{t('クラシック・18ホール')}</option><option value="adventure">{t('冒険・18ホール')}</option><option value="side">{t('2D・全72ホール')}</option></select></label>{isSideCourse(value)&&<label>{t('2Dコースを選ぶ')}<select aria-label={t('2Dコースを選ぶ')} value={value} disabled={disabled} onChange={e=>onChange(e.target.value as CourseId)}>{SIDE_COLLECTIONS.map(c=><option key={c.id} value={c.id}>{t(c.name)} · 18 H</option>)}</select></label>}</>;
}
