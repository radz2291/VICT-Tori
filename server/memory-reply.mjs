// The receipt and its Studio card own status. The bound reply check recognizes
// specific English and Malay claims; it does not infer memory intent or grants.
const action=String.raw`(?:sav(?:e|ed|ing)|stor(?:e|ed|ing)|memoriz(?:e|ed|ing)|persist(?:ed|ing)?|retain(?:ed|ing)?|record(?:ed|ing)?|log(?:ged|ging)?|schedul(?:e|ed|ing))`;
const object=String.raw`(?:this|that|it|(?:(?:your|my|our|the|this|that)\s+(?:[\w’'-]+\s+){0,6})?(?:memor(?:y|ies)|preferences?|reminders?|notes?))\b`;
const location=String.raw`(?:(?:my|your|our|the)\s+)?(?:(?:saved|persistent|permanent|long[- ]term)\s+)?memor(?:y|ies)\b`;
const modifiers=String.raw`(?:(?:just|now|successfully|already|permanently)\s+)*`;
const subject=String.raw`(?:this|that|it|preference|memory|reminder|request|note)`;
const state=String.raw`(?:['’]s|\s+(?:is|was|has\s+been|had\s+been|got))\s+`;
const memoryObject=String.raw`(?:(?:your|my|our|the|this|that|a|an)\s+)?(?:(?:saved|standing|persistent|permanent|long[- ]term)\s+)?(?:memor(?:y|ies)|preferences?)\b`;
const preferenceSubject=String.raw`(?:your|the|this|that)\s+(?:saved\s+|standing\s+)?(?:[\p{L}-]+\s+)*preferences?`;
const preferenceDetail=String.raw`(?:\s+for\s+[^.!?;\n]+)?`;
const speaker=String.raw`(?:i|we)(?:['’]ve|\s+have)?\s+${modifiers}`;
const effect=String.raw`(?:saved|stored|memorized|persisted|updated|forgotten|deleted)`;
const sentenceEnd=String.raw`(?=\s*(?:[.!;]|$))`;
const futureUse=String.raw`(?:\s+(?:permanently|for\s+(?:later|next\s+time|future\s+(?:reference|chats?|conversations?|sessions?))))?`;
const memoryPlace=String.raw`(?:to|in|into)\s+${location}`;
const malayPlace=String.raw`(?:ke|dalam)\s+(?:memori|ingatan)(?:\s+(?:saya|kami|aku|anda))?`;
const malayFuture=String.raw`(?:\s+untuk\s+(?:rujukan|sesi|perbualan)\s+akan\s+datang)?`;
const malayObject=String.raw`(?:ini|itu|pilihan(?:\s+(?:ini|itu|anda|awak|kamu))?|maklumat(?:\s+(?:ini|itu))?|(?:keutamaan|tetapan)\s+anda)`;
const quotation=/(?<![\p{L}\p{N}])'[^'\n]*'(?![\p{L}\p{N}])|"(?:\\.|[^"\\])*"|“[^”]*”|‘[^’]*’|«[^»]*»|`[^`\n]*`/gu;
const attributedQuotation=/(?:\b(?:example|documentation|sample|quotation|phrase|contoh|petikan)\b|\b(?:says?|reads?|wrote|said)\s*:?)\s*[^.!?\n]*$/iu;
const explicitClaims=[
  new RegExp(String.raw`^(?:memory|preferences?)\s+${effect}${futureUse}${sentenceEnd}`,'iu'),
  new RegExp(String.raw`^(?:saved|stored)${sentenceEnd}`,'iu'),
  new RegExp(String.raw`^(?:saved|stored|added)\s+${memoryPlace}${futureUse}${sentenceEnd}`,'iu'),
  new RegExp(String.raw`^${speaker}(?:saved|stored|memorized|persisted)\s+(?:this|that|it)(?:\s+as\s+(?:a|your|the)\s+(?:saved|standing)\s+preference)?${futureUse}${sentenceEnd}`,'iu'),
  new RegExp(String.raw`^(?:${speaker})?(?:saved|stored|memorized|persisted|updated|forgot|deleted)\s+${memoryObject}${futureUse}${sentenceEnd}`,'iu'),
  new RegExp(String.raw`^${speaker}(?:saved|stored|recorded)\s+${preferenceSubject}${preferenceDetail}${sentenceEnd}`,'iu'),
  new RegExp(String.raw`^${speaker}updated\s+${preferenceSubject}(?:\s+to\s+[^.!?;\n]+)?${sentenceEnd}`,'iu'),
  new RegExp(String.raw`^${speaker}(?:saved|stored|put|added|recorded|logged)\s+(?:[^.?!\n]+?\s+)?${memoryPlace}${futureUse}${sentenceEnd}`,'iu'),
  new RegExp(String.raw`^(?:(?:your|the)\s+(?:memory|preferences?)|this|that|it)${state}${modifiers}(?:${effect}|retained)(?:\s+${memoryPlace})?${futureUse}${sentenceEnd}`,'iu'),
  new RegExp(String.raw`^(?:your|the)\s+(?:memory|preferences?)${state}${modifiers}(?:added\s+${memoryPlace}|${memoryPlace})${futureUse}${sentenceEnd}`,'iu'),
  new RegExp(String.raw`^(?:saya|kami|aku)\s+(?:dah|sudah|telah|baru\s+sahaja)\s+(?:menyimpan|simpan|mencatat|catat)\s+(?:${malayObject}(?:\s+${malayPlace})?|(?:[^.!?;\n]+\s+)?${malayPlace})${malayFuture}${sentenceEnd}`,'iu'),
  new RegExp(String.raw`^(?:${malayObject}\s+)?(?:(?:dah|sudah|telah)\s+)?disimpan(?:\s+${malayPlace})?${malayFuture}${sentenceEnd}`,'iu'),
];
const claimPatterns=[
  /\bmemory proposal\b|\breview the (?:text|proposal) in studio\b|\bnothing (?:was )?saved\b/iu,
  /(?:^|\n)\s*(?:[#>-]+\s*)?(?:memory )?saved[.!]?\s*(?:$|\n)/iu,
  new RegExp(String.raw`\b(?:i|we)(?:['’](?:ve|ll|d|m|re)|\s+(?:have|had|will|am|are))?\s+${modifiers}${action}\s+${object}`,'iu'),
  new RegExp(String.raw`\b(?:i|we)(?:['’](?:ve|ll|m|re)|\s+(?:have|will|just|am|are))\s+${modifiers}${action}\b`,'iu'),
  /\b(?:i|we)(?:['’]ll|\s+will)\s+(?:remember|forget)\b/iu,
  new RegExp(String.raw`(?:^|\n)\s*(?:[#>-]+\s*)?(?:saved|stored|memorized|scheduled|forgot)\s+${object}`,'iu'),
  new RegExp(String.raw`\b${subject}${state}${modifiers}(?:saved|stored|memorized|persisted|retained|recorded|logged|scheduled|forgotten)\b`,'iu'),
  new RegExp(String.raw`\b${subject}${state}${modifiers}(?:in|part\s+of)\s+${location}`,'iu'),
  new RegExp(String.raw`\b(?:added|logged|recorded|filed|put|kept)\s+(?:[^.?!\n]+\s+)?(?:to|in|into)\s+${location}`,'iu'),
  new RegExp(String.raw`\b(?:made|make|making|set|setting|marked|marking)\s+${object}\s+(?:(?:as|to\s+be)\s+)?(?:permanent|persistent|a\s+(?:saved|standing)\s+preference)\b`,'iu'),
  /\b(?:updated|changed|revised|removed|cleared|deleted)\s+(?:(?:my|your|our|the)\s+)?(?:saved|stored)\s+(?:memor(?:y|ies)|preferences?|notes?)\b/iu,
  /\bkeep\s+(?:this|that|it)\s+in\s+mind\s+(?:for\s+(?:future|later)|going\s+forward|from\s+now\s+on)\b/iu,
];

export function reportsMemoryEffect(text,explicitOnly=false){
  const spoken=text.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/gu,'');
  if(!explicitOnly)return claimPatterns.some(pattern=>pattern.test(spoken.replace(/[*_`]+/gu,'')));
  // Preserve the predicate in a direct claim with a quoted object.
  // Mask attributed examples, fenced code and Markdown block quotations.
  const publicText=spoken.replace(/^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gmu,'[quoted text]')
    .replace(/^[ \t]*>.*$/gmu,'[quoted text]')
    .replace(quotation,(quote,offset,reply)=>attributedQuotation.test(reply.slice(0,offset))?' [quoted text] ':quote.slice(1,-1))
    .replace(/[*_]/gu,'');
  return publicText.split(/(?<=[.!?;])\s+|\n/u).some(sentence=>{
    if(sentence.trimEnd().endsWith('?'))return false;
    const clause=sentence.replace(/^\s*(?:(?:[-+#]+|\d+\.)\s+)?/u,'')
      .replace(/^(?:done|got it|okay|all set|baik|selesai)\s*[:,—–-]\s*/iu,'');
    return explicitClaims.some(pattern=>pattern.test(clause));
  });
}
