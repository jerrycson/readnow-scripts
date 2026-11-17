export function correctCitation(row){
 if(row.noteId!=='36-duct')return row;
 return {...row,detail:row.detail.replace('Hassiotou와 Geddes의 인체 유방 발달 종설','Javed와 Lteif의 인체 유방 발달 종설')};
}
