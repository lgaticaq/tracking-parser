'use strict'

const mobileLocator = require('mobile-locator')
const meitrack = require('meitrack-parser')
const cellocator = require('cellocator-parser')
const queclink = require('queclink-parser')
const rg = require('simple-reverse-geocoder')
const tz = require('tz-parser')

/**
 * Set client Redis for cache results
 * @param  {String} uri Redis connection string. Ex redis://user:pass@host:port/db
 * @return {Void}
 */
const setCache = uri => {
  rg.setCache(uri)
}

/**
 * Get imei from raw data
 * @param  {Buffer} raw Raw data from tracking device
 * @return {String}     Imei
 */
const getImei = raw => {
  const fns = [
    tz.getImei,
    meitrack.getImei,
    cellocator.getImei,
    queclink.getImei
  ]
  const imei = fns.map(x => x(raw)).find(x => x !== null) || null
  return imei
}

/**
 * Set geolocation from cell tower information
 * @param  {Object}          data        Parsed data
 * @param  {Number}          options.mcc Mobile country code
 * @param  {Number}          options.mnc Mobile network code
 * @param  {String}          options.key Google api key
 * @return {Promise<Object>}             Parsed data with geolocation
 */
const setLoc = (data, { mcc = 730, mnc = 1, key = null } = {}) => {
  const locate = mobileLocator('google', { key })
  return locate({ mcc, mnc, lac: data.lac, cid: data.cid })
    .then(coords => {
      data.loc = {
        type: 'Point',
        coordinates: [coords.longitude, coords.latitude]
      }
      data.gps = 'triangulation'
      return data
    })
    .catch(() => data)
}

/**
 * Set address
 * @param  {Object}         data   Parsed data
 * @param  {String}         apiKey Google api key
 * @return {Promise<Object>}        Parsed data with address
 */
const setAddress = (data, apiKey = null) => {
  if (!data.loc) return Promise.resolve(data)
  return rg
    .getAddress(data.loc, apiKey)
    .then(address => {
      data.address = address
      return data
    })
    .catch(() => {
      return data
    })
}

/**
 * Set gps (enable, triangulation, disable) and set address
 * @param  {Object}          data           Parsed data
 * @param  {Number}          options.mcc    Mobile country code
 * @param  {Number}          options.mnc    Mobile network code
 * @param  {String}          options.apiKey Google api key
 * @return {Promise<Object>}                Parsed data with geolocation and address
 */
const setGps = (data, { mcc = 730, mnc = 1, apiKey = null } = {}) => {
  if (data.type !== 'data') return Promise.resolve(data)
  data.gps = data.loc ? 'enable' : 'disable'
  if (data.gps === 'enable') {
    return setAddress(data, apiKey)
  }
  return setLoc(data, {
    mcc: data.mcc || mcc,
    mnc: data.mnc || mnc,
    key: apiKey
  }).then(data => {
    return setAddress(data, apiKey)
  })
}

/**
 * Parse raw data
 * @param  {Buffer}               raw Raw data
 * @return {Object|Array<Object>}     Parsed data
 */
const simpleParse = raw => {
  const fns = [tz.parse, meitrack.parse, cellocator.parse, queclink.parse]
  const data = fns.map(x => x(raw)).find(x => x.type !== 'UNKNOWN') || {
    raw: raw.toString(),
    type: 'UNKNOWN'
  }
  return data
}

/**
 * Parse raw data, set, geolocation, gps (enable, triangulation, disable) and address
 * @param  {Buffer}                        raw            Raw data
 * @param  {Number}                        options.mcc    Mobile country code
 * @param  {Number}                        options.mnc    Mobile network code
 * @param  {String}                        options.apiKey Google api key
 * @return {Promise<Object|Array<Object>>}                Parsed data with geolocation, gps and address
 */
const parse = (raw, { mcc = 730, mnc = 1, apiKey = null } = {}) => {
  try {
    const options = { mcc, mnc, apiKey }
    const fns = [tz.parse, meitrack.parse, cellocator.parse, queclink.parse]
    const data = fns.map(x => x(raw)).find(x => x.type !== 'UNKNOWN') || {
      raw: raw.toString(),
      type: 'UNKNOWN'
    }
    if (Array.isArray(data)) {
      return Promise.all(data.map(x => setGps(x, options)))
    } else {
      return setGps(data, options)
    }
  } catch (err) {
    return Promise.reject(err)
  }
}

/**
 * Parse command to raw command
 * @param  {Object} data Command data
 * @return {String}      Raw command
 */
const parseCommand = data => {
  let command = null
  const fns = {
    tz: tz.parseCommand,
    meitrack: meitrack.parseCommand,
    cellocator: cellocator.parseCommand,
    queclink: queclink.parseCommand
  }
  if (fns.hasOwnProperty(data.device)) {
    command = fns[data.device](data)
  }
  return command
}

/**
 * Get raw roboot command
 * @param  {Object} data Command data
 * @return {String}      Raw command
 */
const getRebootCommand = data => {
  let command = null
  if (data.device === 'tz') {
    command = tz.getRebootCommand(data.password || '000000')
  } else if (data.device === 'meitrack') {
    command = meitrack.getRebootCommand(data.imei)
  } else if (data.device === 'queclink') {
    command = queclink.getRebootCommand(data.password, data.serial)
  }
  return command
}

/**
 * Get ack command
 * @param  {Object} data manufacturer, counter and others
 * @return {Object}      Raw command ack and limit
 */
const getAck = data => {
  let ack
  let limit
  if (data.manufacturer === 'queclink') {
    ack = Buffer.from(
      queclink.getAckHeartBeat(data.protocolVersion, data.counter)
    )
    limit = queclink.limitAck || 65535
  } else if (data.manufacturer === 'cellocator') {
    ack = cellocator.ack(data.unitId, data.counter, data.serialId)
    limit = cellocator.limitAck || 255
  }
  return { ack, limit }
}

/**
 * Check if raw data is a HeartBeat
 * @param  {Object} data manufacturer and raw data
 * @return {Boolean}
 */
const isHeartBeat = data => {
  if (data.manufacturer === 'queclink') {
    return queclink.isHeartBeat(data.raw)
  }
  return false
}

module.exports = {
  getImei: getImei,
  setCache: setCache,
  simpleParse: simpleParse,
  parse: parse,
  parseCommand: parseCommand,
  getRebootCommand: getRebootCommand,
  getCellocatorAck: cellocator.ack,
  getAck: getAck,
  isHeartBeat: isHeartBeat
}
