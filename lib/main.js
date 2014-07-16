var { ActionButton } = require("sdk/ui/button/action");
var notifications = require("sdk/notifications");
var prefs = require("sdk/simple-prefs").prefs;
var pageWorkers = require("sdk/page-worker");
var self = require("sdk/self");

// Create a toolbar action button
var button = ActionButton({
    id: "pq-button",
    label: "PageQuery",
    icon: {
      "16": "./pagequery-16.png",
      "32": "./pagequery-32.png"
    },
    onClick: function(state) {
      var url = prefs.pqUrl || '';
      var code = prefs.pqCode || '';

      if (url == '' || code == '') {
        showNotification("Error: Please configure PageQuery from Addons > Extensions > PageQuery > Options");
      }
      else {
        invokePageWorker(url, code);
      }
    }
});

// Show the notifications
function showNotification(data) {
  notifications.notify({
    title: "PageQuery Response",
    text: data
  });      
}

// Invode and execute the code on the specified URL via a worker
function invokePageWorker(url, code) {
  var script = 'var result = '+ code +';'+
               'if (result != undefined && result != "") {'+
               '   postMessage(result);'+
               '}'+
               'else {'+
               '   postMessage("Error: Nothing to show!");'+
               '}';

  pageWorkers.Page({
    contentURL: url,
    contentScriptFile: self.data.url('jquery.min.js'),
    contentScript: script,
    contentScriptWhen: "ready",
    onMessage: function(message) {
      showNotification(message);
    }
  });
}