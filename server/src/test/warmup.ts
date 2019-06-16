require('module-alias/register');

import * as chai from 'chai';
const expect = chai.expect;

import { constants } from 'lib/constants';
import { utils } from 'lib/utils';

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

import timeseries, { GenericEvent } from 'shared/timeseries';

describe('timeseries-count', function () {
  it(`should count events`, async function () {
    const events: GenericEvent[] = await prisma.events() as GenericEvent[];
    const count = timeseries.countEvents(events);
    // console.log('count', count);
    expect(count).to.exist;
  })
})

describe('timeseries-continuousTracks', function () {
  it(`should count events`, async function () {
    const events: GenericEvent[] = await prisma.events() as GenericEvent[];
    // console.log(events);
    const tracks = timeseries.continuousTracks(events, 1);
    // console.log('tracks', tracks);
    expect(tracks).to.exist;
  })
})

describe('secrets', function() {
  it(`should be able to read from a secret file`, async function() {
    const secret = utils.getSecret('test-secret');
    expect(secret).to.exist;
  })
})
