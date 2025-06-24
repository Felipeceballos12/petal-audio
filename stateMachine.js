// State Machine for audio player
export const STATES = {
  INIT: 'init',
  LOADING: 'loading',
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  STOPPED: 'stopped',
  ERROR: 'error',
};

export const playerState = {
  loaded: false,
  playing: false,
  mode: STATES.INIT,
  currentState: STATES.INIT,
};

export const stateMachine = {
  setState(newState) {
    if (this.isValidTransition(playerState.currentState, newState)) {
      const oldState = playerState.currentState;
      playerState.currentState = newState;
      playerState.mode = newState; // Keep backward compatibility
      console.log(`State transition: ${oldState} -> ${newState}`);
      this.onStateChange(newState, oldState);
    } else {
      console.warn(
        `Invalid state transition: ${playerState.currentState} -> ${newState}`
      );
    }
  },

  isValidTransition(from, to) {
    const validTransitions = {
      [STATES.INIT]: [STATES.LOADING, STATES.ERROR],
      [STATES.LOADING]: [STATES.READY, STATES.ERROR],
      [STATES.READY]: [STATES.PLAYING, STATES.ERROR],
      [STATES.PLAYING]: [STATES.PAUSED, STATES.STOPPED, STATES.ERROR],
      [STATES.PAUSED]: [STATES.PLAYING, STATES.STOPPED, STATES.ERROR],
      [STATES.STOPPED]: [STATES.PLAYING, STATES.ERROR],
      [STATES.ERROR]: [STATES.INIT, STATES.LOADING],
    };

    return validTransitions[from]?.includes(to) || false;
  },

  onStateChange(newState, oldState) {
    // Update UI based on state
    switch (newState) {
      case STATES.LOADING:
        this.updateButtonStates(true, true, true);
        break;
      case STATES.READY:
        this.updateButtonStates(false, true, true);
        break;
      case STATES.PLAYING:
        this.updateButtonStates(true, false, false);
        playerState.playing = true;
        break;
      case STATES.PAUSED:
        this.updateButtonStates(false, false, false);
        playerState.playing = false;
        break;
      case STATES.STOPPED:
        this.updateButtonStates(false, true, true);
        playerState.playing = false;
        break;
      case STATES.ERROR:
        this.updateButtonStates(true, true, true);
        playerState.playing = false;
        break;
    }
  },

  updateButtonStates(playDisabled, pauseDisabled, stopDisabled) {
    const playButton = document.querySelector('.play');
    const pauseButton = document.querySelector('.pause');
    const stopButton = document.querySelector('.stop');
    
    if (playButton) playButton.disabled = playDisabled;
    if (pauseButton) pauseButton.disabled = pauseDisabled;
    if (stopButton) stopButton.disabled = stopDisabled;
  },
};