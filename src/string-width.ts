// A javascript port of wcswidth based on https://www.cl.cam.ac.uk/~mgk25/ucs/wcwidth.c with modification for emojis and not returning -1 for control characters

import {Intervals, nonSpacing} from './string-chars.js';

const EMOJI_REGEX = /(?:\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\u200d(?:\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*/uy;
const ANSI_REGEX = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/y;
const MODIFIER_REGEX = /\p{M}+/uy;

const EMOJI_LENGTH = 2;

// binarySearch function to check if an intervals array contains a certain character
function binarySearch(ucs: number, intervals: Intervals) {
  let min = 0;
  let mid;
  let max = intervals.length - 1;

  if (ucs < intervals[0][0] || ucs > intervals[max][1]) return false;

  while (max >= min) {
    mid = Math.floor((min + max) / 2);
    if (ucs > intervals[mid][1]) min = mid + 1;
    else if (ucs < intervals[mid][0]) max = mid - 1;
    else return true;
  }

  return false;
}

function getCharWidth(ucs: number) {
  if (ucs === 0 || ucs < 32 || (ucs >= 0x7f && ucs < 0xa0) || binarySearch(ucs, nonSpacing)) return 0;

  return ucs >= 0x1100 &&
    (ucs <= 0x115f /* Hangul Jamo init. consonants */ ||
      ucs == 0x2329 ||
      ucs == 0x232a ||
      (ucs >= 0x2e80 && ucs <= 0xa4cf && ucs != 0x303f) /* CJK ... Yi */ ||
      (ucs >= 0xac00 && ucs <= 0xd7a3) /* Hangul Syllables */ ||
      (ucs >= 0xf900 && ucs <= 0xfaff) /* CJK Compatibility Ideographs */ ||
      (ucs >= 0xfe10 && ucs <= 0xfe19) /* Vertical forms */ ||
      (ucs >= 0xfe30 && ucs <= 0xfe6f) /* CJK Compatibility Forms */ ||
      (ucs >= 0xff00 && ucs <= 0xff60) /* Fullwidth Forms */ ||
      (ucs >= 0xffe0 && ucs <= 0xffe6) ||
      (ucs >= 0x20000 && ucs <= 0x2fffd) ||
      (ucs >= 0x30000 && ucs <= 0x3fffd))
    ? 2
    : 1;
}

export function getStringWidth(str: string) {
  let width = 0;
  let charCode = 0;

  for (let i = 0; i < str.length; i++) {
    charCode = str[i].charCodeAt(0);
    // Check if the character is a regular 1-width ASCII latin character
    if (charCode >= 32 && charCode < 127) {
      width++;
      continue;
    }

    ANSI_REGEX.lastIndex = i;
    if (ANSI_REGEX.test(str)) {
      i = ANSI_REGEX.lastIndex - 1;
      continue;
    }
    EMOJI_REGEX.lastIndex = i;
    if (EMOJI_REGEX.test(str)) {
      i = EMOJI_REGEX.lastIndex - 1;
      width += EMOJI_LENGTH;
      continue;
    }
    MODIFIER_REGEX.lastIndex = i;
    if (MODIFIER_REGEX.test(str)) {
      i = MODIFIER_REGEX.lastIndex - 1;
      continue;
    }

    width += getCharWidth(charCode);
  }

  return width;
}
