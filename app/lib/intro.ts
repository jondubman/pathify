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
  'grabBar' = 'grabBar',
  'help' = 'help',
  'map' = 'map',
  'follow' = 'follow',
  'refTime' = 'refTime',
  'settings' = 'settings',
  'start' = 'start',
  'timelineControls' = 'timelineControls',
}
// selector: which UICategory may potentially appear in the current introModePage.
// This acts as a filter and doesn't guarantee visibility of the corresponding UI, which might have other dependencies.
export const uiCategories = (state: AppState): UICategory[] => (
  (state.flags.introMode && introPages[state.options.introModePage]) ?
    introPages[state.options.introModePage].ui
  :
    [ // allow all by default (when not in intro mode)
      UICategory.activities,
      UICategory.follow,
      UICategory.grabBar,
      UICategory.help,
      UICategory.map,
      UICategory.refTime,
      UICategory.settings,
      UICategory.timelineControls,
      UICategory.start,
    ]
)

export interface IntroPageTemplate {
  name: string;
  buttonNext?: IntroPageButton;
  buttonNextStyle?: StyleProp<ViewStyle>;
  buttonRestart?: IntroPageButton;
  header: string;
  headerColor: string;
  headerStyle?: StyleProp<ViewStyle>;
  isFinalPage?: boolean;
  pageStyle?: StyleProp<ViewStyle>;
  text: string;
  textAlternate?: string;
  textStyle?: StyleProp<ViewStyle>;
  ui: UICategory[];
  yieldsLocationRequest?: boolean;
}
const doneButton = {
  label: 'DONE',
}
const nextButton = {
  label: 'NEXT',
}
const restartButton = {
  label: 'RESTART',
}

const headerColors = constants.colors.introPages.pageHeader;

export const introPages: IntroPageTemplate[] = [
  {
    name: 'welcome',
    buttonNext: nextButton,
    header: 'Hello, world!',
    headerColor: headerColors[0],
    pageStyle: { top: -10 },
    text: `Pathify is a location-based app for privately tracking, measuring and mapping your activities, while navigating through space and time - a map with a memory.
\nPathify reinvents the running app and takes off running in a new direction. Present and past activities coexist on a unified map, linked and synced to a unified timeline.
\nWe hope this fresh approach will provide insights and inspiration while you explore the near far away. This is only the start of a new journey we're excited to be sharing with you.`,
    ui: [UICategory.help],
  },
  {
    name: 'privacy',
    buttonNext: nextButton,
    header: 'Privacy, first',
    headerColor: headerColors[1],
    pageStyle: { top: -5 },
    text: `Privacy is a basic right. Your activity in Pathify is fully private by design. There's no signup to complete, and no account to create. We don't seek your identity, or your data.
\nPathify respectfully requests permission to track your location for your benefit only. What happens in Pathify stays on your device, not replicated to a remote server or data store. Exporting and sharing are slated for a future release.
\nPathify does not collect anonymized usage data, and opts out with our map provider unless you choose to participate.`,
    ui: [UICategory.help],
    yieldsLocationRequest: true, // This will issue a requestLocationPermission action on buttonNext.
  },
  {
    name: 'map',
    buttonNext: nextButton,
    header: 'One map to find them all',
    headerColor: headerColors[2],
    text: `Instead of a separate route map inside each activity, Pathify overlays current and prior activities on the same map.
\nBeautiful, up-to-date maps from Mapbox help you discover lesser-known parks and trails.
\nAdjust the map style and opacity with the Settings panel. Dim the map to highlight your path.`,
    ui: [UICategory.help, UICategory.map, UICategory.settings],
  },
  {
    name: 'start',
    buttonNext: nextButton,
    header: 'Two taps to get tracking ',
    headerColor: headerColors[3],
    text: `Tap the START button, then Start New Activity. It's that simple. End Activity the same way, anytime. It even works from here.
\nThe Info panel helps you discover more features of the app. Hide the helpful yellow labels for a cleaner, more minimal look.`,
    ui: [UICategory.help, UICategory.start],
  },
  {
    name: 'bar',
    buttonNext: nextButton,
    buttonNextStyle: { bottom: constants.timeline.default.height + 70 },
    header: 'Choose your own\nadventure UI on the fly',
    headerColor: headerColors[4],
    pageStyle: { flexDirection: 'column', justifyContent: 'flex-start', marginTop: -10 },
    text: `Slide the horizontal bar down to reveal the timeline and list of activities. 
\nKeep pulling it down for details like distance, elapsed time, pace, elevation. Or slide the bar way up for all map.`,
    textAlternate: `That's it! With the bar in this lower position, the timeline and activity list are revealed.  Tap and slide the clocks to zoom the timeline.`,
    ui: [UICategory.activities, UICategory.grabBar, UICategory.help, UICategory.map, UICategory.settings, UICategory.start, UICategory.timelineControls],
  },
  {
    name: 'timeline',
    buttonNext: nextButton,
    buttonNextStyle: { bottom: 30 },
    header: 'Zoom through time,\nfollow your own path',
    headerColor: headerColors[5],
    pageStyle: { flexDirection: 'column', justifyContent: 'flex-start', marginTop: -10 },
    text: `Use the blue arrow to follow prior paths on the map as you scroll through time, and the green arrow to jump to here and now.
\nScroll the timeline or activity list to spin the clock and retrace your path on the map. It's all synchronized - like clockwork!`,
    textAlternate: `Scroll the timeline or activity list to spin the clock and retrace your path on the map. It's all synchronized - like clockwork!`,
    ui: [UICategory.activities, UICategory.follow, UICategory.grabBar, UICategory.help, UICategory.map, UICategory.settings, UICategory.start, UICategory.timelineControls],
  },
  { // Note isFinalPage
    name: 'tips',
    buttonRestart: restartButton,
    buttonNext: doneButton, // instead of Next. isFinalPage will affect its behavior.
    header: 'Tips and tricks',
    headerColor: headerColors[6],
    isFinalPage: true,
    pageStyle: { top: -10 },
    text: `Use the Activities menu up top to zoom the map to an activity, or to delete an activity.
\nZoom both map and timeline to a past activity by tapping its square. First to the end, then to the start, then the halfway point, looping around.
\nZoom the map with only one finger by double tapping and sliding up and down. Double tap zooms in. Two finger tap zooms out.`,
    ui: [UICategory.help, UICategory.start],
  },
]

export const introPage = (name: string): IntroPageTemplate | undefined => {
  return introPages.find(page => page.name === name)
}
