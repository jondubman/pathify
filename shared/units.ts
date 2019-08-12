export const metersPerSecondToMilesPerHour = (mps: number) => mps * 2.23694;
export const metersToMiles = (m: number) => m * 0.00062137;

export const minutesFromMsec = (msec: number) => msec / 60000;

// input: some number like 8.5 representing minutes
// output: a string like 8:30 in this case
export const minutesToString = (minutes: number) => {
  const minutesRounded = precisionRound(minutes, 2);
  const minutesOnly = Math.floor(minutesRounded);
  const fraction = minutesRounded - minutesOnly;
  let seconds = (fraction * 60).toFixed(0);
  if (parseInt(seconds) < 10) {
    seconds = '0' + seconds; // now, a string
  }
  return `${minutesOnly}:${seconds}`
}

export const msecToString = (msec: number) => minutesToString(minutesFromMsec(msec));

export const precisionRound = (num: number, precision: number) => {
  const factor = Math.pow(10, precision);
  return Math.round(num * factor) / factor;
}
