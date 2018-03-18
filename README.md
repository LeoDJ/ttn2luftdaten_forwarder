Forked from [cinezaster/ttn2luftdaten_forwarder](https://github.com/Cinezaster/ttn2luftdaten_forwarder).
# ttn2luftdaten_forwarder
Forwards data from ttn nodes to luftdaten and madavi.

[On docker hub](https://hub.docker.com/r/leodj/ttn2luftdaten_forwarder/)

## Requirements
1. Knowledge how to work with docker and have it installed.
2. Have a Lora Wan node sending PM10 and PM2.5 to the TheThingsNetwork.
3. You need to have a TTN application configured and your sensor Node (Device) connected to it. You'll need the "Application ID" which you can find in the yellow/orange box in the https://console.thethingsnetwork.org/applications page and you'll need the access key which you find at the bottom of the https://console.thethingsnetwork.org/applications/###yourapplicationID### page. (The default key will do)
4. You need to decide a prefix. Preferably starting with TTN and ending with a place code. For example: TTNBXL = TheThingsNetworkBrussels
5. Your TTN application should output a json object like this
``` {"pm10":19,"pm25":18,"temperature":16,"humidity":74}```
temperature and humidity are not required. You can achief this by writing a decoder function at this page: https://console.thethingsnetwork.org/applications/###yourapplicationID###/payload-formats that returns an object with the given properties.

### TTN Decoder example
When using a struct like described in the [opendataHN LoRa_Feinstaub code](https://github.com/opendata-heilbronn/Lora/blob/master/LoRa_Feinstaub_SDS011/src/main.cpp#L12).

The TTN Decoder code: [GitHub Gist](https://gist.github.com/LeoDJ/441c4e6678a568afe1e165d80c58f3f6).

### Run
Fill in the xxx parts
#### Docker Run Command
```
docker run --env appID=xxx --env accessKey=xxx  --env prefix=xxx leodj/ttn2luftdaten_forwarder:latest
```
#### Docker Compose
```
version: '3'
services:
    ttn2luftdaten_forwarder:
        environment:
            - appID=xxx
            - accessKey=xxx
            - prefix=xxx
        image: 'leodj/ttn2luftdaten_forwarder:latest'
```

## Luftdaten API "documentation"
The so called "documentation" for the Luftdaten API can be found [here](https://github.com/opendata-stuttgart/meta/wiki/APIs).