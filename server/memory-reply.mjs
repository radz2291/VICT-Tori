// The receipt and its Studio card own status. Screen clear English memory
// effect claims before the ordinary reply reaches a VICT/Mastra thread.
// Past or present recall ("I remember ...") says nothing about storage.
const action=String.raw`(?:sav(?:e|ed|ing)|stor(?:e|ed|ing)|memoriz(?:e|ed|ing)|persist(?:ed|ing)?|retain(?:ed|ing)?|record(?:ed|ing)?|log(?:ged|ging)?|schedul(?:e|ed|ing))`;
const object=String.raw`(?:this|that|it|(?:(?:your|my|our|the|this|that)\s+(?:[\w’'-]+\s+){0,6})?(?:memor(?:y|ies)|preferences?|reminders?|notes?))\b`;
const location=String.raw`(?:(?:my|your|our|the)\s+)?(?:(?:saved|persistent|permanent|long[- ]term)\s+)?memor(?:y|ies)\b`;
const modifiers=String.raw`(?:(?:just|now|successfully|already|permanently)\s+)*`;
const subject=String.raw`(?:this|that|it|preference|memory|reminder|request|note)`;
const state=String.raw`(?:['’]s|\s+(?:is|was|has\s+been|had\s+been|got))\s+`;
const memoryObject=String.raw`(?:(?:your|my|our|the|this|that|a|an)\s+)?(?:(?:saved|standing|persistent|permanent|long[- ]term)\s+)?(?:memor(?:y|ies)|preferences?)\b`;
const explicitClaims=[
  /(?:^|\n)\s*(?:[#>-]+\s*)?memory (?:saved|stored|updated|forgotten)[.!]?\s*(?:$|\n)/iu,
  /\breview the (?:memory proposal|proposal in studio)\b/iu,
  new RegExp(String.raw`\b(?:sav(?:e|ed|ing)|stor(?:e|ed|ing)|memoriz(?:e|ed|ing)|persist(?:ed|ing)?|updated|forgot|deleted)\s+${memoryObject}`,'iu'),
  new RegExp(String.raw`\b(?:saved|stored|put|added|recorded|logged)\s+[^.?!\n]+?\s+(?:to|in|into)\s+${location}`,'iu'),
  new RegExp(String.raw`\b(?:memory|preference)${state}${modifiers}(?:saved|stored|memorized|persisted|retained|forgotten|deleted)\b`,'iu'),
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
  const spoken=text.normalize('NFKC').replace(/[*_`\u200B-\u200D\uFEFF]+/gu,'');
  return (explicitOnly?explicitClaims:claimPatterns).some(pattern=>pattern.test(spoken));
}
