// Which journey this is. 'drive': the same nine stations, driven at night in a car.
// Anything else: the original daytime bicycle ride. ?world=ride or ?world=drive overrides it.
import career from '../content/career.json'

const asked = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('world') : null
export const WORLD = asked ?? career.world ?? 'ride'
export const DRIVE = WORLD === 'drive'

// The words that change with the vehicle.
export const T = DRIVE
  ? { title: 'Night Drive', lede: 'Nine stations, one car, one night. Drive from a software workshop in 2004 to an AI classroom at sunrise.', auto: 'Drive for me', manual: 'Take the wheel', into: 'Driving into', again: 'Drive again', keys: 'drive', exit: 'Drive through the glowing gate to leave for' }
  : { title: 'Career Ride', lede: 'Nine islands, one bicycle. Ride from a software workshop in 2004 to an AI classroom today.', auto: 'Ride for me', manual: 'Take the handlebars', into: 'Riding into', again: 'Ride again', keys: 'pedal', exit: 'Ride through the glowing gate to leave for' }
