(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],2:[function(require,module,exports){
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false Mustache: true*/

(function defineMustache (global, factory) {
  if (typeof exports === 'object' && exports && typeof exports.nodeName !== 'string') {
    factory(exports); // CommonJS
  } else if (typeof define === 'function' && define.amd) {
    define(['exports'], factory); // AMD
  } else {
    global.Mustache = {};
    factory(global.Mustache); // script, wsh, asp
  }
}(this, function mustacheFactory (mustache) {

  var objectToString = Object.prototype.toString;
  var isArray = Array.isArray || function isArrayPolyfill (object) {
    return objectToString.call(object) === '[object Array]';
  };

  function isFunction (object) {
    return typeof object === 'function';
  }

  /**
   * More correct typeof string handling array
   * which normally returns typeof 'object'
   */
  function typeStr (obj) {
    return isArray(obj) ? 'array' : typeof obj;
  }

  function escapeRegExp (string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
  }

  /**
   * Null safe way of checking whether or not an object,
   * including its prototype, has a given property
   */
  function hasProperty (obj, propName) {
    return obj != null && typeof obj === 'object' && (propName in obj);
  }

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  var regExpTest = RegExp.prototype.test;
  function testRegExp (re, string) {
    return regExpTest.call(re, string);
  }

  var nonSpaceRe = /\S/;
  function isWhitespace (string) {
    return !testRegExp(nonSpaceRe, string);
  }

  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  function escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap (s) {
      return entityMap[s];
    });
  }

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var equalsRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  /**
   * Breaks up the given `template` string into a tree of tokens. If the `tags`
   * argument is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. [ "<%", "%>" ]). Of
   * course, the default is to use mustaches (i.e. mustache.tags).
   *
   * A token is an array with at least 4 elements. The first element is the
   * mustache symbol that was used inside the tag, e.g. "#" or "&". If the tag
   * did not contain a symbol (i.e. {{myValue}}) this element is "name". For
   * all text that appears outside a symbol this element is "text".
   *
   * The second element of a token is its "value". For mustache tags this is
   * whatever else was inside the tag besides the opening symbol. For text tokens
   * this is the text itself.
   *
   * The third and fourth elements of the token are the start and end indices,
   * respectively, of the token in the original template.
   *
   * Tokens that are the root node of a subtree contain two more elements: 1) an
   * array of tokens in the subtree and 2) the index in the original template at
   * which the closing tag for that section begins.
   */
  function parseTemplate (template, tags) {
    if (!template)
      return [];

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace () {
      if (hasTag && !nonSpace) {
        while (spaces.length)
          delete tokens[spaces.pop()];
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var openingTagRe, closingTagRe, closingCurlyRe;
    function compileTags (tagsToCompile) {
      if (typeof tagsToCompile === 'string')
        tagsToCompile = tagsToCompile.split(spaceRe, 2);

      if (!isArray(tagsToCompile) || tagsToCompile.length !== 2)
        throw new Error('Invalid tags: ' + tagsToCompile);

      openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + '\\s*');
      closingTagRe = new RegExp('\\s*' + escapeRegExp(tagsToCompile[1]));
      closingCurlyRe = new RegExp('\\s*' + escapeRegExp('}' + tagsToCompile[1]));
    }

    compileTags(tags || mustache.tags);

    var scanner = new Scanner(template);

    var start, type, value, chr, token, openSection;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(openingTagRe);

      if (value) {
        for (var i = 0, valueLength = value.length; i < valueLength; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push([ 'text', chr, start, start + 1 ]);
          start += 1;

          // Check for whitespace on the current line.
          if (chr === '\n')
            stripSpace();
        }
      }

      // Match the opening tag.
      if (!scanner.scan(openingTagRe))
        break;

      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(equalsRe);
        scanner.scan(equalsRe);
        scanner.scanUntil(closingTagRe);
      } else if (type === '{') {
        value = scanner.scanUntil(closingCurlyRe);
        scanner.scan(curlyRe);
        scanner.scanUntil(closingTagRe);
        type = '&';
      } else {
        value = scanner.scanUntil(closingTagRe);
      }

      // Match the closing tag.
      if (!scanner.scan(closingTagRe))
        throw new Error('Unclosed tag at ' + scanner.pos);

      token = [ type, value, start, scanner.pos ];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        openSection = sections.pop();

        if (!openSection)
          throw new Error('Unopened section "' + value + '" at ' + start);

        if (openSection[1] !== value)
          throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        compileTags(value);
      }
    }

    // Make sure there are no open sections when we're done.
    openSection = sections.pop();

    if (openSection)
      throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);

    return nestTokens(squashTokens(tokens));
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens (tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      if (token) {
        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          squashedTokens.push(token);
          lastToken = token;
        }
      }
    }

    return squashedTokens;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens (tokens) {
    var nestedTokens = [];
    var collector = nestedTokens;
    var sections = [];

    var token, section;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      switch (token[0]) {
        case '#':
        case '^':
          collector.push(token);
          sections.push(token);
          collector = token[4] = [];
          break;
        case '/':
          section = sections.pop();
          section[5] = token[2];
          collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
          break;
        default:
          collector.push(token);
      }
    }

    return nestedTokens;
  }

  /**
   * A simple string scanner that is used by the template parser to find
   * tokens in template strings.
   */
  function Scanner (string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function eos () {
    return this.tail === '';
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function scan (re) {
    var match = this.tail.match(re);

    if (!match || match.index !== 0)
      return '';

    var string = match[0];

    this.tail = this.tail.substring(string.length);
    this.pos += string.length;

    return string;
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function scanUntil (re) {
    var index = this.tail.search(re), match;

    switch (index) {
      case -1:
        match = this.tail;
        this.tail = '';
        break;
      case 0:
        match = '';
        break;
      default:
        match = this.tail.substring(0, index);
        this.tail = this.tail.substring(index);
    }

    this.pos += match.length;

    return match;
  };

  /**
   * Represents a rendering context by wrapping a view object and
   * maintaining a reference to the parent context.
   */
  function Context (view, parentContext) {
    this.view = view;
    this.cache = { '.': this.view };
    this.parent = parentContext;
  }

  /**
   * Creates a new context using the given view with this context
   * as the parent.
   */
  Context.prototype.push = function push (view) {
    return new Context(view, this);
  };

  /**
   * Returns the value of the given name in this context, traversing
   * up the context hierarchy if the value is absent in this context's view.
   */
  Context.prototype.lookup = function lookup (name) {
    var cache = this.cache;

    var value;
    if (cache.hasOwnProperty(name)) {
      value = cache[name];
    } else {
      var context = this, names, index, lookupHit = false;

      while (context) {
        if (name.indexOf('.') > 0) {
          value = context.view;
          names = name.split('.');
          index = 0;

          /**
           * Using the dot notion path in `name`, we descend through the
           * nested objects.
           *
           * To be certain that the lookup has been successful, we have to
           * check if the last object in the path actually has the property
           * we are looking for. We store the result in `lookupHit`.
           *
           * This is specially necessary for when the value has been set to
           * `undefined` and we want to avoid looking up parent contexts.
           **/
          while (value != null && index < names.length) {
            if (index === names.length - 1)
              lookupHit = hasProperty(value, names[index]);

            value = value[names[index++]];
          }
        } else {
          value = context.view[name];
          lookupHit = hasProperty(context.view, name);
        }

        if (lookupHit)
          break;

        context = context.parent;
      }

      cache[name] = value;
    }

    if (isFunction(value))
      value = value.call(this.view);

    return value;
  };

  /**
   * A Writer knows how to take a stream of tokens and render them to a
   * string, given a context. It also maintains a cache of templates to
   * avoid the need to parse the same template twice.
   */
  function Writer () {
    this.cache = {};
  }

  /**
   * Clears all cached templates in this writer.
   */
  Writer.prototype.clearCache = function clearCache () {
    this.cache = {};
  };

  /**
   * Parses and caches the given `template` and returns the array of tokens
   * that is generated from the parse.
   */
  Writer.prototype.parse = function parse (template, tags) {
    var cache = this.cache;
    var tokens = cache[template];

    if (tokens == null)
      tokens = cache[template] = parseTemplate(template, tags);

    return tokens;
  };

  /**
   * High-level method that is used to render the given `template` with
   * the given `view`.
   *
   * The optional `partials` argument may be an object that contains the
   * names and templates of partials that are used in the template. It may
   * also be a function that is used to load partial templates on the fly
   * that takes a single argument: the name of the partial.
   */
  Writer.prototype.render = function render (template, view, partials) {
    var tokens = this.parse(template);
    var context = (view instanceof Context) ? view : new Context(view);
    return this.renderTokens(tokens, context, partials, template);
  };

  /**
   * Low-level method that renders the given array of `tokens` using
   * the given `context` and `partials`.
   *
   * Note: The `originalTemplate` is only ever used to extract the portion
   * of the original template that was contained in a higher-order section.
   * If the template doesn't use higher-order sections, this argument may
   * be omitted.
   */
  Writer.prototype.renderTokens = function renderTokens (tokens, context, partials, originalTemplate) {
    var buffer = '';

    var token, symbol, value;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      value = undefined;
      token = tokens[i];
      symbol = token[0];

      if (symbol === '#') value = this.renderSection(token, context, partials, originalTemplate);
      else if (symbol === '^') value = this.renderInverted(token, context, partials, originalTemplate);
      else if (symbol === '>') value = this.renderPartial(token, context, partials, originalTemplate);
      else if (symbol === '&') value = this.unescapedValue(token, context);
      else if (symbol === 'name') value = this.escapedValue(token, context);
      else if (symbol === 'text') value = this.rawValue(token);

      if (value !== undefined)
        buffer += value;
    }

    return buffer;
  };

  Writer.prototype.renderSection = function renderSection (token, context, partials, originalTemplate) {
    var self = this;
    var buffer = '';
    var value = context.lookup(token[1]);

    // This function is used to render an arbitrary template
    // in the current context by higher-order sections.
    function subRender (template) {
      return self.render(template, context, partials);
    }

    if (!value) return;

    if (isArray(value)) {
      for (var j = 0, valueLength = value.length; j < valueLength; ++j) {
        buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate);
      }
    } else if (typeof value === 'object' || typeof value === 'string' || typeof value === 'number') {
      buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate);
    } else if (isFunction(value)) {
      if (typeof originalTemplate !== 'string')
        throw new Error('Cannot use higher-order sections without the original template');

      // Extract the portion of the original template that the section contains.
      value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);

      if (value != null)
        buffer += value;
    } else {
      buffer += this.renderTokens(token[4], context, partials, originalTemplate);
    }
    return buffer;
  };

  Writer.prototype.renderInverted = function renderInverted (token, context, partials, originalTemplate) {
    var value = context.lookup(token[1]);

    // Use JavaScript's definition of falsy. Include empty arrays.
    // See https://github.com/janl/mustache.js/issues/186
    if (!value || (isArray(value) && value.length === 0))
      return this.renderTokens(token[4], context, partials, originalTemplate);
  };

  Writer.prototype.renderPartial = function renderPartial (token, context, partials) {
    if (!partials) return;

    var value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
    if (value != null)
      return this.renderTokens(this.parse(value), context, partials, value);
  };

  Writer.prototype.unescapedValue = function unescapedValue (token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return value;
  };

  Writer.prototype.escapedValue = function escapedValue (token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return mustache.escape(value);
  };

  Writer.prototype.rawValue = function rawValue (token) {
    return token[1];
  };

  mustache.name = 'mustache.js';
  mustache.version = '2.3.0';
  mustache.tags = [ '{{', '}}' ];

  // All high-level mustache.* functions use this writer.
  var defaultWriter = new Writer();

  /**
   * Clears all cached templates in the default writer.
   */
  mustache.clearCache = function clearCache () {
    return defaultWriter.clearCache();
  };

  /**
   * Parses and caches the given template in the default writer and returns the
   * array of tokens it contains. Doing this ahead of time avoids the need to
   * parse templates on the fly as they are rendered.
   */
  mustache.parse = function parse (template, tags) {
    return defaultWriter.parse(template, tags);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  mustache.render = function render (template, view, partials) {
    if (typeof template !== 'string') {
      throw new TypeError('Invalid template! Template should be a "string" ' +
                          'but "' + typeStr(template) + '" was given as the first ' +
                          'argument for mustache#render(template, view, partials)');
    }

    return defaultWriter.render(template, view, partials);
  };

  // This is here for backwards compatibility with 0.4.x.,
  /*eslint-disable */ // eslint wants camel cased function name
  mustache.to_html = function to_html (template, view, partials, send) {
    /*eslint-enable*/

    var result = mustache.render(template, view, partials);

    if (isFunction(send)) {
      send(result);
    } else {
      return result;
    }
  };

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  mustache.escape = escapeHtml;

  // Export these mainly for testing, but also for advanced usage.
  mustache.Scanner = Scanner;
  mustache.Context = Context;
  mustache.Writer = Writer;

  return mustache;
}));

},{}],3:[function(require,module,exports){
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['module', 'exports', './Panel'], factory);
    } else if (typeof exports !== "undefined") {
        factory(module, exports, require('./Panel'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod, mod.exports, global.Panel);
        global.DataPanel = mod.exports;
    }
})(this, function (module, exports, _Panel2) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _Panel3 = _interopRequireDefault(_Panel2);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    var DataPanel = function (_Panel) {
        _inherits(DataPanel, _Panel);

        _createClass(DataPanel, [{
            key: '_bindListeners',
            value: function _bindListeners() {
                var _this2 = this;

                var textValue = null;

                this._textarea.addEventListener('keyup', function () {
                    if (_this2.text !== textValue) {
                        textValue = _this2.text;
                        _this2.emit('change', textValue);

                        _this2.saveState();
                    }
                });
            }
        }, {
            key: '_createPanel',
            value: function _createPanel() {
                var templateStr = '\n            <div class="tools-panel tools-panel--column">\n                <h3 class="tools-panel__title">Data</h3>\n                <textarea class="tools-panel__textarea">{}</textarea>\n            </div>\n        ';
                var el = document.createElement('div');
                el.innerHTML = templateStr.trim();
                return el.firstChild;
            }
        }]);

        function DataPanel() {
            _classCallCheck(this, DataPanel);

            var _this = _possibleConstructorReturn(this, (DataPanel.__proto__ || Object.getPrototypeOf(DataPanel)).call(this));

            _this.name = 'DataPanel';
            _this._textarea = _this.el.querySelector('.tools-panel__textarea');

            _this._bindListeners();
            _this.readState();
            return _this;
        }

        _createClass(DataPanel, [{
            key: '_saveState',
            value: function _saveState() {
                return {
                    text: this.text
                };
            }
        }, {
            key: '_readState',
            value: function _readState(contents) {
                this._textarea.value = contents.text;
            }
        }, {
            key: 'json',
            get: function get() {
                return JSON.parse(this.text);
            }
        }, {
            key: 'text',
            get: function get() {
                return this._textarea.value;
            }
        }]);

        return DataPanel;
    }(_Panel3.default);

    exports.default = DataPanel;
    module.exports = exports['default'];
});

},{"./Panel":5}],4:[function(require,module,exports){
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['module', 'exports', './utils', './Panel'], factory);
    } else if (typeof exports !== "undefined") {
        factory(module, exports, require('./utils'), require('./Panel'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod, mod.exports, global.utils, global.Panel);
        global.DifferencePanel = mod.exports;
    }
})(this, function (module, exports, _utils, _Panel2) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _Panel3 = _interopRequireDefault(_Panel2);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    var _slicedToArray = function () {
        function sliceIterator(arr, i) {
            var _arr = [];
            var _n = true;
            var _d = false;
            var _e = undefined;

            try {
                for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
                    _arr.push(_s.value);

                    if (i && _arr.length === i) break;
                }
            } catch (err) {
                _d = true;
                _e = err;
            } finally {
                try {
                    if (!_n && _i["return"]) _i["return"]();
                } finally {
                    if (_d) throw _e;
                }
            }

            return _arr;
        }

        return function (arr, i) {
            if (Array.isArray(arr)) {
                return arr;
            } else if (Symbol.iterator in Object(arr)) {
                return sliceIterator(arr, i);
            } else {
                throw new TypeError("Invalid attempt to destructure non-iterable instance");
            }
        };
    }();

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    var DifferencePanel = function (_Panel) {
        _inherits(DifferencePanel, _Panel);

        _createClass(DifferencePanel, [{
            key: '_createPanel',
            value: function _createPanel() {
                var templateStr = '\n            <div class="tools-panel tools-panel--column">\n                <h3 class="tools-panel__title">Style difference</h3>\n                <label for="txtIgnore">Ignore keys: <input type="text" class="js-txtIgnore" /></label>\n                <div class="tools-panel__difference"></div>\n            </div>\n        ';
                var el = document.createElement('div');
                el.innerHTML = templateStr.trim();
                return el.firstChild;
            }
        }, {
            key: '_processIgnoreKeys',
            value: function _processIgnoreKeys(value) {
                this._ignoreKeys = new Set(value.split(', ').map(function (a) {
                    return a.trim();
                }));
            }
        }, {
            key: '_bindListeners',
            value: function _bindListeners() {
                var _this2 = this;

                this._ignore.addEventListener('input', (0, _utils.debounce)(function (e) {
                    _this2._processIgnoreKeys(e.target.value);
                    _this2.saveState();

                    if (_this2._lastCompared[0] !== null && _this2._lastCompared[1] !== null) {
                        _this2.compare(_this2._lastCompared[0], _this2._lastCompared[1]);
                    }
                }, 300));
            }
        }, {
            key: '_saveState',
            value: function _saveState() {
                return {
                    ignoreKeys: this._ignore.value
                };
            }
        }, {
            key: '_readState',
            value: function _readState(contents) {
                this._ignore.value = contents.ignoreKeys;
                this._processIgnoreKeys(contents.ignoreKeys);
            }
        }]);

        function DifferencePanel() {
            _classCallCheck(this, DifferencePanel);

            var _this = _possibleConstructorReturn(this, (DifferencePanel.__proto__ || Object.getPrototypeOf(DifferencePanel)).call(this));

            _this.name = 'DifferencePanel';
            _this._difference = _this.el.querySelector('.tools-panel__difference');
            _this._ignore = _this.el.querySelector('.js-txtIgnore');

            _this._ignoreKeys = new Set();
            _this._lastCompared = [null, null];

            _this._bindListeners();
            _this.readState();
            return _this;
        }

        _createClass(DifferencePanel, [{
            key: 'compare',
            value: function compare(beforePreview, afterPreview) {

                var beforeMap = new Map();
                var afterMap = new Map();
                var diffMap = new Map();

                var beforeNode = beforePreview.frame.contentWindow.document.body;
                var afterNode = afterPreview.frame.contentWindow.document.body;

                walkTree(beforeNode, beforeMap, this._ignoreKeys);
                walkTree(afterNode, afterMap, this._ignoreKeys);
                diffStyleMaps(beforeMap, afterMap, diffMap);

                this._difference.innerHTML = renderGroups(diffMap);
                this._lastCompared[0] = beforePreview;
                this._lastCompared[1] = afterPreview;
            }
        }]);

        return DifferencePanel;
    }(_Panel3.default);

    function diffStyles(before, after) {
        var diff = {};

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = before.keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var key = _step.value;

                if (before.get(key) !== after.get(key)) {
                    diff[key] = [before.get(key), after.get(key)];
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        return diff;
    }

    function diffStyleMaps(beforeMap, afterMap, diffMap) {
        var diff = null;
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = beforeMap.keys()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var mapKey = _step2.value;

                diff = diffStyles(beforeMap.get(mapKey), afterMap.get(mapKey));
                if (Object.keys(diff).length > 0) {
                    diffMap.set(mapKey, diff);
                }
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }
    }

    function copyComputedStyles(cssStyles, ignoreKeys) {
        var m = new Map();
        var i = 0;
        var len = cssStyles.length;
        var propertyKey = null;

        for (; i < len; i++) {
            propertyKey = cssStyles[i];
            if (ignoreKeys.has(propertyKey)) continue;
            m.set(propertyKey, cssStyles.getPropertyValue(propertyKey));
        }
        return m;
    }

    function getTagString(node) {
        var cls = '';
        if (node.classList.length > 0) {
            cls = '.' + node.classList.toString().trim().split(' ').join('.');
        }

        var id = '';
        if (node.hasAttribute('id')) {
            id = '#' + node.id;
        }

        return '' + node.tagName.toLowerCase() + id + cls;
    }

    function walkTree(domNode, styleMap, ignoreKeys) {
        var treewalker = document.createTreeWalker(domNode, window.NodeFilter.SHOW_ELEMENT);

        while (treewalker.nextNode()) {
            var node = treewalker.currentNode;
            if (node.nodeType !== 1) continue;

            styleMap.set(getTagString(node),
            // Copy the styles as a way of freezing the
            // computed styles
            copyComputedStyles(window.getComputedStyle(node), ignoreKeys));

            // :before
            styleMap.set(getTagString(node) + ':before', copyComputedStyles(window.getComputedStyle(node, ':before'), ignoreKeys));

            // :after
            styleMap.set(getTagString(node) + ':after', copyComputedStyles(window.getComputedStyle(node, ':after'), ignoreKeys));
        }
    }

    function renderGroup(diffKey, diffValues) {
        var tableRows = '';
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = Object.entries(diffValues)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var _step3$value = _slicedToArray(_step3.value, 2),
                    cssName = _step3$value[0],
                    cssChanges = _step3$value[1];

                tableRows = '\n            ' + tableRows + '\n            <tr>\n                <td>' + cssName + '</td>\n                <td class="diff-group__before">' + cssChanges[0] + '</td>\n                <td class="diff-group__after">' + cssChanges[1] + '</td>\n            </tr>\n        ';
            }
        } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                }
            } finally {
                if (_didIteratorError3) {
                    throw _iteratorError3;
                }
            }
        }

        return '\n    <div class="diff-group">\n        <h4 class="diff-group__title">' + diffKey + '</h4>\n        <table class="diff-group__table">\n            <thead>\n                <tr>\n                    <th>Name</th>\n                    <th>Before</th>\n                    <th>After</th>\n                </tr>\n            </thead>\n            <tbody>\n                ' + tableRows + '\n            </tbody>\n        </table>\n    </div>\n    ';
    }

    function renderGroups(diffMap) {
        var groupHTML = '';
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
            for (var _iterator4 = diffMap.entries()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var _step4$value = _slicedToArray(_step4.value, 2),
                    key = _step4$value[0],
                    value = _step4$value[1];

                groupHTML = groupHTML + '\n' + renderGroup(key, value);
            }
        } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                    _iterator4.return();
                }
            } finally {
                if (_didIteratorError4) {
                    throw _iteratorError4;
                }
            }
        }

        return groupHTML;
    }

    exports.default = DifferencePanel;
    module.exports = exports['default'];
});

},{"./Panel":5,"./utils":11}],5:[function(require,module,exports){
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['module', 'exports', 'eventemitter3'], factory);
    } else if (typeof exports !== "undefined") {
        factory(module, exports, require('eventemitter3'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod, mod.exports, global.eventemitter3);
        global.Panel = mod.exports;
    }
})(this, function (module, exports, _eventemitter) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _eventemitter2 = _interopRequireDefault(_eventemitter);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    var PANEL_COUNTER = 0;

    var Panel = function (_EventEmitter) {
        _inherits(Panel, _EventEmitter);

        _createClass(Panel, [{
            key: '_createPanel',
            value: function _createPanel() {
                return document.createElement('div');
            }
        }]);

        function Panel() {
            _classCallCheck(this, Panel);

            var _this = _possibleConstructorReturn(this, (Panel.__proto__ || Object.getPrototypeOf(Panel)).call(this));

            _this.counter = PANEL_COUNTER++;
            _this.name = 'Panel';
            _this.el = _this._createPanel();
            _this.statusBar = _this.el.querySelector('.tools-panel__status');
            _this.title = _this.el.querySelector('.tools-panel__title');
            return _this;
        }

        _createClass(Panel, [{
            key: 'setStatus',
            value: function setStatus(message) {
                this.statusBar.innerHTML = message;
            }
        }, {
            key: 'setTitle',
            value: function setTitle(title) {
                this.title.innerHTML = title;
            }
        }, {
            key: '_saveState',
            value: function _saveState() {
                return {};
            }
        }, {
            key: 'saveState',
            value: function saveState() {
                var contents = this._saveState();
                localStorage.setItem(this.name, JSON.stringify(contents));
            }
        }, {
            key: '_readState',
            value: function _readState() {}
        }, {
            key: 'readState',
            value: function readState() {
                var contents = JSON.parse(localStorage.getItem(this.name));
                if (contents === null) return;
                this._readState(contents);
            }
        }]);

        return Panel;
    }(_eventemitter2.default);

    exports.default = Panel;
    module.exports = exports['default'];
});

},{"eventemitter3":1}],6:[function(require,module,exports){
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['module', 'exports', './Panel'], factory);
    } else if (typeof exports !== "undefined") {
        factory(module, exports, require('./Panel'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod, mod.exports, global.Panel);
        global.PreviewPanel = mod.exports;
    }
})(this, function (module, exports, _Panel2) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _Panel3 = _interopRequireDefault(_Panel2);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    var PreviewPanel = function (_Panel) {
        _inherits(PreviewPanel, _Panel);

        _createClass(PreviewPanel, [{
            key: '_bindListeners',
            value: function _bindListeners() {}
        }, {
            key: '_createPanel',
            value: function _createPanel() {
                var templateStr = '\n            <div class="tools-panel tools-panel--column">\n                <h3 class="tools-panel__title">Before preview</h3>\n                <iframe class="tools-panel__iframe" src="about:blank" frameborder="0" marginheight="0" marginwidth="0" scrolling="yes"></iframe>\n            </div>\n        ';
                var el = document.createElement('div');
                el.innerHTML = templateStr.trim();
                return el.firstChild;
            }
        }]);

        function PreviewPanel() {
            _classCallCheck(this, PreviewPanel);

            var _this = _possibleConstructorReturn(this, (PreviewPanel.__proto__ || Object.getPrototypeOf(PreviewPanel)).call(this));

            _this.name = 'PreviewPanel';
            _this._frame = _this.el.querySelector('.tools-panel__iframe');
            _this._html = '';
            _this._styles = '';

            _this._bindListeners();
            return _this;
        }

        _createClass(PreviewPanel, [{
            key: 'render',
            value: function render() {
                var doc = this._frame.contentWindow.document;

                var html = '\n            <!DOCTYPE html>\n            <html>\n                <head>\n                    <title></title>\n                    <meta name="viewport" content="width=device-width, initial-scale=1">\n                    <style>' + this.styles + '</style>\n                </head>\n                <body>\n                    ' + this.html + '\n                </body>\n            </html>\n        ';
                doc.open('text/html', 'replace');
                doc.write(html);
                doc.close();

                this.emit('render');
            }
        }, {
            key: 'frame',
            get: function get() {
                return this._frame;
            }
        }, {
            key: 'html',
            get: function get() {
                return this._html;
            },
            set: function set(text) {
                this._html = text;
                this.render();
            }
        }, {
            key: 'styles',
            get: function get() {
                return this._styles;
            },
            set: function set(text) {
                this._styles = text;
                this.render();
            }
        }]);

        return PreviewPanel;
    }(_Panel3.default);

    exports.default = PreviewPanel;
    module.exports = exports['default'];
});

},{"./Panel":5}],7:[function(require,module,exports){
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['module', 'exports', 'mustache', './Panel'], factory);
    } else if (typeof exports !== "undefined") {
        factory(module, exports, require('mustache'), require('./Panel'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod, mod.exports, global.mustache, global.Panel);
        global.RendererPanel = mod.exports;
    }
})(this, function (module, exports, _mustache, _Panel2) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _mustache2 = _interopRequireDefault(_mustache);

    var _Panel3 = _interopRequireDefault(_Panel2);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    var RendererPanel = function (_Panel) {
        _inherits(RendererPanel, _Panel);

        _createClass(RendererPanel, [{
            key: '_bindListeners',
            value: function _bindListeners() {
                var _this2 = this;

                var textValue = null;

                this._textarea.addEventListener('keyup', function () {
                    if (_this2.text !== textValue) {
                        textValue = _this2.text;
                        _this2.emit('change', textValue);
                        _this2.saveState();
                    }
                });
            }
        }, {
            key: '_createPanel',
            value: function _createPanel() {
                var templateStr = '\n            <div class="tools-panel tools-panel--column">\n                <h3 class="tools-panel__title">Mustache</h3>\n                <textarea class="tools-panel__textarea"></textarea>\n                <div class="tools-panel__status">Status</div>\n            </div>\n        ';
                var el = document.createElement('div');
                el.innerHTML = templateStr.trim();
                return el.firstChild;
            }
        }]);

        function RendererPanel() {
            _classCallCheck(this, RendererPanel);

            var _this = _possibleConstructorReturn(this, (RendererPanel.__proto__ || Object.getPrototypeOf(RendererPanel)).call(this));

            _this.name = 'RendererPanel';
            _this._textarea = _this.el.querySelector('.tools-panel__textarea');
            _this._html = null;

            _this._bindListeners();
            _this.readState();
            return _this;
        }

        _createClass(RendererPanel, [{
            key: 'processInput',
            value: function processInput() {
                var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

                this.setStatus('Rendering markup...');
                var html = _mustache2.default.render(this.text, data);
                this._html = html;
                this.setStatus('Finished rendering!');
            }
        }, {
            key: '_saveState',
            value: function _saveState() {
                return {
                    text: this.text
                };
            }
        }, {
            key: '_readState',
            value: function _readState(contents) {
                this._textarea.value = contents.text;
            }
        }, {
            key: 'html',
            get: function get() {
                return this._html;
            }
        }, {
            key: 'text',
            get: function get() {
                return this._textarea.value;
            }
        }]);

        return RendererPanel;
    }(_Panel3.default);

    exports.default = RendererPanel;
    module.exports = exports['default'];
});

},{"./Panel":5,"mustache":2}],8:[function(require,module,exports){
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['module', 'exports', './Panel'], factory);
    } else if (typeof exports !== "undefined") {
        factory(module, exports, require('./Panel'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod, mod.exports, global.Panel);
        global.StylePanel = mod.exports;
    }
})(this, function (module, exports, _Panel2) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _Panel3 = _interopRequireDefault(_Panel2);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    var StylePanel = function (_Panel) {
        _inherits(StylePanel, _Panel);

        _createClass(StylePanel, [{
            key: '_bindListeners',
            value: function _bindListeners() {
                var _this2 = this;

                var textValue = null;

                this._textarea.addEventListener('keyup', function () {
                    if (_this2.text !== textValue) {
                        textValue = _this2.text;
                        _this2.emit('change', textValue);
                        _this2.saveState();
                    }
                });
            }
        }, {
            key: '_createPanel',
            value: function _createPanel() {
                var templateStr = '\n            <div class="tools-panel tools-panel--column">\n                <h3 class="tools-panel__title">Styles</h3>\n                <textarea class="tools-panel__textarea"></textarea>\n            </div>\n        ';
                var el = document.createElement('div');
                el.innerHTML = templateStr.trim();
                return el.firstChild;
            }
        }]);

        function StylePanel() {
            _classCallCheck(this, StylePanel);

            var _this = _possibleConstructorReturn(this, (StylePanel.__proto__ || Object.getPrototypeOf(StylePanel)).call(this));

            _this.name = 'StylePanel-' + _this.counter;
            _this._textarea = _this.el.querySelector('.tools-panel__textarea');

            _this._bindListeners();
            _this.readState();
            return _this;
        }

        _createClass(StylePanel, [{
            key: '_saveState',
            value: function _saveState() {
                return {
                    text: this.text
                };
            }
        }, {
            key: '_readState',
            value: function _readState(contents) {
                this._textarea.value = contents.text;
            }
        }, {
            key: 'text',
            get: function get() {
                return this._textarea.value;
            }
        }]);

        return StylePanel;
    }(_Panel3.default);

    exports.default = StylePanel;
    module.exports = exports['default'];
});

},{"./Panel":5}],9:[function(require,module,exports){
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['module', 'exports', './Panel'], factory);
    } else if (typeof exports !== "undefined") {
        factory(module, exports, require('./Panel'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod, mod.exports, global.Panel);
        global.TabbedPanel = mod.exports;
    }
})(this, function (module, exports, _Panel2) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _Panel3 = _interopRequireDefault(_Panel2);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    var _slicedToArray = function () {
        function sliceIterator(arr, i) {
            var _arr = [];
            var _n = true;
            var _d = false;
            var _e = undefined;

            try {
                for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
                    _arr.push(_s.value);

                    if (i && _arr.length === i) break;
                }
            } catch (err) {
                _d = true;
                _e = err;
            } finally {
                try {
                    if (!_n && _i["return"]) _i["return"]();
                } finally {
                    if (_d) throw _e;
                }
            }

            return _arr;
        }

        return function (arr, i) {
            if (Array.isArray(arr)) {
                return arr;
            } else if (Symbol.iterator in Object(arr)) {
                return sliceIterator(arr, i);
            } else {
                throw new TypeError("Invalid attempt to destructure non-iterable instance");
            }
        };
    }();

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    var TabbedPanel = function (_Panel) {
        _inherits(TabbedPanel, _Panel);

        _createClass(TabbedPanel, [{
            key: '_saveState',
            value: function _saveState() {
                return {
                    panels: this.panels.map(function (group) {
                        return {
                            name: group.name,
                            panel: group.panel._saveState()
                        };
                    })
                };
            }
        }, {
            key: '_readState',
            value: function _readState(contents) {
                var _this2 = this;

                contents.panels.forEach(function (group) {
                    var pnl = new _this2._panelType();
                    pnl._readState(group.panel);
                    _this2.addPanel(group.name, pnl);
                });
            }
        }, {
            key: '_createPanel',
            value: function _createPanel() {
                var templateStr = '\n            <div class="tools-panel tools-panel--column">\n                <ul class="tools-panel__tabs">\n                    <li class="tools-panel__tab-button"><button>+</button></li>\n                </ul>\n                <div class="tools-panel__views"></div>\n            </div>\n        ';
                var el = document.createElement('div');
                el.innerHTML = templateStr.trim();
                return el.firstChild;
            }
        }, {
            key: '_addTab',
            value: function _addTab(name) {
                var templateStr = '\n            <li class="tools-panel__tab" contenteditable>' + name + '</li>\n        ';
                var el = document.createElement('ul');
                el.innerHTML = templateStr.trim();
                this._tabList.appendChild(el.firstChild);
            }
        }, {
            key: '_addView',
            value: function _addView(pnl) {
                var templateStr = '\n            <div class="tools-panel__view is-hidden"></div>\n        ';
                var el = document.createElement('div');
                el.innerHTML = templateStr.trim();
                el.firstChild.appendChild(pnl.el);
                this._tabViews.appendChild(el.firstChild);
            }
        }, {
            key: '_getTabIndex',
            value: function _getTabIndex(tabEl) {
                var items = Array.prototype.slice.apply(this._tabList.querySelectorAll('.tools-panel__tab'));
                return items.indexOf(tabEl);
            }
        }, {
            key: '_bindListeners',
            value: function _bindListeners() {
                var _this3 = this;

                var tabButton = this.el.querySelector('.tools-panel__tab-button button');
                tabButton.addEventListener('click', function (e) {
                    var pnl = new _this3._panelType();
                    _this3.addPanel('Panel', pnl);
                });

                this._tabList.addEventListener('click', function (e) {
                    if (e.target && e.target.matches(".tools-panel__tab")) {
                        _this3.selectedIndex = _this3._getTabIndex(e.target);
                    }
                });
                this._tabList.addEventListener('input', function (e) {
                    if (e.target && e.target.matches(".tools-panel__tab")) {
                        var i = _this3._getTabIndex(e.target);
                        _this3.panels[i].name = e.target.innerText;
                        _this3.panels[i].panel.setTitle(e.target.innerText);
                        _this3.saveState();
                    }
                });
                this.addListener('change', function () {
                    return _this3.saveState();
                });
            }
        }, {
            key: '_getTabViewByIndex',
            value: function _getTabViewByIndex(index) {
                var tab = this._tabList.querySelectorAll('.tools-panel__tab')[index];
                var view = this._tabViews.querySelectorAll('.tools-panel__view')[index];
                return [tab, view];
            }
        }, {
            key: 'selectedIndex',
            get: function get() {
                return this._selectedIndex;
            },
            set: function set(index) {
                if (index === this._selectedIndex) return;

                if (this._selectedIndex > -1) {
                    var _getTabViewByIndex2 = this._getTabViewByIndex(this._selectedIndex),
                        _getTabViewByIndex3 = _slicedToArray(_getTabViewByIndex2, 2),
                        _tab = _getTabViewByIndex3[0],
                        _view = _getTabViewByIndex3[1];

                    _tab.classList.remove('is-active');
                    _view.classList.add('is-hidden');
                }

                var _getTabViewByIndex4 = this._getTabViewByIndex(index),
                    _getTabViewByIndex5 = _slicedToArray(_getTabViewByIndex4, 2),
                    tab = _getTabViewByIndex5[0],
                    view = _getTabViewByIndex5[1];

                tab.classList.add('is-active');
                view.classList.remove('is-hidden');

                var oldIndex = this._selectedIndex;
                this._selectedIndex = index;

                this.emit('change', this._selectedIndex, oldIndex);
            }
        }, {
            key: 'selectedPanel',
            get: function get() {
                return this.panels[this.selectedIndex].panel;
            }
        }]);

        function TabbedPanel(panelType) {
            _classCallCheck(this, TabbedPanel);

            var _this = _possibleConstructorReturn(this, (TabbedPanel.__proto__ || Object.getPrototypeOf(TabbedPanel)).call(this));

            _this.name = 'TabbedPanel-' + _this.counter;
            _this.panels = [];

            _this._panelType = panelType;
            _this._tabList = _this.el.querySelector('.tools-panel__tabs');
            _this._tabViews = _this.el.querySelector('.tools-panel__views');
            _this._selectedIndex = -1;

            _this._bindListeners();
            _this.readState();
            return _this;
        }

        _createClass(TabbedPanel, [{
            key: 'addPanel',
            value: function addPanel(name, panel) {
                var _this4 = this;

                panel.setTitle(name);
                this.panels.push({ name: name, panel: panel });
                this._addTab(name);
                this._addView(panel);
                this.selectedIndex = this.panels.length - 1;

                // Bubble up the change events
                panel.addListener('change', function (e) {
                    return _this4.emit('change');
                });

                this.saveState();
            }
        }]);

        return TabbedPanel;
    }(_Panel3.default);

    exports.default = TabbedPanel;
    module.exports = exports['default'];
});

},{"./Panel":5}],10:[function(require,module,exports){
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['./utils', './RendererPanel', './DataPanel', './PreviewPanel', './StylePanel', './DifferencePanel', './TabbedPanel'], factory);
    } else if (typeof exports !== "undefined") {
        factory(require('./utils'), require('./RendererPanel'), require('./DataPanel'), require('./PreviewPanel'), require('./StylePanel'), require('./DifferencePanel'), require('./TabbedPanel'));
    } else {
        var mod = {
            exports: {}
        };
        factory(global.utils, global.RendererPanel, global.DataPanel, global.PreviewPanel, global.StylePanel, global.DifferencePanel, global.TabbedPanel);
        global.index = mod.exports;
    }
})(this, function (_utils, _RendererPanel, _DataPanel, _PreviewPanel, _StylePanel, _DifferencePanel, _TabbedPanel) {
    'use strict';

    var _RendererPanel2 = _interopRequireDefault(_RendererPanel);

    var _DataPanel2 = _interopRequireDefault(_DataPanel);

    var _PreviewPanel2 = _interopRequireDefault(_PreviewPanel);

    var _StylePanel2 = _interopRequireDefault(_StylePanel);

    var _DifferencePanel2 = _interopRequireDefault(_DifferencePanel);

    var _TabbedPanel2 = _interopRequireDefault(_TabbedPanel);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    var rPanel = new _RendererPanel2.default();
    var dPanel = new _DataPanel2.default();
    var tabbedBeforeStylePanel = new _TabbedPanel2.default(_StylePanel2.default);
    var tabbedAfterStylePanel = new _TabbedPanel2.default(_StylePanel2.default);
    var diffPanel = new _DifferencePanel2.default();
    var beforePreview = new _PreviewPanel2.default();
    var afterPreview = new _PreviewPanel2.default();

    var domTools = document.getElementById('domTools');
    var domRenderers = document.getElementById('domRenderers');

    domTools.appendChild(rPanel.el);
    domTools.appendChild(dPanel.el);
    domTools.appendChild(tabbedBeforeStylePanel.el);
    domTools.appendChild(tabbedAfterStylePanel.el);
    domTools.appendChild(diffPanel.el);
    domRenderers.appendChild(beforePreview.el);
    domRenderers.appendChild(afterPreview.el);

    rPanel.addListener('change', (0, _utils.debounce)(renderHtml, 300));
    dPanel.addListener('change', (0, _utils.debounce)(renderHtml, 300));
    tabbedBeforeStylePanel.addListener('change', (0, _utils.debounce)(renderHtml, 300));
    tabbedAfterStylePanel.addListener('change', (0, _utils.debounce)(renderHtml, 300));
    window.addEventListener('resize', (0, _utils.debounce)(function () {
        diffPanel.compare(beforePreview, afterPreview);
    }, 300));
    renderHtml();

    function renderHtml() {
        var json = null;
        try {
            json = dPanel.json;
        } catch (err) {
            return;
        }
        rPanel.processInput(json);
        beforePreview.html = rPanel.html;
        beforePreview.styles = tabbedBeforeStylePanel.selectedPanel.text;
        afterPreview.html = rPanel.html;
        afterPreview.styles = tabbedAfterStylePanel.selectedPanel.text;

        diffPanel.compare(beforePreview, afterPreview);
    }
});

},{"./DataPanel":3,"./DifferencePanel":4,"./PreviewPanel":6,"./RendererPanel":7,"./StylePanel":8,"./TabbedPanel":9,"./utils":11}],11:[function(require,module,exports){
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.utils = mod.exports;
    }
})(this, function (exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.debounce = debounce;
    exports.throttle = throttle;
    function debounce(func, wait, immediate) {
        var timeout;

        return function () {
            var context = this;
            var args = arguments;
            var later = function later() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    function throttle(func, limit) {
        var lastFunc = void 0;
        var lastRan = void 0;
        return function () {
            var context = this;
            var args = arguments;
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function () {
                    if (Date.now() - lastRan >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }
});

},{}]},{},[10]);
