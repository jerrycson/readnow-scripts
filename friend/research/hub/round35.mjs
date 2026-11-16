// Earlier release rows are reconstructed without calling this merger.
export function mergeNotes35(previous,notes){
  const prior=new Map(notes.filter(r=>r.noteId.startsWith('prior-')).map(r=>[r.title+'|'+(r.url||''),r]));
  const revised=previous.map(r=>prior.get(r.title+'|'+(r.url||''))||r);
  return [...revised,...notes.filter(r=>!r.noteId.startsWith('prior-'))];
}
