/* Mongoose OS Playground JavaScript for the browser
	Addapted from Paolo Manna git pmanna/mongoose_os_playground browser_rpc_service.js
*/

var platform = '';
var host = '';

var defCallBack = function(response) {
  if ((response) && (response.error)) {
	  alert(response.message);
  }
};

// Common call to RPC services on the board
function callRPCService(cmd, params, callback) {
  if (!callback) {
	  callback = defCallBack;
  }
  var xhttp = new XMLHttpRequest();
  
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      callback(this.response);
    }
  };
  
  xhttp.open('POST', 'rpc/' + cmd + '?' + new Date().getTime(), true);
  xhttp.responseType = 'json';
  xhttp.send(JSON.stringify(params));
}

// Discover which platform we're using, to enable/disable features
function startup() {
  callRPCService('Config.Get',{}, function(response) {
    if (response) {
      platform = response.device.id;
      console.log('Platform is: ' + platform);

      var mac_id = (response.device.id.split("_"))[1];

      host = mac_id + '.local';
      document.getElementById("hostname").innerHTML = host;
    }
  });
}

// Reboots the microcontroller
function rebootDevice() {
  callRPCService('Sys.Reboot',{delay_ms:500});
}

