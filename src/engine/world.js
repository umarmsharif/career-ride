// Which world the journey is set in. 'voyage': the islands rise out of a sea and the rider
// sails between them. Anything else: the original floating islands joined by roads in the sky.
import career from '../content/career.json'

export const VOYAGE = career.world === 'voyage'
// Sea level, in every island's own coordinates. In the voyage all islands share one height.
export const SEA = -6.5
export const DECK = SEA + 0.55
