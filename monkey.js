({define:
  typeof define === "function" ? define :
  typeof module !== "undefined" ? function (name, fn) { module.exports = fn(); } :
  function (name, fn) { this.monkey = fn(); }.bind(this)
}).
define('monkey', function () {
  var chrome = chrome || null;

  var monkey = {
    initialize: function () {
      this.bindMessageListeners();
      return this;
    },

    options: {
      disableTransition: true,
      showClick: true,
      delay: 100,
      limit: 200,
      _count: 0,
      stopOnError: false,
      overlayErrors: true,

      is: 'a',
      not: ['script', '[data-next-button=logout]'],
      hasParents: ['body'],
      notParents: ['[data-stage=right]', '[data-stage=left]',
        '[data-stage=up]', '[data-next-button=logout]', 'script'],

      dot: '<div style="width: 40px; height: 40px; border-radius: 100px;' +
           'position: absolute; z-index: 9999; margin: -20px;' +
           'border-top: 2px solid rgba(255, 200, 200, 1);' +
           'background-color: rgba(255, 100, 100, 0.8);' +
           'box-shadow: 0 0 5px rgba(0, 0, 0, 0.4);">'
    },

    bindMessageListeners: function () {
      var self = this;
      window.addEventListener('message', function (event) {
        if (event.data.type && event.data.type === 'monkey')
          self[event.data.command](event.data.options);
      });
    },

    setOptions: function (options) {
      for (var key in options)
        this.options[key] = options[key];
    },

    evaluate: function (fn, context) {
      fn.call(context || this);
    },

    cleanup: function () {
      window._isTester = false;
      window.alert = this._alert;
      window.open = this._open;
      window.onerror = this._onerror;
      $(document.body).attr('data-transition', 'true');
    },

    // TODO: why is this not working?
    setup: function () {
      window._isTester = true;

      window.alert = function () {};

      window.open = function () {
        var obj = {};
        for (var key in window)
          obj[key] = function () {};
        return obj;
      };

      window.onerror = function () {
        if (monkey.onerror) monkey.onerror.apply(monkey, arguments);
      };

      if (this.options.preventRedirect)
        $(document).on('click', 'a', function (e) { e.preventDefault(); });

      var transition = (!this.options.disableTransition).toString();
      $(document.body).attr('data-transition', transition);

      if (this.$overlayContainer)
        this.$overlayContainer.remove();
    },

    stop: function () {
      this._stop = true;
      this.cleanup();
    },

    onerror: function () {
      if (this.options.stopOnError)
        this.stop();

      if (this.options.overlayErrors) {
        if (!this.$overlayContainer || !this.$overlayContainer.is(':visible')) {
          this.$overlayContainer =
            $('<div style="overflow: scroll; position: fixed; top: 0;' +
            'left: 0; bottom: 0; right: 0; background-image:' +
            '-webkit-radial-gradient(circle, rgba(0, 0, 0, 0.5),rgba(0, 0, 0, 0.6));' +
            '-webkit-overflow-scrolling: touch;' +
            'color: white; box-sizing: border-box; padding: 50px;' +
            'z-index: 999999999">')
            .appendTo('body').on('click', function () { $(this).remove(); });
        }

        if (!this.$overlay || !this.$overlay.is(':visible'))
          $('<pre style="color: white;">')
            .appendTo(this.$overlayContainer);

        this.$overlay.append(JSON.stringify([].slice.call(arguments), null, 2) + '\n');
      }
    },

    start: function (options) {
      this.stop();
      this.removeDot();
      this.setup();
      if (options && options.setup) options.setup();
      this._stop = false;

      if (options) this.setOptions(options);

      this.touch = $('html').is('.touch');
      this._count = 0;

      this.monkey();
    },

    removeDot: function () {
      if (this.$dot)
        this.$dot.remove();
    },

    monkey: function () {
      this.removeDot();

      if (this._stop || this._count > this.limit)
        return this.stop();

      var opts = this.options;
      var notParents = opts.notParents.join(',')
        , not = opts.not.join(',')
        , selector = 'body ' + opts.is + ':not(' + not + ')'
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

      this.$dot = $(opts.dot);
      if (opts.showClick)
        this.$dot.css({top: top, left: left}).appendTo(document.body);

      if (this.touch)
        $button.trigger('touchstart').trigger('touchend');
      else
        $button.click();

      var self = this;
      setTimeout(function () {
        self._count++;
        self.monkey();
      }, opts.delay);
    }
  };

  return monkey.initialize();
});
