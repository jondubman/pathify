// Intro mode is driven by introPages below, a template with overridable styles. The Intro pages are somewhat similar.
// Page-specific styling is thus here, and generic Intro mode styling is in the component.

import {
  StyleProp,
  ViewStyle,
} from 'react-native';

import constants from 'lib/constants';
import {
  AppState,
} from 'lib/state';

interface IntroPageButton {
  label: string;
}
export enum UICategory {
  'activities' = 'activities',
  'help' = 'help',
  'map' = 'map',
  'follow' = 'follow',
  'settings' = 'settings',
  'start' = 'start',
}
// selector: which UICategory are visible in the current introModePage (or, just allow all of them by default.)
export const uiCategories = (state: AppState): UICategory[] => (
  (state.flags.introMode && introPages[state.options.introModePage]) ?
    introPages[state.options.introModePage].ui
  :
    [ // allow all by default
      UICategory.activities,
      UICategory.help,
      UICategory.follow,
      UICategory.map,
      UICategory.settings,
      UICategory.start,
    ]
)

export interface IntroPageTemplate {
  name: string;
  buttonClose?: IntroPageButton;
  buttonNext?: IntroPageButton;
  header: string;
  headerStyle?: StyleProp<ViewStyle>;
  pageStyle?: StyleProp<ViewStyle>;
  text: string;
  textStyle?: StyleProp<ViewStyle>;
  ui: UICategory[];
}
const closeButton = {
  label: 'CLOSE',
}
const nextButton = {
  label: 'NEXT',
}
const doneButton = {
  label: 'DONE',
}
export const introPages: IntroPageTemplate[] = [
  {
    name: 'welcome',
    buttonClose: closeButton, // TODO only show this one when intro manually launched
    buttonNext: nextButton,
    header: 'Hello, world',
    headerStyle: { color: constants.colors.byName.blue } as StyleProp<ViewStyle>,
    text: `Pathify is a location-based app that lets you track, measure and map your activities, navigating through time as well as space.\n
Pathify takes a fresh approach that lets you plan, monitor and review activities all at once, on a unified map.`,
    ui: [],
  },
  {
    name: 'privacy',
    buttonClose: closeButton,
    buttonNext: nextButton,
    header: 'Privacy, first',
    text: `Privacy is a basic right. Your activity in Pathify is completely private by design. There's no signup to complete, no account to create.
\nPathify respectfully requests permission to track your location for your benefit only. What happens in Pathify stays on your device, not in a big, shared data pool.
\nWe don't even collect anonymous usage data. Mapbox does, to improve the map, but you can opt out on the next page. New features will be opt-in, designed up front to maximize your privacy.`,
    ui: [],
  },
  {
    name: 'map',
    buttonClose: closeButton,
    buttonNext: nextButton,
    header: 'One map to find them all',
    headerStyle: { color: constants.colors.byName.lighterRed } as StyleProp<ViewStyle>,
    text: `Instead of a separate route map for each activity, Pathify overlays current and prior activities on a unified map.
\nBeautiful, up-to-date maps from Mapbox help you find lesser-known parks and trails.
\nAdjust the style and opacity on the go with the Settings panel. For maximum privacy, opt out of Mapbox Telemetry with the little blue (i) in the corner. `,
    ui: [UICategory.map, UICategory.settings],
  },
  {
    name: 'start',
    buttonClose: closeButton,
    buttonNext: nextButton,
    header: 'Two taps to get tracking ',
    headerStyle: { color: constants.colorThemes.now } as StyleProp<ViewStyle>,
    text: `Tap the START button, then Start New Activity. It's that simple. End Activity the same way.
\nYour path is green while tracking, and blue when done. You can dim the map to highlight it.`,
    ui: [UICategory.start],
  },
  {
    name: 'bar',
    buttonClose: closeButton,
    buttonNext: nextButton,
    header: 'Choose your own\nadventure UI on the fly',
    headerStyle: { color: constants.colors.byName.orange } as StyleProp<ViewStyle>,
    text: `Slide the bar down to reveal a continuous timeline below the map, and a chronological list of activities above. 
\nKeep pulling down for details. See your distance, elapsed time, pace, elevation and more. Or slide the bar way up for all map.`,
    ui: [],
  },
  {
    name: 'timeline',
    buttonClose: closeButton,
    buttonNext: nextButton,
    header: 'Zoom through time,\nfollow your own path',
    headerStyle: { color: constants.colors.byName.lighterBlue } as StyleProp<ViewStyle>,
    text: `Scroll the timeline or activity list to adjust the clock and retrace your path.
\nTap the clock to zoom the timeline. Zoom out to see your whole history, or way in to a moment.
\nBlue arrow follows a prior path, as you scroll through time. Green arrow jumps to the here and now.`,
    ui: [],
  },
  {
    name: 'tips',
    // final page, no buttonSkip
    buttonClose: closeButton,
    buttonNext: doneButton, // instead of Next
    header: 'Tips and tricks',
    headerStyle: { color: constants.colors.byName.fuschia } as StyleProp<ViewStyle>,
    text: `Use the Activities menu up top to zoom the map to an activity, or to delete an activity.
\nZoom both map and timeline to a past activity by tapping its square. First to the end, then to the start, then the halfway point, looping around.
\nUse the Info panel to show helpful yellow labels while you learn the app, then hide them for a cleaner look.
\nTap the green clock in the activity list to jump to now. Green means now.
\nZoom the map with only one finger by double tapping and sliding up and down.`,
    ui: [],
  },
]

export const introPage = (name: string): IntroPageTemplate | undefined => {
  return introPages.find(page => page.name === name)
}
