import React,{useRef} from 'react';
import GolfCanvas from './GolfCanvas';
import SideCanvas from './side-golf/SideCanvas';
import {createSideState} from './side-golf/physics';
import {isSideCourse,sideHoleId,type CourseId} from './course';
import type {GolfView} from './engine';
import type {KartAvatar} from '../gakuro-kart/avatar';
export default function GolfCoursePreview({course,view=null,selfId='',avatar}:{course:CourseId;view?:GolfView|null;selfId?:string;avatar:KartAvatar}){
 const game=useRef(createSideState(sideHoleId(course,0))),id=view?.sideState?.courseId??sideHoleId(course,0);
 if(game.current.courseId!==id)game.current=createSideState(id);if(view?.sideState)game.current=view.sideState;
 return isSideCourse(course)?<div style={{position:'absolute',inset:0}}><SideCanvas key={id} game={game} angle={44} power={.65} shot="normal" correct={3} avatar={avatar} overview paused/></div>:<GolfCanvas view={view} selfId={selfId} aim={0} overview={false} avatar={avatar}/>;
}
