require('module-alias/register');

import * as chai from 'chai';
const expect = chai.expect;

import { constants } from 'lib/constants';

// ----------------------
// Mocha tests begin here
// ----------------------

describe('category-warmup', function() {
  it(`should confirm server port number ${constants.defaultPort}`, async function() {
    console.log('hello');
    expect(constants.defaultPort).to.exist;
  })
})

import { prisma } from 'prisma-client/index';

describe('category-prisma', function () {
  it(`should run a query`, async function () {
    const testResult = await prisma.events();
    console.log(testResult);
    expect(testResult).to.exist;
  })
})
