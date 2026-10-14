/** Each finger owns only its own control; releasing an action must not stop the stick. */
export class SkyTouchInput {
 stickPointer:number|null=null;
 stick={x:0,z:0};
 private held=new Map<number,'dash'|'stomp'>();
 beginStick(id:number){if(this.stickPointer!==null)return false;this.stickPointer=id;return true;}
 moveStick(id:number,x:number,z:number){if(id!==this.stickPointer)return false;const n=Math.max(1,Math.hypot(x,z));this.stick={x:x/n,z:z/n};return true;}
 endStick(id:number){if(this.stickPointer!==id)return false;this.stickPointer=null;this.stick={x:0,z:0};return true;}
 hold(id:number,action:'dash'|'stomp'){this.held.set(id,action);}
 release(id:number){this.held.delete(id);}
 isHeld(action:'dash'|'stomp'){return [...this.held.values()].includes(action);}
 reset(){this.stickPointer=null;this.stick={x:0,z:0};this.held.clear();}
}
