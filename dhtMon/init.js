/*
	DHT22 temp test (max temp 80c 176F)

	Hardware hookup:

	.======. top
	|      | front view
	________
	1 2 3 4
	| | | |_GND
	| | |___nc
	| |_____Data (GPIO2 may need 10K pullup?)
	|_______VCC

*/

load('api_rpc.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_timer.js');
load('api_dht.js');
load('api_net.js');

let netReady = 0;
let sensPin = 2;	// GPIO2 = D4 (also blue LED #2) sensor pin

// Initialize DHT library
let dht = DHT.create(sensPin, DHT.DHT22);
// Loop and sample temperature every few seconds
Timer.set(5000, true, function() {

	if (!netReady) {
		return;
	}
//  Get sensor values
	let t = dht.getTemp();
	let h = dht.getHumidity();

	if (isNaN(h) || isNaN(t)) {
		print('Failed to read data from sensor');
		return;
	}

	print('Temperature:', t, '*C');
	print('Humidity:', h, '%');

	let topic = 'DHT22/D1';
	let msg = JSON.stringify({'Temperature' : t, 'Humidity' : h});
	if (netReady) {
		let ok = MQTT.pub(topic, msg);
		print('Published:', ok ? 'yes' : 'no', 'topic:', topic, 'msg:', msg);
	} else {
		print(topic, ' = ', msg);
	}

}, null);


// Monitor network connectivity.
Event.addGroupHandler(Net.EVENT_GRP, function(ev, evdata, ud) {
	if (ev === Net.STATUS_DISCONNECTED) {
		netReady = 0;
		print("** Net Discntd");
	} else if (ev === Net.STATUS_GOT_IP) {
		netReady = 1;
		print("** Net Ready");
	}
}, null);

RPC.addHandler('GetTH', function(args) {
	let t = dht.getTemp();
	let h = dht.getHumidity();

	if (isNaN(h) || isNaN(t)) {
		return "Unable to read sensor";
	}

	t = t*9/5 + 32; // convert to F
	return {'t' : t, 'h': h};
});


