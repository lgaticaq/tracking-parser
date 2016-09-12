'use strict';

const bscoords = require('bscoords');
const meitrack = require('meitrack-parser');
const cellocator = require('cellocator-parser');
const queclink = require('queclink-parser');
const Promise = require('bluebird');
const rg = require('simple-reverse-geocoder');
const tz = require('tz-parser');

Promise.promisifyAll(bscoords);

const setCache = instance => {
  rg.setCache(instance);
};

const getImei = raw => {
  const fns = [tz.getImei, meitrack.getImei, cellocator.getImei, queclink.getImei];
  const imei = fns.map(x => x(raw)).find(x => x !== null) || null;
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
  const fns = [tz.parse, meitrack.parse, cellocator.parse, queclink.parse];
  const data = fns.map(x => x(raw)).find(x => x.type !== 'UNKNOWN') || {raw: raw.toString(), type: 'UNKNOWN'};
  if (Object.prototype.toString.call(data) === '[object Array]') {
    return Promise.all(data.map(x => enableLoc(x, options)));
  } else {
    return enableLoc(data, options);
  }
};

const parseCommand = data => {
  let command = null;
  const fns = {
    tz: tz.parseCommand,
    meitrack: meitrack.parseCommand,
    cellocator: cellocator.parseCommand,
    queclink: queclink.parseCommand
  };
  if (fns.hasOwnProperty(data.device)) {
    command = fns[data.device](data);
  }
  return command;
};

const getRebootCommand = data => {
  let command = null;
  if (data.device === 'tz') {
    command = tz.getRebootCommand(data.password || '000000');
  } else if (data.device === 'meitrack') {
    command = meitrack.getRebootCommand(data.imei);
  } else if (data.device === 'queclink') {
    command = queclink.getRebootCommand(data.password, data.serial);
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
