import * as chai from 'chai';
const expect = chai.expect;

import { constants } from '../lib/constants';

// ----------------------
// Mocha tests begin here
// ----------------------

describe('category-warmup', function() {
  describe('server-port', function() {
    it(`should confirm server port number ${constants.defaultPort}`, async function() {
      expect(constants.defaultPort).to.exist;
    })
  })
})
