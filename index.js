// Simple responsive visualizer - no IIFEs, just clean functions
let visualizerBars = [];
let isAnimationRunning = false;
let currentSettings = null;

// Our responsive settings for different screen sizes
const responsiveSettings = {
  landScapeMobile: {
    barCount: 16,
    heightMultiplier: 136,
    barWidth: '30.4px',
    deviceType: 'landScapemobile',
  },
  mobile: {
    barCount: 16,
    heightMultiplier: 136,
    barWidth: '30.4px',
    deviceType: 'mobile',
  },
  tablet: {
    barCount: 16,
    heightMultiplier: 116,
    barWidth: '30.4px',
    deviceType: 'tablet',
  },
  desktop: {
    barCount: 16,
    heightMultiplier: 139,
    barWidth: '30.4px',
    deviceType: 'desktop',
  },
};

const FREQUENCY_COUNT = 256;
export const playerState = {
  loaded: false,
  playing: false,
  mode: 'init',
};

let audioContext = null;
let analyzer = null;
let frequencyData = null;
let source = null;

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
  player.crossOrigin = 'anonymous';
  player.currentTime = 0; // Reset to start

  const songUrl =
    'https://raw.githubusercontent.com/1yumag/job-demo/main/f_75363e65a4009cb8.mp3';
  const songURL = "./Nana's Words delok patefon FINAL.mp3";

  // Set source for audio element
  player.src = songURL;
  player.addEventListener('loadedmetadata', () => {
    console.log('Song loaded and ready to play');

    playerState.loaded = true;
    // Initialize Audio Context and Analyzer
    setupAudioContext();
  });
}

function setupAudioContext() {
  if (audioContext) return; // Already set up

  // Create Audio Context with cross-browser support
  if (typeof window.AudioContext !== 'undefined') {
    audioContext = new AudioContext();
  } else if (typeof webkitAudioContext !== 'undefined') {
    audioContext = new webkitAudioContext();
  } else {
    alert('Your browser does not support the Web Audio API');
    return;
  }

  // Create analyzer node
  analyzer = audioContext.createAnalyser();
  analyzer.fftSize = FREQUENCY_COUNT;
  frequencyData = new Uint8Array(analyzer.frequencyBinCount);

  // Create source from audio element
  source = audioContext.createMediaElementSource(player);

  // Connect the audio nodes
  source.connect(analyzer);
  analyzer.connect(audioContext.destination);

  // Set up visualization elements
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
  const container = document.querySelector('#visualisation');

  if (!container) {
    console.error('Visualization container not found');
    return;
  }

  // Clear existing bars
  container.innerHTML = '';
  visualizerBars = [];

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
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    // The key part - create a group for our elements
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    //group.setAttribute('transform', 'translate(0,543) scale(0.1,-0.1)');
    let color =
      settings.deviceType === 'mobile' ||
      settings.deviceType === 'landScapemobile'
        ? '#EF5757'
        : '#F38585';

    group.setAttribute('fill', color);
    group.setAttribute('stroke', 'none');

    // Then, create the leaf shape at the top of the stem
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute(
      'd',
      `M14.3648 1.48007C13.3403 2.25622 12.0984 3.34282 10.5151 4.80198C10.1736 5.14348 9.30431 6.10591 8.6213 6.94415C7.93829 7.81344 7.069 8.80691 6.69645 9.24155C5.95135 10.0487 2.8778 16.0096 2.8778 16.6615C2.8778 16.8788 2.75362 17.0651 2.59839 17.0651C1.97747 17.0651 0.70459 24.9818 0.70459 28.7073C0.70459 31.2221 1.29446 35.941 1.91538 38.4868C2.31898 40.0391 4.24382 44.1682 5.95135 47.0244C7.28633 49.2908 10.7635 53.1715 12.6573 54.5375L13.5886 55.1895V98.157C13.5886 141.156 13.806 151.37 14.7373 154.35C15.0478 155.468 15.9171 155.996 15.9171 155.126C15.9171 154.94 16.1034 153.419 16.3517 151.804C16.6001 150.19 16.9416 147.179 17.1589 145.13C17.3452 143.08 17.6246 140.628 17.7798 139.665C17.9661 138.641 18.0903 121.69 18.0903 96.791V55.6241L20.8534 52.799C22.4057 51.2467 24.2995 48.9803 25.1067 47.7385C25.9139 46.4967 26.69 45.41 26.7832 45.3169C27.4662 44.8512 29.5773 38.8594 30.1982 35.7548C30.3845 34.7923 30.695 33.4884 30.8502 32.8675C31.2538 31.191 31.1917 30.6011 30.5087 30.0113C29.5462 29.2041 28.4596 29.0489 27.4662 29.6387C26.659 30.1355 26.5658 30.4149 26.2554 32.7123C25.7586 36.4378 24.5789 40.3496 23.9269 40.3496C23.7717 40.3496 23.6786 40.5048 23.6786 40.6911C23.6786 42.2123 19.4874 48.4215 18.4629 48.4215C18.0903 48.4215 18.0282 46.3104 18.1214 33.892C18.1524 25.9132 18.0903 19.1452 17.9661 18.8658C17.6557 18.1828 15.7929 17.8102 14.7994 18.2759C14.0543 18.5864 14.0543 18.6795 14.0543 22.7155C14.0543 24.9818 13.9612 31.7809 13.837 37.7728C13.6818 46.3725 13.5576 48.732 13.2471 48.732C13.0298 48.732 12.2847 47.9248 11.6017 46.9313C10.8877 45.9689 10.0494 44.8202 9.67686 44.3855C8.83862 43.3921 6.94482 39.4182 6.69645 38.1143C6.60332 37.5554 6.38599 36.9345 6.26181 36.7482C6.10658 36.562 5.88926 35.5374 5.79612 34.4819C5.67194 33.4263 5.45462 32.4949 5.33043 32.4018C4.95788 32.1845 4.95788 25.2302 5.33043 25.0129C5.45462 24.9197 5.67194 24.0504 5.79612 23.057C6.01344 21.1321 7.19319 17.3756 8.24875 15.3576C9.80104 12.2841 14.7684 6.50951 15.855 6.50951C16.6932 6.50951 21.8779 12.253 23.0577 14.4883C23.4923 15.2955 23.8959 16.0406 24.0201 16.1337C24.9204 16.9409 27.4041 23.3364 27.4041 24.8266C27.4041 25.1371 27.5283 25.4786 27.6835 25.5717C27.8077 25.6648 28.025 26.3168 28.1492 26.9998C28.2734 
        27.7139 28.4907 28.1796 28.6459 28.0864C29.0185 27.838 29.0495 19.3315 28.677 19.1141C28.5217 19.021 28.3044 18.1517 28.1802 17.1893C28.056 16.1958 27.8698 15.2024 27.7456 14.9229C26.5658 12.4393 24.9825 9.52097 24.1753 8.37227C22.2505 5.57814 16.7553 0.579735 15.6998 0.610781C15.5445 0.610781 14.9547 1.01438 14.3648 1.48007Z`
    );

    if (!isAnimationRunning) {
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      let svgWidth = parseFloat(settings.barWidth);
      let height = settings.deviceType === 'mobile' ? '60' : '1';

      svg.setAttribute('viewBox', `0 0 ${svgWidth} ${height}`);
    }

    // Add elements to the group
    group.appendChild(path);

    // Add the group to the SVG
    svg.appendChild(group);

    // Add the SVG to the container
    barContainer.appendChild(svg);
    container.appendChild(barContainer);

    // Store for animation
    visualizerBars.push({
      container: barContainer,
      svg: svg,
      group: group,
    });
  }
}

// Update the animation function
function animateVisualizer() {
  if (!isAnimationRunning) {
    return;
  }

  requestAnimationFrame(animateVisualizer);
  analyzer.getByteFrequencyData(frequencyData);

  visualizerBars.forEach((bar, index) => {
    const frequencyValue = frequencyData[index];

    // Calculate height to ensure stem is always visible
    const heightPercentage = frequencyValue / 255;
    const height = currentSettings.heightMultiplier * heightPercentage;

    // Update SVG viewBox to maintain proportion
    bar.svg.setAttribute('width', '100%');
    bar.svg.setAttribute('height', '100%');
    let svgWidth = parseFloat(currentSettings.barWidth);
    bar.svg.setAttribute('viewBox', `0 0 ${svgWidth} ${height}`);
  });
}

// Start the visualizer
export function startVisualizer() {
  // Make sure we have current responsive settings
  if (!currentSettings) {
    setupResponsiveQueries();
  }

  /* // Create bars if they don't exist
    if (visualizerBars.length === 0) {
      createVisualizerBars();
    } */

  // Start the animation
  isAnimationRunning = true;
  animateVisualizer();

  console.log('Visualizer started');
}

// Stop the visualizer
export function stopVisualizer() {
  isAnimationRunning = false;
  console.log('Visualizer stopped');
}

// Reset the visualizer completely
export function resetVisualizer() {
  stopVisualizer();

  const container = document.querySelector('#visualisation');
  if (container) {
    container.innerHTML = '';
  }

  visualizerBars = [];
  console.log('Visualizer reset');
}

window.addEventListener('DOMContentLoaded', () => {
  initAudio();

  console.log('Init: ', { visualizerBars });

  playButton.disabled = false;
  pauseButton.disabled = true;
  stopButton.disabled = true;
});

// Updated button handlers using the simplified approach
playButton.addEventListener('click', () => {
  // Resume audio context if suspended (browser security requirement)
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }

  player.play().catch((error) => {
    console.error('Failed to play audio:', error);
    playerState.playing = false;
  });
});

stopButton.addEventListener('click', () => {
  playButton.disabled = false;
  pauseButton.disabled = true;
  stopButton.disabled = true;

  playerState.playing = false;
  playerState.mode = 'stopped';

  player.pause();
  player.currentTime = 0; // Reset to beginning
  console.log({ visualizerBars });
});

pauseButton.addEventListener('click', () => {
  if (playerState.playing && playerState.loaded) {
    // Currently playing - pause everything
    player.pause();
  } else if (!playerState.playing && playerState.loaded) {
    // Currently paused - resume everything
    player.play();
  }
});

player.onplay = function () {
  playerState.playing = true;
  playerState.mode = 'play';
  console.log('Play bbefore visualizer: ', { visualizerBars });
  // Start animation functions
  startVisualizer();
  console.log('Play after visualizer: ', { visualizerBars });

  playButton.disabled = true;
  pauseButton.disabled = false;
  stopButton.disabled = false;
};

player.onpause = function () {
  if (playerState.playing && playerState.loaded) {
    playerState.playing = false;
    playerState.mode = 'pause';

    stopVisualizer();
    playButton.disabled = false;
    pauseButton.disabled = false;
    stopButton.disabled = false;
  }
};
