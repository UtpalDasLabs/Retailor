import { ReactNode } from 'react'

/**
 * Templates render content as a flat list of blocks per column; blocks are
 * measured offscreen at exact print width and packed into A4 pages.
 * `keepWithNext` (section headers, role titles) prevents widows/orphans:
 * the block moves to the next page unless the following block also fits.
 */
export interface Block {
  key: string
  node: ReactNode
  keepWithNext?: boolean
}

/** Pack block heights (px) into pages of the given capacity (px). */
export function pack(heights: number[], keepWithNext: boolean[], capacity: number): number[][] {
  const pages: number[][] = [[]]
  let used = 0
  for (let i = 0; i < heights.length; i++) {
    let needed = heights[i]
    if (keepWithNext[i] && i + 1 < heights.length) needed += heights[i + 1]
    if (used > 0 && used + needed > capacity) {
      pages.push([])
      used = 0
    }
    pages[pages.length - 1].push(i)
    used += heights[i]
  }
  return pages
}
