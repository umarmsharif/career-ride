// Dot-matrix lettering for figures spelled in lit windows.
// Five-by-seven dot letters for the figures the windows spell.
export const DOTS = {
  0: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '..#..', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '%': ['##..#', '##.#.', '...#.', '..#..', '.#...', '.#.##', '#..##'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
}

// Which lights of a `cols`-wide strip are on for this text, as rows of true/false, top row first.
export function spell(text, cols) {
  const chars = [...text].map((c) => DOTS[c] || DOTS[' '])
  const wide = chars.length * 6 - 1
  const left = Math.max(0, Math.floor((cols - wide) / 2))
  return Array.from({ length: 7 }, (_, y) => {
    const row = Array(cols).fill(false)
    chars.forEach((g, i) => [...g[y]].forEach((d, x) => { if (d === '#' && left + i * 6 + x < cols) row[left + i * 6 + x] = true }))
    return row
  })
}

// A figure with a space in it, such as a currency and an amount, is stacked on two lines with a
// two-row gap, so every tower can be the same width.
export function spellLines(text, cols) {
  return text.split(' ').flatMap((line, i) => [...(i ? [Array(cols).fill(false), Array(cols).fill(false)] : []), ...spell(line, cols)])
}

