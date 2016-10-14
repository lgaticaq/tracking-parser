'use strict';

const expect = require('chai').expect;
const proxyquire = require('proxyquire');

const bscoordsStub = {
  requestGoogle: (mcc, mnc, lac, cid, cb) => {
    if (mcc === 1) {
      cb(new Error('Not found'));
    } else if (mcc === 2) {
      cb(null, {lat: -35.362024, lon: -71.51566});
    } else {
      cb(null, {lat: -33.362024, lon: -70.51566});
    }
  },
  requestGoogleAsync: (mcc) => {
    return new Promise((resolve, reject) => {
      if (mcc === 1) {
        reject(new Error('Not found'));
      } else if (mcc === 2) {
        resolve({lat: -35.362024, lon: -71.51566});
      } else {
        resolve({lat: -33.362024, lon: -70.51566});
      }
    });
  }
};
const rgStub = {
  getAddress: loc => {
    return new Promise((resolve, reject) => {
      if (loc.coordinates[0] === -71.51566) {
        reject(new Error('Not found'));
      } else {
        resolve('Av. La Dehesa 538');
      }
    });
  }
};
proxyquire('../src/index.js', {
  bscoords: bscoordsStub,
  'simple-reverse-geocoder': rgStub
});

const tracking = require('../src');

describe('tracking-parser', () => {
  it('should return imei from TZ-AVL05 data', () => {
    const raw = new Buffer('$$B6869444005480041|AA$GPRMC,194329.000,A,3321.6735,S,07030.7640,W,0.00,0.00,090216,,,A*6C|02.1|01.3|01.7|000000000000|20160209194326|13981188|00000000|32D3A03F|0000|0.6376|0100|995F\r\n');
    const imei = tracking.getImei(raw);
    expect(imei).to.eql('869444005480041');
  });

  it('should return imei from MVT380 data', () => {
    const raw = new Buffer('$$A138,862170013556541,AAA,35,7.092076,79.960473,140412132808,A,10,9,57,275,1,14,5783799,7403612,413|1|F6E0|3933,0000,000B|0009||02D8|0122,*EE\r\n');
    const imei = tracking.getImei(raw);
    expect(imei).to.eql('862170013556541');
  });

  it('should return imei from cellocator data', () => {
    const raw = new Buffer('4d43475000aac30c00000aa84e2104161d002001c30400002a69e291b600000042f7830fea440000a0000000000000000000000000000000000000000000202d03000000005e', 'hex');
    const imei = tracking.getImei(raw);
    expect(imei).to.eql('357247050053442');
  });

  it('should return imei from queclink data', () => {
    const raw = new Buffer('+RESP:GTFRI,250504,135790246811220,,,00,1,1,4.3,92,70.0,121.354335,31.222073,20090214013254,0460,0000,18d8,6141,00,2000.0,12345:12:34,,,80,210100,,,,20090214093254,11F0$');
    const imei = tracking.getImei(raw);
    expect(imei).to.eql('135790246811220');
  });

  it('should return imei from UNKNOWN data', () => {
    const raw = new Buffer('asdasdasdasdasdsadasdasdasdasdasdasdasdasdasdsadasdasdasdasdasdasdasdasdasdsadasdasdasdasdasdasdasdasdasdsadasdasdasdasdasdasdasdasdasdsadasdasdasdasdasdasdasdasdasdsadasdasdasdasd');
    const imei = tracking.getImei(raw);
    expect(imei).to.be.null;
  });

  it('should return UNKNOWN data', done => {
    const raw = new Buffer('asdasdasdasdasdsadasdasdasdasdasdasdasdasdasdsadasdasdasdasdasdasdasdasdasdsadasdasdasdasdasdasdasdasdasdsadasdasdasdasdasdasdasdasdasdsadasdasdasdasdasdasdasdasdasdsadasdasdasdasd');
    tracking.parse(raw).then(data => {
      expect(data.raw).to.eql(raw.toString());
      expect(data.type).to.eql('UNKNOWN');
      done();
    }).catch(err => {
      done(err);
    });
  });

  it('should return TZ-AVL05 data with empty GPS and not found loc', done => {
    const raw = new Buffer('$$AE869444005480041|AA000000000000000000000000000000000000000000000000000000000000|02.1|01.3|01.7|000000000000|20160209194326|13981188|00000000|32D3A03F|0000|0.6376|0100|6CCB\r\n');
    tracking.parse(raw, {mcc: 1}).then(data => {
      expect(data.raw).to.eql(raw.toString());
      expect(data.loc).to.eql(null);
      expect(data.address).to.be.undefined;
      done();
    }).catch(err => {
      done(err);
    });
  });

  it('should return TZ-AVL05 data with empty GPS and not found address', done => {
    const raw = new Buffer('$$AE869444005480041|AA000000000000000000000000000000000000000000000000000000000000|02.1|01.3|01.7|000000000000|20160209194326|13981188|00000000|32D3A03F|0000|0.6376|0100|6CCB\r\n');
    tracking.parse(raw, {mcc: 2}).then(data => {
      expect(data.raw).to.eql(raw.toString());
      expect(data.loc.type).to.eql('Point');
      expect(data.loc.coordinates).to.eql([-71.51566, -35.362024]);
      expect(data.address).to.be.undefined;
      done();
    }).catch(err => {
      done(err);
    });
  });

  it('should return TZ-AVL05 data with empty GPS', done => {
    const raw = new Buffer('$$AE869444005480041|AA000000000000000000000000000000000000000000000000000000000000|02.1|01.3|01.7|000000000000|20160209194326|13981188|00000000|32D3A03F|0000|0.6376|0100|6CCB\r\n');
    tracking.parse(raw).then(data => {
      expect(data.raw).to.eql(raw.toString());
      expect(data.loc.type).to.eql('Point');
      expect(data.loc.coordinates).to.eql([-70.51566, -33.362024]);
      expect(data.address).to.eql('Av. La Dehesa 538');
      done();
    }).catch(err => {
      done(err);
    });
  });

  it('should return TZ-AVL05 data parsed', done => {
    const raw = new Buffer('$$B6869444005480041|AA$GPRMC,194329.000,A,3321.6735,S,07030.7640,W,0.00,0.00,090216,,,A*6C|02.1|01.3|01.7|000000000000|20160209194326|13981188|00000000|32D3A03F|0000|0.6376|0100|995F\r\n');
    tracking.parse(raw).then(data => {
      expect(data.raw).to.eql(raw.toString());
      expect(data.manufacturer).to.eql('tz');
      expect(data.device).to.eql('tz');
      expect(data.model).to.eql('TZ-AVL05');
      expect(data.type).to.eql('data');
      expect(data.imei).to.eql('869444005480041');
      expect(data.alarm.type).to.eql('Gps');
      expect(data.loc.type).to.eql('Point');
      expect(data.loc.coordinates).to.eql([-70.51273333333333, -33.361225]);
      expect(data.speed).to.eql(0);
      expect(data.gpsStatus).to.be.a.true;
      expect(data.track).to.eql('0.00');
      expect(data.magneticVariation).to.be.null;
      expect(data.gpsMode).to.eql('Autonomous');
      expect(data.pdop).to.eql(2.1);
      expect(data.hdop).to.eql(1.3);
      expect(data.vdop).to.eql(1.7);
      expect(data.status.raw).to.eql('000000000000');
      expect(data.status.sos).to.be.a.false;
      expect(data.status.input['1']).to.be.a.false;
      expect(data.status.input['2']).to.be.a.false;
      expect(data.status.input['3']).to.be.a.false;
      expect(data.status.input['4']).to.be.a.false;
      expect(data.status.input['5']).to.be.a.false;
      expect(data.status.output['1']).to.be.a.false;
      expect(data.status.output['2']).to.be.a.false;
      expect(data.status.charge).to.be.a.true;
      expect(data.datetime).to.eql(new Date('2016-02-09T19:43:26.000Z'));
      expect(data.voltage.battery).to.eql(3.98);
      expect(data.voltage.inputCharge).to.eql(11.88);
      expect(data.voltage.ada).to.eql(0);
      expect(data.voltage.adb).to.eql(0);
      expect(data.lac).to.eql(13011);
      expect(data.cid).to.eql(41023);
      expect(data.temperature).to.eql(0);
      expect(data.odometer).to.eql(0.6376);
      expect(data.serialId).to.eql(100);
      expect(data.valid).to.be.a.true;
      expect(data.gps).to.eql('enable');
      expect(data.address).to.eql('Av. La Dehesa 538');
      done();
    }).catch(err => {
      done(err);
    });
  });

  it('should return MVT380 raw data parsed', done => {
    const raw = new Buffer('$$A138,862170013556541,AAA,35,7.092076,79.960473,140412132808,A,10,9,57,275,1,14,5783799,7403612,413|1|F6E0|3933,0000,000B|0009||02D8|0122,*EE\r\n');
    tracking.parse(raw).then(data => {
      expect(data.raw).to.eql(raw.toString());
      expect(data.manufacturer).to.eql('meitrack');
      expect(data.device).to.eql('MVT380');
      expect(data.type).to.eql('data');
      expect(data.imei).to.eql(862170013556541);
      expect(data.command).to.eql('AAA');
      expect(data.alarm.type).to.eql('Gps');
      expect(data.loc.type).to.eql('Point');
      expect(data.loc.coordinates).to.eql([79.960473, 7.092076]);
      expect(data.datetime).to.eql(new Date('2014-04-12T13:28:08.000Z'));
      expect(data.gpsSignal).to.eql('A');
      expect(data.satellites).to.eql(10);
      expect(data.gsmSignal).to.eql(9);
      expect(data.speed).to.eql(57);
      expect(data.direction).to.eql(275);
      expect(data.hdop).to.eql(1);
      expect(data.altitude).to.eql(14);
      expect(data.odometer).to.eql(5783799);
      expect(data.runtime).to.eql(7403612);
      expect(data.mcc).to.eql('413');
      expect(data.mnc).to.eql('1');
      expect(data.lac).to.eql(63200);
      expect(data.ci).to.eql(14643);
      expect(data.status.input['1']).to.be.false;
      expect(data.status.input['2']).to.be.false;
      expect(data.status.input['3']).to.be.false;
      expect(data.status.input['4']).to.be.false;
      expect(data.status.input['5']).to.be.false;
      expect(data.status.input['6']).to.be.false;
      expect(data.status.input['7']).to.be.false;
      expect(data.status.input['8']).to.be.false;
      expect(data.status.output['1']).to.be.false;
      expect(data.status.output['2']).to.be.false;
      expect(data.status.output['3']).to.be.false;
      expect(data.status.output['4']).to.be.false;
      expect(data.status.output['5']).to.be.false;
      expect(data.status.output['6']).to.be.false;
      expect(data.status.output['7']).to.be.false;
      expect(data.status.output['8']).to.be.false;
      expect(data.gps).to.eql('enable');
      expect(data.address).to.eql('Av. La Dehesa 538');
      done();
    }).catch(err => {
      done(err);
    });
  });

  it('should return cellocator raw data parsed', done => {
    const raw = new Buffer('4d43475000bdda0b0000060ddf20041017002000e3c40000baeff3c6b6224502000000000000ea65000402090daec5f7cb302cff3357000038090000930a002a170c03e007c1', 'hex');
    tracking.parse(raw).then(data => {
      expect(data.raw).to.eql(raw.toString('hex'));
      expect(data.unitId).to.eql(776893);
      expect(data.manufacturer).to.eql('cellocator');
      expect(data.device).to.eql('CelloTrack');
      expect(data.type).to.eql('data');
      expect(data.alarm.type).to.eql('ConnectionUp');
      expect(data.loc.type).to.eql('Point');
      expect(data.loc.coordinates).to.eql([-79.09097658351084, -7.953307941260071]);
      expect(data.speed).to.eql(84.96);
      expect(data.datetime).to.eql('2016-03-12T23:42:00.000Z');
      expect(data.direction).to.eql(155.09967514191385);
      expect(data.satellites).to.eql(9);
      expect(data.voltage.ada).to.eql(28.1176470588165);
      expect(data.voltage.adb).to.eql(4.00235293989);
      expect(data.voltage.adc).to.eql(45.41720000000001);
      expect(data.voltage.add).to.eql(182);
      expect(data.altitude).to.eql(223.23000000000002);
      expect(data.status.input['1']).to.be.false;
      expect(data.status.input['2']).to.be.false;
      expect(data.status.input['3']).to.be.false;
      expect(data.status.input['4']).to.be.false;
      expect(data.status.input['5']).to.be.true;
      expect(data.status.output['1']).to.be.false;
      expect(data.status.output['2']).to.be.false;
      expect(data.status.output['3']).to.be.false;
      expect(data.status.output['4']).to.be.false;
      expect(data.status.output['5']).to.be.false;
      expect(data.status.output['6']).to.be.false;
      expect(data.status.sos).to.be.false;
      expect(data.status.engine).to.be.false;
      expect(data.status.driving).to.be.false;
      expect(data.status.accelerometer).to.be.true;
      expect(data.hardware.model).to.eql('Cello-IQ');
      expect(data.hardware.modem).to.eql('Telit GE864, automative');
      expect(data.valid).to.be.true;
      expect(data.address).to.eql('Av. La Dehesa 538');
      done();
    }).catch(err => {
      done(err);
    });
  });

  it('should return queclink raw data parsed', done => {
    const raw = new Buffer('+RESP:GTFRI,350302,867844003012625,,12401,10,1,0,0.0,0,816.1,-70.514613,-33.361280,20160811170821,0730,0002,7410,C789,00,0.0,00001:33:08,2788,702,137,08,00,,,20160811180025,07B8$');
    tracking.parse(raw).then(data => {
      expect(data.raw).to.eql(raw.toString());
      expect(data.raw).to.eql(raw.toString());
      // expect(data.manufacturer).to.eql('queclink');
      expect(data.device).to.eql('Queclink-GV200');
      expect(data.type).to.eql('data');
      expect(data.imei).to.eql('867844003012625');
      expect(data.protocolVersion.raw).to.eql('350302');
      expect(data.protocolVersion.deviceType).to.eql('GV200');
      expect(data.protocolVersion.version).to.eql('3.2');
      expect(data.temperature).to.be.null;
      expect(data.history).to.be.false;
      expect(data.sentTime).to.eql(new Date('2016-08-11T18:00:25.000Z'));
      expect(data.serialId).to.eql(1976);
      expect(data.alarm.type).to.eql('Gps');
      expect(data.loc.type).to.eql('Point');
      expect(data.loc.coordinates).to.eql([-70.514613, -33.36128]);
      expect(data.speed).to.eql(0);
      expect(data.gpsStatus).to.be.a.true;
      expect(data.hdop).to.eql(0);
      expect(data.status.raw).to.eql('0800');
      expect(data.status.sos).to.be.false;
      expect(data.status.input[1]).to.be.true;
      expect(data.status.input[2]).to.be.false;
      expect(data.status.input[3]).to.be.false;
      expect(data.status.input[4]).to.be.false;
      expect(data.status.output[1]).to.be.false;
      expect(data.status.output[2]).to.be.false;
      expect(data.status.output[3]).to.be.false;
      expect(data.status.output[4]).to.be.false;
      expect(data.status.charge).to.be.true;
      expect(data.azimuth).to.eql(0);
      expect(data.altitude).to.eql(816.1);
      expect(data.datetime).to.eql(new Date('2016-08-11T17:08:21.000Z'));
      expect(data.voltage.battery).to.be.null;
      expect(data.voltage.inputCharge).to.eql(12.401);
      expect(data.voltage.ada).to.eql(2.788);
      expect(data.voltage.adb).to.eql(0.702);
      expect(data.voltage.adc).to.eql(0.137);
      expect(data.mcc).to.eql(730);
      expect(data.mnc).to.eql(2);
      expect(data.lac).to.eql(29712);
      expect(data.cid).to.eql(51081);
      expect(data.odometer).to.eql(0);
      expect(data.hourmeter).to.eql('00001:33:08');
      expect(data.address).to.eql('Av. La Dehesa 538');
      done();
    }).catch(err => {
      done(err);
    });
  });

  it('should return null raw command', () => {
    const data = {
      instruction: 'reboot',
      password: 897463,
      device: 'asdasda'
    };
    const raw = tracking.parseCommand(data);
    expect(raw).to.be.null;
  });

  it('should return TZ raw command', () => {
    const data = {
      instruction: 'reboot',
      password: 897463,
      device: 'tz'
    };
    const raw = tracking.parseCommand(data);
    expect(raw).to.eql('*897463,991#');
  });

  it('should return Meitrack raw command', () => {
    const data = {
      instruction: '1_on',
      imei: 353358017784062,
      device: 'meitrack'
    };
    const raw = tracking.parseCommand(data);
    expect(raw).to.match(/^@@([\x41-\x7A])(\d{1,3}),353358017784062,C01,0,12222\*([0-9A-F]{2})\r\n$/);
  });

  it('should return Cellocator raw command', () => {
    const data = {
      unitId: 836522,
      commandNumerator: 1,
      instruction: '1_on',
      device: 'cellocator'
    };
    const raw = tracking.parseCommand(data);
    expect(raw).to.eql(new Buffer('4d43475000aac30c0001000000000003000300140014000000000000a8', 'hex'));
  });

  it('should return queclink raw command', () => {
    const data = {
      password: '101010',
      serial: 1010,
      instruction: '2_on',
      previousOutput: {
        '1': true,
        '2': false,
        '3': false,
        '4': true
      },
      device: 'queclink'
    };
    const raw = tracking.parseCommand(data);
    expect(raw).to.eql('AT+GTOUT=101010,1,0,0,1,0,0,0,0,0,1,0,0,0,0,,,03f2$');
  });

  it('should return null raw command reboot', () => {
    const data = {device: 'asdf'};
    const raw = tracking.getRebootCommand(data);
    expect(raw).to.be.null;
  });

  it('should return TZ raw command reboot', () => {
    const data = {
      password: 897463,
      device: 'tz'
    };
    const raw = tracking.getRebootCommand(data);
    expect(raw).to.eql('*897463,991#');
  });

  it('should return TZ raw command reboot without password', () => {
    const data = {device: 'tz'};
    const raw = tracking.getRebootCommand(data);
    expect(raw).to.eql('*000000,991#');
  });

  it('should return Meitrack raw command reboot', () => {
    const data = {
      imei: 353358017784062,
      device: 'meitrack'
    };
    const raw = tracking.getRebootCommand(data);
    expect(raw).to.match(/^@@([\x41-\x7A])(\d{1,3}),353358017784062,F02\*([0-9A-F]{2})\r\n$/);
  });

  it('should return queclink raw command reboot', () => {
    const data = {
      password: '000000',
      serial: 32,
      device: 'queclink'
    };
    const raw = tracking.getRebootCommand(data);
    expect(raw).to.eql('AT+GTRTO=000000,3,,,,,,32$');
  });

  it('should return a cellocator ACK command', () => {
    const unitId = 836522;
    const commandNumerator = 1;
    const messageNumerator = 80;
    const ack = tracking.getCellocatorAck(unitId, commandNumerator, messageNumerator);
    expect(ack).to.eql(new Buffer('4D43475004AAC30C00010000000000500000000000000000000000CE', 'hex'));
  });
});
