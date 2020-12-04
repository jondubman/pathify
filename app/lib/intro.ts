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
  hideCloseButtonBeforeLocationRequest?: boolean;
  buttonNext?: IntroPageButton;
  header: string;
  headerStyle?: StyleProp<ViewStyle>;
  isFinalPage?: boolean;
  pageStyle?: StyleProp<ViewStyle>;
  text: string;
  textStyle?: StyleProp<ViewStyle>;
  ui: UICategory[];
  yieldsLocationRequest?: boolean;
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
    header: 'Hello, world!',
    headerStyle: { color: constants.colors.byName.blue } as StyleProp<ViewStyle>,
    hideCloseButtonBeforeLocationRequest: true,
    text: `Pathify is a location-based app for privately tracking, measuring and mapping your activities, while navigating through time and space - a map with a memory.
\nPathify has the essential features of a running app, with a fresh approach. Plan, monitor and review activities all at once, on a unified map, linked and synced to a unified timeline.
\nWe hope this app will inspire you, and provide valuable insights from your own data while you explore the near far away.`,
    ui: [],
  },
  {
    name: 'privacy',
    buttonClose: closeButton,
    buttonNext: nextButton,
    header: 'Privacy, first',
    hideCloseButtonBeforeLocationRequest: true,
    text: `Privacy is a basic right. Your activity in Pathify is fully private by design. There's no signup to complete, and no account to create. We don't seek your identity, or your data.
\nPathify respectfully requests permission to track your location for your benefit only. What happens in Pathify stays on your device and is not copied to a remote repository. It's not yet possible to export or share data.
\nWe do not even collect anonymous usage data. By default, Mapbox does so, to improve the map, but you can opt out on the next page.`,
    ui: [],
    yieldsLocationRequest: true, // This will issue a requestLocationPermission action on buttonNext.
  },
  {
    name: 'map',
    buttonClose: closeButton,
    buttonNext: nextButton,
    header: 'One map to find them all',
    headerStyle: { color: constants.colors.byName.lighterRed } as StyleProp<ViewStyle>,
    pageStyle: { top: -15 }, // leave extra room for labeled Settings button above, since we have UICategory.settings.
    text: `Instead of a separate route map inside each activity, Pathify overlays current and prior activities on the same map.
\nBeautiful, up-to-date maps from Mapbox help you discover lesser-known parks and trails. For maximum privacy, opt out of Mapbox Telemetry with the little blue (i) in the corner.
\nAdjust the map style and opacity with the Settings panel anytime (including now!)`,
    ui: [UICategory.map, UICategory.settings],
  },
  {
    name: 'start',
    buttonClose: closeButton,
    buttonNext: nextButton,
    header: 'Two taps to get tracking ',
    headerStyle: { color: constants.colorThemes.now } as StyleProp<ViewStyle>,
    text: `Tap the START button, then Start New Activity. It's that simple. End Activity the same way, anytime. It even works from here.
\nYour path on the map is green while tracking, and blue when done. You can dim the map to highlight it using Settings.`,
    ui: [UICategory.start],
  },
  {
    name: 'bar',
    buttonClose: closeButton,
    buttonNext: nextButton,
    header: 'Choose your own\nadventure UI on the fly',
    headerStyle: { color: constants.colors.byName.orange } as StyleProp<ViewStyle>,
    text: `There's a horizontal bar you can slide down to reveal the timeline and list of activities. 
\nKeep pulling it down for details like distance, elapsed time, pace, elevation. Or slide the bar way up for all map.`,
    ui: [UICategory.start],
  },
  {
    name: 'timeline',
    buttonClose: closeButton,
    buttonNext: nextButton,
    header: 'Zoom through time,\nfollow your own path',
    headerStyle: { color: constants.colors.byName.lighterBlue } as StyleProp<ViewStyle>,
    text: `Scroll the timeline or activity list to spin the clock and retrace your path on the map. It's all synchronized... like clockwork!
\nTap the clock to zoom the timeline. Zoom continuously, from the entire span of history, down to a split-second.
\nUse the blue arrow to follow prior paths on the map, and the green arrow to jump to here and now.`,
    ui: [UICategory.follow, UICategory.start],
  },
  { // Note isFinalPage
    name: 'tips',
    buttonClose: closeButton,
    buttonNext: doneButton, // instead of Next
    header: 'Tips and tricks',
    headerStyle: { color: constants.colors.byName.fuschia } as StyleProp<ViewStyle>,
    isFinalPage: true,
    text: `Use the Activities menu up top to zoom the map to an activity, or to delete an activity.
\nZoom both map and timeline to a past activity by tapping its square. First to the end, then to the start, then the halfway point, looping around.
\nUse the Info panel to show helpful yellow labels while you learn the app, then hide them for a cleaner look.
\nTap the green clock in the activity list to jump to now. Green means now.
\nZoom the map with only one finger by double tapping and sliding up and down.`,
    ui: [UICategory.start],
  },
]

export const introPage = (name: string): IntroPageTemplate | undefined => {
  return introPages.find(page => page.name === name)
}
