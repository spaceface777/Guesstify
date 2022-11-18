import styles from '../css/app.module.scss'
// import '../css/app.global.scss'
import React from 'react'
import Fuse from 'fuse.js'

import GuessItem from '../components/GuessItem'
import Button from '../components/Button'

import { initialize, toggleNowPlaying, checkGuess, saveStats, stageToTime } from '../logic'
import AudioManager from '../AudioManager'
import { fetchListFromUri } from '../shuffle+'

enum GameState {
  Playing,
  Won,
  Lost,
}

class Game extends React.Component<
  { URIs?: string[] },
  {
    stage: number
    guess: string
    guesses: (string | null)[]
    options: string[]
    gameState: GameState
  }
> {
  state = {
    // What guess you're on
    stage: 0,
    // The current guess
    guess: '',
    options: [],
    // Past guesses
    guesses: [],
    gameState: GameState.Playing,
  }

  URIs?: string[]
  titles: string[] = []
  f: Fuse<string>
  audioManager: AudioManager
  constructor(props: { URIs?: string[] }) {
    super(props)
    this.audioManager = new AudioManager()
    this.URIs = Spicetify.Platform.History.location.state.URIs
    setTimeout(async () => {
      let uris = this.URIs
      if (!uris) {
        uris = await fetchListFromUri(Spicetify.Player.data.context_uri)
      }
      console.warn(uris.length)
      console.warn(uris[0])

      for (let i = 0; i < uris.length; i += 50) {
        const u = uris.slice(i, i + 50).map(x => x.split(':')[2])
        const res = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks?ids=${u.join(',')}`)
        this.titles = this.titles.concat(res.tracks.map(t => t.artists[0].name + ' - ' + t.name))
      }
      console.warn(this.titles.length)
      console.warn(this.titles[0])

      this.f = new Fuse(this.titles, { threshold: 0.5 })
    }, 0)
    console.clear()
  }

  componentDidMount() {
    console.log('App mounted, URIs: ', this.URIs)
    initialize(this.URIs)
    this.audioManager.listen()
  }

  componentWillUnmount() {
    this.audioManager.unlisten()
  }

  playClick = () => {
    this.audioManager.play()
  }

  guessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const results = this.f.search(e.target.value)
    this.setState({ guess: e.target.value, options: results.map(r => r.item).slice(0, 10) })
  }

  optionClick = (e: React.MouseEvent<HTMLLIElement>) => {
    const guess = e.currentTarget.innerText.split(' - ').slice(1).join(' - ')
    this.setState({ guess, options: [] })
  }

  skipGuess = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    // Add the guess to the guess list in the state
    this.setState({
      guesses: [...this.state.guesses, null],
      // Reset the guess
      guess: '',
      options: [],
      // Increment the stage
      stage: this.state.stage + 1,
    }, () => {
      this.audioManager.setEnd(stageToTime(this.state.stage))
      setTimeout(() => this.playClick(), 0)
    })
  }

  submitGuess = (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault()

    // Don't allow empty guesses
    if (this.state.guess.trim().length === 0) return

    const won = checkGuess(this.state.guess)
    if (won) saveStats(this.state.stage)

    // Add the guess to the guess list in the state
    this.setState({
      guesses: [...this.state.guesses, this.state.guess],
      // Reset the guess
      guess: '',
      options: [],
      // Increment the stage
      stage: this.state.stage + 1,
      gameState: won ? GameState.Won : GameState.Playing,
    }, () => {
      if (won) {
        this.audioManager.setEnd(0)
        Spicetify.Player.seek(0)
        Spicetify.Player.play()
        toggleNowPlaying(true)
      } else {
        this.audioManager.setEnd(stageToTime(this.state.stage))
        setTimeout(() => this.playClick(), 0)
      }
    })
  }

  giveUp = () => {
    this.audioManager.setEnd(0)
    Spicetify.Player.seek(0)
    Spicetify.Player.play()
    toggleNowPlaying(true)
    saveStats(-1)

    this.setState({
      gameState: GameState.Lost,
    })
  }

  nextSong = () => {
    toggleNowPlaying(false)
    Spicetify.Player.next()
    Spicetify.Player.seek(0)
    Spicetify.Player.pause()
    this.audioManager.setEnd(1)

    this.setState({
      guesses: [],
      // Reset the guess
      guess: '',
      // Increment the stage
      stage: 0,
      options: [],
      gameState: GameState.Playing,
    }, () => {
      this.audioManager.setEnd(stageToTime(this.state.stage))
      setTimeout(() => this.playClick(), 0)
    })
  }

  goToStats = () => {
    Spicetify.Platform.History.push({
      pathname: '/guesstify/stats',
      state: {
        data: {},
      },
    })
  }

  render() {
    const gameWon = this.state.gameState === GameState.Won
    const isPlaying = this.state.gameState === GameState.Playing
    const { options } = this.state

    return (
      <>
        <div className={styles.container}>
          <h1 className={styles.title}>{'Guesstify'}</h1>
          {gameWon ? <h2 className={styles.subtitle}>{'You won!'}</h2> : null}

          <form onSubmit={this.submitGuess}>
            <input
              type={'text'}
              className={styles.input}
              placeholder='Guess the song'
              value={this.state.guess}
              disabled={!isPlaying}
              onChange={this.guessChange}
            />
            <div className={styles.formButtonContainer}>
              <Button onClick={this.submitGuess} disabled={!isPlaying}>
                {'Guess'}
              </Button>
              <Button onClick={this.skipGuess} disabled={!isPlaying}>
                {'Skip'}
              </Button>
            </div>
          </form>
          {isPlaying ? (
            <Button
              onClick={this.playClick}
            >{`Play ${stageToTime(this.state.stage)}s`}</Button>
          ) : null}

          {options.length ? (
            <ul className={styles.options}>
              {options.map((o, i) => (
                <li key={i} className={styles.option} onClick={this.optionClick} >
                  {o}
                </li>
              ))}
            </ul>
          ) : null}

          <Button onClick={isPlaying ? this.giveUp : this.nextSong}>
            {isPlaying ? 'Give up' : 'Next song'}
          </Button>

          <ol className={styles.guessList}>
            {this.state.guesses.map((guess, i) => (
              <GuessItem
                key={i}
                index={i}
                guesses={this.state.guesses}
                won={gameWon}
              />
            ))}
          </ol>
          <Button onClick={this.goToStats} classes={[styles.StatsButton]}>
            Stats
          </Button>
        </div>
      </>
    )
  }
}

export default Game
