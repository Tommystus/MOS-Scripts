/*
	Temp control using DS18B20 OneWire temperature sensor

	Data --> D4
	Cntr --> D8

*/

load('api_rpc.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_timer.js');
load('api_arduino_onewire.js');
load('api_arduino_dallas_temp.js');
load('api_net.js');

let netReady = false;
let controlTemp = -1;

let tmsPin = 2;		// GPIO2 = D4 (blue LED #2) DS18B20
let ssrPin = 15; 	// GPIO15 (D8) (has pulldown)

GPIO.set_mode(ssrPin, GPIO.MODE_OUTPUT);
GPIO.write(ssrPin, 0);	// 1 enable driver

let ow = OneWire.create(tmsPin);
let dt = DallasTemperature.create(ow);
dt.begin();

let dsRom = [];
let dsDeviceCnt = 0;

let searchForDevice = function() {

    dsDeviceCnt = dt.getDeviceCount();
	print('**Found ', dsDeviceCnt, ' sensor');

    for (let n = 0; n < dsDeviceCnt; n++) {
		dsRom[n] = '01234567';
		if (dt.getAddress(dsRom[n], n) === 1) {
			print( '**Sensor', n, dt.toHexStr(dsRom[n]));
		}
	}
};

Event.addGroupHandler(Net.EVENT_GRP, function(ev, evdata, ud) {
	if (ev === Net.STATUS_DISCONNECTED) {
		netReady = false;
		print("** Net Discntd");
	} else if (ev === Net.STATUS_GOT_IP) {
		netReady = true;
		print("** Net Ready");
	}
}, null);


RPC.addHandler('ListSensor', function(args) {
	let da = [];
 	for (let i = 0; i < dsDeviceCnt; i++) {
		da[i] = {'idx':i, 'addr': dt.toHexStr(dsRom[i])};
	}
	let rs = {'deviceList' : da};
	return rs;
});

// call SetControlTemp '{"temp" : 136}'
RPC.addHandler('SetControlTemp', function(args) {
	let rs = JSON.stringify({'prevControlTemp' : controlTemp});
	if (((args.temp > 70) && (args.temp < 200)) || (args.temp < 0)) {
		controlTemp = args.temp;
	}
	return rs;
});

RPC.addHandler('GetTemp', function(args) {
	dt.requestTemperatures();
	let da = [];
 	for (let i = 0; i < dsDeviceCnt; i++) {
		let t = dt.getTempF(dsRom[i]);
		if (t === dt.DEVICE_DISCONNECTED_RAW) // bad read
			continue;
		da[i] = {'i' : i, 't' : t};
	}
	let rs = {'temperatureList' : da};
	return rs;
});


// try to search for devices
Timer.set(15000, true, function() {

	if (!netReady) {
		print("**Wait for wifi");
		return;
	}

//  Try to get a list of attached device sensors
	if (dsDeviceCnt === 0) {
		print('** Searching for OneWire DS18B20 devices **');
		searchForDevice();
	}
//  Quit if none is found
	if (dsDeviceCnt === 0) {
		print('**No device found');
		return;
	}
}, null);

searchForDevice();
