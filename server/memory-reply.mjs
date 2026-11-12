// The receipt and its Studio card own status. Screen clear English memory
// effect claims before the ordinary reply reaches a VICT/Mastra thread.
const action=String.raw`(?:sav(?:e|ed)|stor(?:e|ed)|memoriz(?:e|ed)|persist(?:ed)?|retain(?:ed)?|record(?:ed)?|log(?:ged)?|remember(?:ed)?|schedul(?:e|ed)|forget|forgot(?:ten)?)`;
const object=String.raw`(?:this|that|it|(?:(?:your|my|our|the)\s+(?:[\w’'-]+\s+){0,6})?(?:memor(?:y|ies)|preferences?|reminders?|notes?))\b`;
const location=String.raw`(?:(?:my|your|our|the)\s+)?(?:(?:saved|persistent|permanent|long[- ]term)\s+)?memor(?:y|ies)\b`;
const modifiers=String.raw`(?:(?:just|now|successfully|already|permanently)\s+)*`;
const subject=String.raw`(?:this|that|it|preference|memory|reminder|request|note)`;
const state=String.raw`(?:['’]s|\s+(?:is|was|has\s+been|had\s+been|got))\s+`;
const claimPatterns=[
  /\bmemory proposal\b|\breview the (?:text|proposal) in studio\b|\bnothing (?:was )?saved\b/iu,
  /(?:^|\n)\s*(?:[#>-]+\s*)?(?:memory )?saved[.!]?\s*(?:$|\n)/iu,
  new RegExp(String.raw`\b(?:i|we)(?:['’](?:ve|ll|d)|\s+(?:have|had|will))?\s+${modifiers}${action}\s+${object}`,'iu'),
  new RegExp(String.raw`\b(?:i|we)(?:['’](?:ve|ll)|\s+(?:have|will|just))\s+${modifiers}${action}\b`,'iu'),
  new RegExp(String.raw`(?:^|\n)\s*(?:[#>-]+\s*)?(?:saved|stored|memorized|scheduled|forgot)\s+${object}`,'iu'),
  new RegExp(String.raw`\b${subject}${state}${modifiers}(?:saved|stored|memorized|persisted|retained|recorded|logged|scheduled|forgotten)\b`,'iu'),
  new RegExp(String.raw`\b${subject}${state}${modifiers}(?:in|part\s+of)\s+${location}`,'iu'),
  new RegExp(String.raw`\b(?:added|logged|recorded|filed|put|kept)\s+(?:[^.?!\n]+\s+)?(?:to|in|into)\s+${location}`,'iu'),
  /\b(?:updated|changed|revised|removed|cleared|deleted)\s+(?:(?:my|your|our|the)\s+)?(?:saved|stored)\s+(?:memor(?:y|ies)|preferences?|notes?)\b/iu,
  /\bkeep\s+(?:this|that|it)\s+in\s+mind\s+(?:for\s+(?:future|later)|going\s+forward|from\s+now\s+on)\b/iu,
];

export function reportsMemoryEffect(text){
  const spoken=text.normalize('NFKC').replace(/[*_`\u200B-\u200D\uFEFF]+/gu,'');
  return claimPatterns.some(pattern=>pattern.test(spoken));
}
