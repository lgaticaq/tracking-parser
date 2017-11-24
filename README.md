# tracking-parser

[![npm version](https://img.shields.io/npm/v/tracking-parser.svg?style=flat-square)](https://www.npmjs.com/package/tracking-parser)
[![npm downloads](https://img.shields.io/npm/dm/tracking-parser.svg?style=flat-square)](https://www.npmjs.com/package/tracking-parser)
[![Build Status](https://img.shields.io/travis/lgaticaq/tracking-parser.svg?style=flat-square)](https://travis-ci.org/lgaticaq/tracking-parser)
[![Coverage Status](https://img.shields.io/coveralls/lgaticaq/tracking-parser/master.svg?style=flat-square)](https://coveralls.io/github/lgaticaq/tracking-parser?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/5c5e61696149ee2d3ebb/maintainability)](https://codeclimate.com/github/lgaticaq/tracking-parser/maintainability)
[![dependency Status](https://img.shields.io/david/lgaticaq/tracking-parser.svg?style=flat-square)](https://david-dm.org/lgaticaq/tracking-parser#info=dependencies)
[![devDependency Status](https://img.shields.io/david/dev/lgaticaq/tracking-parser.svg?style=flat-square)](https://david-dm.org/lgaticaq/tracking-parser#info=devDependencies)

> Parse raw data from tracking devices

Parser availables:

* [tz-parser](https://www.npmjs.com/package/tz-parser)
* [meitrack-parser](https://www.npmjs.com/package/meitrack-parser)
* [cellocator-parser](https://www.npmjs.com/package/cellocator-parser)
* [queclink-parser](https://www.npmjs.com/package/queclink-parser)

## Installation

```bash
npm i -S tracking-parser
```

## Use

[Try on Tonic](https://tonicdev.com/npm/tracking-parser)
```js
const tracking = require('tracking-parser')

const raw = new Buffer('$$B6869444005480041|91$GPRMC,194329.000,A,3321.6735,S,07030.7640,W,0.00,0.00,090216,,,A*6C|02.1|01.3|01.7|000000000000|20160209194326|13981188|00000000|32D3A03F|0000|0.6376|0100|7B20\r\n')
const options = {
  mcc: 730, // Necessary in TZ devices. Used for get geolocation. Default 730
  mnc: 1, // Necessary in TZ devices. Used for get geolocation. Default 1
  apiKey: 'googleApiKey' // Used for get address or geolocation. Default null
}
const data = tracking.simpleParse(raw)
console.log(data)
/*{
  raw: '$$B6869444005480041|91$GPRMC,194329.000,A,3321.6735,S,07030.7640,W,0.00,0.00,090216,,,A*6C|02.1|01.3|01.7|000000000000|20160209194326|13981188|00000000|32D3A03F|0000|0.6376|0100|7B20\r\n',
  manufacturer: 'tz',
  device: 'TZ-AVL05',
  type: 'data',
  imei: '869444005480041',
  alarm: { type: 'Sleep', status: true },
  loc: { type: 'Point', coordinates: [ -70.51273333, -33.361225 ] },
  gpsStatus: true,
  speed: 0,
  track: '0.00',
  magneticVariation: null,
  gpsMode: 'Autonomous'
  pdop: 2.1,
  hdop: 1.3,
  vdop: 1.7,
  status: {
    raw: '000000000000',
    sos: false,
    input: { '1': false, '2': false, '3': false, '4': false, '5': false },
    output: { '1': false, '2': false },
    charge: true
  },
  datetime: Tue Feb 09 2016 19:43:26 GMT+0000 (UTC),
  voltage: { battery: 3.98, inputCharge: 11.88, ada: 0, adb: 0 },
  lac: 13011,
  cid: 41023,
  temperature: 0,
  odometer: 0.6376,
  serialId: 100,
  valid: true,
  currentData: { isCurrent: false, diff: '22 días' }
}*/
tracking.parse(raw, options).then(console.log)
/*{
  raw: '$$B6869444005480041|91$GPRMC,194329.000,A,3321.6735,S,07030.7640,W,0.00,0.00,090216,,,A*6C|02.1|01.3|01.7|000000000000|20160209194326|13981188|00000000|32D3A03F|0000|0.6376|0100|7B20\r\n',
  manufacturer: 'tz',
  device: 'TZ-AVL05',
  type: 'data',
  imei: '869444005480041',
  alarm: { type: 'Sleep', status: true },
  loc: { type: 'Point', coordinates: [ -70.51273333, -33.361225 ] },
  gpsStatus: true,
  speed: 0,
  track: '0.00',
  magneticVariation: null,
  gpsMode: 'Autonomous'
  pdop: 2.1,
  hdop: 1.3,
  vdop: 1.7,
  status: {
    raw: '000000000000',
    sos: false,
    input: { '1': false, '2': false, '3': false, '4': false, '5': false },
    output: { '1': false, '2': false },
    charge: true
  },
  datetime: Tue Feb 09 2016 19:43:26 GMT+0000 (UTC),
  voltage: { battery: 3.98, inputCharge: 11.88, ada: 0, adb: 0 },
  lac: 13011,
  cid: 41023,
  temperature: 0,
  odometer: 0.6376,
  serialId: 100,
  valid: true,
  currentData: { isCurrent: false, diff: '22 días' },
  gps: 'enable',
  address: 'Robles 13180, Lo Barnechea'
}*/
```

## License

[MIT](https://tldrlegal.com/license/mit-license)
