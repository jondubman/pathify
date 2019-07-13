import * as chai from 'chai';
const expect = chai.expect;
require('module-alias/register');

import locations, { LocationEvent } from 'shared/locations';
import log from 'shared/log';
import timeseries, { EventType, GenericEvents, TimeReference } from 'shared/timeseries';

// ----------------------
// Mocha tests begin here
// ----------------------

const tBase = 1000;
const tIncrement = 10;

const eventList: GenericEvents = [
  { t: tBase, type: EventType.TEST },
  { t: tBase + tIncrement * 1, type: EventType.TEST },
  { t: tBase + tIncrement * 2, type: EventType.TEST },
  { t: tBase + tIncrement * 3, type: EventType.TEST },
  { t: tBase + tIncrement * 4, type: EventType.TEST },
]

describe('GenericEvents tests', function () {
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
  it('should adjustTime with fixed start time only', function () {
    const startAtTime = 5000;
    const startAt: TimeReference = {
      t: startAtTime,
      relative: false,
    }
    const adjustedEventList = timeseries.adjustTime(eventList, startAt);

    log.info(eventList);
    log.debug(adjustedEventList);
  })
  it('should adjustTime with fixed end time only', function () {
    const endAtTime = 5000;
    const endAt: TimeReference = {
      t: endAtTime,
      relative: false,
    }
    const adjustedEventList = timeseries.adjustTime(eventList, null, endAt);

    log.info(eventList);
    log.debug(adjustedEventList);
  })
  it('should adjustTime with fixed start and end time', function() {
    const startAtTime = 5000;
    const endAtTime = 8000;
    const startAt: TimeReference = {
      t: startAtTime,
      relative: false,
    }
    const endAt: TimeReference = {
      t: endAtTime,
      relative: false,
    }
    const adjustedEventList = timeseries.adjustTime(eventList, startAt, endAt);

    log.info(eventList);
    log.debug(adjustedEventList);

    expect(adjustedEventList[0].t).to.equal(startAtTime);
    expect(adjustedEventList[adjustedEventList.length - 1].t).to.equal(endAtTime);
  })
  it('should adjustTime with relative start and end time', function () {
    const startAtTime = 0;
    const endAtTime = 9;
    const relativeTo = 10000;
    const startAt: TimeReference = {
      t: startAtTime,
      relative: true,
    }
    const endAt: TimeReference = {
      t: endAtTime,
      relative: true,
    }
    const adjustedEventList = timeseries.adjustTime(eventList, startAt, endAt, relativeTo);

    log.info(eventList);
    log.debug(adjustedEventList);

  })
  it('should adjustTime with relative start time and no end time', function () {
    const startAtTime = 0;
    const relativeTo = 10000;
    const startAt: TimeReference = {
      t: startAtTime,
      relative: true,
    }
    const adjustedEventList = timeseries.adjustTime(eventList, startAt, null, relativeTo);

    log.info(eventList);
    log.debug(adjustedEventList);
  })
  it('should adjustTime with relative end time and no start time', function () {
    const endAtTime = 0;
    const relativeTo = 10000;
    const endAt: TimeReference = {
      t: endAtTime,
      relative: true,
    }
    const adjustedEventList = timeseries.adjustTime(eventList, null, endAt, relativeTo);

    log.info(eventList);
    log.debug(adjustedEventList);
  })
})
