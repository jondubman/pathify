require('module-alias/register');

import * as chai from 'chai';
const expect = chai.expect;

import locations, { LocationEvent } from 'shared/locations';
import timeseries, { EventType, GenericEvent } from 'shared/timeseries';

// ----------------------
// Mocha tests begin here
// ----------------------

const tBase = 1000;
const tIncrement = 10;

const eventList: GenericEvent[] = [
  { t: tBase, type: EventType.OTHER },
  { t: tBase + tIncrement * 1, type: EventType.OTHER },
  { t: tBase + tIncrement * 2, type: EventType.OTHER },
  { t: tBase + tIncrement * 3, type: EventType.OTHER },
  { t: tBase + tIncrement * 4, type: EventType.OTHER },
]

describe('shared modules', function () {
  it('should load locations module', function () {
    expect(locations).to.exist;
  })
  it('should load timeseries module', function () {
    expect(timeseries).to.exist;
  })
  it('should countEvents', function () {
    expect(timeseries.countEvents(eventList) === eventList.length);
  })
  it('should findEventsAtTimepoint', function() {
    for (let i = 0; i < eventList.length; i++) {
      const timepoint = eventList[i].t;
      const results = timeseries.findEventsAtTimepoint(eventList, timepoint);
      expect(results.length).to.equal(1);
      expect(results[0].t).to.equal(timepoint);
    }
  })
  it('should findEventsNearestTimepoint', function () {
    for (let i = 0; i < eventList.length; i++) {

      const exactMatches =
        timeseries.findEventsNearestTimepoint(eventList, eventList[i].t, false, false);
      expect(exactMatches.length).to.equal(1);

      const matchesBefore =
        timeseries.findEventsNearestTimepoint(eventList, eventList[i].t + (tIncrement - 1), true, false, tIncrement);
      expect(matchesBefore.length).to.equal(1);

      const matchesAfter =
        timeseries.findEventsNearestTimepoint(eventList, eventList[i].t - (tIncrement - 1), false, true, tIncrement);
      expect(matchesAfter.length).to.equal(1);
    }
  })
  it('should find two events equally near a timepoint', function () {
    for (let i = 1; i < eventList.length - 1; i++) {

      const matchTwo =
        timeseries.findEventsNearestTimepoint(eventList, eventList[i].t - tIncrement / 2, true, true, tIncrement / 2);
      expect(matchTwo.length).to.equal(2);
    }
  })
  it('should not find any locEventNearestTimepoint in a list with no LOC events', function() {
    const locEvent: LocationEvent = locations.locEventNearestTimepoint(eventList, tBase, tIncrement);
    expect(locEvent).to.be.null;
  })
})
