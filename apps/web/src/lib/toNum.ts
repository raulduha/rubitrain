export const toNum = (v: unknown): number | null => {
  if (v === '' || v == null) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}
