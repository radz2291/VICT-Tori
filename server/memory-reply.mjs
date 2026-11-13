// The receipt and its Studio card own status. The bound reply check recognizes
// specific English and Malay claims; it does not infer memory intent or grants.
const action=String.raw`(?:sav(?:e|ed|ing)|stor(?:e|ed|ing)|memoriz(?:e|ed|ing)|persist(?:ed|ing)?|retain(?:ed|ing)?|record(?:ed|ing)?|log(?:ged|ging)?|schedul(?:e|ed|ing))`;
const object=String.raw`(?:this|that|it|(?:(?:your|my|our|the|this|that)\s+(?:[\w’'-]+\s+){0,6})?(?:memor(?:y|ies)|preferences?|reminders?|notes?))\b`;
const location=String.raw`(?:(?:my|your|our|the)\s+)?(?:(?:saved|persistent|permanent|long[- ]term)\s+)?memor(?:y|ies)\b`;
const modifiers=String.raw`(?:(?:just|now|successfully|already|permanently)\s+)*`;
const subject=String.raw`(?:this|that|it|preference|memory|reminder|request|note)`;
const state=String.raw`(?:['’]s|\s+(?:is|was|has\s+been|had\s+been|got))\s+`;
const memoryObject=String.raw`(?:(?:your|my|our|the|this|that|a|an)\s+)?(?:(?:saved|standing|persistent|permanent|long[- ]term)\s+)?(?:memor(?:y|ies)|preferences?)\b`;
const speaker=String.raw`\b(?:i|we)(?:['’]ve|\s+have)?\s+${modifiers}`;
const effect=String.raw`(?:saved|stored|memorized|persisted|updated|forgotten|deleted)`;
const sentenceEnd=String.raw`(?=\s*(?:[.!?;\n]|$))`;
const futureUse=String.raw`(?:\s+(?:permanently|for\s+(?:later|next\s+time|future\s+(?:reference|chats?|conversations?|sessions?))))?`;
const malayObject=String.raw`(?:ini|itu|pilihan(?:\s+(?:ini|itu|anda|awak|kamu))?|maklumat(?:\s+(?:ini|itu))?|(?:keutamaan|tetapan)\s+anda)`;
const quotation=/(?<![\p{L}\p{N}])'[^'\n]*'(?![\p{L}\p{N}])|"(?:\\.|[^"\\])*"|“[^”]*”|‘[^’]*’|«[^»]*»|`[^`\n]*`/gu;
const externalDestination=String.raw`\s+(?:in|under|to|on|as|di|dalam|ke)\s+(?:(?:the|a|an|your)\s+)?(?:external\s+(?:app|site|dashboard)|browser(?:\s+dashboard)?|settings|PDF|file|disk|drive|fail|pelayar|tetapan)\b`;
const explicitClaims=[
  new RegExp(String.raw`^(?:(?:done|got it|okay|all set)\s*[:—–-]\s*)?(?:(?:memory|preference)\s+${effect}|(?:saved|stored|added)\s+(?:to|in|into)\s+${location})${sentenceEnd}`,'iu'),
  new RegExp(String.raw`${speaker}(?:saved|stored|memorized|persisted)\s+(?:this|that|it)${futureUse}${sentenceEnd}`,'iu'),
  new RegExp(String.raw`^(?:saved|stored)\s+${memoryObject}${futureUse}${sentenceEnd}`,'iu'),
  new RegExp(String.raw`${speaker}(?:saved|stored|memorized|persisted|updated|forgot|deleted)\s+${memoryObject}(?!${externalDestination})`,'iu'),
  new RegExp(String.raw`${speaker}(?:saved|stored|put|added|recorded|logged)\s+(?:[^.?!\n]+?\s+)?(?:to|in|into)\s+${location}`,'iu'),
  new RegExp(String.raw`^\s*(?:your|the)\s+(?:memory|preferences?)${state}${modifiers}(?:${effect}|retained)${sentenceEnd}`,'iu'),
  new RegExp(String.raw`\b(?:saya|kami|aku)\s+(?:dah|sudah|telah|baru\s+sahaja)\s+(?:menyimpan|simpan)\s+(?:${malayObject}|(?:ke|dalam)\s+(?:memori|ingatan))\b(?!${externalDestination})`,'iu'),
  new RegExp(String.raw`^\s*(?:${malayObject}\s+)?(?:dah\s+|sudah\s+|telah\s+)?disimpan(?:\s+(?:ke|dalam)\s+(?:memori|ingatan))?${sentenceEnd}`,'iu'),
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
  // Preserve directly asserted status when the entire answer is quoted.
  // Mask inline examples, fenced code and Markdown block quotations.
  const publicText=spoken.replace(/^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gmu,'[quoted text]')
    .replace(/^[ \t]*>.*$/gmu,'[quoted text]')
    .replace(quotation,(quote,offset,reply)=>reply.trim()===quote?quote.slice(1,-1):' [quoted text] ')
    .replace(/[*_]/gu,'');
  return publicText.split(/(?<=[.!?;])\s+|\n/u).some(sentence=>{
    const clause=sentence.replace(/^\s*(?:[-+#]+\s+)?/u,'');
    if(/^(?:if|assuming|suppose|jika|kalau|sekiranya)\b/iu.test(clause))return false;
    return explicitClaims.some(pattern=>pattern.test(clause));
  });
}
