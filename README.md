# tracking-parser

[![npm version](https://img.shields.io/npm/v/tracking-parser.svg?style=flat-square)](https://www.npmjs.com/package/tracking-parser)
[![npm downloads](https://img.shields.io/npm/dm/tracking-parser.svg?style=flat-square)](https://www.npmjs.com/package/tracking-parser)
[![dependency Status](https://img.shields.io/david/lgaticaq/tracking-parser.svg?style=flat-square)](https://david-dm.org/lgaticaq/tracking-parser#info=dependencies)
[![Build Status](https://img.shields.io/travis/lgaticaq/tracking-parser.svg?style=flat-square)](https://travis-ci.org/lgaticaq/tracking-parser)
[![devDependency Status](https://img.shields.io/david/dev/lgaticaq/tracking-parser.svg?style=flat-square)](https://david-dm.org/lgaticaq/tracking-parser#info=devDependencies)
[![Join the chat at https://gitter.im/lgaticaq/tracking-parser](https://img.shields.io/badge/gitter-join%20chat%20%E2%86%92-brightgreen.svg?style=flat-square)](https://gitter.im/lgaticaq/tracking-parser?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Parse raw data from tracking devices

## Installation

```bash
npm i -S tracking-parser
```

## Use

[Try on Tonic](https://tonicdev.com/npm/tracking-parser)
```js
import tracking from 'tracking-parser'

const raw = new Buffer('$$B6869444005480041|91$GPRMC,194329.000,A,3321.6735,S,07030.7640,W,0.00,0.00,090216,,,A*6C|02.1|01.3|01.7|000000000000|20160209194326|13981188|00000000|32D3A03F|0000|0.6376|0100|7B20\r\n');
const imei = tracking.getImei(raw); // '869444005480041'
```
