import path from "node:path";

import { Font } from "@react-pdf/renderer";

export const CONTRACT_FONT_FAMILY = "Bai Jamjuree";

let fontsRegistered = false;
const THAI_CHARACTER_PATTERN = /[\u0E00-\u0E7F]/;
const THAI_CLOSING_MARK_PATTERN = /^[ๆฯ,.;:!?%…\)\]\}”’»]+$/u;
const THAI_OPENING_MARK_PATTERN = /[\(\[\{“‘«]$/u;
const thaiWordSegmenter = new Intl.Segmenter("th", { granularity: "word" });

// These words should stay with the word that follows them. Leaving one at the
// end of a line makes Thai legal text noticeably harder to read.
const THAI_KEEP_WITH_NEXT = new Set([
  "การ",
  "ความ",
  "ผู้",
  "ข้อ",
  "คำ",
  "ที่",
  "ซึ่ง",
  "อัน",
  "โดย",
  "และ",
  "หรือ",
  "แต่",
  "กับ",
  "แก่",
  "แด่",
  "ต่อ",
  "ของ",
  "ใน",
  "จาก",
  "ตาม",
  "เพื่อ",
  "เพราะ",
  "หาก",
  "เมื่อ",
  "ก่อน",
  "หลัง",
  "ระหว่าง",
  "จน",
  "ถึง",
  "ว่า",
  "ให้",
  "ไม่",
  "จะ",
  "ได้",
  "ต้อง",
  "เป็น",
  "มี",
  "คือ",
  "เช่น",
  "ได้แก่",
  "ภายใต้",
  "เนื่องจาก",
  "รวมถึง",
  "สัญญา",
  "ฝึก",
  "ฝ่าย",
  "ส่วน",
  "เข้า",
  "รับ",
  "ทำ",
  "ทำความ",
  "หลัก",
  "จึง",
]);

const THAI_KEEP_WITH_PREVIOUS = new Set([
  "นี้",
  "นั้น",
  "ดังกล่าว",
  "เดียว",
  "เอง",
  "ทั้งสิ้น",
  "ไว้",
  "แล้ว",
  "อยู่",
  "ขึ้น",
  "ลง",
  "ออก",
  "ไป",
  "มา",
  "ๆ",
  "ฯ",
]);

function thaiCharacterCount(value: string): number {
  return Array.from(value).length;
}

function createNaturalThaiLineBreaks(rawSegments: string[]): string[] {
  const result: string[] = [];
  let pending = "";

  for (const rawSegment of rawSegments) {
    const segment = rawSegment.trim();
    if (!segment) continue;

    if (pending) {
      pending += segment;

      if (
        THAI_KEEP_WITH_NEXT.has(segment) ||
        THAI_OPENING_MARK_PATTERN.test(segment) ||
        thaiCharacterCount(segment) <= 2
      ) {
        continue;
      }

      result.push(pending);
      pending = "";
      continue;
    }

    const shouldStayWithPrevious =
      THAI_KEEP_WITH_PREVIOUS.has(segment) ||
      THAI_CLOSING_MARK_PATTERN.test(segment) ||
      thaiCharacterCount(segment) <= 2;

    if (shouldStayWithPrevious && result.length > 0) {
      pending = `${result.pop()}${segment}`;
      continue;
    }

    if (
      THAI_KEEP_WITH_NEXT.has(segment) ||
      THAI_OPENING_MARK_PATTERN.test(segment)
    ) {
      pending = segment;
      continue;
    }

    result.push(segment);
  }

  if (pending) {
    if (result.length > 0 && thaiCharacterCount(pending) <= 3) {
      result[result.length - 1] += pending;
    } else {
      result.push(pending);
    }
  }

  return result;
}

function segmentThaiWord(word: string): string[] {
  if (!THAI_CHARACTER_PATTERN.test(word)) return [word];

  const rawSegments = Array.from(
    thaiWordSegmenter.segment(word),
    ({ segment }) => segment,
  ).filter(Boolean);
  const segments = createNaturalThaiLineBreaks(rawSegments);

  return segments.length > 0 ? segments : [word];
}

export function registerEmploymentContractFonts(): void {
  if (fontsRegistered) return;

  const fontDirectory = path.join(process.cwd(), "public", "fonts");

  Font.register({
    family: CONTRACT_FONT_FAMILY,
    fonts: [
      {
        src: path.join(fontDirectory, "BaiJamjuree-Regular.ttf"),
        fontWeight: 400,
      },
      {
        src: path.join(fontDirectory, "BaiJamjuree-Medium.ttf"),
        fontWeight: 500,
      },
      {
        src: path.join(fontDirectory, "BaiJamjuree-SemiBold.ttf"),
        fontWeight: 600,
      },
      {
        src: path.join(fontDirectory, "BaiJamjuree-Bold.ttf"),
        fontWeight: 700,
      },
    ],
  });

  // React PDF splits input on spaces before calculating line breaks. Thai text
  // commonly has long runs without spaces, so expose locale-aware boundaries
  // while keeping grammatical particles and punctuation with adjacent words.
  Font.registerHyphenationCallback(segmentThaiWord);
  fontsRegistered = true;
}
