require('module-alias/register');

import * as chai from 'chai';
const expect = chai.expect;

import { prisma } from 'prisma-client/index';
import timeseries, { GenericEvents } from 'shared/timeseries';
import { continuousTracks } from 'shared/tracks';

// ----------------------
// Mocha tests begin here
// ----------------------

// TODO for now, skip Prisma tests when running locally

if (process.env.PATHIFY_MODE === 'production') {
  describe('Prisma', function () {

    it('should run a query', async function () {
      const testResult = await prisma.events();
      expect(testResult).to.exist;
    })

    it('should count events', async function () {
      const events: GenericEvents = await prisma.events() as GenericEvents;
      const count = timeseries.countEvents(events);
      console.log('count of events', count);
      expect(count).to.exist;
    })

    it('should calculate continuousTracks', async function () {
      const events: GenericEvents = await prisma.events() as GenericEvents;
      const tracks = continuousTracks(events, 1);
      expect(tracks).to.exist;
    })
  })
}
