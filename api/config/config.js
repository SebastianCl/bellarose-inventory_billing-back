module.exports = {
  'version': '1.0.0',
  'secret': '*987654321bellarose-inventory_billing123456789*',
  'keyPath': './api/config/key/',
  'moraCost': 10000,
  'front': 'http://localhost:4200',
  'key': 'bellarose-qa-7196b9c80b13.json',
  'bucketName': 'bellarose-qa.appspot.com',
  //'front': 'https://bellarose-inventarioyreservas.uw.r.appspot.com', // prod
  //'key': 'bellarose-inventarioyreservas-18da8f127eb1.json', //prod
  //'bucketName': 'bellarose-inventarioyreservas.appspot.com'  //prod
};

module.exports.configJWT = {
  issuer: 'bellarose-inventory_billing',
  subject: 'cardonaloaizasebastian112@gmail.com',
  audience: 'bellarose-inventory_billing-view.appspot.com',
  expiresIn: "12h",
  algorithm: 'HS256'
};
