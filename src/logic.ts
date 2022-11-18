import { diceCoefficient } from 'dice-coefficient'

import { fetchAndPlay, shuffle, playList } from './shuffle+'
import { getLocalStorageDataFromKey } from './Utils'
import { STATS_KEY } from './constants'

export const toggleNowPlaying = (visible: boolean) => {
  // visible = true
  // Hide items that give away information while playing
  [
    // The left side chunk with the title, artist, album art, etc.
    document.querySelector<HTMLElement>('.main-nowPlayingBar-left'),
    // Play/pause/next/previous/etc.
    document.querySelector<HTMLElement>('.player-controls__buttons'),
  ].forEach((item) => {
    if (item) {
      item.style.opacity = visible ? '1' : '0'
      item.style.pointerEvents = visible ? 'auto' : 'none'
    }
  })

  // Disable playback bar interaction while playing
  const playbackBar = document.querySelector<HTMLElement>('.playback-bar')
  if (playbackBar) {
    playbackBar.style.pointerEvents = visible ? 'auto' : 'none'
  }
}

// TODO: potentially tweak this
const normalize = (str: string) => {
  let cleaned = str.trim().toLowerCase()

  // Remove anything within parentheses
  cleaned = cleaned.replace(/\(.*\)/g, '')

  // Remove anything that comes after a ' - '
  cleaned = cleaned.replace(/\s+-\s+.*$/, '')

  // Convert & to 'and'
  cleaned = cleaned.replace(/&/g, 'and')

  // Remove special characters and spaces
  cleaned = cleaned.replace(/[^a-zA-Z0-9]/g, '')

  // TODO: add any other logic?

  return cleaned
}

export const checkGuess = (guess: string) => {
  const normalizedTitle = normalize(
    Spicetify.Player.data.track?.metadata?.title || '',
  )
  const normalizedGuess = normalize(guess)

  const similarity = diceCoefficient(normalizedGuess, normalizedTitle)
  return similarity > 0.9
}

export const initialize = (URIs?: string[]) => {
  // If passed in URIs, use them
  if (URIs) {
    if (URIs.length === 1) {
      fetchAndPlay(URIs[0])
      return
    }

    playList(shuffle(URIs), null)

    // Spicetify.Player.playUri(URIs[0])
    // Because it will start playing automatically
    try {
      Spicetify.Player.pause()
    } catch (e) {
      console.log('Error pausing player:', e)
    }
    // if (Spicetify.Player.isPlaying()) {
    // }
    Spicetify.Player.seek(0)
  }
}

const fib = new Array(25).fill(0).reduce((acc, _, i) => (acc.push(i < 2 ? i : acc[i - 1] + acc[i - 2]), acc), [] as number[])
export const stageToTime = i => fib[i+3]

/**
 * Saves an object to localStorage with key:value pairs as stage:occurrences
 * @param stage The stage they won at, or -1 if they gave up
 */
export const saveStats = (stage: number) => {
  const savedStats = getLocalStorageDataFromKey(STATS_KEY, {})
  console.debug('Existing stats:', savedStats)
  savedStats[stage] = savedStats[stage] + 1 || 1
  console.debug('Saving stats:', savedStats)
  localStorage.setItem(STATS_KEY, JSON.stringify(savedStats))
}
