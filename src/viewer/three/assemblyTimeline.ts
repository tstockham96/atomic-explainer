import {ease} from './timeline.ts'
export const ASSEMBLY_START=.12, ASSEMBLY_END=.94
export const assemblyProgress=(index:number,local:number,count:number)=>ASSEMBLY_START+(index+local)/count*(ASSEMBLY_END-ASSEMBLY_START)
export function assemblySample(progress:number,count:number){
 const p=Math.max(0,Math.min(1,progress)),opening=p<ASSEMBLY_START,reveal=ease((p-.035)/(ASSEMBLY_START-.035)),complete=p>=ASSEMBLY_END,chapterProgress=Math.max(0,(p-ASSEMBLY_START)/(ASSEMBLY_END-ASSEMBLY_START)*count),index=complete?count-1:Math.min(count-1,Math.floor(chapterProgress)),local=complete?1:chapterProgress-index
 const arrival=index===0?1:ease(local/.18),focus=arrival*(1-ease((local-.58)/.18)),join=ease((local-.76)/.16)
 return {progress:p,index,local,opening,reveal,complete,arrival,focus,join,turn:ease((local-.2)/.36)*Math.PI*2}
}

/** Preserve reading/inspection room as more lessons and milestones are added. */
export const assemblyScrollVh=(chapters:number)=>(3+chapters*1.25)*100
