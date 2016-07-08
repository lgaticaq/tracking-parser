'use strict';

const bscoords = require('bscoords');
const meitrack = require('meitrack-parser');
const cellocator = require('cellocator-parser');
const Promise = require('bluebird');
const rg = require('simple-reverse-geocoder');
const tz = require('tz-parser');

Promise.promisifyAll(bscoords);

const setCache = instance => {
  rg.setCache(instance);
};

const getImei = raw => {
  const data = raw.toString();
  let imei;
  if (tz.patterns.avl05.test(data)) {
    imei = tz.patterns.avl05.exec(data)[2];
  } else if (tz.patterns.avl08.test(data)) {
    imei = tz.patterns.avl08.exec(data)[2];
  } else if (tz.patterns.avl201.test(data)) {
    imei = tz.patterns.avl201.exec(data)[2];
  } else if (meitrack.patterns.mvt380.test(data)) {
    imei = meitrack.patterns.mvt380.exec(data)[3];
  } else if (cellocator.patterns.data.test(raw.toString('hex'))) {
    imei = cellocator.getImei(raw).toString();
  }
  return imei;
};

const getLoc = (mcc, mnc, lac, cid) => {
  return new Promise((resolve, reject) => {
    bscoords.requestGoogleAsync(mcc, mnc, lac, cid).then(coords => {
      resolve({
        type: 'Point',
        coordinates: [coords.lon, coords.lat]
      });
    }).catch(reject);
  });
};

const addLoc = (data, options) => {
  return new Promise((resolve) => {
    options = options || {};
    data.gps = data.loc ? 'enable' : 'disable';
    if (data.gps === 'enable') return resolve(data);
    const mcc = options.mcc || 730;
    const mnc = options.mnc || 1;
    getLoc(mcc, mnc, data.lac, data.cid).then(loc => {
      if (!loc) return resolve(data);
      data.loc = loc;
      data.gps = 'triangulation';
      resolve(data);
    }).catch(() => resolve(data));
  });
};

const addAddress = data => {
  return new Promise((resolve) => {
    if (!data.loc) return resolve(data);
    rg.getAddress(data.loc).then(address => {
      data.address = address;
      resolve(data);
    }).catch(() => {
      resolve(data);
    });
  });
};

const enableLoc = (data, options) => {
  return new Promise((resolve, reject) => {
    options = options || {};
    if (data.type !== 'data') return resolve(data);
    data.gps = data.loc ? 'enable' : 'disable';
    addLoc(data, options).then(addAddress).then(resolve).catch(reject);
  });
};

const parse = (raw, options) => {
  options = options || {};
  let data = {raw: raw.toString()};
  if (tz.isTz(raw)) {
    data = tz.parse(raw);
  } else if (meitrack.isMeitrack(raw)) {
    data = meitrack.parse(raw);
  } else if (cellocator.isCello(raw)) {
    data = cellocator.parse(raw);
  }
  if (Object.prototype.toString.call(data) === '[object Array]') {
    return Promise.all(data.map(x => enableLoc(x, options)));
  } else {
    return enableLoc(data, options);
  }
};

const parseCommand = data => {
  let command = null;
  if (data.device === 'tz') {
    command = tz.parseCommand(data);
  } else if (data.device === 'meitrack') {
    command = meitrack.parseCommand(data);
  }
  return command;
};

const getRebootCommand = data => {
  let command = null;
  if (/TZ-AVL(05|08|201)/.test(data.device)) {
    command = tz.getRebootCommand(data.password || '000000');
  } else if (/MVT380/.test(data.device)) {
    command = meitrack.getRebootCommand(data.imei);
  }
  return command;
};

module.exports = {
  getImei: getImei,
  setCache: setCache,
  parse: parse,
  parseCommand: parseCommand,
  getRebootCommand: getRebootCommand,
  getCellocatorAck: cellocator.ack
};
