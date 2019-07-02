require('module-alias/register');

import * as chai from 'chai';
const expect = chai.expect;

import { constants } from 'lib/constants';
import { utils } from 'lib/utils';

// ----------------------
// Mocha tests begin here
// ----------------------

describe('warmup', function() {
  it(`should confirm server config port number ${constants.defaultPort}`, async function() {
    expect(constants.defaultPort).to.exist;
  })
})

describe('secrets', function() {
  it(`should be able to read from a secret file`, async function() {
    const secret = utils.getSecret('test-secret');
    expect(secret).to.exist;
  })
})
