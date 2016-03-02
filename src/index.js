'use strict';

import tz from 'tz-parser';
import meitrack from 'meitrack-parser';

const getImei = (raw) =>{
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
  }
  return imei;
};

module.exports = {
  getImei: getImei
};
