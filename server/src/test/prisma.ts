require('module-alias/register');

import * as chai from 'chai';
const expect = chai.expect;

import { prisma } from 'prisma-client/index';
import timeseries, { GenericEvent } from 'shared/timeseries';

// ----------------------
// Mocha tests begin here
// ----------------------

// TODO describe.skip

describe.skip('prisma', function () {

  it('should run a query', async function () {
    const testResult = await prisma.events();
    expect(testResult).to.exist;
  })

  it('should count events', async function () {
    const events: GenericEvent[] = await prisma.events() as GenericEvent[];
    const count = timeseries.countEvents(events);
    // console.log('count', count);
    expect(count).to.exist;
  })

  it('should calculate continuousTracks', async function () {
    const events: GenericEvent[] = await prisma.events() as GenericEvent[];
    // console.log(events);
    const tracks = timeseries.continuousTracks(events, 1);
    // console.log('tracks', tracks);
    expect(tracks).to.exist;
  })
})
