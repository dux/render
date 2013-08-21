(function() {

  $.extend({
    cachedScript: function(url, options) {
      if (typeof options === "function") {
        options = {
          success: options
        };
      }
      options = $.extend(options || {}, {
        crossDomain: true,
        dataType: "script",
        cache: true,
        url: url
      });
      return $.ajax(options);
    },
    speed: function() {
      var _this = this;
      this.time = $.now();
      return function() {
        var ms;
        ms = ("" + ($.now() - _this.time)).replace(/(\d)(\d{3})$/, '$1.$2');
        return "(" + ms + " ms)";
      };
    }
  });

  $.fn.extend({
    exportByAttr: function(name, func) {
      return this.find("*[" + name + "]").each(function() {
        var el, val;
        el = $(this);
        val = el.attr(name);
        func(el, val);
        return el;
      });
    },
    serializeHash: function() {
      var els, hash, stringKey;
      stringKey = function(key, value) {
        var beginBracket, hash, newKey, newValue;
        beginBracket = key.lastIndexOf("[");
        if (beginBracket === -1) {
          hash = {};
          hash[key] = value;
          return hash;
        }
        newKey = key.substr(0, beginBracket);
        newValue = {};
        newValue[key.substring(beginBracket + 1, key.length - 1)] = value;
        return stringKey(newKey, newValue);
      };
      hash = {};
      els = $(this).find(":input").get();
      $.each(els, function() {
        var val;
        if (this.name && !this.disabled && (this.checked || /select|textarea/i.test(this.nodeName) || /hidden|text|search|tel|url|email|password|datetime|date|month|week|time|datetime-local|number|range|color/i.test(this.type))) {
          val = $(this).val();
          return $.extend(true, hash, stringKey(this.name, val));
        }
      });
      return hash;
    }
  });

  this.Render = {
    is_link: function(data) {
      if (/^http/.test(data)) return true;
      if (/^\//.test(data)) return true;
      return false;
    },
    scope: function(node) {
      return $(node).closest('.render-box').data('scope');
    },
    to: function(node, opts, data) {
      var script, speed, template,
        _this = this;
      opts.body = $(node);
      if (data) opts.data = data;
      opts.data || (opts.data = {});
      opts.node || (opts.node = {});
      opts.bind || (opts.bind = {});
      opts.script || (opts.script = []);
      opts.once || (opts.once = function() {
        return true;
      });
      opts.onchange || (opts.onchange = function() {
        return true;
      });
      template = opts.template;
      if (opts.script && typeof opts.script === 'string') {
        opts.script = [opts.script];
      }
      while (script = opts.script.shift()) {
        $.cachedScript(script, function() {
          return _this.to(opts.body, opts);
        });
        return;
      }
      if (typeof template === 'function') template = template(opts.data);
      if (typeof template === 'object' || /^#\w/.test(template)) {
        template = $(template).html();
      } else if (this.is_link(template)) {
        opts.__template = template;
        speed = $.speed();
        $.get(template, function(ret) {
          console.log("Render ajax GET " + (speed()) + ": " + template);
          opts.template = ret;
          return _this.to(opts.body, opts);
        });
        return;
      }
      if (!template) {
        template = opts.template = node.html();
        node.show();
      }
      opts.template = opts.template.replace(/\$scope\./g, 'Render.scope(this).');
      opts.set = function(key, val) {
        opts.data[key] = val;
        node = this.node[key];
        if (typeof node === 'object') {
          if (['TEXTAREA', 'INPUT', 'SELECT'].indexOf(node[0].nodeName) > -1) {
            node.val(val);
          } else {
            node.html(val);
          }
        }
        opts.onchange();
        return Render.onchange_default(opts);
      };
      return this.render(opts);
    },
    render: function(opts) {
      var first_node,
        _this = this;
      opts.body.html("<div class='render-box'>" + opts.template + "</div>");
      first_node = opts.body.find('div').first();
      if (opts.__template) opts.template = opts.__template;
      first_node.data('scope', opts);
      opts.refresh = function() {
        return Render.refresh(first_node);
      };
      opts.body.exportByAttr('bind', function(node, bind_var) {
        var keys, node_name;
        node_name = node[0].nodeName.toLowerCase();
        keys = bind_var.split('-', 2);
        bind_var = keys.shift();
        if (bind_var === 'data' || bind_var === 'template' || bind_var === 'bind' || bind_var === 'once' || bind_var === 'onchange' || bind_var === 'node' || bind_var === 'script') {
          alert("Render error: [" + bind_var + "] for bind= is reserved word");
          return;
        }
        opts.node[bind_var] = node;
        if (node_name === 'button') {
          return node.on('click', function() {
            opts.set(bind_var, keys[0]);
            if (opts.bind[bind_var]) {
              return opts.bind[bind_var].apply(opts, [node, keys[0]]);
            }
          });
        } else if (node_name === 'input' || node_name === 'textarea') {
          if (node[0].type === 'checkbox') {
            node.after("<input style='display:none;' name='" + bind_var + "' />");
            return node.on('click', function() {
              opts.set(bind_var, node[0].checked);
              return node.next().val(node[0].checked ? 1 : 0);
            });
          } else {
            opts.data[bind_var] = node.val();
            node.on('keyup', function() {
              return opts.set(bind_var, node.val());
            });
            if (opts.bind[bind_var]) {
              node.on('focus', function() {});
              if (opts.bind[bind_var]) {
                return opts.bind[bind_var].apply(opts, [node, keys[0]]);
              }
            }
          }
        } else if (node_name === 'form') {
          return node.on('submit', function() {
            if (opts.bind[bind_var]) {
              opts.bind[bind_var].apply(opts, [node, node.serializeHash()]);
            }
            _this.onchange_default(opts);
            return false;
          });
        }
      });
      opts.once();
      opts.onchange();
      return this.onchange_default(opts);
    },
    onchange_default: function(opts) {
      var key, node, _ref, _ref2,
        _this = this;
      _ref = opts.node;
      for (key in _ref) {
        node = _ref[key];
        if ((_ref2 = node[0].nodeName) === 'TEXTAREA' || _ref2 === 'INPUT' || _ref2 === 'SELECT') {
          node.val(opts.data[key]);
        } else {
          node.html(opts.data[key]);
        }
      }
      return opts.body.exportByAttr('if', function(node, bind_var) {
        var bind_val, display_now, inverse;
        inverse = false;
        bind_var = bind_var.replace(/\s+/g, '').split('!');
        if (bind_var[1]) {
          inverse = true;
          bind_var = bind_var[1];
        }
        bind_val = opts.data[bind_var];
        (function() {
          if (typeof bind_val === 'object' && bind_val.length > 0) {
            return node.show();
          }
          if (bind_val) return node.show();
          return node.hide();
        })();
        display_now = node.css('display');
        if (inverse) {
          return node.css({
            display: display_now === 'block' ? 'none' : 'block'
          });
        }
      });
    },
    refresh: function(node) {
      var opts, root;
      root = $(node).closest('.render-box');
      opts = root.data('scope');
      return root.parent().render(opts);
    }
  };

  $.fn.render = function(opts, data) {
    Render.to(this, opts, data);
    return this;
  };

}).call(this);
