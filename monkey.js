({define:
  // typeof define === "function" ? define :
  typeof module !== "undefined" ? function (name, fn) { module.exports = fn(); } :
  function (name, fn) { this.monkey = fn(); }.bind(this)
}).
define('monkey', function () {
  var options = options || {};
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

      is: 'a',
      not: ['script', '[data-next-button=logout]'],
      notParents: ['[data-stage=right]', '[data-stage=left]',
        '[data-stage=up]', '[data-next-button=logout]', 'script'],

      hasParents: ['body'],

      dot: '<div style="width: 40px; height: 40px; border-radius: 100px;' +
        'position: absolute; z-index: 9999; margin: -20px' +
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
      window.alert = window._alert;
      window.open = window._open;
      window.onerror = window._onerror;
      $(document.body).attr('data-transition', 'true');
    },

    // TODO: why is this not working?
    setup: function () {
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
        if (this.onerror) this.onerror();
      };

      if (this.options.preventRedirect)
        $(document).on('click', 'a', function (e) { e.preventDefault(); });

      var transition = (!this.options.disableTransition).toString();
      $(document.body).attr('data-transition', transition);

    },

    stop: function () {
      this._stop = true;
      this.cleanup();
    },

    onerror: function () {
      // window._alert('ERROR: ' + [].join.call(arguments, ' '));
    },

    start: function (options) {
      this.stop();
      this.removeDot();
      this.setup();
      if (options.setup) options.setup();
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
