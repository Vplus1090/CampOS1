/**
 * Calculates whether it is currently daytime at a given latitude/longitude.
 * Noida coordinates used as default: lat = 28.628, lon = 77.38
 */
export function getSunriseSunset(lat = 28.628, lon = 77.38, date = new Date()) {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  
  // Solar declination (angle of sun relative to equator)
  const declination = 23.45 * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365);
  
  // Convert latitude and declination to radians
  const latRad = (lat * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;
  
  // Hour angle (half of day length in degrees)
  const cosH = -Math.tan(latRad) * Math.tan(decRad);
  
  let hourAngle = 90; // Default if division fails or polar day/night
  if (cosH >= -1 && cosH <= 1) {
    hourAngle = (Math.acos(cosH) * 180) / Math.PI;
  }
  
  const dayLengthHours = (2 * hourAngle) / 15;
  
  // Timezone offset in hours
  const timezoneOffset = -date.getTimezoneOffset() / 60;
  
  // Solar noon offset based on longitude
  const lstm = 15 * timezoneOffset;
  const longitudeCorrection = (lstm - lon) / 15; // in hours
  
  // Equation of Time approximation (in minutes, converted to hours)
  const b = (2 * Math.PI * (dayOfYear - 81)) / 364;
  const eqTime = (9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b)) / 60;
  
  const solarNoon = 12 + longitudeCorrection - eqTime;
  
  const sunrise = solarNoon - dayLengthHours / 2;
  const sunset = solarNoon + dayLengthHours / 2;
  
  return { sunrise, sunset };
}

export function isDaytime() {
  const lat = parseFloat(localStorage.getItem('campos-lat')) || 28.628;
  const lon = parseFloat(localStorage.getItem('campos-lon')) || 77.38;
  
  const now = new Date();
  const { sunrise, sunset } = getSunriseSunset(lat, lon, now);
  
  const currentHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  return currentHour >= sunrise && currentHour < sunset;
}

export function applyThemeMode(modeId, amoledEnabled) {
  document.body.classList.remove('mode-light', 'mode-dark', 'mode-amoled');
  
  const mode = modeId !== undefined ? modeId : (localStorage.getItem('campos-mode') || 'dark');
  const amoled = amoledEnabled !== undefined ? amoledEnabled : (localStorage.getItem('campos-amoled') === 'true');
  
  let resolvedMode = mode;
  if (mode === 'light') {
    document.body.classList.add('mode-light');
  } else if (mode === 'dark') {
    document.body.classList.add('mode-dark');
    if (amoled) {
      document.body.classList.add('mode-amoled');
      resolvedMode = 'amoled';
    }
  } else if (mode === 'auto') {
    const isDay = isDaytime();
    resolvedMode = isDay ? 'light' : 'dark';
    document.body.classList.add(resolvedMode === 'light' ? 'mode-light' : 'mode-dark');
    if (resolvedMode === 'dark' && amoled) {
      document.body.classList.add('mode-amoled');
      resolvedMode = 'amoled';
    }
  }
  
  localStorage.setItem('campos-mode', mode);
  localStorage.setItem('campos-amoled', amoled ? 'true' : 'false');
  
  // Re-apply active theme to sync CSS variables
  const currentTheme = localStorage.getItem('campos-theme') || 'lavender';
  applyTheme(currentTheme);
}

export function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

export function applyCustomHueVariables(hue, modeId) {
  const isLight = modeId === 'light';
  const isAmoled = modeId === 'amoled';
  const tertiaryHue = (hue + 60) % 360;
  
  let styles = {};
  
  if (isLight) {
    styles = {
      '--m3-primary': `hsl(${hue}, 40%, 48%)`,
      '--m3-on-primary': `#ffffff`,
      '--m3-primary-container': `hsl(${hue}, 65%, 90%)`,
      '--m3-on-primary-container': `hsl(${hue}, 65%, 15%)`,
      
      '--m3-secondary': `hsl(${hue}, 12%, 40%)`,
      '--m3-on-secondary': `#ffffff`,
      '--m3-secondary-container': `hsl(${hue}, 15%, 90%)`,
      '--m3-on-secondary-container': `hsl(${hue}, 15%, 12%)`,
      
      '--m3-tertiary': `hsl(${tertiaryHue}, 30%, 40%)`,
      '--m3-on-tertiary': `#ffffff`,
      '--m3-tertiary-container': `hsl(${tertiaryHue}, 35%, 90%)`,
      '--m3-on-tertiary-container': `hsl(${tertiaryHue}, 30%, 12%)`,
      
      '--m3-surface': `hsl(${hue}, 20%, 96%)`,
      '--m3-on-surface': `hsl(${hue}, 15%, 10%)`,
      '--m3-surface-variant': `hsl(${hue}, 15%, 90%)`,
      '--m3-on-surface-variant': `hsl(${hue}, 12%, 30%)`,
      
      '--m3-outline': `hsl(${hue}, 10%, 47%)`,
      '--m3-outline-variant': `hsl(${hue}, 12%, 82%)`,
      '--m3-surface-container-lowest': `hsl(${hue}, 20%, 98%)`,
      '--m3-surface-container-low': `hsl(${hue}, 20%, 96%)`,
      '--m3-surface-container': `hsl(${hue}, 20%, 94%)`,
      '--m3-surface-container-high': `hsl(${hue}, 20%, 92%)`,
      '--m3-surface-container-highest': `hsl(${hue}, 20%, 90%)`,
      '--m3-home-surface': `hsl(${hue}, 20%, 96%)`
    };
  } else {
    styles = {
      '--m3-primary': `hsl(${hue}, 70%, 80%)`,
      '--m3-on-primary': `hsl(${hue}, 70%, 20%)`,
      '--m3-primary-container': `hsl(${hue}, 50%, 32%)`,
      '--m3-on-primary-container': `hsl(${hue}, 70%, 90%)`,
      
      '--m3-secondary': `hsl(${hue}, 15%, 75%)`,
      '--m3-on-secondary': `hsl(${hue}, 15%, 20%)`,
      '--m3-secondary-container': `hsl(${hue}, 15%, 32%)`,
      '--m3-on-secondary-container': `hsl(${hue}, 15%, 88%)`,
      
      '--m3-tertiary': `hsl(${tertiaryHue}, 40%, 75%)`,
      '--m3-on-tertiary': `hsl(${tertiaryHue}, 40%, 20%)`,
      '--m3-tertiary-container': `hsl(${tertiaryHue}, 30%, 32%)`,
      '--m3-on-tertiary-container': `hsl(${tertiaryHue}, 40%, 88%)`,
      
      '--m3-surface': isAmoled ? `#000000` : `hsl(${hue}, 10%, 8%)`,
      '--m3-on-surface': `hsl(${hue}, 10%, 90%)`,
      '--m3-surface-variant': `hsl(${hue}, 12%, 25%)`,
      '--m3-on-surface-variant': `hsl(${hue}, 10%, 80%)`,
      
      '--m3-outline': `hsl(${hue}, 10%, 55%)`,
      '--m3-outline-variant': `hsl(${hue}, 12%, 28%)`,
      '--m3-surface-container-lowest': isAmoled ? `#000000` : `hsl(${hue}, 10%, 5%)`,
      '--m3-surface-container-low': isAmoled ? `#050505` : `hsl(${hue}, 10%, 7%)`,
      '--m3-surface-container': isAmoled ? `#0a0a0a` : `hsl(${hue}, 10%, 10%)`,
      '--m3-surface-container-high': isAmoled ? `#101010` : `hsl(${hue}, 10%, 13%)`,
      '--m3-surface-container-highest': isAmoled ? `#151515` : `hsl(${hue}, 10%, 18%)`,
      '--m3-home-surface': isAmoled ? `#000000` : `hsl(${hue}, 10%, 8%)`
    };
  }

  const [r, g, b] = hslToRgb(hue, 12, isLight ? 82 : 28);
  styles['--m3-outline-variant-rgb'] = `${r} ${g} ${b}`;

  for (const [key, val] of Object.entries(styles)) {
    document.body.style.setProperty(key, val);
  }
}

export function clearCustomHueVariables() {
  const vars = [
    '--m3-primary',
    '--m3-on-primary',
    '--m3-primary-container',
    '--m3-on-primary-container',
    '--m3-secondary',
    '--m3-on-secondary',
    '--m3-secondary-container',
    '--m3-on-secondary-container',
    '--m3-tertiary',
    '--m3-on-tertiary',
    '--m3-tertiary-container',
    '--m3-on-tertiary-container',
    '--m3-surface',
    '--m3-on-surface',
    '--m3-surface-variant',
    '--m3-on-surface-variant',
    '--m3-outline',
    '--m3-outline-variant',
    '--m3-outline-variant-rgb',
    '--m3-surface-container-lowest',
    '--m3-surface-container-low',
    '--m3-surface-container',
    '--m3-surface-container-high',
    '--m3-surface-container-highest',
    '--m3-home-surface'
  ];
  for (const v of vars) {
    document.body.style.removeProperty(v);
  }
}

export function updateThemeColorMeta() {
  if (typeof document === 'undefined') return;
  const theme = localStorage.getItem('campos-theme') || 'lavender';
  const mode = localStorage.getItem('campos-mode') || 'dark';
  const amoled = localStorage.getItem('campos-amoled') === 'true';
  const customHue = parseInt(localStorage.getItem('campos-custom-hue')) || 270;
  
  let resolvedMode = mode;
  if (mode === 'auto') {
    resolvedMode = isDaytime() ? 'light' : 'dark';
  }
  
  let color = '#0a0a0a';
  if (resolvedMode === 'light') {
    if (theme === 'custom') {
      color = `hsl(${customHue}, 20%, 96%)`;
    } else {
      if (theme === 'lavender') color = '#f3efff';
      else if (theme === 'blue') color = '#f0f4ff';
      else if (theme === 'green') color = '#effbf2';
      else if (theme === 'orange') color = '#fff5ee';
      else if (theme === 'yellow') color = '#fffbfa';
    }
  } else {
    if (amoled) {
      color = '#000000';
    } else if (theme === 'custom') {
      color = `hsl(${customHue}, 10%, 8%)`;
    } else {
      if (theme === 'lavender') color = '#121016';
      else if (theme === 'blue') color = '#0f111a';
      else if (theme === 'green') color = '#0e120f';
      else if (theme === 'orange') color = '#16110e';
      else if (theme === 'yellow') color = '#15140f';
    }
  }
  
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', color);
}

export function applyTheme(themeId) {
  const themeClasses = ['theme-lavender', 'theme-blue', 'theme-green', 'theme-orange', 'theme-yellow', 'theme-custom'];
  document.body.classList.remove(...themeClasses);
  document.body.classList.add(`theme-${themeId}`);
  
  localStorage.setItem('campos-theme', themeId);
  
  if (themeId === 'custom') {
    const customHue = parseInt(localStorage.getItem('campos-custom-hue')) || 270;
    const mode = localStorage.getItem('campos-mode') || 'dark';
    const amoled = localStorage.getItem('campos-amoled') === 'true';
    let resolvedMode = mode;
    if (mode === 'auto') {
      resolvedMode = isDaytime() ? 'light' : 'dark';
    }
    if (resolvedMode === 'dark' && amoled) {
      resolvedMode = 'amoled';
    }
    applyCustomHueVariables(customHue, resolvedMode);
  } else {
    clearCustomHueVariables();
  }
  
  updateThemeColorMeta();
}

/**
 * Attempts to request the user's geolocation and updates the coordinates in localStorage.
 * If successful, re-evaluates the auto mode theme.
 */
export function initGeolocation(onLocationUpdated) {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        localStorage.setItem('campos-lat', latitude);
        localStorage.setItem('campos-lon', longitude);
        if (onLocationUpdated) {
          onLocationUpdated();
        }
      },
      (error) => {
        console.warn('Geolocation permission denied or error. Defaulting to Noida campus coordinates.', error);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 86400000 }
    );
  }
}
