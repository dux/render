# Released under MIT license
# Copyright (c) 2013 Dino Reic (@dux)
# https://github.com/dux/render

# $(node).render(opts, data)
# Render.to(node, opts, data)
#  node: '#node' || [DOM object] || [jQuery object]
#  opts:
#    template
#      #data           : takes .html()
#      /ajax.html      : $.get and render
#      f(data) {}      : $.get and render
#      <div>blah</div>
#    script: [scripts to preload]     
#    bind:
#      el_on_state_change:(node, value) ->
#         function data        
#    data:
#
#  data: { el1:1, el2:2, ... }
#

# useful jQuery plugins
$.extend
  cachedScript: (url, options) ->
    if typeof(options) == "function"
      options = 
        success:options

    options = $.extend options or {},
      crossDomain: true
      dataType: "script"
      cache: true
      url: url
    
    $.ajax options

$.fn.extend
  exportByAttr: (name, func) ->
    this.find("*[#{name}]").each ->
      el = $ this
      val = el.attr(name)
      func(el, val)
      el

  serializeHash: ->
    stringKey = (key, value) ->
      beginBracket = key.lastIndexOf("[")
      if beginBracket is -1
        hash = {}
        hash[key] = value
        return hash
      newKey = key.substr(0, beginBracket)
      newValue = {}
      newValue[key.substring(beginBracket + 1, key.length - 1)] = value
      stringKey newKey, newValue
    hash = {}
    els = $(this).find(":input").get()
    $.each els, ->
      if @name and not @disabled and (@checked or /select|textarea/i.test(@nodeName) or /hidden|text|search|tel|url|email|password|datetime|date|month|week|time|datetime-local|number|range|color/i.test(@type))
        val = $(this).val()
        $.extend true, hash, stringKey(@name, val)

    hash

@Render = 
  is_link: (data) ->
    return true if /^http/.test(data)
    return true if /^\//.test(data)
    false

  scope: (node) ->
    $(node).closest('.render-box').data('scope')

  to: (node, opts, data) ->
    opts.body     = $ node
    opts.data     = data if data
    opts.data     ||= {}
    opts.node     ||= {}
    opts.bind     ||= {}
    opts.script   ||= []
    opts.once     ||= -> true
    opts.onchange ||= -> true
    template = opts.template

    # script: '...' to script: ['...']
    if opts.script && typeof opts.script == 'string'
      opts.script= [opts.script]

    # load all scripts and then execute widget
    while script = opts.script.shift()
      $.cachedScript script, =>
        @to(opts.body, opts)
      return

    # execute template if it is function, pass data
    if typeof(template) == 'function'
      template = template(opts.data)

    # if template is object, extract data
    if typeof(template) == 'object' || /^#\w/.test(template)
      template = $(template).html()
    
    # if it is a link, ajax get
    else if @is_link(template)
      $.get template, (ret) =>
        opts.template = ret
        @to(opts.body, opts)
      return

    # if everything else fails, extract template from target and show it
    unless template
      template = opts.template = node.html()
      node.show()

    template = template.replace(/\$scope\./g,'Render.scope(this).')

    opts.set = (key, val) ->
      opts.data[key] = val
      node = @node[key]
      if typeof node == 'object'
        if ['TEXTAREA', 'INPUT', 'SELECT'].indexOf(node[0].nodeName) > -1
          node.val val
        else
          node.html val
      
      opts.onchange()
      Render.onchange_default(opts)

    @render opts


  render: (opts)->

    opts.body.html "<div class='render-box'>#{opts.template}</div>"
    opts.body.find('div').first().data('scope', opts)

    opts.body.exportByAttr 'bind', (node, bind_var) =>
      node_name = node[0].nodeName.toLowerCase()
      keys = bind_var.split('-', 2)
      bind_var = keys.shift()
      
      if ['data', 'template', 'bind', 'once', 'onchange','node', 'script'].indexOf(bind_var) > -1
        alert "Render error: [#{bind_var}] for bind= is reserved word"
        return

      opts.node[bind_var] = node

      if node_name == 'button'
        node.on 'click', =>
          opts.set bind_var, keys[0]
          opts.bind[bind_var].apply(opts, [node, keys[0]]) if opts.bind[bind_var]
      else if node_name == 'input' || node_name == 'textarea'
        if node[0].type == 'checkbox'
          node.after("<input style='display:none;' name='#{bind_var}' />")
          node.on 'click', ->
            opts.set bind_var, node[0].checked
            node.next().val if node[0].checked then 1 else 0
        else
          opts.data[bind_var] = node.val()
          node.on 'keyup', ->
            opts.set bind_var, node.val()
          if opts.bind[bind_var]
            node.on 'focus', ->
            opts.bind[bind_var](node, keys[0]) if opts.bind[bind_var]
      else if node_name == 'form'
        node.on 'submit', =>
          opts.bind[bind_var].apply(opts, [node, node.serializeHash()]) if opts.bind[bind_var]
          @onchange_default(opts)
          false

    opts.once()
    opts.onchange()
    @onchange_default(opts)


  onchange_default: (opts) ->
    for key,node of opts.node
      if ['TEXTAREA', 'INPUT', 'SELECT'].indexOf(node[0].nodeName) > -1
        node.val opts.data[key]
      else
        node.html opts.data[key]

    opts.body.exportByAttr 'if', (node, bind_var) =>
      inverse = false
      bind_var = bind_var.replace(/\s+/g,'').split('!')
      if bind_var[1]
        inverse = true
        bind_var = bind_var[1]
      
      bind_val = opts.data[bind_var]
      (=>
        return node.show() if typeof bind_val == 'object' && bind_val.length > 0
        return node.show() if bind_val
        node.hide()
      )()
      display_now = node.css('display')
      node.css(display:if display_now == 'block' then 'none' else 'block') if inverse


  refresh: (node) ->
    root = $(node).closest('.render-box')
    opts = root.data('scope')
    root.parent().render(opts)

$.fn.render = (opts, data) ->
  Render.to(this, opts, data)
  this

