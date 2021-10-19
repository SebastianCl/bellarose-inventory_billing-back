module.exports = {
  'version': '1.0.0',
  'secret': '*987654321bellarose-inventory_billing123456789*',
  'moraCost': 10000,
  'keyPath': './api/config/key/',
  'key': 'bellarose-qa-if-8fbeb9b2eb33.json',
  'front': 'https://bellarose-qa-if.ue.r.appspot.com',
  'bucketName': 'bellarose-qa-if.appspot.com',//'bellarose-qa.appspot.com',
  //'keyPath': './api/config/key2/', //prod
  //'key': 'bellarose-inventarioyreservas-18da8f127eb1.json', //prod  
  //'front': 'https://bellarose-inventarioyreservas.uw.r.appspot.com', // prod
  //'bucketName': 'bellarose-inventarioyreservas.appspot.com'  //prod
};

module.exports.configJWT = {
  issuer: 'bellarose-inventory_billing',
  subject: 'cardonaloaizasebastian112@gmail.com',
  audience: 'bellarose-inventory_billing-view.appspot.com',
  expiresIn: "12h",
  algorithm: 'HS256'
};
