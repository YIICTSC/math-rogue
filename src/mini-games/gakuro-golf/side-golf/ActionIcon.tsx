import React from 'react';
export default function ActionIcon({kind}:{kind:string}){
 const paths:Record<string,React.ReactNode>={
 ball:<><circle cx="32" cy="32" r="18"/><path d="m21 27 3 1m12-8 3 1m0 17 3 1m-19 0 3 1"/></>,
 anchor:<><path d="M32 16v32M19 29H9v10a23 23 0 0 0 46 0V29H45M10 30l9 5m36-5-9 5"/><circle cx="32" cy="12" r="5"/></>,
 snow:<><path d="M32 6v52M9 19l46 26M9 45l46-26M25 10l7 7 7-7M25 54l7-7 7 7M9 26l10-3-2-10m30 0-2 10 10 3M9 38l10 3-2 10m30 0-2-10 10-3"/></>,
 weight:<><path d="m18 25-8 29h44l-8-29ZM25 25v-9a7 7 0 0 1 14 0v9"/><path d="m25 38 7 7 7-7M32 32v13"/></>,
 bounce:<><path d="M8 54h48M12 45c0-34 21-34 21 0m0 0c0-25 19-25 19 0"/><circle cx="12" cy="13" r="5"/></>,
 feather:<><path d="M13 55 44 16M17 45C-2 26 32 1 54 10c0 25-17 44-37 35Zm8-8 17 1M32 28l14 1"/></>,
 ghost:<><path d="M12 54V27a20 20 0 0 1 40 0v27l-10-6-10 6-10-6Z"/><circle cx="25" cy="28" r="2"/><circle cx="40" cy="28" r="2"/></>,
 brake:<><path d="M15 8h34l9 9v30l-9 9H15l-9-9V17ZM26 20v24m12-24v24"/></>,
 undo:<><path d="M15 24a23 23 0 1 1 1 26M7 9v20h20"/></>,
 shot:<><path d="m41 9-22 39 19 8 10-9-16-9M12 12l8 4M8 26l10 2"/><circle cx="48" cy="17" r="7"/></>,
 left:<path d="m41 12-22 20 22 20"/>,right:<path d="m23 12 22 20-22 20"/>,map:<><path d="m8 15 16-7 16 8 16-7v40l-16 7-16-8-16 7ZM24 8v40m16-32v40"/></>,
 pause:<><path d="M22 12v40m20-40v40"/></>,play:<path d="m20 10 31 22-31 22Z"/>,
 help:<><circle cx="32" cy="32" r="24"/><path d="M24 25a9 9 0 1 1 15 7c-7 4-7 4-7 9m0 7v1"/></>,
 };
 return <svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">{paths[kind]||paths.ball}</svg>;
}
