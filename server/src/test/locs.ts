require('module-alias/register');

import * as chai from 'chai';
const expect = chai.expect;
import * as turf from '@turf/helpers';
import * as util from 'util';

import locations, { LocationEvents } from 'shared/locations';
import log from 'shared/log';
import { EventType, interval, Timepoint } from 'shared/timeseries';

const startLoc = [ -122.422943, 37.827293 ]; // Alcatraz
const locEventCount = 100;
const tBase = 1000;
const tIncrement = interval.second;
const lonIncrement = turf.lengthToDegrees(1, 'meters'); // positive means east
const latIncrement = turf.lengthToDegrees(1, 'meters'); // positive means north

const timepoint = (index: number): Timepoint => (tBase + tIncrement * index);

const locEvents: LocationEvents = function() {
  let events: LocationEvents = [];
  let lon = startLoc[0];
  let lat = startLoc[1];

  for (let i = 0; i < locEventCount; i++) {
    events.push({
      t: timepoint(i),
      type: EventType.LOC,
      loc: [ lon, lat ],
    })
    lon += lonIncrement;
    lat += latIncrement;
  }
  return events;
}()

describe('LocationEvents tests', function() {
  it('should generate locEvents', function() {
    expect(locEvents).to.exist;
    // log.debug(util.inspect(locEvents, { depth: 3 }));
  })
  it('should find locEventNearestTimepoint', function() {
    const t = tBase + tIncrement * locEventCount / 2; // TODO loop

    const t1 = t + tIncrement / 3;
    const near1 = tIncrement / 2;
    const e1 = locations.locEventNearestTimepoint(locEvents, t1, near1);
    // log.debug(util.inspect(e1, { depth: 3 }));
    expect(e1).to.exist;
    expect(e1.t).to.equal(t);

    const t2 = t + (2 * tIncrement) / 3;
    const near2 = tIncrement / 2;
    const e2 = locations.locEventNearestTimepoint(locEvents, t2, near2);
    // log.debug(util.inspect(e2, { depth: 3 }));
    expect(e2).to.exist;
    expect(e2.t).to.equal(t + tIncrement);

    const t3 = t + (2 * tIncrement) / 3;
    const near3 = tIncrement / 4;
    const e3 = locations.locEventNearestTimepoint(locEvents, t3, near3);
    log.debug(util.inspect(e3, { depth: 3 }));
    expect(e3).to.not.exist;
  })
})
