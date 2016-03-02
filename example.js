const tracking = require('tracking-parser');

const raw = new Buffer('$$B6869444005480041|91$GPRMC,194329.000,A,3321.6735,S,07030.7640,W,0.00,0.00,090216,,,A*6C|02.1|01.3|01.7|000000000000|20160209194326|13981188|00000000|32D3A03F|0000|0.6376|0100|7B20\r\n');
const imei = tracking.getImei(raw);
