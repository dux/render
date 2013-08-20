(function() {

  $.fn.extend({
    disable: function(data) {
      this[0].disabled = true;
      if (data) this.html(data);
      return this;
    },
    enable: function(data) {
      this[0].disabled = false;
      if (data) this.html(data);
      return this;
    }
  });

  this.Example = {
    basic: {
      title: 'Basic binding template, no code',
      render: {
        template: "<H3>URL bind</H3>\n<input bind='link' /><button class='btn'>Submit</button>\n<div if='link'>URL here</div><div if='! link'>NO URL</div></div>"
      }
    },
    basic2: {
      title: 'Simple code',
      render: {
        template: "<H3>URL bind</H3>\n<input bind='link' /><button class='btn' bind=\"btn\">Submit</button>",
        onchange: function() {
          if (!this.data.link) return this.node.btn.disable('Link is req');
          if (this.data.link.length < 5) {
            return this.node.btn.disable('Link shoud have at least 5 chrs');
          }
          return this.node.btn.enable('Submit');
        }
      }
    },
    timer: {
      title: 'Timer in ms with stop - start',
      render: {
        template: "<H3>Timer in ms</H3>\n<div><button bind=\"start\">Start</button><button bind=\"stop\">Stop</button></div>\n<div bind=\"time\"></div>",
        start_timer: function() {
          var _this = this;
          return this._timer = setInterval(function() {
            _this.node.time.html((new Date()).getTime());
            _this.node.start.disable();
            return _this.node.stop.enable();
          }, 100);
        },
        once: function() {
          return this.start_timer();
        },
        bind: {
          start: function() {
            return this.start_timer();
          },
          stop: function(node) {
            clearInterval(this._timer);
            this.node.start.enable();
            return this.node.stop.disable();
          }
        }
      }
    },
    todo: {
      title: 'To-do list',
      render: {
        template: "<h3>To to (<span bind=\"count\"></span>)</h3>\n<form bind=\"add_todo\">\n<input bind=\"todo\" />\n</form>\n<ul bind=\"out\"></ul>",
        data: {
          list: ['buy milk']
        },
        bind: {
          add_todo: function() {
            if (!this.data.todo) return;
            this.data.list.push(this.data.todo);
            return this.data.todo = '';
          }
        },
        onchange: function() {
          var el, ret, _i, _len, _ref;
          ret = [];
          _ref = this.data.list;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            el = _ref[_i];
            ret.push("<li>" + el + "</li>");
          }
          this.data.out = ret.join("\n");
          return this.data.count = this.data.list.length;
        }
      }
    },
    markdown: {
      title: 'Preload Javascript and render markdown',
      render: {
        script: 'https://raw.github.com/evilstreak/markdown-js/master/lib/markdown.js',
        template: "<h3>Markdown data</h3>\n<textarea bind=\"md_data\" style=\"width:96%; height:100px;\"></textarea>\n<h4>Preview</h4>\n<div bind=\"md_prev\" style=\"background:#eee;padding:5px;\"></div>",
        onchange: function() {
          var markdown_text;
          markdown_text = markdown.toHTML(this.data.md_data);
          return this.data.md_prev = markdown_text;
        }
      }
    }
  };

  $(function() {
    var key, node, val;
    for (key in Example) {
      val = Example[key];
      node = $("#render-" + key);
    }
    return $('xmp').each(function() {
      var data, tpl;
      node = $(this);
      node.html(node.html().replace(/^\s+/, "  ").replace(/\n\s{14}/g, "\n"));
      tpl = node.attr('template');
      data = Example[tpl];
      if (!tpl) return;
      node.html("$(node).render\n" + node.html());
      node.before("<hr><h2>" + data.title + "</h2>");
      return node.after('<div class="box" />').next().render(data.render);
    });
  });

}).call(this);