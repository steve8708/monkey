({define:
    typeof define === "function" ? define :
    typeof module !== "undefined" ? function (name, fn) { module.exports = fn(); } :
    function (name, fn) { this.monkey = fn(); }.bind(this)
}).
define('monkey', function () {
  var options = options || {};
  var chrome = chrome || null;

  return {
    initialize: function () {
      this._bindChromeEvents();
      return this;
    },

    _bindChromeEvents: function () {
      if (chrome && chrome.extension) {
        chrome.extension.onMessage.addListener(function (request, sender, respond) {
          if (request.type == 'monkey.start')
            monkey.start();

          if (request.type == 'monkey.stop')
            monkey.stop();
        });
      }
    },

    _parseOptions: function (options) {
      var parse = function (string) {
        var response;
        try {
          response = JSON.parse(string);
        } catch (error) {
          response = null;
        }

        return response;
      };

      var prepare = function (string) {
        return string.replace(/\s/g, '').split(',');
      };

      var obj = {
        showClick: parse(options.showClick),
        delay: parse(options.delay),
        limit: parse(options.limit),
        is: prepare(options.is),
        not: prepare(options.not),
        notParents: prepare(options.notParents),
        disableTransition: parse(options.disableTransition)
      };

      return obj;
    },

    setOptions: function (options) {
      for (var key in options)
        this[key] = options[key];
    },

    setup: function () {
      this.evaluate(this._setup);
    },

    evaluate: function (fn, context) {
      if (chrome && chrome.extension)
        this._injectChrome(fn);
      else
        fn.call(context || this);
    },

    _injectChrome: function (fn) {
      var script = fn.toString();
      // Send message to background.js using chrome messaging api
      // Inject our js into the document
      var js = document.createElement('script');
      var path = 'src/injected-scripts/inject-options.js';
      js.type = 'text/javascript';
      js.async = true;
      js.id = "monkey-injected-options";
      js.innerHTML = '(' + script + ')()';
      document.getElementsByTagName('head')[0].appendChild(js);
      // Don't pollute the html - remove this tag once script evaluates
      setTimeout(function () { js.parentNode.removeChild(js); }, 10);
    },

    cleanup: function () {
      this.evaluate(this._cleanup);
    },

    _cleanup: function () {
      window._isTester = false;
      window.alert = window._alert;
      window.open = window._open;
      window.onerror = window._onerror;
      $(document.body).attr('data-transition', 'true');
    },

    // TODO: why is this not working?
    _setup: function (disableTransition) {
      window._isTester = true;

      window._alert = window.alert;
      window.alert = function () {};

      window._open = window.open;
      window.open = function () {
        var obj = {};
        for (var key in window)
          obj[key] = function () {};
        return obj;
      };

      window._onerror = window.onerror;
      window.onerror = function () {
        if (_onerror) _onerror();
        window._alert('ERROR: ' + [].join.call(arguments, ' '));
      };

      // $(document).on('click', 'a', function (e) { e.preventDefault(); });
    },

    stop: function () {
      this._stop = true;
      this.cleanup();
    },

    onerror: function () {},

    start: function (dontReset) {
      this.stop();
      this.removeDot();
      this.setup();
      if (!dontReset) this._count = 0;

      var self = this;
      if (chrome && chrome.extension) {
        chrome.extension.sendMessage({get: 'options'}, function (response) {
          self.setOptions(self._parseOptions(response.options));
          self._start();
        });
      } else {
        this._start();
      }
    },

    // TODO: rename this not so ugly
    _start: function () {
      $(document.body).attr('data-transition', (!this.disableTransition).toString());
      if (options.setup) options.setup();
      this._stop = false;
      this.monkey();
    },

    disableTransition: true,
    showClick: true,
    delay: 100,
    limit: 200,
    _count: 0,

    is: 'a',
    not: ['script', '[data-next-button=logout]'],
    notParents: ['[data-stage=right]', '[data-stage=left]',
      '[data-stage=up]', '[data-next-button=logout]', 'script'],

    hasParents: ['body'],

    dot: '<div style="width: 40px; height: 40px; border-radius: 100px;' +
      'background-color: rgba(255, 100, 100, 0.8);' +
      'border-top: 2px solid rgba(255, 200, 200, 1);' +
      ' box-shadow: 0 0 5px rgba(0, 0, 0, 0.4); position: absolute; z-index: 9999; ' +
      'margin: -20px;"></div>',

    removeDot: function () {
      if (this.$dot)
        this.$dot.remove();
    },

    _click: function ($el) {
      var touch = $('html').is('.touch');

      if ($el.is('a') && !touch)
        var $div = $('<div></div>').appendTo($el).click().remove();
      else if (touch)
        $el.trigger('touchstart').trigger('touchend');
      else
        $el.click();
    },

    monkey: function () {
      this.removeDot();

      if (this._stop || this._count > this.limit)
        return this.stop();

      var notParents = this.notParents.join(',')
        , not = this.not.join(',')
        , selector = 'body ' + this.is + ':not(' + not + ')'
        , $el = $(selector)
        , len = $el.length
        , random = Math.floor(Math.random() * len)
        , $button = $el.eq(random)
        , offset = $button.offset()
        , width = $button.width()
        , height = $button.height()
        , top = offset.top + (height / 2)
        , left = offset.left + (width / 2);

      if ($button.parents(notParents).length > 0)
        return this.monkey();

      this.$dot = $(this.dot);
      if (this.showClick)
        this.$dot.css({top: top, left: left}).appendTo(document.body);

      this._click($button);

      var self = this;
      setTimeout(function () {
        self._count++;
        self.monkey();
      }, this.delay);
    }
  };
});
