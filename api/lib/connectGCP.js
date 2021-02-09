// Cargar configuración de api
const env = require('./setupEnv');
/**************************
 * INCIO DEPENDENCIAS GCP  *
 **************************/
const { Gstore, instances } = require('gstore-node');
const { Datastore } = require('@google-cloud/datastore');
/**************************
 * FIN DEPENDENCIAS GCP   *
 **************************/

// Ruta de llave de conexión
const keyPath = env.getKeyPath();

function conectionDatastore() {
    const gstore = new Gstore();
    // Instancia para conectar a Datastore
    const datastore = new Datastore({ keyFilename: keyPath });
    gstore.connect(datastore);
    // Guardar la instancia de Gstore, ruta de llave y nombre del bucket
    instances.set('unique-id', gstore);
}

module.exports = {
    conectionDatastore
}
