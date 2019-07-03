require('module-alias/register');

import * as chai from 'chai';
const expect = chai.expect;
import * as turf from '@turf/helpers';

import { LocationEvents } from 'shared/locations';
import { EventType, interval, Timepoint } from 'shared/timeseries';

const locEventCount = 100;
const tBase = 1000;
const tIncrement = interval.second;
// const lonIncrement = turf.lengthToDegrees(1, 'meters');
// const latIncrement = turf.lengthToDegrees(1, 'meters');

const timepoint = (index: number): Timepoint => (tBase + tIncrement * index);

const locEvents: LocationEvents = function() {
  let events: LocationEvents = [];
  const lon = 0, lat = 0;

  for (let i = 0; i < locEventCount; i++) {
    events.push({
      t: timepoint(i),
      type: EventType.LOC,
      data: { lon, lat },
    })
  }
  return events;
}()

describe('LocationEvents tests', function() {
  it('should generate locEvents', function() {
    expect(locEvents).to.exist;
  })
  console.log(locEvents);
})
