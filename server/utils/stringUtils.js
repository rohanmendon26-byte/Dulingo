export const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

export const matches = (expected, value) =>
  norm(expected).length > 0 &&
  String(expected)
    .split('|')
    .some((a) => norm(a) === norm(value));

export const isCorrect = (task, answer) => matches(task.answer, answer);
