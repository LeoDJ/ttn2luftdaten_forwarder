'use strict'

const request = require('request')
const ttn = require('ttn')

const log = (logMessage) => {
    process.stdout.write(logMessage + '\n')
}

if (process.env.appID === undefined || process.env.accessKey === undefined || process.env.prefix === undefined) {
    log('Provide \'appID\' & \'accessKey\' & \'prefix\' for your ttn application with the environment')
    process.exit(1)
}

const appID = process.env.appID
const accessKey = process.env.accessKey
const prefix = process.env.prefix

const sendData = (url, payload, deviceId, XPin) => {
    const options = {
        headers: {
            'X-Pin': XPin,
            'X-Sensor': deviceId
        },
        method: 'POST',
        url: url,
        json: {
            sensordatavalues: payload
        }
    }

    request(options)
}

//converts payload for madavi API to Luftdaten API, because it does not require value_type prefixes
function convertToLuftdatenPayload(madaviPayload) {
    let sensorPayloadLuftdaten = [];
    madaviPayload.forEach((elem) => {
        let luftElem = JSON.parse(JSON.stringify(elem)); //duplicate object without reference
        let vt = luftElem.value_type;
        if (vt.includes('_')) {
            luftElem.value_type = vt.substr(vt.indexOf('_') + 1);
        }
        sensorPayloadLuftdaten.push(luftElem);
    });
    return sensorPayloadLuftdaten;
}

ttn.data(appID, accessKey)
    .then((client) => {
        client.on('uplink', (devID, payload) => {
            const deviceId = prefix + '-' + parseInt(payload.hardware_serial, 16)
            log('Forwarding data from device: ' + devID + ' [' + deviceId + ']')
            log('data: ' + JSON.stringify(payload.payload_fields))

            if (payload.payload_fields.pm10 && payload.payload_fields.pm25) {
                const pmPayload = [{
                        value_type: 'SDS_P1',
                        value: payload.payload_fields.pm10.toString()
                    },
                    {
                        value_type: 'SDS_P2',
                        value: payload.payload_fields.pm25.toString()
                    }
                ]
                sendData('https://api.luftdaten.info/v1/push-sensor-data/', convertToLuftdatenPayload(pmPayload), deviceId, 1)
                sendData('https://api-rrd.madavi.de/data.php', pmPayload, deviceId, 1)
            }

            // need to differentiate the sensors based on the sensor values provided (because the API requires it)
            let xPin = 0;
            let p = payload.payload_fields;
            let apiString = {};
            if (p.temperature && !p.humidity && !p.pressure) {
                xPin = 13; //DS18B20
                apiString.temperature = "DS18B20_temperature";
            } else if (p.temperature && p.humidity && !p.pressure) {
                xPin = 7; //DHT22
                apiString.temperature = "temperature";
                apiString.humidity = "humidity";
            } else if (p.temperature && !p.humidity && p.pressure) {
                xPin = 3; //BMP180
                apiString.temperature = "BMP_temperature";
                apiString.pressure = "BMP_pressure";
            } else if (p.temperature && p.humidity && p.pressure) {
                xPin = 11; //BME280
                apiString.temperature = "BME280_temperature";
                apiString.humidity = "BME280_humidity";
                apiString.pressure = "BME280_pressure";
            }

            const sensorPayloadMadavi = []
            if (payload.payload_fields.temperature) {
                sensorPayloadMadavi.push({
                    value_type: apiString.temperature || 'temperature',
                    value: payload.payload_fields.temperature.toString()
                });
            }
            if (payload.payload_fields.humidity) {
                sensorPayloadMadavi.push({
                    value_type: apiString.humidity || 'humidity',
                    value: payload.payload_fields.humidity.toString()
                });
            }
            if (payload.payload_fields.pressure) {
                sensorPayloadMadavi.push({
                    value_type: apiString.pressure || 'BMP_pressure',
                    value: payload.payload_fields.pressure.toString()
                });
            }

            if (xPin > 0 && xPin !== undefined) {
                /*log('apiData: ' + JSON.stringify({
                    deviceId: deviceId,
                    xPin: xPin,
                    sensorPayloadMadavi: sensorPayloadMadavi,
                    sensorPayloadLuftdaten: convertToLuftdatenPayload(sensorPayloadMadavi)
                }));*/
                sendData('https://api.luftdaten.info/v1/push-sensor-data/', convertToLuftdatenPayload(sensorPayloadMadavi), deviceId, xPin)
                sendData('https://api-rrd.madavi.de/data.php', sensorPayloadMadavi, deviceId, xPin)
            }
        })
    })
    .catch(function (err) {
        log(err)
        process.exit(1)
    })