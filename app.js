/**
 * @fileoverview Codigo principal de la API para la creacion del servidor con las rutas
 * @version    1.0.0
 * @author     Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright  Bellarose
 * History
 * v1.1 – API principal y rutas
 */
'use strict';

/**************************
 * INCIO DEPENDENCIAS API  *
 **************************/
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

// Conexion con Google 
const gcp = require('./api/lib/connectGCP');
// Configuración de api
const config = require('./api/config/config');
// Configuración de ambiente
const env = require('./api/lib/setupEnv');
/**************************
 * FIN DEPENDENCIAS API   *
 **************************/

// IMPORTANTE!!! Crear carpeta para archivos temporales y carpeta para llave de acceso
const dir = './api/config/key';
if (!fs.existsSync(dir)) fs.mkdirSync(dir); // Guardar llave en esta carpeta

// Iniciar servidor
const app = express();
const port = process.env.PORT || 3435;

// Conección a GCP
gcp.conectionDatastore();

// Rutas API
const article = require('./api/routes/article.route');
const articleReserved = require('./api/routes/articleReserved.route');
const customer = require('./api/routes/customer.route');
const employee = require('./api/routes/employee.route');
const invoice = require('./api/routes/invoice.route');
const reserve = require('./api/routes/reserve.route');
const user = require('./api/routes/user.route');

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));

// Establecer origin cors
let front = env.getFront();
const corsOptions = { origin: front };
app.use(cors(corsOptions));


app.get('/', (req, res) => { res.send(`Bellarose API version ${config.version} in port: ${port}`); });
app.use('/article', article);
app.use('/articleReserved', articleReserved);
app.use('/customer', customer);
app.use('/employee', employee);
app.use('/invoice', invoice);
app.use('/reserve', reserve);
app.use('/user', user);

app.listen(port, () => { console.log(`Server is up and running on port number ${port}`); });

// Se exporta para poder correr las pruebas de integración
module.exports = app;
