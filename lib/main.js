if (typeof PageQuery == "undefined") {
  // The PageQuery plugin namespace

  var PageQuery = {
    init: function () {
      // The initialization method

      PageQuery.config = {};
      PageQuery.config.notifications = require("sdk/notifications");
      PageQuery.config.prefs = require("sdk/simple-prefs").prefs;
      PageQuery.config.pageWorkers = require("sdk/page-worker");
      PageQuery.config.this = require("sdk/self");
      PageQuery.config._ = require("sdk/l10n").get;
      PageQuery.config.messages = {
        configurationError: PageQuery.config._("configuration_error"),
        notConfigured: PageQuery.config._("not_configured"),
        invalidUrl: PageQuery.config._("invalid_url"),
        noDataError: PageQuery.config._("no_data_error"),
        responseTitle: PageQuery.config._("response_title")
      };

      // Create a toolbar action button
      var { ActionButton } = require("sdk/ui/button/action");
      PageQuery.config.button = ActionButton({
          id: "pq-button",
          label: "PageQuery",
          icon: {
            "16": "./pagequery-16.png",
            "32": "./pagequery-32.png",
            "64": "./pagequery-64.png"
          },
          onClick: PageQuery.actionButtonClick
      });
    },
    actionButtonClick: function (state) {
      // The click handler for the toolbar action button

      var url = PageQuery.config.prefs["extensions.pageQuery.pqUrl"] || '';
      var code = PageQuery.config.prefs["extensions.pageQuery.pqCode"] || '';

      PageQuery.disableButtonForThisWindow();

      if (PageQuery.isEmpty(url) || PageQuery.isEmpty(code)) {
        PageQuery.showNotification(
          PageQuery.config.messages.notConfigured, 
          PageQuery.config.messages.configurationError
        );
      }
      else if (!PageQuery.isHttpUrl(url)) {
        PageQuery.showNotification(
          PageQuery.config.messages.invalidUrl, 
          PageQuery.config.messages.configurationError
        );
      }
      else {
        PageQuery.invokePageWorker(url, code);
      }
    },
    invokePageWorker: function (url, code) {
      // Invoke and execute the code on the specified URL via a worker

      // The one-liner execution code
      var script = 'try {' +
      ' var result = '+ code +';' +
      '} catch (e) {' +
      ' self.postMessage(e.toString());' +
      '}' +
      'if (result) {' +
      ' self.postMessage(result);' +
      '}' +
      'else {' +
      ' self.postMessage("'+ PageQuery.config.messages.noDataError +'");' +
      '}';

      // Invoke URL with jQuery and configured oneliner
      PageQuery.config.pageWorkers.Page({
        contentURL: url,
        contentScriptFile: PageQuery.config.this.data.url('jquery.min.js'),
        contentScript: script,
        contentScriptWhen: "ready",
        onMessage: function(message) {
          PageQuery.showNotification(message);
        }
      });
    },
    showNotification: function (data, title) {
      // Show the notifications

      title = title || PageQuery.config.messages.responseTitle;
      PageQuery.config.notifications.notify({
        title: title,
        text: data,
        iconURL: PageQuery.config.this.data.url("pagequery-16.png")
      });

      PageQuery.enableButtonForThisWindow();
    },
    disableButtonForThisWindow: function () {
      // Disable the action button
      
      PageQuery.config.button.state("window", {
        disabled: true
      });  
    },
    enableButtonForThisWindow: function () {
      // Enable the action button

      PageQuery.config.button.state("window", {
        disabled: false
      });
    },
    isEmpty: function (string) {
      // Check if the string is blank

      return (string.length === 0 || !string.trim());
    },
    isHttpUrl: function (string) {
      // Check if the string is a HTTP(S) URL

      return (new RegExp("^https?:\/\/.*", "i")).test(string);
    }
  };

  // Initialize the plugin
  PageQuery.init();
}