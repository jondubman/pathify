require('module-alias/register');

import * as chai from 'chai';
const expect = chai.expect;

import { constants } from 'lib/constants';

// ----------------------
// Mocha tests begin here
// ----------------------

describe('category-warmup', function() {
  it(`should confirm server config port number ${constants.defaultPort}`, async function() {
    console.log('hello');
    expect(constants.defaultPort).to.exist;
  })
})

import { prisma } from 'prisma-client/index';

describe('category-prisma', function () {
  it(`should run a query`, async function () {
    const testResult = await prisma.events();
    expect(testResult).to.exist;
  })
})

// TODO at the moment this is dependent on seed data in seed.ts

import timeseries, { GenericEvent } from 'shared/timeseries';

describe('timeseries-count', function () {
  it(`should count events`, async function () {
    const events: GenericEvent[] = await prisma.events() as GenericEvent[];
    const count = timeseries.countEvents(events);
    console.log('count', count);
    expect(count).to.exist;
  })
})

describe('timeseries-continuousTracks', function () {
  it(`should count events`, async function () {
    const events: GenericEvent[] = await prisma.events() as GenericEvent[];
    console.log(events);
    const tracks = timeseries.continuousTracks(events, 1);
    console.log('tracks', tracks);
    expect(tracks).to.exist;
  })
})
