/** Immutable deep-set used by the editor: returns a new object, preserving
 *  every sibling key (unknown/extension fields survive edits untouched). */
export function setIn<T>(obj: T, path: (string | number)[], value: unknown): T {
  if (path.length === 0) return value as T
  const [head, ...rest] = path
  if (typeof head === 'number') {
    const arr = Array.isArray(obj) ? [...(obj as unknown[])] : []
    arr[head] = setIn(arr[head], rest, value)
    return arr as T
  }
  const rec = { ...(obj as Record<string, unknown> | undefined) }
  rec[head] = setIn(rec[head], rest, value)
  return rec as T
}
