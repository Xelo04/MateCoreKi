// ==========================================
// FORMAT: Tekst i wzory w jednym bloku API
// ==========================================

import katex from "katex";

export type MathContentPart =
  | { type: "text"; text: string }
  | { type: "math"; latex: string };

// * Pojedyncze $ ograniczają wzór; niepoprawne i niezamknięte znaczniki pozostają tekstem.
function findMathEnd(value: string, start: number): number | null {
  if (value[start + 1] === "$") return null;
  for (let end = start + 1; end < value.length; end++) {
    if (value[end] === "\n" || value[end] === "\r") return null;
    if (value[end] !== "$") continue;
    let slashes = 0;
    for (let i = end - 1; i > start && value[i] === "\\"; i--) slashes++;
    if (slashes % 2 !== 0) continue;
    const latex = value.slice(start + 1, end);
    if (!latex || latex.trim() !== latex) return null;
    try {
      katex.renderToString(latex, { throwOnError: true, trust: false });
      return end;
    } catch {
      return null;
    }
  }
  return null;
}

export function decodeMathContent(value: string): MathContentPart[] {
  const parts: MathContentPart[] = [];
  let text = "";
  let index = 0;

  while (index < value.length) {
    let slashes = 0;
    while (value[index + slashes] === "\\") slashes++;
    if (slashes && value[index + slashes] !== "$") {
      text += "\\".repeat(slashes);
      index += slashes;
      continue;
    }

    const dollar = index + slashes;
    if (value[dollar] !== "$") {
      text += value[index];
      index++;
      continue;
    }
    if (slashes % 2 === 1) {
      text += "\\".repeat((slashes - 1) / 2) + "$";
      index = dollar + 1;
      continue;
    }

    const end = findMathEnd(value, dollar);
    if (end !== null) {
      text += "\\".repeat(slashes / 2);
      if (text) parts.push({ type: "text", text });
      parts.push({ type: "math", latex: value.slice(dollar + 1, end) });
      text = "";
      index = end + 1;
    } else {
      text += "\\".repeat(slashes) + "$";
      index = dollar + 1;
      if (value[index] === "$") {
        text += "$";
        index++;
      }
    }
  }
  if (text || parts.length === 0) parts.push({ type: "text", text });
  return parts;
}

export function encodeMathContent(parts: readonly MathContentPart[]): string {
  let result = "";
  let text = "";
  const appendText = (beforeMath: boolean) => {
    let escaped = text.replace(/(\\*)\$/g, (_, slashes: string) => "\\".repeat(slashes.length * 2 + 1) + "$");
    if (beforeMath) escaped = escaped.replace(/\\+$/, (slashes) => slashes + slashes);
    result += escaped;
    text = "";
  };
  for (const part of parts) {
    if (part.type === "text") text += part.text;
    else {
      appendText(true);
      result += `$${part.latex}$`;
    }
  }
  appendText(false);
  return result;
}
