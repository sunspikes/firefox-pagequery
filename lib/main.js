var { ActionButton } = require("sdk/ui/button/action");
var notifications = require("sdk/notifications");
var prefs = require("sdk/simple-prefs").prefs;
var pageWorkers = require("sdk/page-worker");
var self = require("sdk/self");

// Check if the string is blank
String.prototype.isEmpty = function() {
  return (this.length === 0 || !this.trim());
};

// Check if the string is a HTTP(S) URL
String.prototype.isHttpUrl = function() {
  return (new RegExp("^https?:\/\/.*", "i")).test(this);
}

// Create a toolbar action button
var button = ActionButton({
    id: "pq-button",
    label: "PageQuery",
    icon: {
      "16": "./pagequery-16.png",
      "32": "./pagequery-32.png",
      "64": "./pagequery-64.png"
    },
    onClick: function(state) {
      var url = prefs.pqUrl || '';
      var code = prefs.pqCode || '';

      disableButtonForThisWindow();

      if (url.isEmpty() || code.isEmpty()) {
        showNotification("Please configure PageQuery in Addons > Extensions > PageQuery > Options", "Configuration Error");
      }
      else if (!url.isHttpUrl()) {
        showNotification("Please configure a valid web URL in Options", "Configuration Error");
      }
      else {
        invokePageWorker(url, code);
      }
    }
});

// Invoke and execute the code on the specified URL via a worker
function invokePageWorker(url, code) {
  // The oneliner execution code
  var script = 'try {' +
               'var result = '+ code +';' +
               '} catch (e) {' +
               '  self.postMessage(e.toString());' +
               '}' +
               'if (result) {' +
               '  self.postMessage(result);' +
               '}' +
               'else {' +
               '  self.postMessage("Error: Nothing to show!");' +
               '}';

  // Invoke URL with jQuery and configured oneliner
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

// Show the notifications
function showNotification(data, title) {
  title = title || "Response";
  notifications.notify({
    title: title,
    text: data,
    iconURL: self.data.url("pagequery-16.png")
  });

  enableButtonForThisWindow();   
}

// Disable the action button
function disableButtonForThisWindow() {
  button.state("window", {
    disabled: true
  });
}

// Enable the action button
function enableButtonForThisWindow() {
  button.state("window", {
    disabled: false
  });
}

