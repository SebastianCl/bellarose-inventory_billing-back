/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Servicio común
*/

// Configuración de ambiente
const env = require('../lib/setupEnv');

// Dependencias
const fs = require('fs');
const Excel = require('exceljs');
const nodeMailer = require('nodemailer');
const uniqid = require('uniqid');
const crypto = require('crypto');

// Servicio común
const commonService = require('../service/common.service');

// Adaptador para conectarse con gmail
function configTransporter() {
    const credentials = env.getConfigEmail();
    return nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: credentials.email,
            pass: credentials.password
        }
    });
}

// Crear archivo excel con información de orden de compra TODO: Falta mapear todos los datos, totales y garantizar integridad
async function writeExcelPO(dataPO, dataSupplier) {
    // Nombre único del archivo
    let fileName = uniqid() + crypto.randomBytes(4).toString('hex') + '.xlsx';
    // Ruta del archivo
    const pathFile = `api/temp/${fileName}`;

    let workbook = new Excel.Workbook();
    await workbook.xlsx
        .readFile('api/tools/files/PO.xlsx')
        .then(writeData);

    async function writeData() {
        let worksheet = workbook.getWorksheet('Hoja1');
        let row;

        // Fecha
        row = worksheet.getRow(4);
        let date = getDate(new Date());
        row.getCell('H').value = date;
        row.commit();

        // Nombre
        row = worksheet.getRow(8);
        row.getCell('C').value = dataSupplier.name;
        row.commit();

        // Dirección
        row = worksheet.getRow(9);
        row.getCell('C').value = dataSupplier.direction;
        row.commit();

        // Teléfono
        row = worksheet.getRow(10);
        row.getCell('C').value = dataSupplier.telephone;
        row.commit();

        // Email
        row = worksheet.getRow(12);
        row.getCell('C').value = dataSupplier.emailOrders;
        row.commit();

        let numRow = 21;
        dataPO.items.forEach(element => {
            // Descripción
            row = worksheet.getRow(numRow);
            row.getCell('B').value = element.description;
            row.commit();

            // Cantidad
            row = worksheet.getRow(numRow);
            row.getCell('G').value = element.quantity;
            row.commit();

            numRow++;
        });


        await workbook.xlsx.writeFile(pathFile);
    }
    return pathFile;
}

// Crear archivo excel con infomración de cotización TODO: Validar se crea siendo cotización o orden de cliente
async function writeExcelCO(dataQuote, dataCustomer) {
    // Nombre único del archivo
    let fileName = uniqid() + crypto.randomBytes(4).toString('hex') + '.xlsx';
    // Ruta del archivo
    const pathFile = `api/temp/${fileName}`;

    let workbook = new Excel.Workbook();
    workbook.xlsx
        .readFile('api/tools/files/CO.xlsx')
        .then(writeDataCO);

    async function writeDataCO() {
        let worksheet = workbook.getWorksheet('Hoja1');
        let row;

        // Fecha
        row = worksheet.getRow(4);
        let date = getDate(new Date());
        row.getCell('H').value = date;
        row.commit();

        // Nombre
        row = worksheet.getRow(8);
        row.getCell('C').value = `${dataCustomer.firstname} ${dataCustomer.lastname}`
        row.commit();

        // Dirección
        row = worksheet.getRow(9);
        row.getCell('C').value = dataCustomer.direction;
        row.commit();

        // Teléfono
        row = worksheet.getRow(10);
        row.getCell('C').value = dataCustomer.telephone;
        row.commit();

        // Email
        row = worksheet.getRow(11);
        row.getCell('C').value = dataCustomer.email;
        row.commit();

        // Comentarios
        row = worksheet.getRow(14);
        row.getCell('B').value = dataQuote.comments;
        row.commit();


        let numRow = 21;
        dataQuote.items.forEach(element => {
            // Descuento
            row = worksheet.getRow(numRow);
            row.getCell('B').value = element.discount;
            row.commit();

            // Descripción
            row = worksheet.getRow(numRow);
            row.getCell('C').value = element.description;
            row.commit();

            // Retail
            row = worksheet.getRow(numRow);
            row.getCell('E').value = element.retail;
            row.commit();

            // Precio
            row = worksheet.getRow(numRow);
            row.getCell('F').value = element.price;
            row.commit();

            // Cantidad
            row = worksheet.getRow(numRow);
            row.getCell('G').value = element.quantity;
            row.commit();

            // Total
            row = worksheet.getRow(numRow);
            row.getCell('H').value = element.total;
            row.commit();

            numRow++;
        });


        await workbook.xlsx.writeFile(pathFile);
    }
    return pathFile;
}

// Enviar correo electronico
async function sendEmail(emailTo, pathFile) {
    let res = { code: 400, resp: false, msg: {} };
    try {
        const transporter = configTransporter();

        let mailOptions = {
            from: '"Bellarose" <xx@gmail.com>',
            to: emailTo,
            subject: 'Notification Bellarose',
            text: 'Test email',
            html: '<b>Enviando email desde app</b>',
            attachments: [{
                filename: 'PO.xlsx',
                path: pathFile
            }]
        };

        let send = new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    res.msg = error;
                    return reject(res);
                }
                res.code = 200;
                res.resp = true;
                res.msg = 'Email enviado';
                fs.unlinkSync(pathFile); // Eliminar archivo
                return resolve(res);
            });
        });
        await send;
        return res;
    } catch (error) {
        console.log(error);
        res.code = 500;
        res.msg = error;
        return res;
    }
}

// Asigna formato de d/m/y a una fecha
function getDate(d) {
    let now = d;
    let dd = now.getDate();
    let mm = now.getMonth() + 1;
    let yyyy = now.getFullYear();

    dd = addZero(dd);
    mm = addZero(mm);

    // Formato para archivo excel
    now = dd + '/' + mm + '/' + yyyy;
    return now;

    function addZero(i) {
        if (i < 10) i = '0' + i;
        return i;
    }
}
const sendEmailPO = async (dataPO) => {
    let res = { resp: false, msg: {}, code: 400 };
    try {
        const idSupplier = dataPO.supplier.id;
        // TODO: continuar desde aqui
        const emailOrder = dataPO.supplier.emailOrder;
        let response = await commonService.getModel(Supplier, idSupplier);
        let supplier = response.msg;
        const pathFile = await writeExcelPO(dataPO, supplier);
        response = await sendEmail(emailOrder, pathFile);
        if (response.resp) {
            res.code = 200;
            res.resp = true;
            res.msg = 'Email enviado';
        }
        else {
            res.msg = response.msg;
        }
        return res;
    } catch (error) {
        console.log(error);
        res.msg = error;
        return res;
    }
}

const sendEmailCO = async (newCO, customer) => {
    const pathFile = await writeExcelCO(newCO, customer);
}

function test(pathFile) {
    var msopdf = require('node-msoffice-pdf');

    msopdf(null, function (error, office) {

        if (error) {
            console.log("Init failed", error);
            return;
        }

        office.excel({ input: pathFile, output: "api/temp/outfile.pdf" }, function (error, pdf) {
            if (error) {
                console.log("Woops", error);
            } else {
                console.log("Saved to", pdf);
            }
        });

        office.close(null, function (error) {
            if (error) {
                console.log("Woops", error);
            } else {
                console.log("Finished & closed");
            }
        });
    });
}



module.exports = {
    sendEmailCO,
    sendEmailPO
}
