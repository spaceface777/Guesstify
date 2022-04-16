/// <reference path='../../spicetify-cli/globals.d.ts' />
/// <reference path='../../spicetify-cli/jsHelper/spicetifyWrapper.js' />

import styles from './css/app.module.scss';
// import './css/app.global.scss';
import React from 'react';

import GuessItem from './components/GuessItem';

import {
  initialize,
  toggleNowPlaying,
  playSegment,
  checkGuess,
} from './logic';

class App extends React.Component<{URIs?: string[]}, {
  stage: number,
  timeAllowed: number,
  guess: string,
  guesses: (string | null)[],
  won: boolean ,
}> {
  state = {
    // What guess you're on
    stage: 0,
    // How many seconds you're given
    timeAllowed: 1,
    // The current guess
    guess: '',
    // Past guesses
    guesses: [],
    // If you've won
    won: false,
  };

  URIs?: string[];
  constructor(props: any) {
		super(props);
		this.URIs = Spicetify.Platform.History.location.state.URIs;
	}

  componentDidMount() {
    console.log('App mounted, URIs: ', this.URIs);
    initialize(this.URIs);
  }

  // TODO: don't just add the same amount of time for each guess
  /*
    Heardle offsets:
    1s, +1s, +3s, +3s +4s, +4s
   */

  playClick = () => {
    playSegment(this.state.timeAllowed);
  };

  guessChange = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({ guess: e.target.value});

  skipGuess = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Add the guess to the guess list in the state
    this.setState({
      guesses: [
        ...this.state.guesses,
        null,
      ],
      // Reset the guess
      guess: '',
      // Increment the stage
      stage: this.state.stage + 1,
      // Increment the time allowed
      timeAllowed: this.state.timeAllowed + 1,
      won: false,
    });
  }

  submitGuess = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Don't allow empty guesses
    if (this.state.guess.trim().length === 0) return;

    const won = checkGuess(this.state.guess);

    if (won) toggleNowPlaying(true);

    // Add the guess to the guess list in the state
    this.setState({
      guesses: [
        ...this.state.guesses,
        this.state.guess,
      ],
      // Reset the guess
      guess: '',
      // Increment the stage
      stage: this.state.stage + 1,
      // Increment the time allowed
      timeAllowed: this.state.timeAllowed + 1,
      won,
    });
  }

  nextSong = () => {
    toggleNowPlaying(false);
    Spicetify.Player.next();
    Spicetify.Player.seek(0);
    Spicetify.Player.pause();

    this.setState({
      guesses: [],
      // Reset the guess
      guess: '',
      // Increment the stage
      stage: 0,
      // Increment the time allowed
      timeAllowed: 1,
      won: false,
    });
  }

  render() {
    return <>
      <div className={styles.container}>
        <h1 className={styles.title}>{'🎵 Spurdle!'}</h1>
        {this.state.won ? <h2 className={styles.subtitle}>{'You won!'}</h2> : null }

        <form id='guessForm' onSubmit={this.submitGuess}>
          <input type={'text'} className={styles.input} placeholder='Guess the song' value={this.state.guess} disabled={this.state.won} onChange={this.guessChange} />
          <div className={styles.formButtonContainer}>
            <button type={'submit'} className='main-buttons-button main-button-secondary' disabled={this.state.won}>{'Guess'}</button>
            <button className='main-buttons-button main-button-secondary' disabled={this.state.won} onClick={this.skipGuess} >{'Skip'}</button>
          </div>
        </form>

        { this.state.won
          ? null
          : <button className='main-buttons-button main-button-secondary' onClick={this.playClick}>{`Play ${this.state.timeAllowed}s`}</button>
        }

        <button className='main-buttons-button main-button-secondary' onClick={this.nextSong}>{'Next song'}</button>

        <ol className={styles.guessList}>
          {this.state.guesses.map((guess, i) => <GuessItem key={i} index={i} guesses={this.state.guesses} won={this.state.won} />)}
        </ol>
      </div>
    </>
  }
};

export default App;
