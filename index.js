// Simple responsive visualizer - no IIFEs, just clean functions
let isAnimationRunning = false;
let currentSettings = null;
let animationFrame = null;

let isReverseAnimationRunning = false;
let heightsAtStop = []; // Store starting heights for reverse animation
let reverseAnimationProgress = 0; // Progress from 0 to 1

// Configuration object to centralize all constants
const CONFIG = {
  FREQUENCY_COUNT: 256,
  MAX_FREQUENCY_VALUE: 255,
  MIN_ANIMATION_HEIGHT: 30,
  AUDIO_FILE: "./Nana's Words delok patefon FINAL.mp3",
  CROSS_ORIGIN: 'anonymous',
  VISUALIZER_CONTAINER_ID: '#visualisation',
  BAR_CLASS: '.petalBar',
  SVG_NAMESPACE: 'http://www.w3.org/2000/svg',
  STOP_ANIMATION_LENGTH: 0.02, // How fast petals return to rest (0.02 = slower, 0.08 = faster)
};

// State Machine for better state management
const STATES = {
  INIT: 'init',
  LOADING: 'loading',
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  STOPPED: 'stopped',
  ERROR: 'error',
};

// Cache for DOM elements to improve performance
let visualizerBarsCache = null;

// Our responsive settings for different screen sizes
const responsiveSettings = {
  landScapeMobile: {
    barCount: 16,
    heightMultiplier: 136,
    initHeight: '60',
    barWidth: '30.4px',
    deviceType: 'landScapemobile',
  },
  mobile: {
    barCount: 16,
    heightMultiplier: 136,
    initHeight: '60',
    barWidth: '30.4px',
    deviceType: 'mobile',
  },
  tablet: {
    barCount: 16,
    heightMultiplier: 116,
    initHeight: '1',
    barWidth: '30.4px',
    deviceType: 'tablet',
  },
  desktop: {
    barCount: 16,
    heightMultiplier: 139,
    initHeight: '1',
    barWidth: '30.4px',
    deviceType: 'desktop',
  },
};

export const playerState = {
  loaded: false,
  playing: false,
  mode: STATES.INIT,
  currentState: STATES.INIT,
};

// State machine methods
const stateMachine = {
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
    if (playButton) playButton.disabled = playDisabled;
    if (pauseButton) pauseButton.disabled = pauseDisabled;
    if (stopButton) stopButton.disabled = stopDisabled;
  },
};

let audioContext = null;
let analyzer = null;
let frequencyData = null;
let source = null;

// Event listeners cleanup array
let eventListeners = [];

const playButton = document.querySelector('.play');
const stopButton = document.querySelector('.stop');
const pauseButton = document.querySelector('.pause');

export const player = new Audio();

export function initAudio() {
  // Initialize the responsive system when the page loads
  // This sets up our media queries and initial settings
  setupResponsiveQueries();
  loadSong();
  createVisualizerBars();
}

function loadSong() {
  stateMachine.setState(STATES.LOADING);

  player.crossOrigin = CONFIG.CROSS_ORIGIN;
  player.currentTime = 0; // Reset to start
  player.src = CONFIG.AUDIO_FILE;

  const loadHandler = () => {
    console.log('Song loaded and ready to play');
    playerState.loaded = true;
    stateMachine.setState(STATES.READY);
    setupAudioContext();
  };

  const errorHandler = (error) => {
    console.error('Failed to load audio:', error);
    playerState.loaded = false;
    stateMachine.setState(STATES.ERROR);
  };

  player.addEventListener('loadedmetadata', loadHandler);
  player.addEventListener('error', errorHandler);

  // Store for cleanup
  eventListeners.push(
    { element: player, event: 'loadedmetadata', handler: loadHandler },
    { element: player, event: 'error', handler: errorHandler }
  );
}

function setupAudioContext() {
  if (audioContext) return; // Already set up

  try {
    // Create Audio Context with cross-browser support
    if (typeof window.AudioContext !== 'undefined') {
      audioContext = new AudioContext();
    } else if (typeof webkitAudioContext !== 'undefined') {
      audioContext = new webkitAudioContext();
    } else {
      throw new Error('Web Audio API not supported');
    }

    // Create analyzer node
    analyzer = audioContext.createAnalyser();
    analyzer.fftSize = CONFIG.FREQUENCY_COUNT;
    frequencyData = new Uint8Array(analyzer.frequencyBinCount);

    // Create source from audio element
    source = audioContext.createMediaElementSource(player);

    // Connect the audio nodes
    source.connect(analyzer);
    analyzer.connect(audioContext.destination);
  } catch (error) {
    console.error('Failed to setup audio context:', error);
    stateMachine.setState(STATES.ERROR);
    alert('Your browser does not support the Web Audio API');
  }
}

// Set up our media queries using matchMedia
function setupResponsiveQueries() {
  const landScapeMobileQuery = window.matchMedia(
    '(orientation: landscape) and (max-width: 800px) '
  );
  const mobileQuery = window.matchMedia('(max-width: 800px)');
  const tabletQuery = window.matchMedia(
    '(min-width: 801px) and (max-width: 1120px)'
  );
  const desktopQuery = window.matchMedia('(min-width: 1121px)');

  // Function to update settings when screen size changes
  function updateSettings() {
    let newSettings;

    if (mobileQuery.matches) {
      if (landScapeMobileQuery.matches) {
        newSettings = responsiveSettings.landScapeMobile;
      } else {
        newSettings = responsiveSettings.mobile;
      }
    } else if (tabletQuery.matches) {
      newSettings = responsiveSettings.tablet;
    } else if (desktopQuery.matches) {
      newSettings = responsiveSettings.desktop;
    }

    // Only rebuild if settings actually changed
    if (
      !currentSettings ||
      currentSettings.deviceType !== newSettings.deviceType
    ) {
      currentSettings = newSettings;
      const visualizerBars = Array.from(document.querySelectorAll('.petalBar'));
      console.log('Queries: ', { visualizerBars });
      // Rebuild bars if the visualizer is active
      if (visualizerBars.length > 0) {
        createVisualizerBars();
      }
    } else {
      // If only height multiplier changed, just update that
      currentSettings = newSettings;
    }
  }

  // Set initial settings
  updateSettings();

  // Listen for changes to each media query
  // This is the key advantage of matchMedia - precise boundary detection
  landScapeMobileQuery.addEventListener('change', updateSettings);
  mobileQuery.addEventListener('change', updateSettings);
  tabletQuery.addEventListener('change', updateSettings);
  desktopQuery.addEventListener('change', updateSettings);
}

// Create the visual bars based on current responsive settings
function createVisualizerBars() {
  const container = document.querySelector(CONFIG.VISUALIZER_CONTAINER_ID);

  if (!container) {
    console.error('Visualization container not found');
    return;
  }

  // Clear existing bars and cache
  container.innerHTML = '';
  visualizerBarsCache = null;

  // Use current responsive settings
  const settings = currentSettings;

  // Create each visualization element
  for (let i = 0; i < settings.barCount; i++) {
    // Create container for each visualization element
    const barContainer = document.createElement('div');

    // Style the container
    if (
      settings.deviceType === 'mobile' ||
      settings.deviceType === 'landScapemobile'
    ) {
      barContainer.style.width =
        settings.deviceType !== 'mobile' ? '4.5vmax' : '4.5vmin';
    } else {
      barContainer.style.width = settings.barWidth;
      barContainer.style.height = settings.heightMultiplier + 'px';
    }

    // Create SVG element
    const svg = document.createElementNS(CONFIG.SVG_NAMESPACE, 'svg');
    svg.classList.add('petalBar');

    // The key part - create a group for our elements
    const group = document.createElementNS(CONFIG.SVG_NAMESPACE, 'g');
    //group.setAttribute('transform', 'translate(0,543) scale(0.1,-0.1)');
    let color =
      settings.deviceType === 'mobile' ||
      settings.deviceType === 'landScapemobile'
        ? '#EF5757'
        : '#F38585';

    group.setAttribute('fill', color);
    group.setAttribute('stroke', 'none');

    // Then, create the leaf shape at the top of the stem
    const path = document.createElementNS(CONFIG.SVG_NAMESPACE, 'path');
    path.setAttribute(
      'd',
      `M14.3648 1.48007C13.3403 2.25622 12.0984 3.34282 10.5151 4.80198C10.1736 5.14348 9.30431 6.10591 8.6213 6.94415C7.93829 7.81344 7.069 8.80691 6.69645 9.24155C5.95135 10.0487 2.8778 16.0096 2.8778 16.6615C2.8778 16.8788 2.75362 17.0651 2.59839 17.0651C1.97747 17.0651 0.70459 24.9818 0.70459 28.7073C0.70459 31.2221 1.29446 35.941 1.91538 38.4868C2.31898 40.0391 4.24382 44.1682 5.95135 47.0244C7.28633 49.2908 10.7635 53.1715 12.6573 54.5375L13.5886 55.1895V98.157C13.5886 141.156 13.806 151.37 14.7373 154.35C15.0478 155.468 15.9171 155.996 15.9171 155.126C15.9171 154.94 16.1034 153.419 16.3517 151.804C16.6001 150.19 16.9416 147.179 17.1589 145.13C17.3452 143.08 17.6246 140.628 17.7798 139.665C17.9661 138.641 18.0903 121.69 18.0903 96.791V55.6241L20.8534 52.799C22.4057 51.2467 24.2995 48.9803 25.1067 47.7385C25.9139 46.4967 26.69 45.41 26.7832 45.3169C27.4662 44.8512 29.5773 38.8594 30.1982 35.7548C30.3845 34.7923 30.695 33.4884 30.8502 32.8675C31.2538 31.191 31.1917 30.6011 30.5087 30.0113C29.5462 29.2041 28.4596 29.0489 27.4662 29.6387C26.659 30.1355 26.5658 30.4149 26.2554 32.7123C25.7586 36.4378 24.5789 40.3496 23.9269 40.3496C23.7717 40.3496 23.6786 40.5048 23.6786 40.6911C23.6786 42.2123 19.4874 48.4215 18.4629 48.4215C18.0903 48.4215 18.0282 46.3104 18.1214 33.892C18.1524 25.9132 18.0903 19.1452 17.9661 18.8658C17.6557 18.1828 15.7929 17.8102 14.7994 18.2759C14.0543 18.5864 14.0543 18.6795 14.0543 22.7155C14.0543 24.9818 13.9612 31.7809 13.837 37.7728C13.6818 46.3725 13.5576 48.732 13.2471 48.732C13.0298 48.732 12.2847 47.9248 11.6017 46.9313C10.8877 45.9689 10.0494 44.8202 9.67686 44.3855C8.83862 43.3921 6.94482 39.4182 6.69645 38.1143C6.60332 37.5554 6.38599 36.9345 6.26181 36.7482C6.10658 36.562 5.88926 35.5374 5.79612 34.4819C5.67194 33.4263 5.45462 32.4949 5.33043 32.4018C4.95788 32.1845 4.95788 25.2302 5.33043 25.0129C5.45462 24.9197 5.67194 24.0504 5.79612 23.057C6.01344 21.1321 7.19319 17.3756 8.24875 15.3576C9.80104 12.2841 14.7684 6.50951 15.855 6.50951C16.6932 6.50951 21.8779 12.253 23.0577 14.4883C23.4923 15.2955 23.8959 16.0406 24.0201 16.1337C24.9204 16.9409 27.4041 23.3364 27.4041 24.8266C27.4041 25.1371 27.5283 25.4786 27.6835 25.5717C27.8077 25.6648 28.025 26.3168 28.1492 26.9998C28.2734 
        27.7139 28.4907 28.1796 28.6459 28.0864C29.0185 27.838 29.0495 19.3315 28.677 19.1141C28.5217 19.021 28.3044 18.1517 28.1802 17.1893C28.056 16.1958 27.8698 15.2024 27.7456 14.9229C26.5658 12.4393 24.9825 9.52097 24.1753 8.37227C22.2505 5.57814 16.7553 0.579735 15.6998 0.610781C15.5445 0.610781 14.9547 1.01438 14.3648 1.48007Z`
    );

    if (!isAnimationRunning) {
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      let svgWidth = parseFloat(settings.barWidth);

      svg.setAttribute('viewBox', `0 0 ${svgWidth} ${settings.initHeight}`);
    }

    // Add elements to the group
    group.appendChild(path);

    // Add the group to the SVG
    svg.appendChild(group);

    // Add the SVG to the container
    barContainer.appendChild(svg);
    container.appendChild(barContainer);
  }
}

// Get cached visualizer bars for performance
function getVisualizerBars() {
  if (!visualizerBarsCache) {
    visualizerBarsCache = Array.from(
      document.querySelectorAll(CONFIG.BAR_CLASS)
    );
  }
  return visualizerBarsCache;
}

// Update the animation function
function animateVisualizer() {
  if (!isAnimationRunning) {
    return;
  }
  const visualizerBars = getVisualizerBars();

  animationFrame = requestAnimationFrame(animateVisualizer);
  analyzer.getByteFrequencyData(frequencyData);

  visualizerBars.forEach((svg, index) => {
    const frequencyValue = frequencyData[index];
    // Calculate height to ensure stem is always visible
    const heightPercentage = frequencyValue / CONFIG.MAX_FREQUENCY_VALUE;
    const height = currentSettings.heightMultiplier * heightPercentage;

    if (height >= CONFIG.MIN_ANIMATION_HEIGHT) {
      // Update SVG viewBox to maintain proportion
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      // Update SVG viewBox to maintain proportion
      const svgWidth = parseFloat(currentSettings.barWidth);
      svg.setAttribute('viewBox', `0 0 ${svgWidth} ${height}`);
    }
  });
}

// Add this new function to handle the synchronized reverse animation
function animateToStartPosition() {
  if (!isReverseAnimationRunning) {
    return;
  }

  const visualizerBars = getVisualizerBars();
  const targetHeight = parseFloat(currentSettings.initHeight);

  animationFrame = requestAnimationFrame(animateToStartPosition);

  // Increment animation progress for all petals simultaneously
  reverseAnimationProgress += CONFIG.STOP_ANIMATION_LENGTH;

  // Ensure progress doesn't exceed 1
  if (reverseAnimationProgress >= 1) {
    reverseAnimationProgress = 1;
  }

  // Apply easing function for smoother animation (ease-out)
  const easedProgress = 1 - Math.pow(1 - reverseAnimationProgress, 3);

  visualizerBars.forEach((svg, index) => {
    // Calculate current height based on progress
    // All petals move the same percentage toward target
    const startHeight = heightsAtStop[index] || targetHeight;
    const heightDifference = startHeight - targetHeight;
    const currentHeight = startHeight - heightDifference * easedProgress;

    // Update SVG viewBox
    const svgWidth = parseFloat(currentSettings.barWidth);
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${currentHeight}`);
  });

  // If animation is complete, stop the reverse animation
  if (reverseAnimationProgress >= 1) {
    stopReverseAnimation();
  }
}

// Function to start the reverse animation
function startReverseAnimation() {
  if (isReverseAnimationRunning) {
    return; // Already running
  }

  console.log('Starting synchronized reverse animation to initial position');
  isReverseAnimationRunning = true;
  reverseAnimationProgress = 0; // Reset progress

  // Capture current heights of all petals at the moment stop is pressed
  const visualizerBars = getVisualizerBars();
  heightsAtStop = []; // resets array

  // get heights of all petals and add to array heightsAtStop
  visualizerBars.forEach((svg, index) => {
    // Get current viewBox height
    const viewBox = svg.getAttribute('viewBox');
    if (viewBox) {
      const viewBoxValues = viewBox.split(' ');
      heightsAtStop[index] =
        parseFloat(viewBoxValues[3]) || parseFloat(currentSettings.initHeight);
    } else {
      heightsAtStop[index] = parseFloat(currentSettings.initHeight);
    }
  });

  animateToStartPosition();
}

// Function to stop the reverse animation
function stopReverseAnimation() {
  isReverseAnimationRunning = false;
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  // Reset animation variables
  heightsAtStop = [];
  reverseAnimationProgress = 0;
  console.log('Synchronized reverse animation completed');
}

// Start the visualizer
export function startVisualizer() {
  // Make sure we have current responsive settings
  if (!currentSettings) {
    setupResponsiveQueries();
  }

  // Start the animation
  isAnimationRunning = true;
  animateVisualizer();

  console.log('Visualizer started');
}

// Stop the visualizer
export function stopVisualizer() {
  isAnimationRunning = false;
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
  // Also stop reverse animation if running
  stopReverseAnimation();
  console.log('Visualizer stopped');
}

// Reset the visualizer completely
export function resetVisualizer() {
  stopVisualizer();
  visualizerBarsCache = null;
  console.log('Visualizer reset');
}

// Cleanup function for memory management
export function cleanup() {
  stopVisualizer();
  stopReverseAnimation();

  // Remove event listeners
  eventListeners.forEach(({ element, event, handler }) => {
    element.removeEventListener(event, handler);
  });
  eventListeners = [];

  // Close audio context
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
    audioContext = null;
  }

  // Clear caches
  visualizerBarsCache = null;
  frequencyData = null;
  analyzer = null;
  source = null;
  currentHeights = [];

  console.log('Cleanup completed');
}

window.addEventListener('DOMContentLoaded', () => {
  initAudio();

  playButton.disabled = false;
  pauseButton.disabled = true;
  stopButton.disabled = true;
});

// Updated button handlers using the simplified approach
playButton.addEventListener('click', () => {
  if (
    playerState.currentState === STATES.READY ||
    playerState.currentState === STATES.PAUSED ||
    playerState.currentState === STATES.STOPPED
  ) {
    // Resume audio context if suspended (browser security requirement)
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }

    player.play().catch((error) => {
      console.error('Failed to play audio:', error);
      stateMachine.setState(STATES.ERROR);
    });
  }
});

stopButton.addEventListener('click', () => {
  if (
    playerState.currentState === STATES.PLAYING ||
    playerState.currentState === STATES.PAUSED
  ) {
    stateMachine.setState(STATES.STOPPED);
    player.pause();
    player.currentTime = 0; // Reset to beginning
    stopVisualizer();

    // Start the reverse animation to return petals to starting position
    startReverseAnimation();
  }
});

pauseButton.addEventListener('click', () => {
  if (playerState.currentState === STATES.PLAYING) {
    // Currently playing - pause everything
    player.pause();
  } else if (playerState.currentState === STATES.PAUSED) {
    // Currently paused - resume everything
    player.play();
  }
});

player.onplay = function () {
  stateMachine.setState(STATES.PLAYING);
  // Start animation functions
  startVisualizer();
};

player.onpause = function () {
  if (playerState.currentState === STATES.PLAYING) {
    stateMachine.setState(STATES.PAUSED);
    stopVisualizer();
  }
};
