# ttn2luftdaten_forwarder
forwards data from ttn nodes to luftdaten and madavi

## Production

### build
You can run this forwarder via docker.
First build
```docker build .```
### Environment Variables
- accessKey: "ttn-account-v2...example..."
- appID: "..."
- prefix: "TTN + location code"

### Run
```docker run --env appID= --env accessKey=  --env prefix= imageID```
