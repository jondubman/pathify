// Intro mode

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
  'settings' = 'settings',
  'start' = 'start',
}
// selector
export const uiCategories = (state: AppState): UICategory[] => (
  state.flags.introMode ? introPages[state.options.introModePage].ui : [
    // allow all by default
    UICategory.activities,
    UICategory.help,
    UICategory.map,
    UICategory.settings,
    UICategory.start,
  ]
)

export interface IntroPageTemplate {
  name: string;
  buttonSkip?: IntroPageButton;
  buttonNext?: IntroPageButton;
  header: string;
  text: string;
  ui: UICategory[];
}
const askLaterButton = {
  label: 'Ask later',
}
const closeButton = {
  label: 'Skip rest',
}
const nextButton = {
  label: 'NEXT',
}
const skipButton = {
  label: 'Skip intro',
}
const doneButton = {
  label: 'GET STARTED',
}
export const introPages: IntroPageTemplate[] = [
  {
    name: 'welcome',
    buttonSkip: skipButton,
    buttonNext: nextButton,
    header: 'Welcome to Pathify',
    text: `Pathify is a location-based app that lets you track, measure, map and retrace your activities, while navigating through time as well as space - all with complete privacy.`,
    ui: [],
  },
  {
    name: 'privacy',
    buttonSkip: closeButton,
    buttonNext: nextButton,
    header: 'Privacy, first',
    text: `Privacy is a basic right. Your activity in Pathify is private by design. There's no signup to complete, no account to create. You are not the product. You are the owner - of your own data, whose value should accrue to you.
\nWe want to earn your attention, not to monetize it.`,
    ui: [],
  },
  {
    name: 'location',
    buttonSkip: askLaterButton,
    buttonNext: nextButton,
    header: 'Location permission',
    text: `Pathify respectfully requests permission to track your location - for your benefit, not ours. We don't want to know where you are or where you've been. But if we agree that you should, let's get started!`,
    ui: [],
},
  {
    name: 'map',
    buttonSkip: closeButton,
    buttonNext: nextButton,
    header: 'Built around the map',
    text: `Instead of a separate route map for each activity, Pathify overlays current and prior activities on a unified map.
\nBeautiful, up-to-date maps from Mapbox help you find lesser-known parks and trails. Adjust the style and opacity on the go with the Settings panel.`,
    ui: [UICategory.map, UICategory.settings],
  },
  {
    name: 'start',
    buttonSkip: closeButton,
    buttonNext: nextButton,
    header: 'Two taps to get tracking ',
    text: `Tap the START button, then Start New Activity. End Activity the same way. It's that simple.
\nYour path is green as you're tracking, and blue when done. You can dim the map to highlight it.`,
    ui: [UICategory.map, UICategory.settings, UICategory.start],
  },
  {
    name: 'bar',
    buttonSkip: closeButton,
    buttonNext: nextButton,
    header: 'Slide the bar down for details',
    text: `This reveals a continuous timeline below the map, and a chronological list of activities above. 
\nKeep pulling down for details. See your distance, elapsed time, pace, elevation and more. Or slide the bar up for more map.`,
    ui: [UICategory.map, UICategory.settings, UICategory.start, UICategory.activities],
  },
  {
    name: 'timeline',
    buttonSkip: closeButton,
    buttonNext: nextButton,
    header: 'Scroll the timeline to follow your path',
    text: `Horizontally scroll the timeline, or the activity list. They are linked!. Scrolling one scrolls the other proportionally.
\nThe timeline clock changes color. Green means now. Red means paused in the current activity. Blue means paused in a completed activity.
\nTap the clock to reveal timeline zoom controls. Zoom out to see the distribution of activities over time, or way in to revisit a moment.
\nUse the blue arrow to follow the blue dot on the map along a prior path, as you scroll through time.
\nUse the green arrow to jump to where you are now, and the blue arrow to jump back.`,
    ui: [UICategory.map, UICategory.settings, UICategory.start, UICategory.activities],
  },
  {
    name: 'tips',
    // final page, no buttonSkip
    buttonNext: doneButton,
    header: 'Tips and tricks',
    text: `Use the Activities menu (top) to zoom the map to an activity, or to delete an activity.
\nTap an activity list square to zoom the map and timeline to show the entire activity. First tap jumps to the end, second back to the start, third to the chronological midpoint, looping around.
\nUse the Info panel to show helpful yellow labels while you learn the app, then hide them for a cleaner look.
\nSettings and Info panels stay open until you tap the button again, or tap outside the panel.
\nTap the green clock in the activity list to jump to now. Green means now.
\nZoom the map with only one finger by double tapping and sliding up and down.`,
    ui: [UICategory.map, UICategory.settings, UICategory.help, UICategory.start, UICategory.activities],
  },
]

export const introPage = (name: string): IntroPageTemplate | undefined => {
  return introPages.find(page => page.name === name)
}
