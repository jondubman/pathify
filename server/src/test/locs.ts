require('module-alias/register');

import * as chai from 'chai';
const expect = chai.expect;
import * as turf from '@turf/helpers';
import * as util from 'util';

import { LocationEvents } from 'shared/locations';
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
      data: { loc: [ lon, lat ]},
    })
    lon += lonIncrement;
    lat += latIncrement;
  }
  return events;
}()

describe('LocationEvents tests', function() {
  it('should generate locEvents', function() {
    expect(locEvents).to.exist;
  })
  log.debug(util.inspect(locEvents, { depth: 3 }));
})
