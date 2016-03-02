'use strict';

import tracking from '../lib';
import {expect} from 'chai';

describe('tracking-parzer', () => {
  describe('valid TZ-AVL05 data', () => {
    it('should return the valid imei', () => {
      const raw = new Buffer('$$B6869444005480041|AA$GPRMC,194329.000,A,3321.6735,S,07030.7640,W,0.00,0.00,090216,,,A*6C|02.1|01.3|01.7|000000000000|20160209194326|13981188|00000000|32D3A03F|0000|0.6376|0100|995F\r\n');
      const imei = tracking.getImei(raw);
      expect(imei).to.eql('869444005480041');
    });
  });

  describe('valid TZ-AVL08 data', () => {
    it('should return the valid imei', () => {
      const raw = new Buffer('$$B7869444005480041|AA$GPRMC,194329.000,A,3321.6735,S,07030.7640,W,0.00,0.00,090216,,,A*6C|02.1|01.3|01.7|000000000000|20160209194326|13981188|00000000|32D3A03F|0000|0.6376|0100||56E2\r\n');
      const imei = tracking.getImei(raw);
      expect(imei).to.eql('869444005480041');
    });
  });

  describe('valid TZ-AVL201 data', () => {
    it('should return the valid imei', () => {
      const raw = new Buffer('$$AD869444005480041|AA$GPRMC,194329.000,A,3321.6735,S,07030.7640,W,0.00,0.00,090216,,,A*6C|02.1|01.3|01.7|000000000000|20160209194326|13981188|32D3A03F|0000|0.6376|0100|5BEB\r\n');
      const imei = tracking.getImei(raw);
      expect(imei).to.eql('869444005480041');
    });
  });

  describe('valid MVT380 data', () => {
    it('should return the valid imei', () => {
      const raw = new Buffer('$$A138,862170013556541,AAA,35,7.092076,79.960473,140412132808,A,10,9,57,275,1,14,5783799,7403612,413|1|F6E0|3933,0000,000B|0009||02D8|0122,*EE\r\n');
      const imei = tracking.getImei(raw);
      expect(imei).to.eql('862170013556541');
    });
  });
});
