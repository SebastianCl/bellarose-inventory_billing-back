module.exports = {
  'secret': '*987654321bellarose-inventory_billing123456789*',
  'front_dev': 'http://localhost:4200', // https://bellarose-web-qa.wl.r.appspot.com
  'keyPath': './api/config/key/',
  'key_dev': 'bellarose-qa-7196b9c80b13.json', // 'bellarose-qa-2bcdbae2840e',
  'version': '1.0.0',
  'bucketName_dev': 'bellarose-qa.appspot.com', //'bellarose-web-qa.appspot.com'
  'moraCost': 10000
};

module.exports.configJWT = {
  issuer: 'bellarose-inventory_billing',
  subject: 'cardonaloaizasebastian112@gmail.com',
  audience: 'bellarose-inventory_billing-view.appspot.com',
  expiresIn: "12h",
  algorithm: 'HS256'
};
