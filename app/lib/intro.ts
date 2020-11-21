// Intro mode

interface IntroPageButton {
  label: string;
}
interface IntroPageTemplate {
  name: string;
  buttonSkip?: IntroPageButton;
  buttonNext?: IntroPageButton;
  header: string;
  text: string;
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
const introPages: IntroPageTemplate[] = [
  {
    name: 'welcome',
    buttonSkip: skipButton,
    buttonNext: nextButton,
    header: 'Welcome to Pathify',
    text: `Pathify is a location-based app that lets you track, measure, map and retrace your activities, while navigating through time as well as space - all with complete privacy.`,
  },
  {
    name: 'privacy',
    buttonSkip: closeButton,
    buttonNext: nextButton,
    header: 'Privacy, first',
    text: `Privacy is a basic right. Your activity in Pathify is private by design.
We have no need to know who you are, but we wish you health and happiness.
There's no signup to complete, no account to create.
You are not the product. You are the owner: the owner of your data.`,
  },
  {
    name: 'location',
    buttonSkip: askLaterButton,
    buttonNext: nextButton,
    header: 'Location permission',
    text: `Pathify respectfully requests permission to track your location - for your benefit, not ours.
We don't want to know where you are or where you've been, but if we agree that you should know those things yourself, let's get started!`,
  },
  {
    name: 'map',
    buttonSkip: closeButton,
    buttonNext: nextButton,
    header: 'Built around the map',
    text: `Instead of a list of activities each containing its own route map, Pathify has one map capable of showing current and past activities at the same time.
Beautiful, up-to-date maps from Mapbox help you find lesser-known parks and trails. Set the style and opacity on the go with the Settings panel.`,
  },
  {
    name: 'start',
    buttonSkip: closeButton,
    buttonNext: nextButton,
    header: 'Two taps to get tracking ',
    text: `Tap the START button, then Start New Activity, and that's it. Your path is drawn in green on the map. You can dim the map to highlight it. When you're done, stop tracking the same way.`,
  },
  {
    name: 'bar',
    buttonSkip: closeButton,
    buttonNext: nextButton,
    header: 'Slide the bar down for details',
    text: `See your distance, elapsed time, pace, elevation and more. A timeline appears below the map, and a chronological list of activities above. Slide the bar back up for more map.`,
  },
  {
    name: 'timeline',
    buttonSkip: closeButton,
    buttonNext: nextButton,
    header: 'Scroll the timeline to follow your path',
    text: `Scroll the timeline, or the activity list. They are linked! Scrolling one proportionally scrolls the other.
Use the blue arrow to locate the blue dot on the map along a prior path.
Use the green arrow to locate the green dot where you are now.
The timeline clock changes color. Green means now. Red means paused in the current activity. Blue means paused in a completed activity.
Tap the timeline clock to reveal timeline zoom controls. Zoom way out to visualize the distribution of your activities over time, or way in to relive a moment.`,
  },
  {
    name: 'tips',
    // final page, no buttonSkip
    buttonNext: doneButton,
    header: 'Tips and tricks',
    text: `Tap a square activity in the activity list to zoom the map and timeline and show its path. First tap jumps to the end, second back to the start, third to the chronological midpoint, looping around.
Use the Info panel to show yellow labels to help you learn the app, or hide them for a cleaner look.
Settings and Info panels stay open until you tap the button again or tap outside the panel.
Tap the green clock in the activity list to jump to now. Green means now.
Use the Activities menu (top) to zoom the map to an activity, or to delete an activity.
In addition to zooming or rotating the map with two fingers, zoom with one finger by double tapping and sliding up and down.`,
  },
]

export const introPage = (name: string): IntroPageTemplate | undefined => {
  return introPages.find(page => page.name === name)
}
