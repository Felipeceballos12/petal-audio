// Current Audio Settings
export let currentSettings = null;

// Configuration object to centralize all constants
export const CONFIG = {
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

// Our responsive settings for different screen sizes
export const responsiveSettings = {
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

// Cache for DOM elements to improve performance
let visualizerBarsCache = null;

// Get cached visualizer bars for performance
export function getVisualizerBars() {
  if (!visualizerBarsCache) {
    visualizerBarsCache = Array.from(
      document.querySelectorAll(CONFIG.BAR_CLASS)
    );
  }
  return visualizerBarsCache;
}

// Clear the visualizer bars cache
export function clearVisualizerBarsCache() {
  visualizerBarsCache = null;
}

// Set up our media queries using matchMedia
export function setupResponsiveQueries(createVisualizerBarsCallback) {
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
      // Rebuild bars if the visualizer is active
      if (visualizerBars.length > 0) {
        createVisualizerBarsCallback();
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
