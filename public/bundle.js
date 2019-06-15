(function () {
  'use strict';

  /*! (c) Andrea Giammarchi - ISC */
  var self$1 = undefined || /* istanbul ignore next */ {};
  try { self$1.WeakMap = WeakMap; }
  catch (WeakMap) {
    // this could be better but 90% of the time
    // it's everything developers need as fallback
    self$1.WeakMap = (function (id, Object) {    var dP = Object.defineProperty;
      var hOP = Object.hasOwnProperty;
      var proto = WeakMap.prototype;
      proto.delete = function (key) {
        return this.has(key) && delete key[this._];
      };
      proto.get = function (key) {
        return this.has(key) ? key[this._] : void 0;
      };
      proto.has = function (key) {
        return hOP.call(key, this._);
      };
      proto.set = function (key, value) {
        dP(key, this._, {configurable: true, value: value});
        return this;
      };
      return WeakMap;
      function WeakMap(iterable) {
        dP(this, '_', {value: '_@ungap/weakmap' + id++});
        if (iterable)
          iterable.forEach(add, this);
      }
      function add(pair) {
        this.set(pair[0], pair[1]);
      }
    }(Math.random(), Object));
  }
  var WeakMap$1 = self$1.WeakMap;

  /*! (c) Andrea Giammarchi - ISC */
  var self$2 = undefined || /* istanbul ignore next */ {};
  try { self$2.WeakSet = WeakSet; }
  catch (WeakSet) {
    (function (id, dP) {
      var proto = WeakSet.prototype;
      proto.add = function (object) {
        if (!this.has(object))
          dP(object, this._, {value: true, configurable: true});
        return this;
      };
      proto.has = function (object) {
        return this.hasOwnProperty.call(object, this._);
      };
      proto.delete = function (object) {
        return this.has(object) && delete object[this._];
      };
      self$2.WeakSet = WeakSet;
      function WeakSet() {      dP(this, '_', {value: '_@ungap/weakmap' + id++});
      }
    }(Math.random(), Object.defineProperty));
  }
  var WeakSet$1 = self$2.WeakSet;

  /*! (c) Andrea Giammarchi - ISC */
  var self$3 = undefined || /* istanbul ignore next */ {};
  try { self$3.Map = Map; }
  catch (Map) {
    self$3.Map = function Map() {
      var i = 0;
      var k = [];
      var v = [];
      return {
        delete: function (key) {
          var had = contains(key);
          if (had) {
            k.splice(i, 1);
            v.splice(i, 1);
          }
          return had;
        },
        get: function get(key) {
          return contains(key) ? v[i] : void 0;
        },
        has: function has(key) {
          return contains(key);
        },
        set: function set(key, value) {
          v[contains(key) ? i : (k.push(key) - 1)] = value;
          return this;
        }
      };
      function contains(v) {
        i = k.indexOf(v);
        return -1 < i;
      }
    };
  }
  var Map$1 = self$3.Map;

  const append = (get, parent, children, start, end, before) => {
    if ((end - start) < 2)
      parent.insertBefore(get(children[start], 1), before);
    else {
      const fragment = parent.ownerDocument.createDocumentFragment();
      while (start < end)
        fragment.appendChild(get(children[start++], 1));
      parent.insertBefore(fragment, before);
    }
  };

  const eqeq = (a, b) => a == b;

  const identity = O => O;

  const indexOf = (
    moreNodes,
    moreStart,
    moreEnd,
    lessNodes,
    lessStart,
    lessEnd,
    compare
  ) => {
    const length = lessEnd - lessStart;
    /* istanbul ignore if */
    if (length < 1)
      return -1;
    while ((moreEnd - moreStart) >= length) {
      let m = moreStart;
      let l = lessStart;
      while (
        m < moreEnd &&
        l < lessEnd &&
        compare(moreNodes[m], lessNodes[l])
      ) {
        m++;
        l++;
      }
      if (l === lessEnd)
        return moreStart;
      moreStart = m + 1;
    }
    return -1;
  };

  const isReversed = (
    futureNodes,
    futureEnd,
    currentNodes,
    currentStart,
    currentEnd,
    compare
  ) => {
    while (
      currentStart < currentEnd &&
      compare(
        currentNodes[currentStart],
        futureNodes[futureEnd - 1]
      )) {
        currentStart++;
        futureEnd--;
      }  return futureEnd === 0;
  };

  const next = (get, list, i, length, before) => i < length ?
                get(list[i], 0) :
                (0 < i ?
                  get(list[i - 1], -0).nextSibling :
                  before);

  const remove = (get, parent, children, start, end) => {
    if ((end - start) < 2)
      parent.removeChild(get(children[start], -1));
    else {
      const range = parent.ownerDocument.createRange();
      range.setStartBefore(get(children[start], -1));
      range.setEndAfter(get(children[end - 1], -1));
      range.deleteContents();
    }
  };

  // - - - - - - - - - - - - - - - - - - -
  // diff related constants and utilities
  // - - - - - - - - - - - - - - - - - - -

  const DELETION = -1;
  const INSERTION = 1;
  const SKIP = 0;
  const SKIP_OND = 50;

  const HS = (
    futureNodes,
    futureStart,
    futureEnd,
    futureChanges,
    currentNodes,
    currentStart,
    currentEnd,
    currentChanges
  ) => {

    let k = 0;
    /* istanbul ignore next */
    let minLen = futureChanges < currentChanges ? futureChanges : currentChanges;
    const link = Array(minLen++);
    const tresh = Array(minLen);
    tresh[0] = -1;

    for (let i = 1; i < minLen; i++)
      tresh[i] = currentEnd;

    const keymap = new Map$1;
    for (let i = currentStart; i < currentEnd; i++)
      keymap.set(currentNodes[i], i);

    for (let i = futureStart; i < futureEnd; i++) {
      const idxInOld = keymap.get(futureNodes[i]);
      if (idxInOld != null) {
        k = findK(tresh, minLen, idxInOld);
        /* istanbul ignore else */
        if (-1 < k) {
          tresh[k] = idxInOld;
          link[k] = {
            newi: i,
            oldi: idxInOld,
            prev: link[k - 1]
          };
        }
      }
    }

    k = --minLen;
    --currentEnd;
    while (tresh[k] > currentEnd) --k;

    minLen = currentChanges + futureChanges - k;
    const diff = Array(minLen);
    let ptr = link[k];
    --futureEnd;
    while (ptr) {
      const {newi, oldi} = ptr;
      while (futureEnd > newi) {
        diff[--minLen] = INSERTION;
        --futureEnd;
      }
      while (currentEnd > oldi) {
        diff[--minLen] = DELETION;
        --currentEnd;
      }
      diff[--minLen] = SKIP;
      --futureEnd;
      --currentEnd;
      ptr = ptr.prev;
    }
    while (futureEnd >= futureStart) {
      diff[--minLen] = INSERTION;
      --futureEnd;
    }
    while (currentEnd >= currentStart) {
      diff[--minLen] = DELETION;
      --currentEnd;
    }
    return diff;
  };

  // this is pretty much the same petit-dom code without the delete map part
  // https://github.com/yelouafi/petit-dom/blob/bd6f5c919b5ae5297be01612c524c40be45f14a7/src/vdom.js#L556-L561
  const OND = (
    futureNodes,
    futureStart,
    rows,
    currentNodes,
    currentStart,
    cols,
    compare
  ) => {
    const length = rows + cols;
    const v = [];
    let d, k, r, c, pv, cv, pd;
    outer: for (d = 0; d <= length; d++) {
      /* istanbul ignore if */
      if (d > SKIP_OND)
        return null;
      pd = d - 1;
      /* istanbul ignore next */
      pv = d ? v[d - 1] : [0, 0];
      cv = v[d] = [];
      for (k = -d; k <= d; k += 2) {
        if (k === -d || (k !== d && pv[pd + k - 1] < pv[pd + k + 1])) {
          c = pv[pd + k + 1];
        } else {
          c = pv[pd + k - 1] + 1;
        }
        r = c - k;
        while (
          c < cols &&
          r < rows &&
          compare(
            currentNodes[currentStart + c],
            futureNodes[futureStart + r]
          )
        ) {
          c++;
          r++;
        }
        if (c === cols && r === rows) {
          break outer;
        }
        cv[d + k] = c;
      }
    }

    const diff = Array(d / 2 + length / 2);
    let diffIdx = diff.length - 1;
    for (d = v.length - 1; d >= 0; d--) {
      while (
        c > 0 &&
        r > 0 &&
        compare(
          currentNodes[currentStart + c - 1],
          futureNodes[futureStart + r - 1]
        )
      ) {
        // diagonal edge = equality
        diff[diffIdx--] = SKIP;
        c--;
        r--;
      }
      if (!d)
        break;
      pd = d - 1;
      /* istanbul ignore next */
      pv = d ? v[d - 1] : [0, 0];
      k = c - r;
      if (k === -d || (k !== d && pv[pd + k - 1] < pv[pd + k + 1])) {
        // vertical edge = insertion
        r--;
        diff[diffIdx--] = INSERTION;
      } else {
        // horizontal edge = deletion
        c--;
        diff[diffIdx--] = DELETION;
      }
    }
    return diff;
  };

  const applyDiff = (
    diff,
    get,
    parentNode,
    futureNodes,
    futureStart,
    currentNodes,
    currentStart,
    currentLength,
    before
  ) => {
    const live = new Map$1;
    const length = diff.length;
    let currentIndex = currentStart;
    let i = 0;
    while (i < length) {
      switch (diff[i++]) {
        case SKIP:
          futureStart++;
          currentIndex++;
          break;
        case INSERTION:
          // TODO: bulk appends for sequential nodes
          live.set(futureNodes[futureStart], 1);
          append(
            get,
            parentNode,
            futureNodes,
            futureStart++,
            futureStart,
            currentIndex < currentLength ?
              get(currentNodes[currentIndex], 0) :
              before
          );
          break;
        case DELETION:
          currentIndex++;
          break;
      }
    }
    i = 0;
    while (i < length) {
      switch (diff[i++]) {
        case SKIP:
          currentStart++;
          break;
        case DELETION:
          // TODO: bulk removes for sequential nodes
          if (live.has(currentNodes[currentStart]))
            currentStart++;
          else
            remove(
              get,
              parentNode,
              currentNodes,
              currentStart++,
              currentStart
            );
          break;
      }
    }
  };

  const findK = (ktr, length, j) => {
    let lo = 1;
    let hi = length;
    while (lo < hi) {
      const mid = ((lo + hi) / 2) >>> 0;
      if (j < ktr[mid])
        hi = mid;
      else
        lo = mid + 1;
    }
    return lo;
  };

  const smartDiff = (
    get,
    parentNode,
    futureNodes,
    futureStart,
    futureEnd,
    futureChanges,
    currentNodes,
    currentStart,
    currentEnd,
    currentChanges,
    currentLength,
    compare,
    before
  ) => {
    applyDiff(
      OND(
        futureNodes,
        futureStart,
        futureChanges,
        currentNodes,
        currentStart,
        currentChanges,
        compare
      ) ||
      HS(
        futureNodes,
        futureStart,
        futureEnd,
        futureChanges,
        currentNodes,
        currentStart,
        currentEnd,
        currentChanges
      ),
      get,
      parentNode,
      futureNodes,
      futureStart,
      currentNodes,
      currentStart,
      currentLength,
      before
    );
  };

  /*! (c) 2018 Andrea Giammarchi (ISC) */

  const domdiff = (
    parentNode,     // where changes happen
    currentNodes,   // Array of current items/nodes
    futureNodes,    // Array of future items/nodes
    options         // optional object with one of the following properties
                    //  before: domNode
                    //  compare(generic, generic) => true if same generic
                    //  node(generic) => Node
  ) => {
    if (!options)
      options = {};

    const compare = options.compare || eqeq;
    const get = options.node || identity;
    const before = options.before == null ? null : get(options.before, 0);

    const currentLength = currentNodes.length;
    let currentEnd = currentLength;
    let currentStart = 0;

    let futureEnd = futureNodes.length;
    let futureStart = 0;

    // common prefix
    while (
      currentStart < currentEnd &&
      futureStart < futureEnd &&
      compare(currentNodes[currentStart], futureNodes[futureStart])
    ) {
      currentStart++;
      futureStart++;
    }

    // common suffix
    while (
      currentStart < currentEnd &&
      futureStart < futureEnd &&
      compare(currentNodes[currentEnd - 1], futureNodes[futureEnd - 1])
    ) {
      currentEnd--;
      futureEnd--;
    }

    const currentSame = currentStart === currentEnd;
    const futureSame = futureStart === futureEnd;

    // same list
    if (currentSame && futureSame)
      return futureNodes;

    // only stuff to add
    if (currentSame && futureStart < futureEnd) {
      append(
        get,
        parentNode,
        futureNodes,
        futureStart,
        futureEnd,
        next(get, currentNodes, currentStart, currentLength, before)
      );
      return futureNodes;
    }

    // only stuff to remove
    if (futureSame && currentStart < currentEnd) {
      remove(
        get,
        parentNode,
        currentNodes,
        currentStart,
        currentEnd
      );
      return futureNodes;
    }

    const currentChanges = currentEnd - currentStart;
    const futureChanges = futureEnd - futureStart;
    let i = -1;

    // 2 simple indels: the shortest sequence is a subsequence of the longest
    if (currentChanges < futureChanges) {
      i = indexOf(
        futureNodes,
        futureStart,
        futureEnd,
        currentNodes,
        currentStart,
        currentEnd,
        compare
      );
      // inner diff
      if (-1 < i) {
        append(
          get,
          parentNode,
          futureNodes,
          futureStart,
          i,
          get(currentNodes[currentStart], 0)
        );
        append(
          get,
          parentNode,
          futureNodes,
          i + currentChanges,
          futureEnd,
          next(get, currentNodes, currentEnd, currentLength, before)
        );
        return futureNodes;
      }
    }
    /* istanbul ignore else */
    else if (futureChanges < currentChanges) {
      i = indexOf(
        currentNodes,
        currentStart,
        currentEnd,
        futureNodes,
        futureStart,
        futureEnd,
        compare
      );
      // outer diff
      if (-1 < i) {
        remove(
          get,
          parentNode,
          currentNodes,
          currentStart,
          i
        );
        remove(
          get,
          parentNode,
          currentNodes,
          i + futureChanges,
          currentEnd
        );
        return futureNodes;
      }
    }

    // common case with one replacement for many nodes
    // or many nodes replaced for a single one
    /* istanbul ignore else */
    if ((currentChanges < 2 || futureChanges < 2)) {
      append(
        get,
        parentNode,
        futureNodes,
        futureStart,
        futureEnd,
        get(currentNodes[currentStart], 0)
      );
      remove(
        get,
        parentNode,
        currentNodes,
        currentStart,
        currentEnd
      );
      return futureNodes;
    }

    // the half match diff part has been skipped in petit-dom
    // https://github.com/yelouafi/petit-dom/blob/bd6f5c919b5ae5297be01612c524c40be45f14a7/src/vdom.js#L391-L397
    // accordingly, I think it's safe to skip in here too
    // if one day it'll come out like the speediest thing ever to do
    // then I might add it in here too

    // Extra: before going too fancy, what about reversed lists ?
    //        This should bail out pretty quickly if that's not the case.
    if (
      currentChanges === futureChanges &&
      isReversed(
        futureNodes,
        futureEnd,
        currentNodes,
        currentStart,
        currentEnd,
        compare
      )
    ) {
      append(
        get,
        parentNode,
        futureNodes,
        futureStart,
        futureEnd,
        next(get, currentNodes, currentEnd, currentLength, before)
      );
      return futureNodes;
    }

    // last resort through a smart diff
    smartDiff(
      get,
      parentNode,
      futureNodes,
      futureStart,
      futureEnd,
      futureChanges,
      currentNodes,
      currentStart,
      currentEnd,
      currentChanges,
      currentLength,
      compare,
      before
    );

    return futureNodes;
  };

  /*! (c) Andrea Giammarchi - ISC */
  var self$4 = undefined || /* istanbul ignore next */ {};
  self$4.CustomEvent = typeof CustomEvent === 'function' ?
    CustomEvent :
    (function (__p__) {
      CustomEvent[__p__] = new CustomEvent('').constructor[__p__];
      return CustomEvent;
      function CustomEvent(type, init) {
        if (!init) init = {};
        var e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, !!init.bubbles, !!init.cancelable, init.detail);
        return e;
      }
    }('prototype'));
  var CustomEvent$1 = self$4.CustomEvent;

  // hyperHTML.Component is a very basic class
  // able to create Custom Elements like components
  // including the ability to listen to connect/disconnect
  // events via onconnect/ondisconnect attributes
  // Components can be created imperatively or declaratively.
  // The main difference is that declared components
  // will not automatically render on setState(...)
  // to simplify state handling on render.
  function Component() {
    return this; // this is needed in Edge !!!
  }

  // Component is lazily setup because it needs
  // wire mechanism as lazy content
  function setup(content) {
    // there are various weakly referenced variables in here
    // and mostly are to use Component.for(...) static method.
    const children = new WeakMap$1;
    const create = Object.create;
    const createEntry = (wm, id, component) => {
      wm.set(id, component);
      return component;
    };
    const get = (Class, info, context, id) => {
      const relation = info.get(Class) || relate(Class, info);
      switch (typeof id) {
        case 'object':
        case 'function':
          const wm = relation.w || (relation.w = new WeakMap$1);
          return wm.get(id) || createEntry(wm, id, new Class(context));
        default:
          const sm = relation.p || (relation.p = create(null));
          return sm[id] || (sm[id] = new Class(context));
      }
    };
    const relate = (Class, info) => {
      const relation = {w: null, p: null};
      info.set(Class, relation);
      return relation;
    };
    const set = context => {
      const info = new Map$1;
      children.set(context, info);
      return info;
    };
    // The Component Class
    Object.defineProperties(
      Component,
      {
        // Component.for(context[, id]) is a convenient way
        // to automatically relate data/context to children components
        // If not created yet, the new Component(context) is weakly stored
        // and after that same instance would always be returned.
        for: {
          configurable: true,
          value(context, id) {
            return get(
              this,
              children.get(context) || set(context),
              context,
              id == null ?
                'default' : id
            );
          }
        }
      }
    );
    Object.defineProperties(
      Component.prototype,
      {
        // all events are handled with the component as context
        handleEvent: {value(e) {
          const ct = e.currentTarget;
          this[
            ('getAttribute' in ct && ct.getAttribute('data-call')) ||
            ('on' + e.type)
          ](e);
        }},
        // components will lazily define html or svg properties
        // as soon as these are invoked within the .render() method
        // Such render() method is not provided by the base class
        // but it must be available through the Component extend.
        // Declared components could implement a
        // render(props) method too and use props as needed.
        html: lazyGetter('html', content),
        svg: lazyGetter('svg', content),
        // the state is a very basic/simple mechanism inspired by Preact
        state: lazyGetter('state', function () { return this.defaultState; }),
        // it is possible to define a default state that'd be always an object otherwise
        defaultState: {get() { return {}; }},
        // dispatch a bubbling, cancelable, custom event
        // through the first known/available node
        dispatch: {value(type, detail) {
          const {_wire$} = this;
          if (_wire$) {
            const event = new CustomEvent$1(type, {
              bubbles: true,
              cancelable: true,
              detail
            });
            event.component = this;
            return (_wire$.dispatchEvent ?
                      _wire$ :
                      _wire$.firstChild
                    ).dispatchEvent(event);
          }
          return false;
        }},
        // setting some property state through a new object
        // or a callback, triggers also automatically a render
        // unless explicitly specified to not do so (render === false)
        setState: {value(state, render) {
          const target = this.state;
          const source = typeof state === 'function' ? state.call(this, target) : state;
          for (const key in source) target[key] = source[key];
          if (render !== false)
            this.render();
          return this;
        }}
      }
    );
  }

  // instead of a secret key I could've used a WeakMap
  // However, attaching a property directly will result
  // into better performance with thousands of components
  // hanging around, and less memory pressure caused by the WeakMap
  const lazyGetter = (type, fn) => {
    const secret = '_' + type + '$';
    return {
      get() {
        return this[secret] || setValue(this, secret, fn.call(this, type));
      },
      set(value) {
        setValue(this, secret, value);
      }
    };
  };

  // shortcut to set value on get or set(value)
  const setValue = (self, secret, value) =>
    Object.defineProperty(self, secret, {
      configurable: true,
      value: typeof value === 'function' ?
        function () {
          return (self._wire$ = value.apply(this, arguments));
        } :
        value
    })[secret]
  ;

  Object.defineProperties(
    Component.prototype,
    {
      // used to distinguish better than instanceof
      ELEMENT_NODE: {value: 1},
      nodeType: {value: -1}
    }
  );

  const attributes = {};
  const intents = {};
  const keys = [];
  const hasOwnProperty = intents.hasOwnProperty;

  let length = 0;

  var Intent = {

    // used to invoke right away hyper:attributes
    attributes,

    // hyperHTML.define('intent', (object, update) => {...})
    // can be used to define a third parts update mechanism
    // when every other known mechanism failed.
    // hyper.define('user', info => info.name);
    // hyper(node)`<p>${{user}}</p>`;
    define: (intent, callback) => {
      if (intent.indexOf('-') < 0) {
        if (!(intent in intents)) {
          length = keys.push(intent);
        }
        intents[intent] = callback;
      } else {
        attributes[intent] = callback;
      }
    },

    // this method is used internally as last resort
    // to retrieve a value out of an object
    invoke: (object, callback) => {
      for (let i = 0; i < length; i++) {
        let key = keys[i];
        if (hasOwnProperty.call(object, key)) {
          return intents[key](object[key], callback);
        }
      }
    }
  };

  var isArray = Array.isArray || (function (toString) {
    var $ = toString.call([]);
    return function isArray(object) {
      return toString.call(object) === $;
    };
  }({}.toString));

  /*! (c) Andrea Giammarchi - ISC */
  var createContent = (function (document) {  var FRAGMENT = 'fragment';
    var TEMPLATE = 'template';
    var HAS_CONTENT = 'content' in create(TEMPLATE);

    var createHTML = HAS_CONTENT ?
      function (html) {
        var template = create(TEMPLATE);
        template.innerHTML = html;
        return template.content;
      } :
      function (html) {
        var content = create(FRAGMENT);
        var template = create(TEMPLATE);
        var childNodes = null;
        if (/^[^\S]*?<(col(?:group)?|t(?:head|body|foot|r|d|h))/i.test(html)) {
          var selector = RegExp.$1;
          template.innerHTML = '<table>' + html + '</table>';
          childNodes = template.querySelectorAll(selector);
        } else {
          template.innerHTML = html;
          childNodes = template.childNodes;
        }
        append(content, childNodes);
        return content;
      };

    return function createContent(markup, type) {
      return (type === 'svg' ? createSVG : createHTML)(markup);
    };

    function append(root, childNodes) {
      var length = childNodes.length;
      while (length--)
        root.appendChild(childNodes[0]);
    }

    function create(element) {
      return element === FRAGMENT ?
        document.createDocumentFragment() :
        document.createElementNS('http://www.w3.org/1999/xhtml', element);
    }

    // it could use createElementNS when hasNode is there
    // but this fallback is equally fast and easier to maintain
    // it is also battle tested already in all IE
    function createSVG(svg) {
      var content = create(FRAGMENT);
      var template = create('div');
      template.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg">' + svg + '</svg>';
      append(content, template.firstChild.childNodes);
      return content;
    }

  }(document));

  /*! (c) Andrea Giammarchi */
  function disconnected(poly) {  var CONNECTED = 'connected';
    var DISCONNECTED = 'dis' + CONNECTED;
    var Event = poly.Event;
    var WeakSet = poly.WeakSet;
    var notObserving = true;
    var observer = new WeakSet;
    return function observe(node) {
      if (notObserving) {
        notObserving = !notObserving;
        startObserving(node.ownerDocument);
      }
      observer.add(node);
      return node;
    };
    function startObserving(document) {
      var dispatched = null;
      try {
        (new MutationObserver(changes)).observe(
          document,
          {subtree: true, childList: true}
        );
      }
      catch(o_O) {
        var timer = 0;
        var records = [];
        var reschedule = function (record) {
          records.push(record);
          clearTimeout(timer);
          timer = setTimeout(
            function () {
              changes(records.splice(timer = 0, records.length));
            },
            0
          );
        };
        document.addEventListener(
          'DOMNodeRemoved',
          function (event) {
            reschedule({addedNodes: [], removedNodes: [event.target]});
          },
          true
        );
        document.addEventListener(
          'DOMNodeInserted',
          function (event) {
            reschedule({addedNodes: [event.target], removedNodes: []});
          },
          true
        );
      }
      function changes(records) {
        dispatched = new Tracker;
        for (var
          record,
          length = records.length,
          i = 0; i < length; i++
        ) {
          record = records[i];
          dispatchAll(record.removedNodes, DISCONNECTED, CONNECTED);
          dispatchAll(record.addedNodes, CONNECTED, DISCONNECTED);
        }
        dispatched = null;
      }
      function dispatchAll(nodes, type, counter) {
        for (var
          node,
          event = new Event(type),
          length = nodes.length,
          i = 0; i < length;
          (node = nodes[i++]).nodeType === 1 &&
          dispatchTarget(node, event, type, counter)
        );
      }
      function dispatchTarget(node, event, type, counter) {
        if (observer.has(node) && !dispatched[type].has(node)) {
          dispatched[counter].delete(node);
          dispatched[type].add(node);
          node.dispatchEvent(event);
          /*
          // The event is not bubbling (perf reason: should it?),
          // hence there's no way to know if
          // stop/Immediate/Propagation() was called.
          // Should DOM Level 0 work at all?
          // I say it's a YAGNI case for the time being,
          // and easy to implement in user-land.
          if (!event.cancelBubble) {
            var fn = node['on' + type];
            if (fn)
              fn.call(node, event);
          }
          */
        }
        for (var
          // apparently is node.children || IE11 ... ^_^;;
          // https://github.com/WebReflection/disconnected/issues/1
          children = node.children || [],
          length = children.length,
          i = 0; i < length;
          dispatchTarget(children[i++], event, type, counter)
        );
      }
      function Tracker() {
        this[CONNECTED] = new WeakSet;
        this[DISCONNECTED] = new WeakSet;
      }
    }
  }

  /*! (c) Andrea Giammarchi - ISC */
  var importNode = (function (
    document,
    appendChild,
    cloneNode,
    createTextNode,
    importNode
  ) {
    var native = importNode in document;
    // IE 11 has problems with cloning templates:
    // it "forgets" empty childNodes. This feature-detects that.
    var fragment = document.createDocumentFragment();
    fragment[appendChild](document[createTextNode]('g'));
    fragment[appendChild](document[createTextNode](''));
    var content = native ?
      document[importNode](fragment, true) :
      fragment[cloneNode](true);
    return content.childNodes.length < 2 ?
      function importNode(node, deep) {
        var clone = node[cloneNode]();
        for (var
          childNodes = node.childNodes || [],
          length = childNodes.length,
          i = 0; deep && i < length; i++
        ) {
          clone[appendChild](importNode(childNodes[i], deep));
        }
        return clone;
      } :
      (native ?
        document[importNode] :
        function (node, deep) {
          return node[cloneNode](!!deep);
        }
      );
  }(
    document,
    'appendChild',
    'cloneNode',
    'createTextNode',
    'importNode'
  ));

  var trim = ''.trim || function () {
    return String(this).replace(/^\s+|\s+/g, '');
  };

  // Custom
  var UID = '-' + Math.random().toFixed(6) + '%';
  //                           Edge issue!
  if (!(function (template, content, tabindex) {
    return content in template && (
      (template.innerHTML = '<p ' + tabindex + '="' + UID + '"></p>'),
      template[content].childNodes[0].getAttribute(tabindex) == UID
    );
  }(document.createElement('template'), 'content', 'tabindex'))) {
    UID = '_dt: ' + UID.slice(1, -1) + ';';
  }
  var UIDC = '<!--' + UID + '-->';

  // DOM
  var COMMENT_NODE = 8;
  var ELEMENT_NODE = 1;
  var TEXT_NODE = 3;

  var SHOULD_USE_TEXT_CONTENT = /^(?:style|textarea)$/i;
  var VOID_ELEMENTS = /^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$/i;

  function sanitize (template) {
    return template.join(UIDC)
            .replace(selfClosing, fullClosing)
            .replace(attrSeeker, attrReplacer);
  }

  var spaces = ' \\f\\n\\r\\t';
  var almostEverything = '[^ ' + spaces + '\\/>"\'=]+';
  var attrName = '[ ' + spaces + ']+' + almostEverything;
  var tagName = '<([A-Za-z]+[A-Za-z0-9:_-]*)((?:';
  var attrPartials = '(?:\\s*=\\s*(?:\'[^\']*?\'|"[^"]*?"|<[^>]*?>|' + almostEverything + '))?)';

  var attrSeeker = new RegExp(tagName + attrName + attrPartials + '+)([ ' + spaces + ']*/?>)', 'g');
  var selfClosing = new RegExp(tagName + attrName + attrPartials + '*)([ ' + spaces + ']*/>)', 'g');
  var findAttributes = new RegExp('(' + attrName + '\\s*=\\s*)([\'"]?)' + UIDC + '\\2', 'gi');

  function attrReplacer($0, $1, $2, $3) {
    return '<' + $1 + $2.replace(findAttributes, replaceAttributes) + $3;
  }

  function replaceAttributes($0, $1, $2) {
    return $1 + ($2 || '"') + UID + ($2 || '"');
  }

  function fullClosing($0, $1, $2) {
    return VOID_ELEMENTS.test($1) ? $0 : ('<' + $1 + $2 + '></' + $1 + '>');
  }

  function create(type, node, path, name) {
    return {name: name, node: node, path: path, type: type};
  }

  function find(node, path) {
    var length = path.length;
    var i = 0;
    while (i < length)
      node = node.childNodes[path[i++]];
    return node;
  }

  function parse(node, holes, parts, path) {
    var childNodes = node.childNodes;
    var length = childNodes.length;
    var i = 0;
    while (i < length) {
      var child = childNodes[i];
      switch (child.nodeType) {
        case ELEMENT_NODE:
          var childPath = path.concat(i);
          parseAttributes(child, holes, parts, childPath);
          parse(child, holes, parts, childPath);
          break;
        case COMMENT_NODE:
          if (child.textContent === UID) {
            parts.shift();
            holes.push(
              // basicHTML or other non standard engines
              // might end up having comments in nodes
              // where they shouldn't, hence this check.
              SHOULD_USE_TEXT_CONTENT.test(node.nodeName) ?
                create('text', node, path) :
                create('any', child, path.concat(i))
            );
          }
          break;
        case TEXT_NODE:
          // the following ignore is actually covered by browsers
          // only basicHTML ends up on previous COMMENT_NODE case
          // instead of TEXT_NODE because it knows nothing about
          // special style or textarea behavior
          /* istanbul ignore if */
          if (
            SHOULD_USE_TEXT_CONTENT.test(node.nodeName) &&
            trim.call(child.textContent) === UIDC
          ) {
            parts.shift();
            holes.push(create('text', node, path));
          }
          break;
      }
      i++;
    }
  }

  function parseAttributes(node, holes, parts, path) {
    var cache = new Map$1;
    var attributes = node.attributes;
    var remove = [];
    var array = remove.slice.call(attributes, 0);
    var length = array.length;
    var i = 0;
    while (i < length) {
      var attribute = array[i++];
      if (attribute.value === UID) {
        var name = attribute.name;
        // the following ignore is covered by IE
        // and the IE9 double viewBox test
        /* istanbul ignore else */
        if (!cache.has(name)) {
          var realName = parts.shift().replace(/^(?:|[\S\s]*?\s)(\S+?)\s*=\s*['"]?$/, '$1');
          var value = attributes[realName] ||
                        // the following ignore is covered by browsers
                        // while basicHTML is already case-sensitive
                        /* istanbul ignore next */
                        attributes[realName.toLowerCase()];
          cache.set(name, value);
          holes.push(create('attr', value, path, realName));
        }
        remove.push(attribute);
      }
    }
    length = remove.length;
    i = 0;
    while (i < length) {
      // Edge HTML bug #16878726
      var attr = remove[i++];
      if (/^id$/i.test(attr.name))
        node.removeAttribute(attr.name);
      // standard browsers would work just fine here
      else
        node.removeAttributeNode(attr);
    }

    // This is a very specific Firefox/Safari issue
    // but since it should be a not so common pattern,
    // it's probably worth patching regardless.
    // Basically, scripts created through strings are death.
    // You need to create fresh new scripts instead.
    // TODO: is there any other node that needs such nonsense?
    var nodeName = node.nodeName;
    if (/^script$/i.test(nodeName)) {
      // this used to be like that
      // var script = createElement(node, nodeName);
      // then Edge arrived and decided that scripts created
      // through template documents aren't worth executing
      // so it became this ... hopefully it won't hurt in the wild
      var script = document.createElement(nodeName);
      length = attributes.length;
      i = 0;
      while (i < length)
        script.setAttributeNode(attributes[i++].cloneNode(true));
      script.textContent = node.textContent;
      node.parentNode.replaceChild(script, node);
    }
  }

  // globals

  var parsed = new WeakMap$1;
  var referenced = new WeakMap$1;

  function createInfo(options, template) {
    var markup = sanitize(template);
    var transform = options.transform;
    if (transform)
      markup = transform(markup);
    var content = createContent(markup, options.type);
    cleanContent(content);
    var holes = [];
    parse(content, holes, template.slice(0), []);
    var info = {
      content: content,
      updates: function (content) {
        var callbacks = [];
        var len = holes.length;
        var i = 0;
        while (i < len) {
          var info = holes[i++];
          var node = find(content, info.path);
          switch (info.type) {
            case 'any':
              callbacks.push(options.any(node, []));
              break;
            case 'attr':
              callbacks.push(options.attribute(node, info.name, info.node));
              break;
            case 'text':
              callbacks.push(options.text(node));
              node.textContent = '';
              break;
          }
        }
        return function () {
          var length = arguments.length;
          var values = length - 1;
          var i = 1;
          if (len !== values) {
            throw new Error(
              values + ' values instead of ' + len + '\n' +
              template.join(', ')
            );
          }
          while (i < length)
            callbacks[i - 1](arguments[i++]);
          return content;
        };
      }
    };
    parsed.set(template, info);
    return info;
  }

  function createDetails(options, template) {
    var info = parsed.get(template) || createInfo(options, template);
    var content = importNode.call(document, info.content, true);
    var details = {
      content: content,
      template: template,
      updates: info.updates(content)
    };
    referenced.set(options, details);
    return details;
  }

  function domtagger(options) {
    return function (template) {
      var details = referenced.get(options);
      if (details == null || details.template !== template)
        details = createDetails(options, template);
      details.updates.apply(null, arguments);
      return details.content;
    };
  }

  function cleanContent(fragment) {
    var childNodes = fragment.childNodes;
    var i = childNodes.length;
    while (i--) {
      var child = childNodes[i];
      if (
        child.nodeType !== 1 &&
        trim.call(child.textContent).length === 0
      ) {
        fragment.removeChild(child);
      }
    }
  }

  /*! (c) Andrea Giammarchi - ISC */
  var hyperStyle = (function (){  // from https://github.com/developit/preact/blob/33fc697ac11762a1cb6e71e9847670d047af7ce5/src/varants.js
    var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;
    var hyphen = /([^A-Z])([A-Z]+)/g;
    return function hyperStyle(node, original) {
      return 'ownerSVGElement' in node ? svg(node, original) : update(node.style, false);
    };
    function ized($0, $1, $2) {
      return $1 + '-' + $2.toLowerCase();
    }
    function svg(node, original) {
      var style;
      if (original)
        style = original.cloneNode(true);
      else {
        node.setAttribute('style', '--hyper:style;');
        style = node.getAttributeNode('style');
      }
      style.value = '';
      node.setAttributeNode(style);
      return update(style, true);
    }
    function toStyle(object) {
      var key, css = [];
      for (key in object)
        css.push(key.replace(hyphen, ized), ':', object[key], ';');
      return css.join('');
    }
    function update(style, isSVG) {
      var oldType, oldValue;
      return function (newValue) {
        var info, key, styleValue, value;
        switch (typeof newValue) {
          case 'object':
            if (newValue) {
              if (oldType === 'object') {
                if (!isSVG) {
                  if (oldValue !== newValue) {
                    for (key in oldValue) {
                      if (!(key in newValue)) {
                        style[key] = '';
                      }
                    }
                  }
                }
              } else {
                if (isSVG)
                  style.value = '';
                else
                  style.cssText = '';
              }
              info = isSVG ? {} : style;
              for (key in newValue) {
                value = newValue[key];
                styleValue = typeof value === 'number' &&
                                    !IS_NON_DIMENSIONAL.test(key) ?
                                    (value + 'px') : value;
                if (!isSVG && /^--/.test(key))
                  info.setProperty(key, styleValue);
                else
                  info[key] = styleValue;
              }
              oldType = 'object';
              if (isSVG)
                style.value = toStyle((oldValue = info));
              else
                oldValue = newValue;
              break;
            }
          default:
            if (oldValue != newValue) {
              oldType = 'string';
              oldValue = newValue;
              if (isSVG)
                style.value = newValue || '';
              else
                style.cssText = newValue || '';
            }
            break;
        }
      };
    }
  }());

  /*! (c) Andrea Giammarchi - ISC */
  var Wire = (function (slice, proto) {

    proto = Wire.prototype;

    proto.ELEMENT_NODE = 1;
    proto.nodeType = 111;

    proto.remove = function (keepFirst) {
      var childNodes = this.childNodes;
      var first = this.firstChild;
      var last = this.lastChild;
      this._ = null;
      if (keepFirst && childNodes.length === 2) {
        last.parentNode.removeChild(last);
      } else {
        var range = this.ownerDocument.createRange();
        range.setStartBefore(keepFirst ? childNodes[1] : first);
        range.setEndAfter(last);
        range.deleteContents();
      }
      return first;
    };

    proto.valueOf = function (forceAppend) {
      var fragment = this._;
      var noFragment = fragment == null;
      if (noFragment)
        fragment = (this._ = this.ownerDocument.createDocumentFragment());
      if (noFragment || forceAppend) {
        for (var n = this.childNodes, i = 0, l = n.length; i < l; i++)
          fragment.appendChild(n[i]);
      }
      return fragment;
    };

    return Wire;

    function Wire(childNodes) {
      var nodes = (this.childNodes = slice.call(childNodes, 0));
      this.firstChild = nodes[0];
      this.lastChild = nodes[nodes.length - 1];
      this.ownerDocument = nodes[0].ownerDocument;
      this._ = null;
    }

  }([].slice));

  // Node.CONSTANTS
  const DOCUMENT_FRAGMENT_NODE$1 = 11;

  // SVG related constants
  const OWNER_SVG_ELEMENT = 'ownerSVGElement';

  // Custom Elements / MutationObserver constants
  const CONNECTED = 'connected';
  const DISCONNECTED = 'dis' + CONNECTED;

  const componentType = Component.prototype.nodeType;
  const wireType = Wire.prototype.nodeType;

  const observe = disconnected({Event: CustomEvent$1, WeakSet: WeakSet$1});

  // returns an intent to explicitly inject content as html
  const asHTML = html => ({html});

  // returns nodes from wires and components
  const asNode = (item, i) => {
    switch (item.nodeType) {
      case wireType:
        // in the Wire case, the content can be
        // removed, post-pended, inserted, or pre-pended and
        // all these cases are handled by domdiff already
        /* istanbul ignore next */
        return (1 / i) < 0 ?
          (i ? item.remove(true) : item.lastChild) :
          (i ? item.valueOf(true) : item.firstChild);
      case componentType:
        return asNode(item.render(), i);
      default:
        return item;
    }
  };

  // returns true if domdiff can handle the value
  const canDiff = value => 'ELEMENT_NODE' in value;

  // when a Promise is used as interpolation value
  // its result must be parsed once resolved.
  // This callback is in charge of understanding what to do
  // with a returned value once the promise is resolved.
  const invokeAtDistance = (value, callback) => {
    callback(value.placeholder);
    if ('text' in value) {
      Promise.resolve(value.text).then(String).then(callback);
    } else if ('any' in value) {
      Promise.resolve(value.any).then(callback);
    } else if ('html' in value) {
      Promise.resolve(value.html).then(asHTML).then(callback);
    } else {
      Promise.resolve(Intent.invoke(value, callback)).then(callback);
    }
  };

  // quick and dirty way to check for Promise/ish values
  const isPromise_ish = value => value != null && 'then' in value;

  // list of attributes that should not be directly assigned
  const readOnly = /^(?:form|list)$/i;

  // reused every slice time
  const slice = [].slice;

  // simplifies text node creation
  const text = (node, text) => node.ownerDocument.createTextNode(text);

  function Tagger(type) {
    this.type = type;
    return domtagger(this);
  }

  Tagger.prototype = {

    // there are four kind of attributes, and related behavior:
    //  * events, with a name starting with `on`, to add/remove event listeners
    //  * special, with a name present in their inherited prototype, accessed directly
    //  * regular, accessed through get/setAttribute standard DOM methods
    //  * style, the only regular attribute that also accepts an object as value
    //    so that you can style=${{width: 120}}. In this case, the behavior has been
    //    fully inspired by Preact library and its simplicity.
    attribute(node, name, original) {
      const isSVG = OWNER_SVG_ELEMENT in node;
      let oldValue;
      // if the attribute is the style one
      // handle it differently from others
      if (name === 'style')
        return hyperStyle(node, original, isSVG);
      // the name is an event one,
      // add/remove event listeners accordingly
      else if (/^on/.test(name)) {
        let type = name.slice(2);
        if (type === CONNECTED || type === DISCONNECTED) {
          observe(node);
        }
        else if (name.toLowerCase()
          in node) {
          type = type.toLowerCase();
        }
        return newValue => {
          if (oldValue !== newValue) {
            if (oldValue)
              node.removeEventListener(type, oldValue, false);
            oldValue = newValue;
            if (newValue)
              node.addEventListener(type, newValue, false);
          }
        };
      }
      // the attribute is special ('value' in input)
      // and it's not SVG *or* the name is exactly data,
      // in this case assign the value directly
      else if (
        name === 'data' ||
        (!isSVG && name in node && !readOnly.test(name))
      ) {
        return newValue => {
          if (oldValue !== newValue) {
            oldValue = newValue;
            if (node[name] !== newValue) {
              node[name] = newValue;
              if (newValue == null) {
                node.removeAttribute(name);
              }
            }
          }
        };
      }
      else if (name in Intent.attributes) {
        return any => {
          const newValue = Intent.attributes[name](node, any);
          if (oldValue !== newValue) {
            oldValue = newValue;
            if (newValue == null)
              node.removeAttribute(name);
            else
              node.setAttribute(name, newValue);
          }
        };
      }
      // in every other case, use the attribute node as it is
      // update only the value, set it as node only when/if needed
      else {
        let owner = false;
        const attribute = original.cloneNode(true);
        return newValue => {
          if (oldValue !== newValue) {
            oldValue = newValue;
            if (attribute.value !== newValue) {
              if (newValue == null) {
                if (owner) {
                  owner = false;
                  node.removeAttributeNode(attribute);
                }
                attribute.value = newValue;
              } else {
                attribute.value = newValue;
                if (!owner) {
                  owner = true;
                  node.setAttributeNode(attribute);
                }
              }
            }
          }
        };
      }
    },

    // in a hyper(node)`<div>${content}</div>` case
    // everything could happen:
    //  * it's a JS primitive, stored as text
    //  * it's null or undefined, the node should be cleaned
    //  * it's a component, update the content by rendering it
    //  * it's a promise, update the content once resolved
    //  * it's an explicit intent, perform the desired operation
    //  * it's an Array, resolve all values if Promises and/or
    //    update the node with the resulting list of content
    any(node, childNodes) {
      const diffOptions = {node: asNode, before: node};
      const nodeType = OWNER_SVG_ELEMENT in node ? /* istanbul ignore next */ 'svg' : 'html';
      let fastPath = false;
      let oldValue;
      const anyContent = value => {
        switch (typeof value) {
          case 'string':
          case 'number':
          case 'boolean':
            if (fastPath) {
              if (oldValue !== value) {
                oldValue = value;
                childNodes[0].textContent = value;
              }
            } else {
              fastPath = true;
              oldValue = value;
              childNodes = domdiff(
                node.parentNode,
                childNodes,
                [text(node, value)],
                diffOptions
              );
            }
            break;
          case 'function':
            anyContent(value(node));
            break;
          case 'object':
          case 'undefined':
            if (value == null) {
              fastPath = false;
              childNodes = domdiff(
                node.parentNode,
                childNodes,
                [],
                diffOptions
              );
              break;
            }
          default:
            fastPath = false;
            oldValue = value;
            if (isArray(value)) {
              if (value.length === 0) {
                if (childNodes.length) {
                  childNodes = domdiff(
                    node.parentNode,
                    childNodes,
                    [],
                    diffOptions
                  );
                }
              } else {
                switch (typeof value[0]) {
                  case 'string':
                  case 'number':
                  case 'boolean':
                    anyContent({html: value});
                    break;
                  case 'object':
                    if (isArray(value[0])) {
                      value = value.concat.apply([], value);
                    }
                    if (isPromise_ish(value[0])) {
                      Promise.all(value).then(anyContent);
                      break;
                    }
                  default:
                    childNodes = domdiff(
                      node.parentNode,
                      childNodes,
                      value,
                      diffOptions
                    );
                    break;
                }
              }
            } else if (canDiff(value)) {
              childNodes = domdiff(
                node.parentNode,
                childNodes,
                value.nodeType === DOCUMENT_FRAGMENT_NODE$1 ?
                  slice.call(value.childNodes) :
                  [value],
                diffOptions
              );
            } else if (isPromise_ish(value)) {
              value.then(anyContent);
            } else if ('placeholder' in value) {
              invokeAtDistance(value, anyContent);
            } else if ('text' in value) {
              anyContent(String(value.text));
            } else if ('any' in value) {
              anyContent(value.any);
            } else if ('html' in value) {
              childNodes = domdiff(
                node.parentNode,
                childNodes,
                slice.call(
                  createContent(
                    [].concat(value.html).join(''),
                    nodeType
                  ).childNodes
                ),
                diffOptions
              );
            } else if ('length' in value) {
              anyContent(slice.call(value));
            } else {
              anyContent(Intent.invoke(value, anyContent));
            }
            break;
        }
      };
      return anyContent;
    },

    // style or textareas don't accept HTML as content
    // it's pointless to transform or analyze anything
    // different from text there but it's worth checking
    // for possible defined intents.
    text(node) {
      let oldValue;
      const textContent = value => {
        if (oldValue !== value) {
          oldValue = value;
          const type = typeof value;
          if (type === 'object' && value) {
            if (isPromise_ish(value)) {
              value.then(textContent);
            } else if ('placeholder' in value) {
              invokeAtDistance(value, textContent);
            } else if ('text' in value) {
              textContent(String(value.text));
            } else if ('any' in value) {
              textContent(value.any);
            } else if ('html' in value) {
              textContent([].concat(value.html).join(''));
            } else if ('length' in value) {
              textContent(slice.call(value).join(''));
            } else {
              textContent(Intent.invoke(value, textContent));
            }
          } else if (type === 'function') {
            textContent(value(node));
          } else {
            node.textContent = value == null ? '' : value;
          }
        }
      };
      return textContent;
    }
  };

  /*! (c) Andrea Giammarchi - ISC */
  var templateLiteral = (function () {  var RAW = 'raw';
    var isNoOp = typeof document !== 'object';
    var templateLiteral = function (tl) {
      if (
        // for badly transpiled literals
        !(RAW in tl) ||
        // for some version of TypeScript
        tl.propertyIsEnumerable(RAW) ||
        // and some other version of TypeScript
        !Object.isFrozen(tl[RAW]) ||
        (
          // or for Firefox < 55
          /Firefox\/(\d+)/.test(
            (document.defaultView.navigator || {}).userAgent
          ) &&
          parseFloat(RegExp.$1) < 55
        )
      ) {
        var forever = {};
        templateLiteral = function (tl) {
          for (var key = '.', i = 0; i < tl.length; i++)
            key += tl[i].length + '.' + tl[i];
          return forever[key] || (forever[key] = tl);
        };
      } else {
        isNoOp = true;
      }
      return TL(tl);
    };
    return TL;
    function TL(tl) {
      return isNoOp ? tl : templateLiteral(tl);
    }
  }());

  function tta (template) {
    var length = arguments.length;
    var args = [templateLiteral(template)];
    var i = 1;
    while (i < length)
      args.push(arguments[i++]);
    return args;
  }

  // all wires used per each context
  const wires = new WeakMap$1;

  // A wire is a callback used as tag function
  // to lazily relate a generic object to a template literal.
  // hyper.wire(user)`<div id=user>${user.name}</div>`; => the div#user
  // This provides the ability to have a unique DOM structure
  // related to a unique JS object through a reusable template literal.
  // A wire can specify a type, as svg or html, and also an id
  // via html:id or :id convention. Such :id allows same JS objects
  // to be associated to different DOM structures accordingly with
  // the used template literal without losing previously rendered parts.
  const wire = (obj, type) => obj == null ?
    content(type || 'html') :
    weakly(obj, type || 'html');

  // A wire content is a virtual reference to one or more nodes.
  // It's represented by either a DOM node, or an Array.
  // In both cases, the wire content role is to simply update
  // all nodes through the list of related callbacks.
  // In few words, a wire content is like an invisible parent node
  // in charge of updating its content like a bound element would do.
  const content = type => {
    let wire, tagger, template;
    return function () {
      const args = tta.apply(null, arguments);
      if (template !== args[0]) {
        template = args[0];
        tagger = new Tagger(type);
        wire = wireContent(tagger.apply(tagger, args));
      } else {
        tagger.apply(tagger, args);
      }
      return wire;
    };
  };

  // wires are weakly created through objects.
  // Each object can have multiple wires associated
  // and this is thanks to the type + :id feature.
  const weakly = (obj, type) => {
    const i = type.indexOf(':');
    let wire = wires.get(obj);
    let id = type;
    if (-1 < i) {
      id = type.slice(i + 1);
      type = type.slice(0, i) || 'html';
    }
    if (!wire)
      wires.set(obj, wire = {});
    return wire[id] || (wire[id] = content(type));
  };

  // A document fragment loses its nodes 
  // as soon as it is appended into another node.
  // This has the undesired effect of losing wired content
  // on a second render call, because (by then) the fragment would be empty:
  // no longer providing access to those sub-nodes that ultimately need to
  // stay associated with the original interpolation.
  // To prevent hyperHTML from forgetting about a fragment's sub-nodes,
  // fragments are instead returned as an Array of nodes or, if there's only one entry,
  // as a single referenced node which, unlike fragments, will indeed persist
  // wire content throughout multiple renderings.
  // The initial fragment, at this point, would be used as unique reference to this
  // array of nodes or to this single referenced node.
  const wireContent = node => {
    const childNodes = node.childNodes;
    const {length} = childNodes;
    return length === 1 ?
      childNodes[0] :
      (length ? new Wire(childNodes) : node);
  };

  // a weak collection of contexts that
  // are already known to hyperHTML
  const bewitched = new WeakMap$1;

  // better known as hyper.bind(node), the render is
  // the main tag function in charge of fully upgrading
  // or simply updating, contexts used as hyperHTML targets.
  // The `this` context is either a regular DOM node or a fragment.
  function render() {
    const wicked = bewitched.get(this);
    const args = tta.apply(null, arguments);
    if (wicked && wicked.template === args[0]) {
      wicked.tagger.apply(null, args);
    } else {
      upgrade.apply(this, args);
    }
    return this;
  }

  // an upgrade is in charge of collecting template info,
  // parse it once, if unknown, to map all interpolations
  // as single DOM callbacks, relate such template
  // to the current context, and render it after cleaning the context up
  function upgrade(template) {
    const type = OWNER_SVG_ELEMENT in this ? 'svg' : 'html';
    const tagger = new Tagger(type);
    bewitched.set(this, {tagger, template: template});
    this.textContent = '';
    this.appendChild(tagger.apply(null, arguments));
  }

  /*! (c) Andrea Giammarchi (ISC) */

  // all functions are self bound to the right context
  // you can do the following
  // const {bind, wire} = hyperHTML;
  // and use them right away: bind(node)`hello!`;
  const bind = context => render.bind(context);

  // the wire content is the lazy defined
  // html or svg property of each hyper.Component
  setup(content);

  /*jshint browser:true, node:true*/

  var delegate = Delegate;

  /**
   * DOM event delegator
   *
   * The delegator will listen
   * for events that bubble up
   * to the root node.
   *
   * @constructor
   * @param {Node|string} [root] The root node or a selector string matching the root node
   */
  function Delegate(root) {

    /**
     * Maintain a map of listener
     * lists, keyed by event name.
     *
     * @type Object
     */
    this.listenerMap = [{}, {}];
    if (root) {
      this.root(root);
    }

    /** @type function() */
    this.handle = Delegate.prototype.handle.bind(this);
  }

  /**
   * Start listening for events
   * on the provided DOM element
   *
   * @param  {Node|string} [root] The root node or a selector string matching the root node
   * @returns {Delegate} This method is chainable
   */
  Delegate.prototype.root = function(root) {
    var listenerMap = this.listenerMap;
    var eventType;

    // Remove master event listeners
    if (this.rootElement) {
      for (eventType in listenerMap[1]) {
        if (listenerMap[1].hasOwnProperty(eventType)) {
          this.rootElement.removeEventListener(eventType, this.handle, true);
        }
      }
      for (eventType in listenerMap[0]) {
        if (listenerMap[0].hasOwnProperty(eventType)) {
          this.rootElement.removeEventListener(eventType, this.handle, false);
        }
      }
    }

    // If no root or root is not
    // a dom node, then remove internal
    // root reference and exit here
    if (!root || !root.addEventListener) {
      if (this.rootElement) {
        delete this.rootElement;
      }
      return this;
    }

    /**
     * The root node at which
     * listeners are attached.
     *
     * @type Node
     */
    this.rootElement = root;

    // Set up master event listeners
    for (eventType in listenerMap[1]) {
      if (listenerMap[1].hasOwnProperty(eventType)) {
        this.rootElement.addEventListener(eventType, this.handle, true);
      }
    }
    for (eventType in listenerMap[0]) {
      if (listenerMap[0].hasOwnProperty(eventType)) {
        this.rootElement.addEventListener(eventType, this.handle, false);
      }
    }

    return this;
  };

  /**
   * @param {string} eventType
   * @returns boolean
   */
  Delegate.prototype.captureForType = function(eventType) {
    return ['blur', 'error', 'focus', 'load', 'resize', 'scroll'].indexOf(eventType) !== -1;
  };

  /**
   * Attach a handler to one
   * event for all elements
   * that match the selector,
   * now or in the future
   *
   * The handler function receives
   * three arguments: the DOM event
   * object, the node that matched
   * the selector while the event
   * was bubbling and a reference
   * to itself. Within the handler,
   * 'this' is equal to the second
   * argument.
   *
   * The node that actually received
   * the event can be accessed via
   * 'event.target'.
   *
   * @param {string} eventType Listen for these events
   * @param {string|undefined} selector Only handle events on elements matching this selector, if undefined match root element
   * @param {function()} handler Handler function - event data passed here will be in event.data
   * @param {boolean} [useCapture] see 'useCapture' in <https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener>
   * @returns {Delegate} This method is chainable
   */
  Delegate.prototype.on = function(eventType, selector, handler, useCapture) {
    var root, listenerMap, matcher, matcherParam;

    if (!eventType) {
      throw new TypeError('Invalid event type: ' + eventType);
    }

    // handler can be passed as
    // the second or third argument
    if (typeof selector === 'function') {
      useCapture = handler;
      handler = selector;
      selector = null;
    }

    // Fallback to sensible defaults
    // if useCapture not set
    if (useCapture === undefined) {
      useCapture = this.captureForType(eventType);
    }

    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a type of Function');
    }

    root = this.rootElement;
    listenerMap = this.listenerMap[useCapture ? 1 : 0];

    // Add master handler for type if not created yet
    if (!listenerMap[eventType]) {
      if (root) {
        root.addEventListener(eventType, this.handle, useCapture);
      }
      listenerMap[eventType] = [];
    }

    if (!selector) {
      matcherParam = null;

      // COMPLEX - matchesRoot needs to have access to
      // this.rootElement, so bind the function to this.
      matcher = matchesRoot.bind(this);

    // Compile a matcher for the given selector
    } else if (/^[a-z]+$/i.test(selector)) {
      matcherParam = selector;
      matcher = matchesTag;
    } else if (/^#[a-z0-9\-_]+$/i.test(selector)) {
      matcherParam = selector.slice(1);
      matcher = matchesId;
    } else {
      matcherParam = selector;
      matcher = matches;
    }

    // Add to the list of listeners
    listenerMap[eventType].push({
      selector: selector,
      handler: handler,
      matcher: matcher,
      matcherParam: matcherParam
    });

    return this;
  };

  /**
   * Remove an event handler
   * for elements that match
   * the selector, forever
   *
   * @param {string} [eventType] Remove handlers for events matching this type, considering the other parameters
   * @param {string} [selector] If this parameter is omitted, only handlers which match the other two will be removed
   * @param {function()} [handler] If this parameter is omitted, only handlers which match the previous two will be removed
   * @returns {Delegate} This method is chainable
   */
  Delegate.prototype.off = function(eventType, selector, handler, useCapture) {
    var i, listener, listenerMap, listenerList, singleEventType;

    // Handler can be passed as
    // the second or third argument
    if (typeof selector === 'function') {
      useCapture = handler;
      handler = selector;
      selector = null;
    }

    // If useCapture not set, remove
    // all event listeners
    if (useCapture === undefined) {
      this.off(eventType, selector, handler, true);
      this.off(eventType, selector, handler, false);
      return this;
    }

    listenerMap = this.listenerMap[useCapture ? 1 : 0];
    if (!eventType) {
      for (singleEventType in listenerMap) {
        if (listenerMap.hasOwnProperty(singleEventType)) {
          this.off(singleEventType, selector, handler);
        }
      }

      return this;
    }

    listenerList = listenerMap[eventType];
    if (!listenerList || !listenerList.length) {
      return this;
    }

    // Remove only parameter matches
    // if specified
    for (i = listenerList.length - 1; i >= 0; i--) {
      listener = listenerList[i];

      if ((!selector || selector === listener.selector) && (!handler || handler === listener.handler)) {
        listenerList.splice(i, 1);
      }
    }

    // All listeners removed
    if (!listenerList.length) {
      delete listenerMap[eventType];

      // Remove the main handler
      if (this.rootElement) {
        this.rootElement.removeEventListener(eventType, this.handle, useCapture);
      }
    }

    return this;
  };


  /**
   * Handle an arbitrary event.
   *
   * @param {Event} event
   */
  Delegate.prototype.handle = function(event) {
    var i, l, type = event.type, root, phase, listener, returned, listenerList = [], target, /** @const */ EVENTIGNORE = 'ftLabsDelegateIgnore';

    if (event[EVENTIGNORE] === true) {
      return;
    }

    target = event.target;

    // Hardcode value of Node.TEXT_NODE
    // as not defined in IE8
    if (target.nodeType === 3) {
      target = target.parentNode;
    }

    root = this.rootElement;

    phase = event.eventPhase || ( event.target !== event.currentTarget ? 3 : 2 );
    
    switch (phase) {
      case 1: //Event.CAPTURING_PHASE:
        listenerList = this.listenerMap[1][type];
      break;
      case 2: //Event.AT_TARGET:
        if (this.listenerMap[0] && this.listenerMap[0][type]) listenerList = listenerList.concat(this.listenerMap[0][type]);
        if (this.listenerMap[1] && this.listenerMap[1][type]) listenerList = listenerList.concat(this.listenerMap[1][type]);
      break;
      case 3: //Event.BUBBLING_PHASE:
        listenerList = this.listenerMap[0][type];
      break;
    }

    // Need to continuously check
    // that the specific list is
    // still populated in case one
    // of the callbacks actually
    // causes the list to be destroyed.
    l = listenerList.length;
    while (target && l) {
      for (i = 0; i < l; i++) {
        listener = listenerList[i];

        // Bail from this loop if
        // the length changed and
        // no more listeners are
        // defined between i and l.
        if (!listener) {
          break;
        }

        // Check for match and fire
        // the event if there's one
        //
        // TODO:MCG:20120117: Need a way
        // to check if event#stopImmediatePropagation
        // was called. If so, break both loops.
        if (listener.matcher.call(target, listener.matcherParam, target)) {
          returned = this.fire(event, target, listener);
        }

        // Stop propagation to subsequent
        // callbacks if the callback returned
        // false
        if (returned === false) {
          event[EVENTIGNORE] = true;
          event.preventDefault();
          return;
        }
      }

      // TODO:MCG:20120117: Need a way to
      // check if event#stopPropagation
      // was called. If so, break looping
      // through the DOM. Stop if the
      // delegation root has been reached
      if (target === root) {
        break;
      }

      l = listenerList.length;
      target = target.parentElement;
    }
  };

  /**
   * Fire a listener on a target.
   *
   * @param {Event} event
   * @param {Node} target
   * @param {Object} listener
   * @returns {boolean}
   */
  Delegate.prototype.fire = function(event, target, listener) {
    return listener.handler.call(target, event, target);
  };

  /**
   * Check whether an element
   * matches a generic selector.
   *
   * @type function()
   * @param {string} selector A CSS selector
   */
  var matches = (function(el) {
    if (!el) return;
    var p = el.prototype;
    return (p.matches || p.matchesSelector || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector);
  }(Element));

  /**
   * Check whether an element
   * matches a tag selector.
   *
   * Tags are NOT case-sensitive,
   * except in XML (and XML-based
   * languages such as XHTML).
   *
   * @param {string} tagName The tag name to test against
   * @param {Element} element The element to test with
   * @returns boolean
   */
  function matchesTag(tagName, element) {
    return tagName.toLowerCase() === element.tagName.toLowerCase();
  }

  /**
   * Check whether an element
   * matches the root.
   *
   * @param {?String} selector In this case this is always passed through as null and not used
   * @param {Element} element The element to test with
   * @returns boolean
   */
  function matchesRoot(selector, element) {
    /*jshint validthis:true*/
    if (this.rootElement === window) return element === document;
    return this.rootElement === element;
  }

  /**
   * Check whether the ID of
   * the element in 'this'
   * matches the given ID.
   *
   * IDs are case-sensitive.
   *
   * @param {string} id The ID to test against
   * @param {Element} element The element to test with
   * @returns boolean
   */
  function matchesId(id, element) {
    return id === element.id;
  }

  /**
   * Short hand for off()
   * and root(), ie both
   * with no parameters
   *
   * @return void
   */
  Delegate.prototype.destroy = function() {
    this.off();
    this.root();
  };

  /**
   * @preserve Create and manage a DOM event delegator.
   *
   * @codingstandard ftlabs-jsv2
   * @copyright The Financial Times Limited [All Rights Reserved]
   * @license MIT License (see LICENSE.txt)
   */


  var lib = function(root) {
    return new delegate(root);
  };

  var Delegate_1 = delegate;
  lib.Delegate = Delegate_1;

  function getMapSvg() {
      return wire({}, 'svg')`
        <g id="BG" transform="matrix(0.42373,0,0,0.33971,-157.567,-76.9297)">
            <rect x="371.856" y="226.457" width="2831.97" height="2029.38" style="fill:rgb(235,235,235);"/>
        </g>
        <g id="street" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <path d="M-4.13,2003.38C-4.13,2003.38 352.917,1853.08 563.214,1824.39C773.511,1795.7 1047.07,1769.45 1191.18,1493.31C1233.42,1392.69 1236.15,1334.93 1109.83,1276.19C983.511,1217.46 954.597,956.914 966.081,911.492C977.566,866.07 1046.22,716.375 1089.88,682.609C1133.53,648.844 1205.99,620.031 1263.59,705.477C1321.19,790.922 1221.1,893.164 1135.48,871.992C1049.86,850.82 1032.47,903.102 1032,954.789C1031.53,1006.48 1022.46,1151.54 1216.73,1260.68C1277.84,1295.01 1308.47,1249.34 1282.14,1179.3C1267.07,1149.59 1247.58,1154.71 1227.52,1191.52C1180.39,1163.88 1092.29,1095.81 1098.73,970.82C1140.5,970.508 1154.89,969.925 1153.22,952.576C1166,951.065 1203.32,947.794 1203.32,947.794C1203.32,947.794 1200.48,961 1220.79,958.854C1241.1,956.708 1258.57,956.708 1258.57,956.708C1258.57,956.708 1259.72,1038.09 1312.71,1055.45C1302.52,1068.43 1297.62,1076.85 1291.42,1085.59C1285.21,1094.33 1293.2,1103.22 1302.87,1109.69C1312.55,1116.17 1350.16,1140.87 1356.14,1197.13C1363.56,1226.73 1374.11,1256.86 1380.58,1279.97C1408.67,1332.49 1420.32,1320.96 1438.06,1326.04C1455.79,1331.12 1598.75,1371.1 1623.15,1376.8C1647.55,1382.5 1701.11,1393.93 1723.9,1330.81C1746.7,1267.69 1783.99,1120.21 1825,1022.82C1866.02,925.427 1985.65,677.859 2028.44,620.26C2055.53,633.409 2090.17,655.013 2090.17,655.013C2090.17,655.013 1992.68,822.841 1943.82,930.284C1894.96,1037.73 1867.63,1091.72 1844.31,1169.69C1820.98,1247.66 1802.97,1289.67 1795.22,1322.35C1777.23,1381.44 1784.13,1423.41 1870.66,1455.9C1901.59,1469.9 2053.3,1553.87 2137.97,1605.35C2210.93,1651.41 2248.49,1631.97 2298.24,1560.77C2348.01,1489.57 2371.54,1454.28 2392.37,1443.18C2413.19,1432.09 2430.69,1388.76 2432.61,1369.13C2434.52,1349.51 2462.99,1279.44 2560.83,1289.47C2623.03,1295.85 2660.99,1379.45 2642.9,1432.74C2624.82,1486.02 2576.94,1513.73 2528.9,1510.73C2480.87,1507.74 2441.83,1475.29 2406.56,1523.51C2371.3,1571.72 2292.66,1668.34 2302.3,1688.65C2311.93,1708.96 2309.92,1724.53 2360.72,1759.06C2411.52,1793.59 2844.59,2099.37 2844.59,2099.37C2844.59,2099.37 2917.47,2171.48 2965.93,2096.88C3014.39,2022.27 3060.56,1945.77 3076.35,1918.22C3092.14,1890.67 3087.75,1869.07 3087.61,1846.12C3087.47,1823.18 3098.2,1742.4 3203.74,1737.33C3295.05,1751.18 3307.16,1836.2 3302.16,1858.66C3297.17,1881.13 3279.13,1956.79 3179.69,1952.08C3144.93,1954.07 3120.12,1956.1 3104.53,1982.26C3088.95,2008.42 3031.64,2093.87 3018.32,2119.78C3005,2145.68 2988.56,2195.26 3061.75,2228.31C3134.95,2261.37 3563.75,2432.64 3600.26,2445.08C3636.77,2457.52 3759.16,2515.19 3842.18,2565.72C4013.91,2685.51 4038.74,2731.04 4133.62,2818.69C4228.51,2906.34 4295.79,2967.86 4363.67,3000.96C4431.54,3034.05 4457.93,3010.34 4481.44,2974.77C4660.11,2728.34 4671.09,2468.29 4398.68,2252.48C4378.68,2235.29 4300.11,2211.46 4226.05,2171.92C4151.99,2132.38 4147.65,2060.56 4198.2,1999.68C4248.75,1938.79 4340.51,1969.58 4367.59,2019.98C4394.67,2070.39 4377.69,2105.57 4376.38,2132.39C4375.07,2159.2 4370.26,2177.49 4444.16,2210.73C4494.99,2251.18 4820.29,2485.47 4576.35,2935.67C4541.83,2988.89 4491.58,3059.35 4591.31,3097.24C4691.05,3135.12 4871.98,3173.65 4943.96,3210.86C5015.93,3248.07 5083.37,3235.93 5142.87,3153.04C5202.38,3070.15 5271.82,2983.09 5304.35,2942.1C5336.89,2901.1 5338.07,2857.96 5319.53,2821.15C5300.99,2784.34 5292.52,2731.9 5351.26,2690.4C5410.01,2648.89 5449.12,2679.32 5490.58,2705.66C5532.04,2731.99 5544.99,2826.38 5486.11,2872.2C5393.26,2903.27 5412.13,2902.35 5385.51,2939.28C5345.66,2991.65 5240.14,3122.21 5211.2,3158.92C5182.26,3195.62 5167.91,3218.8 5213.32,3299.47C5237.93,3361.76 5173.01,3421.73 5133.03,3433.09C5093.06,3444.45 5013.63,3447.11 4989.99,3357.41C4966.34,3267.7 4949.9,3279.21 4882.88,3251.68C4815.87,3224.15 4624.48,3184.54 4445.24,3104.59C4266,3024.65 4105.74,2874.1 3889.12,2675.43C3803.74,2599.97 3632.6,2523.6 3518.82,2478.22C3405.05,2432.84 3140.66,2336.08 2922.93,2220.12C2830.99,2159.3 2497.24,1925.27 2383.84,1845.76C2270.43,1766.26 2071.27,1616.36 1930.12,1554.63C1788.97,1492.9 1536.61,1415.19 1458.24,1400.51C1379.86,1385.82 1316.6,1374.05 1250.13,1513.87C1225.84,1557.57 1166.73,1725.49 900.602,1821.1C851.503,1841.56 608.988,1884.92 482.081,1911.73C355.175,1938.54 153.024,1998.47 0.571,2073.2C-13.143,2040.35 -15.169,2028.15 -4.13,2003.38Z" style="fill:rgb(166,166,166);stroke:black;stroke-width:4.77px;"/>
        </g>
        <g class="house" data-lot="75" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_75-3998-fellowship-dr" serif:id="75 3998-fellowship-dr">
                <path d="M897.617,1180.19L995.024,1313.28L890.352,1389.22L773.781,1259.19L813.734,1224.93L897.617,1180.19Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="74" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_74-3897-fellowship-dr" serif:id="74 3897-fellowship-dr">
                <path d="M855.359,1165.34L823.656,1014.34L675.352,1039.44L709.688,1193.39L855.359,1165.34Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="73" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_73-3887-fellowship-dr" serif:id="73 3887-fellowship-dr">
                <path d="M842.977,981.516L855.234,818.891L708.797,802.156L697.055,859.781L700.906,932.414L711.617,971.859L842.977,981.516Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="72" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_72-3877-fellowship-dr" serif:id="72 3877-fellowship-dr">
                <path d="M922.883,650.641L893.742,690.117L910.164,704.414L853.664,790.883L731.539,717.18L747.492,690.852L735.336,678.969L805.938,583.344L830.008,598.914L840.781,579.422L922.883,650.641Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="71" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_71-3867-fellowshp-dr" serif:id="71 3867-fellowshp-dr">
                <path d="M1038.06,579.477L1115.01,556.648L1113.87,535.598L1171.04,518.109L1138.29,395.594L978.727,438.645L980.43,488.609L1013.8,551.438L1028.02,550.512L1038.06,579.477Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="70" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_70-3868-fellowship-dr" serif:id="70 3868-fellowship-dr">
                <path d="M1257.54,421.27L1202.37,550.77L1328.61,615.633L1391.29,496.727L1257.54,421.27Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="69" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_69-3878-fellowship-dr" serif:id="69 3878-fellowship-dr">
                <path d="M1495.36,629.539L1517.2,763.391L1389.18,777.73L1365.57,643.359L1495.36,629.539Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="68" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_68-3938-fellowship-dr" serif:id="68 3938-fellowship-dr">
                <path d="M1667.31,1170.58L1652.93,1164.79L1656.37,1150.59L1507.41,1114.16L1476.68,1244.98L1540.84,1263.76L1546.52,1248.39L1638.88,1267.8L1667.31,1170.58Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="67" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_67-3012-jesse-mill-lane" serif:id="67 3012-jesse-mill-lane">
                <path d="M1650.31,899.484L1753.89,943.336L1701.88,1080.5L1596.83,1039.04L1650.31,899.484Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="66" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_66-30222-jesse-mill-lane" serif:id="66 30222-jesse-mill-lane">
                <path d="M1665.31,833L1735.14,692.953L1841.64,745.855L1764.82,900.805L1681.07,859.016L1685.18,839.504L1665.31,833Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="65" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_65-3023-jesse-mill-lane" serif:id="65 3023-jesse-mill-lane">
                <path d="M2206.17,898.625L2095.77,844.965L2032.24,991.816L2138.92,1037.32L2206.17,898.625Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="64" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_64-3113-jesse-mill-lane" serif:id="64 3113-jesse-mill-lane">
                <path d="M2094.44,1232.26L2118.32,1182.11L2104.13,1169.61L2147.54,1074.12L2048.61,1029.21L2021.9,1081.4L2001.22,1075.69L1955.4,1171.16L2094.44,1232.26Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="63" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_63-3003-jesse-mill-lane" serif:id="63 3003-jesse-mill-lane">
                <path d="M2100.24,1322.06L1962.81,1256L1947.48,1289.8L1931.07,1283.57L1900.57,1352.85L2052.18,1421.62L2100.24,1322.06Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="62" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_62-3004-home-town-court" serif:id="62 3004-home-town-court">
                <path d="M2303.27,1397.71L2212.14,1342.02L2121.49,1480.51L2215.12,1539.97L2303.27,1397.71Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="61" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_61-3014-home-twon-court" serif:id="61 3014-home-twon-court">
                <path d="M2406.27,1255.63L2326.15,1163.19L2212.29,1259.18L2295.86,1363.81L2373.66,1301.29L2364.02,1288.86L2406.27,1255.63Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="60" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_60-3024-home-town-court" serif:id="60 3024-home-town-court">
                <path d="M2396.97,1072.25L2421.07,1211.52L2576.98,1178.64L2550.42,1044.14L2396.97,1072.25Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="59" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_59-3034-home-town-court" serif:id="59 3034-home-town-court">
                <path d="M2650.27,1104.54L2606.53,1198.74L2734.35,1264.66L2781.64,1168.09L2650.27,1104.54Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="58" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_58-3025-home-town-court" serif:id="58 3025-home-town-court">
                <path d="M2741.39,1299.26L2746.36,1364.75L2765.94,1364.51L2775.59,1445.79L2894.42,1433.19L2872,1285.43L2741.39,1299.26Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="57" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_57-3015-home-town-court" serif:id="57 3015-home-town-court">
                <path d="M2856.51,1555.79L2784.29,1674.04L2664.03,1602.84L2728.3,1483.66L2856.51,1555.79Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="56" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_56" serif:id="56">
                <path d="M2626.67,1702L2509.06,1598.49L2438.67,1683.36L2562.63,1779.35L2626.67,1702Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="55" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_55-3998-fellowship-dr" serif:id="55 3998-fellowship-dr">
                <path d="M2791.22,1812.41L2711.72,1758.13L2702.83,1766.89L2652.96,1733.36L2606.4,1798.12L2739.49,1891.59L2791.22,1812.41Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="54" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_54-3016-friendship-court" serif:id="54 3016-friendship-court">
                <path d="M2845.58,1840.57L2955.91,1920.53L2891.04,2013.22L2837.42,1980.7L2845.79,1966.17L2812.36,1943.59L2824.14,1927.87L2796.93,1908.69L2845.58,1840.57Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="53" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_53-3026-friendship-court" serif:id="53 3026-friendship-court">
                <path d="M3047.24,1690.36L2959.33,1627.8L2870.77,1750.41L2954.7,1814.29L2965.05,1801.52L2977.9,1811.28L3010.11,1765.76L2996.59,1755.45L3047.24,1690.36Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="52" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_52-3037-friendship-court" serif:id="52 3037-friendship-court">
                <path d="M3433.16,1643.25L3346.94,1691.08L3385.92,1755.61L3371.56,1767.52L3406.57,1826.59L3421.78,1818.57L3432.22,1832.66L3516.69,1787.52L3433.16,1643.25Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="51" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_51-3027-friendship-court" serif:id="51 3027-friendship-court">
                <path d="M3522.26,1917.58L3481.81,2038.55L3377.73,2003.87L3396.78,1946.05L3379.64,1940.43L3395.18,1891.86L3422.6,1895.67L3426.78,1881.62L3522.26,1917.58Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="50" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_50-3017-friendship-court" serif:id="50 3017-friendship-court">
                <path d="M3297.75,2095.45L3166.87,2045.25L3125.84,2145.35L3245.68,2189.56L3254.49,2169.55L3268.73,2174.68L3297.75,2095.45Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="49" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_49-4038-fellowship-dr" serif:id="49 4038-fellowship-dr">
                <path d="M3350.62,2101.07L3402.92,2121.47L3408.02,2110.39L3441.9,2124.05L3434.36,2141L3464.43,2152.81L3462.01,2160.37L3485.81,2169.54L3453.7,2256.28L3399.51,2236.5L3395.11,2247.03L3380.03,2241.55L3373.94,2260.1L3316.14,2237L3324.07,2215.77L3308.63,2210.76L3350.62,2101.07Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="48" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_48-4048-fellowship-dr" serif:id="48 4048-fellowship-dr">
                <path d="M3512.92,2195.48L3622.38,2237.5L3627.4,2225.75L3653.82,2236.94L3611.39,2349.32L3470.81,2295.79L3512.92,2195.48Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="47" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_47" serif:id="47">
                <path d="M3693.25,2256.34L3647.17,2359.03L3780.14,2419.29L3828.69,2319L3693.25,2256.34Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="46" transform="matrix(0.208466,0.0214863,-0.0214863,0.208466,88.7772,-143.662)">
            <g id="_46-4068-fellowship-dr" serif:id="46 4068-fellowship-dr">
                <path d="M3693.25,2256.34L3647.17,2359.03L3780.14,2419.29L3828.69,2319L3693.25,2256.34Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="45" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_45-4078-fellowship-dr" serif:id="45 4078-fellowship-dr">
                <path d="M4051.38,2486.44L4163.49,2590.37L4106.83,2655.74L3990.71,2555.37L4051.38,2486.44Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="44" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_44-4088-fellowship-dr" serif:id="44 4088-fellowship-dr">
                <path d="M4182.48,2609.94L4293.95,2711.52L4233.03,2776.75L4118.4,2673.31L4182.48,2609.94Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="43" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_43-4098-fellowship-dr" serif:id="43 4098-fellowship-dr">
                <path d="M4478.43,2778.17L4385.75,2725.78L4319.63,2846.35L4406.8,2898.65L4478.43,2778.17Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="42" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_42-3048-society-trace" serif:id="42 3048-society-trace">
                <path d="M4394.67,2674.2L4387.98,2537.03L4468.46,2534.04L4469.65,2543.98L4500.62,2544.93L4504,2668.74L4394.67,2674.2Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="41" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_41-3068-society-trace" serif:id="41 3068-society-trace">
                <path d="M4432.6,2434.06L4369.6,2496.94L4267.29,2404.67L4330.63,2333.73L4348.17,2350.68C4353.21,2345.58 4357.13,2341.97 4359.78,2339.82L4398.62,2379.38L4389.47,2387.9L4432.6,2434.06Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="40" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_40-3078-society-trace" serif:id="40 3078-society-trace">
                <path d="M4281.63,2317.59L4226.24,2410.29L4097.38,2337.36L4156.88,2242.21L4281.63,2317.59Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="39" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_39-3088-society-trace" serif:id="39 3088-society-trace">
                <path d="M4083,2140.74L4033.44,2070.71L3936.23,2138.03L3979.31,2202.4L3955.72,2219.9L3977.52,2251.06L4007.66,2231.57L4024.17,2257.37L4102.95,2203.56L4067.71,2151.02L4083,2140.74Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="38" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_38-3098-society-trace" serif:id="38 3098-society-trace">
                <path d="M4050.56,2032.96L3977.99,1974.35L4078.29,1859.61L4145.19,1921.5L4088.41,1988.69L4096.93,1996.02L4082.64,2013.78L4073.35,2008.53L4050.56,2032.96Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.77px;"/>
            </g>
        </g>
        <g class="house" data-lot="37" transform="matrix(0.142909,0.127885,-0.139752,0.15617,605.408,-563.962)">
            <g id="_37" serif:id="37">
                <rect id="_371" serif:id="37" x="4627.36" y="2099.44" width="168.227" height="110.754" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.64px;"/>
            </g>
        </g>
        <g class="house" data-lot="36" transform="matrix(0.0676682,0.179672,-0.195845,0.0737593,1108.9,-591.472)">
            <g id="_36" serif:id="36">
                <rect x="4627.36" y="2099.44" width="168.227" height="110.754" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.64px;"/>
            </g>
        </g>
        <g class="house" data-lot="35" transform="matrix(-0.00652777,0.191664,-0.209449,-0.0071335,1500.8,-431.785)">
            <g id="_35" serif:id="35">
                <rect x="4627.36" y="2099.44" width="168.227" height="110.754" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.64px;"/>
            </g>
        </g>
        <g class="house" data-lot="34" transform="matrix(-0.0352055,0.174055,-0.201883,-0.040834,1613.97,-236.043)">
            <g id="_34" serif:id="34">
                <rect x="4627.36" y="2099.44" width="168.227" height="110.754" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.93px;"/>
            </g>
        </g>
        <g class="house" data-lot="33" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_33" serif:id="33">
                <path d="M4805.88,3014.09L4789.27,3057.03L4653.88,3004.7L4711.14,2856.58L4846.53,2908.91L4828.51,2955.54L4857.16,2966.61L4834.53,3025.16L4805.88,3014.09Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="32" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_32" serif:id="32">
                <path d="M5001.58,3116.28L4997.61,3126.55L4871.53,3077.81L4913.67,2968.8L5039.75,3017.54L5022.06,3063.32L5033.09,3067.58L5012.61,3120.55L5001.58,3116.28Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="31" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_31" serif:id="31">
                <path d="M5173.73,2915.95L5150.2,2973.37L5051.94,2933.1L5110.69,2789.75L5208.95,2830.02L5194.92,2864.25L5206.87,2869.15L5185.68,2920.85L5173.73,2915.95Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="30" transform="matrix(0.206864,0.0335726,-0.0335726,0.206864,130.503,-293.882)">
            <g id="_30" serif:id="30">
                <path d="M5173.73,2915.95L5150.2,2973.37L5051.94,2933.1L5110.69,2789.75L5208.95,2830.02L5194.92,2864.25L5206.87,2869.15L5185.68,2920.85L5173.73,2915.95Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="29" transform="matrix(0.0319466,0.207121,-0.207121,0.0319466,1570.66,-700.3)">
            <g id="_29" serif:id="29">
                <path d="M5173.73,2915.95L5150.2,2973.37L5051.94,2933.1L5110.69,2789.75L5208.95,2830.02L5194.92,2864.25L5206.87,2869.15L5185.68,2920.85L5173.73,2915.95Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="28" transform="matrix(-0.0490437,0.203751,-0.203751,-0.0490437,2013.91,-431.974)">
            <g id="_28" serif:id="28">
                <path d="M5173.73,2915.95L5150.2,2973.37L5051.94,2933.1L5110.69,2789.75L5208.95,2830.02L5194.92,2864.25L5206.87,2869.15L5185.68,2920.85L5173.73,2915.95Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="27" transform="matrix(0.20957,0,0,0.20957,9.46548,-81.2904)">
            <g id="_27" serif:id="27">
                <path d="M5592.41,2773.37L5601.67,2753L5680.84,2789L5624.01,2913.97L5544.85,2877.97L5578.84,2803.22L5564.54,2796.72L5578.12,2766.87L5592.41,2773.37Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="26" transform="matrix(0.190713,0.027249,-0.0244929,0.171423,169.89,-97.43)">
            <g id="_26" serif:id="26">
                <path d="M5592.41,2773.37L5601.67,2753L5680.84,2789L5624.01,2913.97L5544.85,2877.97L5578.84,2803.22L5564.54,2796.72L5578.12,2766.87L5592.41,2773.37Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:7.28px;"/>
            </g>
        </g>
        <g class="house" data-lot="25" transform="matrix(0.190713,0.027249,-0.0244929,0.171423,152.136,-75.0117)">
            <g id="_25" serif:id="25">
                <path d="M5592.41,2773.37L5601.67,2753L5680.84,2789L5624.01,2913.97L5544.85,2877.97L5578.84,2803.22L5564.54,2796.72L5578.12,2766.87L5592.41,2773.37Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:7.28px;"/>
            </g>
        </g>
        <g class="house" data-lot="24" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_24" serif:id="24">
                <path d="M5379.65,3161.94L5391.93,3144.78L5488.32,3213.77L5402.93,3333.09L5306.53,3264.1L5336.3,3222.51L5317.36,3208.95L5360.71,3148.38L5379.65,3161.94Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="23" transform="matrix(0.20957,0,0,0.20957,-12.5309,-41.7007)">
            <g id="_23" serif:id="23">
                <path d="M5379.65,3161.94L5391.93,3144.78L5488.32,3213.77L5402.93,3333.09L5306.53,3264.1L5336.3,3222.51L5317.36,3208.95L5360.71,3148.38L5379.65,3161.94Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="22" transform="matrix(0.189558,-0.0893737,0.0959221,0.203446,-231.482,406.763)">
            <g id="_22" serif:id="22">
                <rect x="5080.21" y="3503.26" width="156.359" height="117.898" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.13px;"/>
            </g>
        </g>
        <g class="house" data-lot="21" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_21" serif:id="21">
                <path d="M4958.6,3501.05L4962.58,3491.18L5014.91,3512.32L5010.92,3522.18L5049.96,3537.95L5016.6,3620.55L5002.2,3614.74L4996.88,3627.91L4944.55,3606.78L4949.88,3593.6L4876.75,3564.06L4910.12,3481.46L4958.6,3501.05Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="20" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_20" serif:id="20">
                <path d="M4835.49,3365.55L4843.4,3346.07L4902.08,3369.88L4891.18,3396.74L4891.42,3396.84L4854.15,3488.68L4768.42,3453.89L4771.42,3446.51L4711.66,3422.26L4748.93,3330.42L4835.49,3365.55Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="19" transform="matrix(0.24333,0.0732084,-0.0473149,0.157265,3.76002,-246.507)">
            <g id="_19" serif:id="19">
                <rect x="4562.16" y="3278.18" width="121.568" height="125.297" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.23px;"/>
            </g>
        </g>
        <g class="house" data-lot="18" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_18" serif:id="18">
                <path d="M4339.6,3280.07L4339.05,3279.85L4379.14,3181.67L4457.01,3213.47L4448.65,3233.94L4524.43,3264.88L4484.34,3363.06L4331.24,3300.54L4339.6,3280.07Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="17" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_17" serif:id="17">
                <path d="M4211.91,3138.36L4225.91,3115.09L4336.32,3181.49L4276.96,3280.21L4263.21,3271.94L4262.89,3272.49L4152.47,3206.09L4198.16,3130.09L4211.91,3138.36Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="16" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_16" serif:id="16">
                <path d="M4079.31,3000.24L4092.66,2983.98L4139.21,3022.17L4125.87,3038.43L4176.62,3080.06L4120.03,3149.06L4119.21,3148.38L4101.89,3169.49L3988.35,3076.36L4044.95,3007.37L4053.74,3014.58L4071.05,2993.47L4079.31,3000.24Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="15" transform="matrix(0.229333,0.208081,-0.13805,0.152149,318.841,-738.184)">
            <g id="_15" serif:id="15">
                <rect x="3921.21" y="2856.91" width="119.958" height="131.339" style="fill:rgb(128,128,128);stroke:black;stroke-width:5.07px;"/>
            </g>
        </g>
        <g class="house" data-lot="14" transform="matrix(0.15667,0.139192,-0.139192,0.15667,597.032,-459.316)">
            <g id="_14" serif:id="14">
                <rect x="3694.63" y="2748.6" width="180.206" height="131.883" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="13" transform="matrix(0.183996,0.100325,-0.106217,0.194803,394.973,-409.593)">
            <g id="_13" serif:id="13">
                <rect x="3509.83" y="2677.3" width="168.578" height="127.781" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.18px;"/>
            </g>
        </g>
        <g class="house" data-lot="12" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_12" serif:id="12">
                <path d="M3451.33,2566.08L3457.26,2552.41L3514.41,2575.78L3508.91,2589.66L3557.59,2609.6L3518.37,2705.37L3360.77,2640.83L3399.99,2545.06L3451.33,2566.08Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="11" transform="matrix(0.17341,0.0703282,-0.0877026,0.21625,346.526,-337.31)">
            <g id="_11" serif:id="11">
                <rect x="3187.01" y="2525.91" width="188.455" height="121.553" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.3px;"/>
            </g>
        </g>
        <g class="house" data-lot="10" transform="matrix(0.195542,0.0753863,-0.119651,0.310358,342.873,-573.316)">
            <g id="_10" serif:id="10">
                <rect x="3045.2" y="2460.12" width="159.773" height="81.289" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.8px;"/>
            </g>
        </g>
        <g class="house" data-lot="9" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_9" serif:id="9">
                <path d="M2883.76,2358.92L2896.16,2332.34L3022.17,2391.08L2986.16,2468.33L2981.84,2466.32L2969.45,2492.9L2834.49,2429.99L2870.5,2352.74L2883.76,2358.92Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="8" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_8" serif:id="8">
                <path d="M2724.94,2233.38L2735.31,2217.36L2796.34,2256.89L2785.97,2272.91L2850.02,2314.39L2792.16,2403.72L2646.6,2309.44L2704.45,2220.11L2724.94,2233.38Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="7" transform="matrix(0.207228,0.138332,-0.173529,0.259956,398.606,-559.237)">
            <g id="_7" serif:id="7">
                <rect x="2496.74" y="2182.15" width="151.981" height="92.07" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.72px;"/>
            </g>
        </g>
        <g class="house" data-lot="6" transform="matrix(0.230659,0.160613,-0.154538,0.221935,267.013,-490.433)">
            <g id="_6" serif:id="6">
                <rect x="2345.86" y="1996.33" width="151.58" height="108.436" style="fill:rgb(128,128,128);stroke:black;stroke-width:4.83px;"/>
            </g>
        </g>
        <g class="house" data-lot="5" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_5" serif:id="5">
                <path d="M2209.35,1881.34L2223.14,1861.48L2311.02,1922.51L2297.22,1942.38L2352.11,1980.5L2286.65,2074.75L2135,1969.41L2200.46,1875.17L2209.35,1881.34Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="4" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_4" serif:id="4">
                <path d="M2104.09,1799.56L2117.58,1780.4L2199.42,1839.6C2195.35,1846.29 2190.85,1852.68 2185.93,1858.76L2193.7,1863.6L2126.64,1958.88L1994.23,1865.69L2061.3,1770.41L2104.09,1799.56Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="3" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_3" serif:id="3">
                <path d="M1900.52,1808.69L1832.75,1776.05L1893.7,1649.5L1997.81,1699.64L1984.52,1727.24L2037.85,1752.93L1990.2,1851.88L1900.52,1808.69L1900.52,1808.69Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g class="house" data-lot="2" transform="matrix(0.219575,0.0787768,-0.0919989,0.256429,133.281,-292.347)">
            <g id="_2" serif:id="2">
                <rect x="1685.96" y="1587.41" width="151.852" height="100.631" style="fill:rgb(128,128,128);stroke:black;stroke-width:5.26px;"/>
            </g>
        </g>
        <g class="house" data-lot="1" transform="matrix(0.20957,0,0,0.20957,2.35401,-82.9047)">
            <g id="_1" serif:id="1">
                <path d="M1499.08,1528.36L1506.1,1504.47L1600.7,1532.29L1593.68,1556.18L1658.64,1575.29L1626.22,1685.54L1613.99,1681.95L1611.1,1691.77L1522.79,1665.8L1525.68,1655.98L1458.41,1636.2L1490.83,1525.94L1499.08,1528.36Z" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>
        <g id="pool" transform="matrix(1,0,0,1,-2676,-1647.8)">
            <g transform="matrix(0.208325,0.0825804,-0.0764643,0.192896,2757.34,1468.66)">
                <rect x="1348.77" y="996.24" width="106.456" height="97.12" style="fill:rgb(128,128,128);stroke:black;stroke-width:6.17px;"/>
            </g>
            <g transform="matrix(0.305897,0.121258,-0.131651,0.332115,2683.15,1241.24)">
                <rect x="1348.77" y="996.24" width="106.456" height="97.12" style="fill:rgb(191,191,191);stroke:black;stroke-width:3.88px;"/>
            </g>
            <g transform="matrix(0.20957,0,0,0.20957,2678.35,1564.9)">
                <path d="M1374.1,900.357L1365.02,896.758L1384.11,848.603L1461.02,879.091L1441.93,927.246L1440.85,929.991L1452.15,934.471L1444.56,953.602L1456.53,958.347L1449.05,977.221L1460.94,981.937L1450.51,1008.27L1405.11,990.274L1405.28,989.855L1375.33,977.984L1340.86,964.32L1351.89,936.498L1358.7,939.2L1374.1,900.357Z" style="fill:rgb(0,214,255);stroke:black;stroke-width:6.36px;"/>
            </g>
            <g transform="matrix(0.20957,0,0,0.20957,2678.35,1564.9)">
                <path d="M3698.54,1603.85C3698.54,1603.85 3901.66,1692.54 3911.75,1697.16C3921.83,1701.77 3938.4,1706.04 3915.95,1753.66C3893.49,1801.29 3894.86,1765.43 3849.12,1843.91C3803.39,1922.4 3775.38,2003.08 3782.42,2041.69C3789.47,2080.31 3802.94,2121.54 3755.49,2118.42C3708.05,2115.3 3651.78,2084.27 3652.88,2047.23C3653.97,2010.19 3681.13,1896.09 3659.5,1791.54C3637.88,1686.98 3629.78,1660.91 3622.51,1641C3615.25,1621.09 3613,1583.35 3648.02,1614.39C3683.03,1645.43 3703.1,1625.86 3698.54,1603.85Z" style="fill:rgb(0,142,182);stroke:black;stroke-width:6.36px;"/>
            </g>
        </g>`
  }

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.

  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */
  /* global Reflect, Promise */

  var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
          function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
      return extendStatics(d, b);
  };

  function __extends(d, b) {
      extendStatics(d, b);
      function __() { this.constructor = d; }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }

  var __assign = function() {
      __assign = Object.assign || function __assign(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i];
              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
          }
          return t;
      };
      return __assign.apply(this, arguments);
  };

  function __rest(s, e) {
      var t = {};
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
          t[p] = s[p];
      if (s != null && typeof Object.getOwnPropertySymbols === "function")
          for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
              t[p[i]] = s[p[i]];
      return t;
  }

  function __awaiter(thisArg, _arguments, P, generator) {
      return new (P || (P = Promise))(function (resolve, reject) {
          function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
          function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
          function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
  }

  function __generator(thisArg, body) {
      var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
      function verb(n) { return function (v) { return step([n, v]); }; }
      function step(op) {
          if (f) throw new TypeError("Generator is already executing.");
          while (_) try {
              if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
              if (y = 0, t) op = [op[0] & 2, t.value];
              switch (op[0]) {
                  case 0: case 1: t = op; break;
                  case 4: _.label++; return { value: op[1], done: false };
                  case 5: _.label++; y = op[1]; op = [0]; continue;
                  case 7: op = _.ops.pop(); _.trys.pop(); continue;
                  default:
                      if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                      if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                      if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                      if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                      if (t[2]) _.ops.pop();
                      _.trys.pop(); continue;
              }
              op = body.call(thisArg, _);
          } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
          if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
      }
  }

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  var nodejsCustomInspectSymbol = typeof Symbol === 'function' ? Symbol.for('nodejs.util.inspect.custom') : undefined;

  function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }
  var MAX_ARRAY_LENGTH = 10;
  var MAX_RECURSIVE_DEPTH = 2;
  /**
   * Used to print values in error messages.
   */

  function inspect(value) {
    return formatValue(value, []);
  }

  function formatValue(value, seenValues) {
    switch (_typeof(value)) {
      case 'string':
        return JSON.stringify(value);

      case 'function':
        return value.name ? "[function ".concat(value.name, "]") : '[function]';

      case 'object':
        return formatObjectValue(value, seenValues);

      default:
        return String(value);
    }
  }

  function formatObjectValue(value, previouslySeenValues) {
    if (previouslySeenValues.indexOf(value) !== -1) {
      return '[Circular]';
    }

    var seenValues = [].concat(previouslySeenValues, [value]);

    if (value) {
      var customInspectFn = getCustomFn(value);

      if (customInspectFn) {
        // $FlowFixMe(>=0.90.0)
        var customValue = customInspectFn.call(value); // check for infinite recursion

        if (customValue !== value) {
          return typeof customValue === 'string' ? customValue : formatValue(customValue, seenValues);
        }
      } else if (Array.isArray(value)) {
        return formatArray(value, seenValues);
      }

      return formatObject(value, seenValues);
    }

    return String(value);
  }

  function formatObject(object, seenValues) {
    var keys = Object.keys(object);

    if (keys.length === 0) {
      return '{}';
    }

    if (seenValues.length > MAX_RECURSIVE_DEPTH) {
      return '[' + getObjectTag(object) + ']';
    }

    var properties = keys.map(function (key) {
      var value = formatValue(object[key], seenValues);
      return key + ': ' + value;
    });
    return '{ ' + properties.join(', ') + ' }';
  }

  function formatArray(array, seenValues) {
    if (array.length === 0) {
      return '[]';
    }

    if (seenValues.length > MAX_RECURSIVE_DEPTH) {
      return '[Array]';
    }

    var len = Math.min(MAX_ARRAY_LENGTH, array.length);
    var remaining = array.length - len;
    var items = [];

    for (var i = 0; i < len; ++i) {
      items.push(formatValue(array[i], seenValues));
    }

    if (remaining === 1) {
      items.push('... 1 more item');
    } else if (remaining > 1) {
      items.push("... ".concat(remaining, " more items"));
    }

    return '[' + items.join(', ') + ']';
  }

  function getCustomFn(object) {
    var customInspectFn = object[String(nodejsCustomInspectSymbol)];

    if (typeof customInspectFn === 'function') {
      return customInspectFn;
    }

    if (typeof object.inspect === 'function') {
      return object.inspect;
    }
  }

  function getObjectTag(object) {
    var tag = Object.prototype.toString.call(object).replace(/^\[object /, '').replace(/]$/, '');

    if (tag === 'Object' && typeof object.constructor === 'function') {
      var name = object.constructor.name;

      if (typeof name === 'string') {
        return name;
      }
    }

    return tag;
  }

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  var QueryDocumentKeys = {
    Name: [],
    Document: ['definitions'],
    OperationDefinition: ['name', 'variableDefinitions', 'directives', 'selectionSet'],
    VariableDefinition: ['variable', 'type', 'defaultValue', 'directives'],
    Variable: ['name'],
    SelectionSet: ['selections'],
    Field: ['alias', 'name', 'arguments', 'directives', 'selectionSet'],
    Argument: ['name', 'value'],
    FragmentSpread: ['name', 'directives'],
    InlineFragment: ['typeCondition', 'directives', 'selectionSet'],
    FragmentDefinition: ['name', // Note: fragment variable definitions are experimental and may be changed
    // or removed in the future.
    'variableDefinitions', 'typeCondition', 'directives', 'selectionSet'],
    IntValue: [],
    FloatValue: [],
    StringValue: [],
    BooleanValue: [],
    NullValue: [],
    EnumValue: [],
    ListValue: ['values'],
    ObjectValue: ['fields'],
    ObjectField: ['name', 'value'],
    Directive: ['name', 'arguments'],
    NamedType: ['name'],
    ListType: ['type'],
    NonNullType: ['type'],
    SchemaDefinition: ['directives', 'operationTypes'],
    OperationTypeDefinition: ['type'],
    ScalarTypeDefinition: ['description', 'name', 'directives'],
    ObjectTypeDefinition: ['description', 'name', 'interfaces', 'directives', 'fields'],
    FieldDefinition: ['description', 'name', 'arguments', 'type', 'directives'],
    InputValueDefinition: ['description', 'name', 'type', 'defaultValue', 'directives'],
    InterfaceTypeDefinition: ['description', 'name', 'directives', 'fields'],
    UnionTypeDefinition: ['description', 'name', 'directives', 'types'],
    EnumTypeDefinition: ['description', 'name', 'directives', 'values'],
    EnumValueDefinition: ['description', 'name', 'directives'],
    InputObjectTypeDefinition: ['description', 'name', 'directives', 'fields'],
    DirectiveDefinition: ['description', 'name', 'arguments', 'locations'],
    SchemaExtension: ['directives', 'operationTypes'],
    ScalarTypeExtension: ['name', 'directives'],
    ObjectTypeExtension: ['name', 'interfaces', 'directives', 'fields'],
    InterfaceTypeExtension: ['name', 'directives', 'fields'],
    UnionTypeExtension: ['name', 'directives', 'types'],
    EnumTypeExtension: ['name', 'directives', 'values'],
    InputObjectTypeExtension: ['name', 'directives', 'fields']
  };
  var BREAK = {};
  /**
   * visit() will walk through an AST using a depth first traversal, calling
   * the visitor's enter function at each node in the traversal, and calling the
   * leave function after visiting that node and all of its child nodes.
   *
   * By returning different values from the enter and leave functions, the
   * behavior of the visitor can be altered, including skipping over a sub-tree of
   * the AST (by returning false), editing the AST by returning a value or null
   * to remove the value, or to stop the whole traversal by returning BREAK.
   *
   * When using visit() to edit an AST, the original AST will not be modified, and
   * a new version of the AST with the changes applied will be returned from the
   * visit function.
   *
   *     const editedAST = visit(ast, {
   *       enter(node, key, parent, path, ancestors) {
   *         // @return
   *         //   undefined: no action
   *         //   false: skip visiting this node
   *         //   visitor.BREAK: stop visiting altogether
   *         //   null: delete this node
   *         //   any value: replace this node with the returned value
   *       },
   *       leave(node, key, parent, path, ancestors) {
   *         // @return
   *         //   undefined: no action
   *         //   false: no action
   *         //   visitor.BREAK: stop visiting altogether
   *         //   null: delete this node
   *         //   any value: replace this node with the returned value
   *       }
   *     });
   *
   * Alternatively to providing enter() and leave() functions, a visitor can
   * instead provide functions named the same as the kinds of AST nodes, or
   * enter/leave visitors at a named key, leading to four permutations of
   * visitor API:
   *
   * 1) Named visitors triggered when entering a node a specific kind.
   *
   *     visit(ast, {
   *       Kind(node) {
   *         // enter the "Kind" node
   *       }
   *     })
   *
   * 2) Named visitors that trigger upon entering and leaving a node of
   *    a specific kind.
   *
   *     visit(ast, {
   *       Kind: {
   *         enter(node) {
   *           // enter the "Kind" node
   *         }
   *         leave(node) {
   *           // leave the "Kind" node
   *         }
   *       }
   *     })
   *
   * 3) Generic visitors that trigger upon entering and leaving any node.
   *
   *     visit(ast, {
   *       enter(node) {
   *         // enter any node
   *       },
   *       leave(node) {
   *         // leave any node
   *       }
   *     })
   *
   * 4) Parallel visitors for entering and leaving nodes of a specific kind.
   *
   *     visit(ast, {
   *       enter: {
   *         Kind(node) {
   *           // enter the "Kind" node
   *         }
   *       },
   *       leave: {
   *         Kind(node) {
   *           // leave the "Kind" node
   *         }
   *       }
   *     })
   */

  function visit(root, visitor) {
    var visitorKeys = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : QueryDocumentKeys;

    /* eslint-disable no-undef-init */
    var stack = undefined;
    var inArray = Array.isArray(root);
    var keys = [root];
    var index = -1;
    var edits = [];
    var node = undefined;
    var key = undefined;
    var parent = undefined;
    var path = [];
    var ancestors = [];
    var newRoot = root;
    /* eslint-enable no-undef-init */

    do {
      index++;
      var isLeaving = index === keys.length;
      var isEdited = isLeaving && edits.length !== 0;

      if (isLeaving) {
        key = ancestors.length === 0 ? undefined : path[path.length - 1];
        node = parent;
        parent = ancestors.pop();

        if (isEdited) {
          if (inArray) {
            node = node.slice();
          } else {
            var clone = {};

            for (var _i = 0, _Object$keys = Object.keys(node); _i < _Object$keys.length; _i++) {
              var k = _Object$keys[_i];
              clone[k] = node[k];
            }

            node = clone;
          }

          var editOffset = 0;

          for (var ii = 0; ii < edits.length; ii++) {
            var editKey = edits[ii][0];
            var editValue = edits[ii][1];

            if (inArray) {
              editKey -= editOffset;
            }

            if (inArray && editValue === null) {
              node.splice(editKey, 1);
              editOffset++;
            } else {
              node[editKey] = editValue;
            }
          }
        }

        index = stack.index;
        keys = stack.keys;
        edits = stack.edits;
        inArray = stack.inArray;
        stack = stack.prev;
      } else {
        key = parent ? inArray ? index : keys[index] : undefined;
        node = parent ? parent[key] : newRoot;

        if (node === null || node === undefined) {
          continue;
        }

        if (parent) {
          path.push(key);
        }
      }

      var result = void 0;

      if (!Array.isArray(node)) {
        if (!isNode(node)) {
          throw new Error('Invalid AST Node: ' + inspect(node));
        }

        var visitFn = getVisitFn(visitor, node.kind, isLeaving);

        if (visitFn) {
          result = visitFn.call(visitor, node, key, parent, path, ancestors);

          if (result === BREAK) {
            break;
          }

          if (result === false) {
            if (!isLeaving) {
              path.pop();
              continue;
            }
          } else if (result !== undefined) {
            edits.push([key, result]);

            if (!isLeaving) {
              if (isNode(result)) {
                node = result;
              } else {
                path.pop();
                continue;
              }
            }
          }
        }
      }

      if (result === undefined && isEdited) {
        edits.push([key, node]);
      }

      if (isLeaving) {
        path.pop();
      } else {
        stack = {
          inArray: inArray,
          index: index,
          keys: keys,
          edits: edits,
          prev: stack
        };
        inArray = Array.isArray(node);
        keys = inArray ? node : visitorKeys[node.kind] || [];
        index = -1;
        edits = [];

        if (parent) {
          ancestors.push(parent);
        }

        parent = node;
      }
    } while (stack !== undefined);

    if (edits.length !== 0) {
      newRoot = edits[edits.length - 1][1];
    }

    return newRoot;
  }

  function isNode(maybeNode) {
    return Boolean(maybeNode && typeof maybeNode.kind === 'string');
  }
  /**
   * Given a visitor instance, if it is leaving or not, and a node kind, return
   * the function the visitor runtime should call.
   */

  function getVisitFn(visitor, kind, isLeaving) {
    var kindVisitor = visitor[kind];

    if (kindVisitor) {
      if (!isLeaving && typeof kindVisitor === 'function') {
        // { Kind() {} }
        return kindVisitor;
      }

      var kindSpecificVisitor = isLeaving ? kindVisitor.leave : kindVisitor.enter;

      if (typeof kindSpecificVisitor === 'function') {
        // { Kind: { enter() {}, leave() {} } }
        return kindSpecificVisitor;
      }
    } else {
      var specificVisitor = isLeaving ? visitor.leave : visitor.enter;

      if (specificVisitor) {
        if (typeof specificVisitor === 'function') {
          // { enter() {}, leave() {} }
          return specificVisitor;
        }

        var specificKindVisitor = specificVisitor[kind];

        if (typeof specificKindVisitor === 'function') {
          // { enter: { Kind() {} }, leave: { Kind() {} } }
          return specificKindVisitor;
        }
      }
    }
  }

  var genericMessage = "Invariant Violation";
  var _a = Object.setPrototypeOf, setPrototypeOf = _a === void 0 ? function (obj, proto) {
      obj.__proto__ = proto;
      return obj;
  } : _a;
  var InvariantError = /** @class */ (function (_super) {
      __extends(InvariantError, _super);
      function InvariantError(message) {
          if (message === void 0) { message = genericMessage; }
          var _this = _super.call(this, message) || this;
          _this.framesToPop = 1;
          _this.name = genericMessage;
          setPrototypeOf(_this, InvariantError.prototype);
          return _this;
      }
      return InvariantError;
  }(Error));
  function invariant(condition, message) {
      if (!condition) {
          throw new InvariantError(message);
      }
  }
  (function (invariant) {
      function warn() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          return console.warn.apply(console, args);
      }
      invariant.warn = warn;
      function error() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          return console.error.apply(console, args);
      }
      invariant.error = error;
  })(invariant || (invariant = {}));

  var fastJsonStableStringify = function (data, opts) {
      if (!opts) opts = {};
      if (typeof opts === 'function') opts = { cmp: opts };
      var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;

      var cmp = opts.cmp && (function (f) {
          return function (node) {
              return function (a, b) {
                  var aobj = { key: a, value: node[a] };
                  var bobj = { key: b, value: node[b] };
                  return f(aobj, bobj);
              };
          };
      })(opts.cmp);

      var seen = [];
      return (function stringify (node) {
          if (node && node.toJSON && typeof node.toJSON === 'function') {
              node = node.toJSON();
          }

          if (node === undefined) return;
          if (typeof node == 'number') return isFinite(node) ? '' + node : 'null';
          if (typeof node !== 'object') return JSON.stringify(node);

          var i, out;
          if (Array.isArray(node)) {
              out = '[';
              for (i = 0; i < node.length; i++) {
                  if (i) out += ',';
                  out += stringify(node[i]) || 'null';
              }
              return out + ']';
          }

          if (node === null) return 'null';

          if (seen.indexOf(node) !== -1) {
              if (cycles) return JSON.stringify('__cycle__');
              throw new TypeError('Converting circular structure to JSON');
          }

          var seenIndex = seen.push(node) - 1;
          var keys = Object.keys(node).sort(cmp && cmp(node));
          out = '';
          for (i = 0; i < keys.length; i++) {
              var key = keys[i];
              var value = stringify(node[key]);

              if (!value) continue;
              if (out) out += ',';
              out += JSON.stringify(key) + ':' + value;
          }
          seen.splice(seenIndex, 1);
          return '{' + out + '}';
      })(data);
  };

  function isStringValue(value) {
      return value.kind === 'StringValue';
  }
  function isBooleanValue(value) {
      return value.kind === 'BooleanValue';
  }
  function isIntValue(value) {
      return value.kind === 'IntValue';
  }
  function isFloatValue(value) {
      return value.kind === 'FloatValue';
  }
  function isVariable(value) {
      return value.kind === 'Variable';
  }
  function isObjectValue(value) {
      return value.kind === 'ObjectValue';
  }
  function isListValue(value) {
      return value.kind === 'ListValue';
  }
  function isEnumValue(value) {
      return value.kind === 'EnumValue';
  }
  function isNullValue(value) {
      return value.kind === 'NullValue';
  }
  function valueToObjectRepresentation(argObj, name, value, variables) {
      if (isIntValue(value) || isFloatValue(value)) {
          argObj[name.value] = Number(value.value);
      }
      else if (isBooleanValue(value) || isStringValue(value)) {
          argObj[name.value] = value.value;
      }
      else if (isObjectValue(value)) {
          var nestedArgObj_1 = {};
          value.fields.map(function (obj) {
              return valueToObjectRepresentation(nestedArgObj_1, obj.name, obj.value, variables);
          });
          argObj[name.value] = nestedArgObj_1;
      }
      else if (isVariable(value)) {
          var variableValue = (variables || {})[value.name.value];
          argObj[name.value] = variableValue;
      }
      else if (isListValue(value)) {
          argObj[name.value] = value.values.map(function (listValue) {
              var nestedArgArrayObj = {};
              valueToObjectRepresentation(nestedArgArrayObj, name, listValue, variables);
              return nestedArgArrayObj[name.value];
          });
      }
      else if (isEnumValue(value)) {
          argObj[name.value] = value.value;
      }
      else if (isNullValue(value)) {
          argObj[name.value] = null;
      }
      else {
          throw new InvariantError();
      }
  }
  function storeKeyNameFromField(field, variables) {
      var directivesObj = null;
      if (field.directives) {
          directivesObj = {};
          field.directives.forEach(function (directive) {
              directivesObj[directive.name.value] = {};
              if (directive.arguments) {
                  directive.arguments.forEach(function (_a) {
                      var name = _a.name, value = _a.value;
                      return valueToObjectRepresentation(directivesObj[directive.name.value], name, value, variables);
                  });
              }
          });
      }
      var argObj = null;
      if (field.arguments && field.arguments.length) {
          argObj = {};
          field.arguments.forEach(function (_a) {
              var name = _a.name, value = _a.value;
              return valueToObjectRepresentation(argObj, name, value, variables);
          });
      }
      return getStoreKeyName(field.name.value, argObj, directivesObj);
  }
  var KNOWN_DIRECTIVES = [
      'connection',
      'include',
      'skip',
      'client',
      'rest',
      'export',
  ];
  function getStoreKeyName(fieldName, args, directives) {
      if (directives &&
          directives['connection'] &&
          directives['connection']['key']) {
          if (directives['connection']['filter'] &&
              directives['connection']['filter'].length > 0) {
              var filterKeys = directives['connection']['filter']
                  ? directives['connection']['filter']
                  : [];
              filterKeys.sort();
              var queryArgs_1 = args;
              var filteredArgs_1 = {};
              filterKeys.forEach(function (key) {
                  filteredArgs_1[key] = queryArgs_1[key];
              });
              return directives['connection']['key'] + "(" + JSON.stringify(filteredArgs_1) + ")";
          }
          else {
              return directives['connection']['key'];
          }
      }
      var completeFieldName = fieldName;
      if (args) {
          var stringifiedArgs = fastJsonStableStringify(args);
          completeFieldName += "(" + stringifiedArgs + ")";
      }
      if (directives) {
          Object.keys(directives).forEach(function (key) {
              if (KNOWN_DIRECTIVES.indexOf(key) !== -1)
                  return;
              if (directives[key] && Object.keys(directives[key]).length) {
                  completeFieldName += "@" + key + "(" + JSON.stringify(directives[key]) + ")";
              }
              else {
                  completeFieldName += "@" + key;
              }
          });
      }
      return completeFieldName;
  }
  function argumentsObjectFromField(field, variables) {
      if (field.arguments && field.arguments.length) {
          var argObj_1 = {};
          field.arguments.forEach(function (_a) {
              var name = _a.name, value = _a.value;
              return valueToObjectRepresentation(argObj_1, name, value, variables);
          });
          return argObj_1;
      }
      return null;
  }
  function resultKeyNameFromField(field) {
      return field.alias ? field.alias.value : field.name.value;
  }
  function isField(selection) {
      return selection.kind === 'Field';
  }
  function isInlineFragment(selection) {
      return selection.kind === 'InlineFragment';
  }
  function isIdValue(idObject) {
      return idObject &&
          idObject.type === 'id' &&
          typeof idObject.generated === 'boolean';
  }
  function toIdValue(idConfig, generated) {
      if (generated === void 0) { generated = false; }
      return __assign({ type: 'id', generated: generated }, (typeof idConfig === 'string'
          ? { id: idConfig, typename: undefined }
          : idConfig));
  }
  function isJsonValue(jsonObject) {
      return (jsonObject != null &&
          typeof jsonObject === 'object' &&
          jsonObject.type === 'json');
  }

  function getDirectiveInfoFromField(field, variables) {
      if (field.directives && field.directives.length) {
          var directiveObj_1 = {};
          field.directives.forEach(function (directive) {
              directiveObj_1[directive.name.value] = argumentsObjectFromField(directive, variables);
          });
          return directiveObj_1;
      }
      return null;
  }
  function shouldInclude(selection, variables) {
      if (variables === void 0) { variables = {}; }
      if (!selection.directives) {
          return true;
      }
      var res = true;
      selection.directives.forEach(function (directive) {
          if (directive.name.value !== 'skip' && directive.name.value !== 'include') {
              return;
          }
          var directiveArguments = directive.arguments || [];
          var directiveName = directive.name.value;
          invariant(directiveArguments.length === 1);
          var ifArgument = directiveArguments[0];
          invariant(ifArgument.name && ifArgument.name.value === 'if');
          var ifValue = directiveArguments[0].value;
          var evaledValue = false;
          if (!ifValue || ifValue.kind !== 'BooleanValue') {
              invariant(ifValue.kind === 'Variable');
              evaledValue = variables[ifValue.name.value];
              invariant(evaledValue !== void 0);
          }
          else {
              evaledValue = ifValue.value;
          }
          if (directiveName === 'skip') {
              evaledValue = !evaledValue;
          }
          if (!evaledValue) {
              res = false;
          }
      });
      return res;
  }
  function getDirectiveNames(doc) {
      var names = [];
      visit(doc, {
          Directive: function (node) {
              names.push(node.name.value);
          },
      });
      return names;
  }
  function hasDirectives(names, doc) {
      return getDirectiveNames(doc).some(function (name) { return names.indexOf(name) > -1; });
  }
  function hasClientExports(document) {
      return (document &&
          hasDirectives(['client'], document) &&
          hasDirectives(['export'], document));
  }

  function getFragmentQueryDocument(document, fragmentName) {
      var actualFragmentName = fragmentName;
      var fragments = [];
      document.definitions.forEach(function (definition) {
          if (definition.kind === 'OperationDefinition') {
              throw new InvariantError();
          }
          if (definition.kind === 'FragmentDefinition') {
              fragments.push(definition);
          }
      });
      if (typeof actualFragmentName === 'undefined') {
          invariant(fragments.length === 1);
          actualFragmentName = fragments[0].name.value;
      }
      var query = __assign({}, document, { definitions: [
              {
                  kind: 'OperationDefinition',
                  operation: 'query',
                  selectionSet: {
                      kind: 'SelectionSet',
                      selections: [
                          {
                              kind: 'FragmentSpread',
                              name: {
                                  kind: 'Name',
                                  value: actualFragmentName,
                              },
                          },
                      ],
                  },
              }
          ].concat(document.definitions) });
      return query;
  }

  function assign(target) {
      var sources = [];
      for (var _i = 1; _i < arguments.length; _i++) {
          sources[_i - 1] = arguments[_i];
      }
      sources.forEach(function (source) {
          if (typeof source === 'undefined' || source === null) {
              return;
          }
          Object.keys(source).forEach(function (key) {
              target[key] = source[key];
          });
      });
      return target;
  }

  function getMutationDefinition(doc) {
      checkDocument(doc);
      var mutationDef = doc.definitions.filter(function (definition) {
          return definition.kind === 'OperationDefinition' &&
              definition.operation === 'mutation';
      })[0];
      invariant(mutationDef);
      return mutationDef;
  }
  function checkDocument(doc) {
      invariant(doc && doc.kind === 'Document');
      var operations = doc.definitions
          .filter(function (d) { return d.kind !== 'FragmentDefinition'; })
          .map(function (definition) {
          if (definition.kind !== 'OperationDefinition') {
              throw new InvariantError();
          }
          return definition;
      });
      invariant(operations.length <= 1);
      return doc;
  }
  function getOperationDefinition(doc) {
      checkDocument(doc);
      return doc.definitions.filter(function (definition) { return definition.kind === 'OperationDefinition'; })[0];
  }
  function getOperationName(doc) {
      return (doc.definitions
          .filter(function (definition) {
          return definition.kind === 'OperationDefinition' && definition.name;
      })
          .map(function (x) { return x.name.value; })[0] || null);
  }
  function getFragmentDefinitions(doc) {
      return doc.definitions.filter(function (definition) { return definition.kind === 'FragmentDefinition'; });
  }
  function getQueryDefinition(doc) {
      var queryDef = getOperationDefinition(doc);
      invariant(queryDef && queryDef.operation === 'query');
      return queryDef;
  }
  function getFragmentDefinition(doc) {
      invariant(doc.kind === 'Document');
      invariant(doc.definitions.length <= 1);
      var fragmentDef = doc.definitions[0];
      invariant(fragmentDef.kind === 'FragmentDefinition');
      return fragmentDef;
  }
  function getMainDefinition(queryDoc) {
      checkDocument(queryDoc);
      var fragmentDefinition;
      for (var _i = 0, _a = queryDoc.definitions; _i < _a.length; _i++) {
          var definition = _a[_i];
          if (definition.kind === 'OperationDefinition') {
              var operation = definition.operation;
              if (operation === 'query' ||
                  operation === 'mutation' ||
                  operation === 'subscription') {
                  return definition;
              }
          }
          if (definition.kind === 'FragmentDefinition' && !fragmentDefinition) {
              fragmentDefinition = definition;
          }
      }
      if (fragmentDefinition) {
          return fragmentDefinition;
      }
      throw new InvariantError();
  }
  function createFragmentMap(fragments) {
      if (fragments === void 0) { fragments = []; }
      var symTable = {};
      fragments.forEach(function (fragment) {
          symTable[fragment.name.value] = fragment;
      });
      return symTable;
  }
  function getDefaultValues(definition) {
      if (definition &&
          definition.variableDefinitions &&
          definition.variableDefinitions.length) {
          var defaultValues = definition.variableDefinitions
              .filter(function (_a) {
              var defaultValue = _a.defaultValue;
              return defaultValue;
          })
              .map(function (_a) {
              var variable = _a.variable, defaultValue = _a.defaultValue;
              var defaultValueObj = {};
              valueToObjectRepresentation(defaultValueObj, variable.name, defaultValue);
              return defaultValueObj;
          });
          return assign.apply(void 0, [{}].concat(defaultValues));
      }
      return {};
  }

  function filterInPlace(array, test, context) {
      var target = 0;
      array.forEach(function (elem, i) {
          if (test.call(this, elem, i, array)) {
              array[target++] = elem;
          }
      }, context);
      array.length = target;
      return array;
  }

  var TYPENAME_FIELD = {
      kind: 'Field',
      name: {
          kind: 'Name',
          value: '__typename',
      },
  };
  function isEmpty(op, fragments) {
      return op.selectionSet.selections.every(function (selection) {
          return selection.kind === 'FragmentSpread' &&
              isEmpty(fragments[selection.name.value], fragments);
      });
  }
  function nullIfDocIsEmpty(doc) {
      return isEmpty(getOperationDefinition(doc) || getFragmentDefinition(doc), createFragmentMap(getFragmentDefinitions(doc)))
          ? null
          : doc;
  }
  function getDirectiveMatcher(directives) {
      return function directiveMatcher(directive) {
          return directives.some(function (dir) {
              return (dir.name && dir.name === directive.name.value) ||
                  (dir.test && dir.test(directive));
          });
      };
  }
  function removeDirectivesFromDocument(directives, doc) {
      var variablesInUse = Object.create(null);
      var variablesToRemove = [];
      var fragmentSpreadsInUse = Object.create(null);
      var fragmentSpreadsToRemove = [];
      var modifiedDoc = nullIfDocIsEmpty(visit(doc, {
          Variable: {
              enter: function (node, _key, parent) {
                  if (parent.kind !== 'VariableDefinition') {
                      variablesInUse[node.name.value] = true;
                  }
              },
          },
          Field: {
              enter: function (node) {
                  if (directives && node.directives) {
                      var shouldRemoveField = directives.some(function (directive) { return directive.remove; });
                      if (shouldRemoveField &&
                          node.directives &&
                          node.directives.some(getDirectiveMatcher(directives))) {
                          if (node.arguments) {
                              node.arguments.forEach(function (arg) {
                                  if (arg.value.kind === 'Variable') {
                                      variablesToRemove.push({
                                          name: arg.value.name.value,
                                      });
                                  }
                              });
                          }
                          if (node.selectionSet) {
                              getAllFragmentSpreadsFromSelectionSet(node.selectionSet).forEach(function (frag) {
                                  fragmentSpreadsToRemove.push({
                                      name: frag.name.value,
                                  });
                              });
                          }
                          return null;
                      }
                  }
              },
          },
          FragmentSpread: {
              enter: function (node) {
                  fragmentSpreadsInUse[node.name.value] = true;
              },
          },
          Directive: {
              enter: function (node) {
                  if (getDirectiveMatcher(directives)(node)) {
                      return null;
                  }
              },
          },
      }));
      if (modifiedDoc &&
          filterInPlace(variablesToRemove, function (v) { return !variablesInUse[v.name]; }).length) {
          modifiedDoc = removeArgumentsFromDocument(variablesToRemove, modifiedDoc);
      }
      if (modifiedDoc &&
          filterInPlace(fragmentSpreadsToRemove, function (fs) { return !fragmentSpreadsInUse[fs.name]; })
              .length) {
          modifiedDoc = removeFragmentSpreadFromDocument(fragmentSpreadsToRemove, modifiedDoc);
      }
      return modifiedDoc;
  }
  function addTypenameToDocument(doc) {
      return visit(checkDocument(doc), {
          SelectionSet: {
              enter: function (node, _key, parent) {
                  if (parent &&
                      parent.kind === 'OperationDefinition') {
                      return;
                  }
                  var selections = node.selections;
                  if (!selections) {
                      return;
                  }
                  var skip = selections.some(function (selection) {
                      return (selection.kind === 'Field' &&
                          (selection.name.value === '__typename' ||
                              selection.name.value.lastIndexOf('__', 0) === 0));
                  });
                  if (skip) {
                      return;
                  }
                  return __assign({}, node, { selections: selections.concat([TYPENAME_FIELD]) });
              },
          },
      });
  }
  var connectionRemoveConfig = {
      test: function (directive) {
          var willRemove = directive.name.value === 'connection';
          if (willRemove) {
              if (!directive.arguments ||
                  !directive.arguments.some(function (arg) { return arg.name.value === 'key'; })) {
                  console.warn('Removing an @connection directive even though it does not have a key. ' +
                      'You may want to use the key parameter to specify a store key.');
              }
          }
          return willRemove;
      },
  };
  function removeConnectionDirectiveFromDocument(doc) {
      return removeDirectivesFromDocument([connectionRemoveConfig], checkDocument(doc));
  }
  function getArgumentMatcher(config) {
      return function argumentMatcher(argument) {
          return config.some(function (aConfig) {
              return argument.value &&
                  argument.value.kind === 'Variable' &&
                  argument.value.name &&
                  (aConfig.name === argument.value.name.value ||
                      (aConfig.test && aConfig.test(argument)));
          });
      };
  }
  function removeArgumentsFromDocument(config, doc) {
      var argMatcher = getArgumentMatcher(config);
      return nullIfDocIsEmpty(visit(doc, {
          OperationDefinition: {
              enter: function (node) {
                  return __assign({}, node, { variableDefinitions: node.variableDefinitions.filter(function (varDef) {
                          return !config.some(function (arg) { return arg.name === varDef.variable.name.value; });
                      }) });
              },
          },
          Field: {
              enter: function (node) {
                  var shouldRemoveField = config.some(function (argConfig) { return argConfig.remove; });
                  if (shouldRemoveField) {
                      var argMatchCount_1 = 0;
                      node.arguments.forEach(function (arg) {
                          if (argMatcher(arg)) {
                              argMatchCount_1 += 1;
                          }
                      });
                      if (argMatchCount_1 === 1) {
                          return null;
                      }
                  }
              },
          },
          Argument: {
              enter: function (node) {
                  if (argMatcher(node)) {
                      return null;
                  }
              },
          },
      }));
  }
  function removeFragmentSpreadFromDocument(config, doc) {
      function enter(node) {
          if (config.some(function (def) { return def.name === node.name.value; })) {
              return null;
          }
      }
      return nullIfDocIsEmpty(visit(doc, {
          FragmentSpread: { enter: enter },
          FragmentDefinition: { enter: enter },
      }));
  }
  function getAllFragmentSpreadsFromSelectionSet(selectionSet) {
      var allFragments = [];
      selectionSet.selections.forEach(function (selection) {
          if ((selection.kind === 'Field' || selection.kind === 'InlineFragment') &&
              selection.selectionSet) {
              getAllFragmentSpreadsFromSelectionSet(selection.selectionSet).forEach(function (frag) { return allFragments.push(frag); });
          }
          else if (selection.kind === 'FragmentSpread') {
              allFragments.push(selection);
          }
      });
      return allFragments;
  }
  function buildQueryFromSelectionSet(document) {
      var definition = getMainDefinition(document);
      var definitionOperation = definition.operation;
      if (definitionOperation === 'query') {
          return document;
      }
      var modifiedDoc = visit(document, {
          OperationDefinition: {
              enter: function (node) {
                  return __assign({}, node, { operation: 'query' });
              },
          },
      });
      return modifiedDoc;
  }
  function removeClientSetsFromDocument(document) {
      checkDocument(document);
      var modifiedDoc = removeDirectivesFromDocument([
          {
              test: function (directive) { return directive.name.value === 'client'; },
              remove: true,
          },
      ], document);
      if (modifiedDoc) {
          modifiedDoc = visit(modifiedDoc, {
              FragmentDefinition: {
                  enter: function (node) {
                      if (node.selectionSet) {
                          var isTypenameOnly = node.selectionSet.selections.every(function (selection) {
                              return (selection.kind === 'Field' &&
                                  selection.name.value === '__typename');
                          });
                          if (isTypenameOnly) {
                              return null;
                          }
                      }
                  },
              },
          });
      }
      return modifiedDoc;
  }

  var toString = Object.prototype.toString;
  function cloneDeep(value) {
      return cloneDeepHelper(value, new Map());
  }
  function cloneDeepHelper(val, seen) {
      switch (toString.call(val)) {
          case "[object Array]": {
              if (seen.has(val))
                  return seen.get(val);
              var copy_1 = val.slice(0);
              seen.set(val, copy_1);
              copy_1.forEach(function (child, i) {
                  copy_1[i] = cloneDeepHelper(child, seen);
              });
              return copy_1;
          }
          case "[object Object]": {
              if (seen.has(val))
                  return seen.get(val);
              var copy_2 = Object.create(Object.getPrototypeOf(val));
              seen.set(val, copy_2);
              Object.keys(val).forEach(function (key) {
                  copy_2[key] = cloneDeepHelper(val[key], seen);
              });
              return copy_2;
          }
          default:
              return val;
      }
  }

  function tryFunctionOrLogError(f) {
      try {
          return f();
      }
      catch (e) {
          if (console.error) {
              console.error(e);
          }
      }
  }
  function graphQLResultHasError(result) {
      return result.errors && result.errors.length;
  }

  function isEqual(a, b) {
      if (a === b) {
          return true;
      }
      if (a instanceof Date && b instanceof Date) {
          return a.getTime() === b.getTime();
      }
      if (a != null &&
          typeof a === 'object' &&
          b != null &&
          typeof b === 'object') {
          for (var key in a) {
              if (Object.prototype.hasOwnProperty.call(a, key)) {
                  if (!Object.prototype.hasOwnProperty.call(b, key)) {
                      return false;
                  }
                  if (!isEqual(a[key], b[key])) {
                      return false;
                  }
              }
          }
          for (var key in b) {
              if (Object.prototype.hasOwnProperty.call(b, key) &&
                  !Object.prototype.hasOwnProperty.call(a, key)) {
                  return false;
              }
          }
          return true;
      }
      return false;
  }

  var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
  function mergeDeep() {
      var sources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
          sources[_i] = arguments[_i];
      }
      return mergeDeepArray(sources);
  }
  function mergeDeepArray(sources) {
      var target = sources[0] || {};
      var count = sources.length;
      if (count > 1) {
          var pastCopies = [];
          target = shallowCopyForMerge(target, pastCopies);
          for (var i = 1; i < count; ++i) {
              target = mergeHelper(target, sources[i], pastCopies);
          }
      }
      return target;
  }
  function isObject(obj) {
      return obj !== null && typeof obj === 'object';
  }
  function mergeHelper(target, source, pastCopies) {
      if (isObject(source) && isObject(target)) {
          if (Object.isExtensible && !Object.isExtensible(target)) {
              target = shallowCopyForMerge(target, pastCopies);
          }
          Object.keys(source).forEach(function (sourceKey) {
              var sourceValue = source[sourceKey];
              if (hasOwnProperty$1.call(target, sourceKey)) {
                  var targetValue = target[sourceKey];
                  if (sourceValue !== targetValue) {
                      target[sourceKey] = mergeHelper(shallowCopyForMerge(targetValue, pastCopies), sourceValue, pastCopies);
                  }
              }
              else {
                  target[sourceKey] = sourceValue;
              }
          });
          return target;
      }
      return source;
  }
  function shallowCopyForMerge(value, pastCopies) {
      if (value !== null &&
          typeof value === 'object' &&
          pastCopies.indexOf(value) < 0) {
          if (Array.isArray(value)) {
              value = value.slice(0);
          }
          else {
              value = __assign({ __proto__: Object.getPrototypeOf(value) }, value);
          }
          pastCopies.push(value);
      }
      return value;
  }
  //# sourceMappingURL=bundle.esm.js.map

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function unwrapExports (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  function getCjsExportFromNamespace (n) {
  	return n && n['default'] || n;
  }

  var Observable_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  // === Symbol Support ===

  var hasSymbols = function () {
    return typeof Symbol === 'function';
  };
  var hasSymbol = function (name) {
    return hasSymbols() && Boolean(Symbol[name]);
  };
  var getSymbol = function (name) {
    return hasSymbol(name) ? Symbol[name] : '@@' + name;
  };

  if (hasSymbols() && !hasSymbol('observable')) {
    Symbol.observable = Symbol('observable');
  }

  var SymbolIterator = getSymbol('iterator');
  var SymbolObservable = getSymbol('observable');
  var SymbolSpecies = getSymbol('species');

  // === Abstract Operations ===

  function getMethod(obj, key) {
    var value = obj[key];

    if (value == null) return undefined;

    if (typeof value !== 'function') throw new TypeError(value + ' is not a function');

    return value;
  }

  function getSpecies(obj) {
    var ctor = obj.constructor;
    if (ctor !== undefined) {
      ctor = ctor[SymbolSpecies];
      if (ctor === null) {
        ctor = undefined;
      }
    }
    return ctor !== undefined ? ctor : Observable;
  }

  function isObservable(x) {
    return x instanceof Observable; // SPEC: Brand check
  }

  function hostReportError(e) {
    if (hostReportError.log) {
      hostReportError.log(e);
    } else {
      setTimeout(function () {
        throw e;
      });
    }
  }

  function enqueue(fn) {
    Promise.resolve().then(function () {
      try {
        fn();
      } catch (e) {
        hostReportError(e);
      }
    });
  }

  function cleanupSubscription(subscription) {
    var cleanup = subscription._cleanup;
    if (cleanup === undefined) return;

    subscription._cleanup = undefined;

    if (!cleanup) {
      return;
    }

    try {
      if (typeof cleanup === 'function') {
        cleanup();
      } else {
        var unsubscribe = getMethod(cleanup, 'unsubscribe');
        if (unsubscribe) {
          unsubscribe.call(cleanup);
        }
      }
    } catch (e) {
      hostReportError(e);
    }
  }

  function closeSubscription(subscription) {
    subscription._observer = undefined;
    subscription._queue = undefined;
    subscription._state = 'closed';
  }

  function flushSubscription(subscription) {
    var queue = subscription._queue;
    if (!queue) {
      return;
    }
    subscription._queue = undefined;
    subscription._state = 'ready';
    for (var i = 0; i < queue.length; ++i) {
      notifySubscription(subscription, queue[i].type, queue[i].value);
      if (subscription._state === 'closed') break;
    }
  }

  function notifySubscription(subscription, type, value) {
    subscription._state = 'running';

    var observer = subscription._observer;

    try {
      var m = getMethod(observer, type);
      switch (type) {
        case 'next':
          if (m) m.call(observer, value);
          break;
        case 'error':
          closeSubscription(subscription);
          if (m) m.call(observer, value);else throw value;
          break;
        case 'complete':
          closeSubscription(subscription);
          if (m) m.call(observer);
          break;
      }
    } catch (e) {
      hostReportError(e);
    }

    if (subscription._state === 'closed') cleanupSubscription(subscription);else if (subscription._state === 'running') subscription._state = 'ready';
  }

  function onNotify(subscription, type, value) {
    if (subscription._state === 'closed') return;

    if (subscription._state === 'buffering') {
      subscription._queue.push({ type: type, value: value });
      return;
    }

    if (subscription._state !== 'ready') {
      subscription._state = 'buffering';
      subscription._queue = [{ type: type, value: value }];
      enqueue(function () {
        return flushSubscription(subscription);
      });
      return;
    }

    notifySubscription(subscription, type, value);
  }

  var Subscription = function () {
    function Subscription(observer, subscriber) {
      _classCallCheck(this, Subscription);

      // ASSERT: observer is an object
      // ASSERT: subscriber is callable

      this._cleanup = undefined;
      this._observer = observer;
      this._queue = undefined;
      this._state = 'initializing';

      var subscriptionObserver = new SubscriptionObserver(this);

      try {
        this._cleanup = subscriber.call(undefined, subscriptionObserver);
      } catch (e) {
        subscriptionObserver.error(e);
      }

      if (this._state === 'initializing') this._state = 'ready';
    }

    _createClass(Subscription, [{
      key: 'unsubscribe',
      value: function unsubscribe() {
        if (this._state !== 'closed') {
          closeSubscription(this);
          cleanupSubscription(this);
        }
      }
    }, {
      key: 'closed',
      get: function () {
        return this._state === 'closed';
      }
    }]);

    return Subscription;
  }();

  var SubscriptionObserver = function () {
    function SubscriptionObserver(subscription) {
      _classCallCheck(this, SubscriptionObserver);

      this._subscription = subscription;
    }

    _createClass(SubscriptionObserver, [{
      key: 'next',
      value: function next(value) {
        onNotify(this._subscription, 'next', value);
      }
    }, {
      key: 'error',
      value: function error(value) {
        onNotify(this._subscription, 'error', value);
      }
    }, {
      key: 'complete',
      value: function complete() {
        onNotify(this._subscription, 'complete');
      }
    }, {
      key: 'closed',
      get: function () {
        return this._subscription._state === 'closed';
      }
    }]);

    return SubscriptionObserver;
  }();

  var Observable = exports.Observable = function () {
    function Observable(subscriber) {
      _classCallCheck(this, Observable);

      if (!(this instanceof Observable)) throw new TypeError('Observable cannot be called as a function');

      if (typeof subscriber !== 'function') throw new TypeError('Observable initializer must be a function');

      this._subscriber = subscriber;
    }

    _createClass(Observable, [{
      key: 'subscribe',
      value: function subscribe(observer) {
        if (typeof observer !== 'object' || observer === null) {
          observer = {
            next: observer,
            error: arguments[1],
            complete: arguments[2]
          };
        }
        return new Subscription(observer, this._subscriber);
      }
    }, {
      key: 'forEach',
      value: function forEach(fn) {
        var _this = this;

        return new Promise(function (resolve, reject) {
          if (typeof fn !== 'function') {
            reject(new TypeError(fn + ' is not a function'));
            return;
          }

          function done() {
            subscription.unsubscribe();
            resolve();
          }

          var subscription = _this.subscribe({
            next: function (value) {
              try {
                fn(value, done);
              } catch (e) {
                reject(e);
                subscription.unsubscribe();
              }
            },

            error: reject,
            complete: resolve
          });
        });
      }
    }, {
      key: 'map',
      value: function map(fn) {
        var _this2 = this;

        if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');

        var C = getSpecies(this);

        return new C(function (observer) {
          return _this2.subscribe({
            next: function (value) {
              try {
                value = fn(value);
              } catch (e) {
                return observer.error(e);
              }
              observer.next(value);
            },
            error: function (e) {
              observer.error(e);
            },
            complete: function () {
              observer.complete();
            }
          });
        });
      }
    }, {
      key: 'filter',
      value: function filter(fn) {
        var _this3 = this;

        if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');

        var C = getSpecies(this);

        return new C(function (observer) {
          return _this3.subscribe({
            next: function (value) {
              try {
                if (!fn(value)) return;
              } catch (e) {
                return observer.error(e);
              }
              observer.next(value);
            },
            error: function (e) {
              observer.error(e);
            },
            complete: function () {
              observer.complete();
            }
          });
        });
      }
    }, {
      key: 'reduce',
      value: function reduce(fn) {
        var _this4 = this;

        if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');

        var C = getSpecies(this);
        var hasSeed = arguments.length > 1;
        var hasValue = false;
        var seed = arguments[1];
        var acc = seed;

        return new C(function (observer) {
          return _this4.subscribe({
            next: function (value) {
              var first = !hasValue;
              hasValue = true;

              if (!first || hasSeed) {
                try {
                  acc = fn(acc, value);
                } catch (e) {
                  return observer.error(e);
                }
              } else {
                acc = value;
              }
            },
            error: function (e) {
              observer.error(e);
            },
            complete: function () {
              if (!hasValue && !hasSeed) return observer.error(new TypeError('Cannot reduce an empty sequence'));

              observer.next(acc);
              observer.complete();
            }
          });
        });
      }
    }, {
      key: 'concat',
      value: function concat() {
        var _this5 = this;

        for (var _len = arguments.length, sources = Array(_len), _key = 0; _key < _len; _key++) {
          sources[_key] = arguments[_key];
        }

        var C = getSpecies(this);

        return new C(function (observer) {
          var subscription = void 0;
          var index = 0;

          function startNext(next) {
            subscription = next.subscribe({
              next: function (v) {
                observer.next(v);
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                if (index === sources.length) {
                  subscription = undefined;
                  observer.complete();
                } else {
                  startNext(C.from(sources[index++]));
                }
              }
            });
          }

          startNext(_this5);

          return function () {
            if (subscription) {
              subscription.unsubscribe();
              subscription = undefined;
            }
          };
        });
      }
    }, {
      key: 'flatMap',
      value: function flatMap(fn) {
        var _this6 = this;

        if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');

        var C = getSpecies(this);

        return new C(function (observer) {
          var subscriptions = [];

          var outer = _this6.subscribe({
            next: function (value) {
              if (fn) {
                try {
                  value = fn(value);
                } catch (e) {
                  return observer.error(e);
                }
              }

              var inner = C.from(value).subscribe({
                next: function (value) {
                  observer.next(value);
                },
                error: function (e) {
                  observer.error(e);
                },
                complete: function () {
                  var i = subscriptions.indexOf(inner);
                  if (i >= 0) subscriptions.splice(i, 1);
                  completeIfDone();
                }
              });

              subscriptions.push(inner);
            },
            error: function (e) {
              observer.error(e);
            },
            complete: function () {
              completeIfDone();
            }
          });

          function completeIfDone() {
            if (outer.closed && subscriptions.length === 0) observer.complete();
          }

          return function () {
            subscriptions.forEach(function (s) {
              return s.unsubscribe();
            });
            outer.unsubscribe();
          };
        });
      }
    }, {
      key: SymbolObservable,
      value: function () {
        return this;
      }
    }], [{
      key: 'from',
      value: function from(x) {
        var C = typeof this === 'function' ? this : Observable;

        if (x == null) throw new TypeError(x + ' is not an object');

        var method = getMethod(x, SymbolObservable);
        if (method) {
          var observable = method.call(x);

          if (Object(observable) !== observable) throw new TypeError(observable + ' is not an object');

          if (isObservable(observable) && observable.constructor === C) return observable;

          return new C(function (observer) {
            return observable.subscribe(observer);
          });
        }

        if (hasSymbol('iterator')) {
          method = getMethod(x, SymbolIterator);
          if (method) {
            return new C(function (observer) {
              enqueue(function () {
                if (observer.closed) return;
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                  for (var _iterator = method.call(x)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var item = _step.value;

                    observer.next(item);
                    if (observer.closed) return;
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

                observer.complete();
              });
            });
          }
        }

        if (Array.isArray(x)) {
          return new C(function (observer) {
            enqueue(function () {
              if (observer.closed) return;
              for (var i = 0; i < x.length; ++i) {
                observer.next(x[i]);
                if (observer.closed) return;
              }
              observer.complete();
            });
          });
        }

        throw new TypeError(x + ' is not observable');
      }
    }, {
      key: 'of',
      value: function of() {
        for (var _len2 = arguments.length, items = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          items[_key2] = arguments[_key2];
        }

        var C = typeof this === 'function' ? this : Observable;

        return new C(function (observer) {
          enqueue(function () {
            if (observer.closed) return;
            for (var i = 0; i < items.length; ++i) {
              observer.next(items[i]);
              if (observer.closed) return;
            }
            observer.complete();
          });
        });
      }
    }, {
      key: SymbolSpecies,
      get: function () {
        return this;
      }
    }]);

    return Observable;
  }();

  if (hasSymbols()) {
    Object.defineProperty(Observable, Symbol('extensions'), {
      value: {
        symbol: SymbolObservable,
        hostReportError: hostReportError
      },
      configurable: true
    });
  }
  });

  unwrapExports(Observable_1);
  var Observable_2 = Observable_1.Observable;

  var zenObservable = Observable_1.Observable;

  var Observable$1 = zenObservable;
  //# sourceMappingURL=bundle.esm.js.map

  var genericMessage$1 = "Invariant Violation";
  var _a$1 = Object.setPrototypeOf, setPrototypeOf$1 = _a$1 === void 0 ? function (obj, proto) {
      obj.__proto__ = proto;
      return obj;
  } : _a$1;
  var InvariantError$1 = /** @class */ (function (_super) {
      __extends(InvariantError, _super);
      function InvariantError(message) {
          if (message === void 0) { message = genericMessage$1; }
          var _this = _super.call(this, typeof message === "number"
              ? genericMessage$1 + ": " + message + " (see https://github.com/apollographql/invariant-packages)"
              : message) || this;
          _this.framesToPop = 1;
          _this.name = genericMessage$1;
          setPrototypeOf$1(_this, InvariantError.prototype);
          return _this;
      }
      return InvariantError;
  }(Error));
  function invariant$2(condition, message) {
      if (!condition) {
          throw new InvariantError$1(message);
      }
  }
  (function (invariant) {
      function warn() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          return console.warn.apply(console, args);
      }
      invariant.warn = warn;
      function error() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          return console.error.apply(console, args);
      }
      invariant.error = error;
  })(invariant$2 || (invariant$2 = {}));

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * Produces the value of a block string from its parsed raw value, similar to
   * CoffeeScript's block string, Python's docstring trim or Ruby's strip_heredoc.
   *
   * This implements the GraphQL spec's BlockStringValue() static algorithm.
   */
  function dedentBlockStringValue(rawString) {
    // Expand a block string's raw value into independent lines.
    var lines = rawString.split(/\r\n|[\n\r]/g); // Remove common indentation from all lines but first.

    var commonIndent = getBlockStringIndentation(lines);

    if (commonIndent !== 0) {
      for (var i = 1; i < lines.length; i++) {
        lines[i] = lines[i].slice(commonIndent);
      }
    } // Remove leading and trailing blank lines.


    while (lines.length > 0 && isBlank(lines[0])) {
      lines.shift();
    }

    while (lines.length > 0 && isBlank(lines[lines.length - 1])) {
      lines.pop();
    } // Return a string of the lines joined with U+000A.


    return lines.join('\n');
  } // @internal

  function getBlockStringIndentation(lines) {
    var commonIndent = null;

    for (var i = 1; i < lines.length; i++) {
      var line = lines[i];
      var indent = leadingWhitespace(line);

      if (indent === line.length) {
        continue; // skip empty lines
      }

      if (commonIndent === null || indent < commonIndent) {
        commonIndent = indent;

        if (commonIndent === 0) {
          break;
        }
      }
    }

    return commonIndent === null ? 0 : commonIndent;
  }

  function leadingWhitespace(str) {
    var i = 0;

    while (i < str.length && (str[i] === ' ' || str[i] === '\t')) {
      i++;
    }

    return i;
  }

  function isBlank(str) {
    return leadingWhitespace(str) === str.length;
  }
  /**
   * Print a block string in the indented block form by adding a leading and
   * trailing blank line. However, if a block string starts with whitespace and is
   * a single-line, adding a leading blank line would strip that whitespace.
   */


  function printBlockString(value) {
    var indentation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    var preferMultipleLines = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var isSingleLine = value.indexOf('\n') === -1;
    var hasLeadingSpace = value[0] === ' ' || value[0] === '\t';
    var hasTrailingQuote = value[value.length - 1] === '"';
    var printAsMultipleLines = !isSingleLine || hasTrailingQuote || preferMultipleLines;
    var result = ''; // Format a multi-line block quote to account for leading space.

    if (printAsMultipleLines && !(isSingleLine && hasLeadingSpace)) {
      result += '\n' + indentation;
    }

    result += indentation ? value.replace(/\n/g, '\n' + indentation) : value;

    if (printAsMultipleLines) {
      result += '\n';
    }

    return '"""' + result.replace(/"""/g, '\\"""') + '"""';
  }

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  /**
   * Converts an AST into a string, using one set of reasonable
   * formatting rules.
   */

  function print(ast) {
    return visit(ast, {
      leave: printDocASTReducer
    });
  } // TODO: provide better type coverage in future

  var printDocASTReducer = {
    Name: function Name(node) {
      return node.value;
    },
    Variable: function Variable(node) {
      return '$' + node.name;
    },
    // Document
    Document: function Document(node) {
      return join(node.definitions, '\n\n') + '\n';
    },
    OperationDefinition: function OperationDefinition(node) {
      var op = node.operation;
      var name = node.name;
      var varDefs = wrap('(', join(node.variableDefinitions, ', '), ')');
      var directives = join(node.directives, ' ');
      var selectionSet = node.selectionSet; // Anonymous queries with no directives or variable definitions can use
      // the query short form.

      return !name && !directives && !varDefs && op === 'query' ? selectionSet : join([op, join([name, varDefs]), directives, selectionSet], ' ');
    },
    VariableDefinition: function VariableDefinition(_ref) {
      var variable = _ref.variable,
          type = _ref.type,
          defaultValue = _ref.defaultValue,
          directives = _ref.directives;
      return variable + ': ' + type + wrap(' = ', defaultValue) + wrap(' ', join(directives, ' '));
    },
    SelectionSet: function SelectionSet(_ref2) {
      var selections = _ref2.selections;
      return block(selections);
    },
    Field: function Field(_ref3) {
      var alias = _ref3.alias,
          name = _ref3.name,
          args = _ref3.arguments,
          directives = _ref3.directives,
          selectionSet = _ref3.selectionSet;
      return join([wrap('', alias, ': ') + name + wrap('(', join(args, ', '), ')'), join(directives, ' '), selectionSet], ' ');
    },
    Argument: function Argument(_ref4) {
      var name = _ref4.name,
          value = _ref4.value;
      return name + ': ' + value;
    },
    // Fragments
    FragmentSpread: function FragmentSpread(_ref5) {
      var name = _ref5.name,
          directives = _ref5.directives;
      return '...' + name + wrap(' ', join(directives, ' '));
    },
    InlineFragment: function InlineFragment(_ref6) {
      var typeCondition = _ref6.typeCondition,
          directives = _ref6.directives,
          selectionSet = _ref6.selectionSet;
      return join(['...', wrap('on ', typeCondition), join(directives, ' '), selectionSet], ' ');
    },
    FragmentDefinition: function FragmentDefinition(_ref7) {
      var name = _ref7.name,
          typeCondition = _ref7.typeCondition,
          variableDefinitions = _ref7.variableDefinitions,
          directives = _ref7.directives,
          selectionSet = _ref7.selectionSet;
      return (// Note: fragment variable definitions are experimental and may be changed
        // or removed in the future.
        "fragment ".concat(name).concat(wrap('(', join(variableDefinitions, ', '), ')'), " ") + "on ".concat(typeCondition, " ").concat(wrap('', join(directives, ' '), ' ')) + selectionSet
      );
    },
    // Value
    IntValue: function IntValue(_ref8) {
      var value = _ref8.value;
      return value;
    },
    FloatValue: function FloatValue(_ref9) {
      var value = _ref9.value;
      return value;
    },
    StringValue: function StringValue(_ref10, key) {
      var value = _ref10.value,
          isBlockString = _ref10.block;
      return isBlockString ? printBlockString(value, key === 'description' ? '' : '  ') : JSON.stringify(value);
    },
    BooleanValue: function BooleanValue(_ref11) {
      var value = _ref11.value;
      return value ? 'true' : 'false';
    },
    NullValue: function NullValue() {
      return 'null';
    },
    EnumValue: function EnumValue(_ref12) {
      var value = _ref12.value;
      return value;
    },
    ListValue: function ListValue(_ref13) {
      var values = _ref13.values;
      return '[' + join(values, ', ') + ']';
    },
    ObjectValue: function ObjectValue(_ref14) {
      var fields = _ref14.fields;
      return '{' + join(fields, ', ') + '}';
    },
    ObjectField: function ObjectField(_ref15) {
      var name = _ref15.name,
          value = _ref15.value;
      return name + ': ' + value;
    },
    // Directive
    Directive: function Directive(_ref16) {
      var name = _ref16.name,
          args = _ref16.arguments;
      return '@' + name + wrap('(', join(args, ', '), ')');
    },
    // Type
    NamedType: function NamedType(_ref17) {
      var name = _ref17.name;
      return name;
    },
    ListType: function ListType(_ref18) {
      var type = _ref18.type;
      return '[' + type + ']';
    },
    NonNullType: function NonNullType(_ref19) {
      var type = _ref19.type;
      return type + '!';
    },
    // Type System Definitions
    SchemaDefinition: function SchemaDefinition(_ref20) {
      var directives = _ref20.directives,
          operationTypes = _ref20.operationTypes;
      return join(['schema', join(directives, ' '), block(operationTypes)], ' ');
    },
    OperationTypeDefinition: function OperationTypeDefinition(_ref21) {
      var operation = _ref21.operation,
          type = _ref21.type;
      return operation + ': ' + type;
    },
    ScalarTypeDefinition: addDescription(function (_ref22) {
      var name = _ref22.name,
          directives = _ref22.directives;
      return join(['scalar', name, join(directives, ' ')], ' ');
    }),
    ObjectTypeDefinition: addDescription(function (_ref23) {
      var name = _ref23.name,
          interfaces = _ref23.interfaces,
          directives = _ref23.directives,
          fields = _ref23.fields;
      return join(['type', name, wrap('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
    }),
    FieldDefinition: addDescription(function (_ref24) {
      var name = _ref24.name,
          args = _ref24.arguments,
          type = _ref24.type,
          directives = _ref24.directives;
      return name + (hasMultilineItems(args) ? wrap('(\n', indent(join(args, '\n')), '\n)') : wrap('(', join(args, ', '), ')')) + ': ' + type + wrap(' ', join(directives, ' '));
    }),
    InputValueDefinition: addDescription(function (_ref25) {
      var name = _ref25.name,
          type = _ref25.type,
          defaultValue = _ref25.defaultValue,
          directives = _ref25.directives;
      return join([name + ': ' + type, wrap('= ', defaultValue), join(directives, ' ')], ' ');
    }),
    InterfaceTypeDefinition: addDescription(function (_ref26) {
      var name = _ref26.name,
          directives = _ref26.directives,
          fields = _ref26.fields;
      return join(['interface', name, join(directives, ' '), block(fields)], ' ');
    }),
    UnionTypeDefinition: addDescription(function (_ref27) {
      var name = _ref27.name,
          directives = _ref27.directives,
          types = _ref27.types;
      return join(['union', name, join(directives, ' '), types && types.length !== 0 ? '= ' + join(types, ' | ') : ''], ' ');
    }),
    EnumTypeDefinition: addDescription(function (_ref28) {
      var name = _ref28.name,
          directives = _ref28.directives,
          values = _ref28.values;
      return join(['enum', name, join(directives, ' '), block(values)], ' ');
    }),
    EnumValueDefinition: addDescription(function (_ref29) {
      var name = _ref29.name,
          directives = _ref29.directives;
      return join([name, join(directives, ' ')], ' ');
    }),
    InputObjectTypeDefinition: addDescription(function (_ref30) {
      var name = _ref30.name,
          directives = _ref30.directives,
          fields = _ref30.fields;
      return join(['input', name, join(directives, ' '), block(fields)], ' ');
    }),
    DirectiveDefinition: addDescription(function (_ref31) {
      var name = _ref31.name,
          args = _ref31.arguments,
          locations = _ref31.locations;
      return 'directive @' + name + (hasMultilineItems(args) ? wrap('(\n', indent(join(args, '\n')), '\n)') : wrap('(', join(args, ', '), ')')) + ' on ' + join(locations, ' | ');
    }),
    SchemaExtension: function SchemaExtension(_ref32) {
      var directives = _ref32.directives,
          operationTypes = _ref32.operationTypes;
      return join(['extend schema', join(directives, ' '), block(operationTypes)], ' ');
    },
    ScalarTypeExtension: function ScalarTypeExtension(_ref33) {
      var name = _ref33.name,
          directives = _ref33.directives;
      return join(['extend scalar', name, join(directives, ' ')], ' ');
    },
    ObjectTypeExtension: function ObjectTypeExtension(_ref34) {
      var name = _ref34.name,
          interfaces = _ref34.interfaces,
          directives = _ref34.directives,
          fields = _ref34.fields;
      return join(['extend type', name, wrap('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
    },
    InterfaceTypeExtension: function InterfaceTypeExtension(_ref35) {
      var name = _ref35.name,
          directives = _ref35.directives,
          fields = _ref35.fields;
      return join(['extend interface', name, join(directives, ' '), block(fields)], ' ');
    },
    UnionTypeExtension: function UnionTypeExtension(_ref36) {
      var name = _ref36.name,
          directives = _ref36.directives,
          types = _ref36.types;
      return join(['extend union', name, join(directives, ' '), types && types.length !== 0 ? '= ' + join(types, ' | ') : ''], ' ');
    },
    EnumTypeExtension: function EnumTypeExtension(_ref37) {
      var name = _ref37.name,
          directives = _ref37.directives,
          values = _ref37.values;
      return join(['extend enum', name, join(directives, ' '), block(values)], ' ');
    },
    InputObjectTypeExtension: function InputObjectTypeExtension(_ref38) {
      var name = _ref38.name,
          directives = _ref38.directives,
          fields = _ref38.fields;
      return join(['extend input', name, join(directives, ' '), block(fields)], ' ');
    }
  };

  function addDescription(cb) {
    return function (node) {
      return join([node.description, cb(node)], '\n');
    };
  }
  /**
   * Given maybeArray, print an empty string if it is null or empty, otherwise
   * print all items together separated by separator if provided
   */


  function join(maybeArray, separator) {
    return maybeArray ? maybeArray.filter(function (x) {
      return x;
    }).join(separator || '') : '';
  }
  /**
   * Given array, print each item on its own line, wrapped in an
   * indented "{ }" block.
   */


  function block(array) {
    return array && array.length !== 0 ? '{\n' + indent(join(array, '\n')) + '\n}' : '';
  }
  /**
   * If maybeString is not null or empty, then wrap with start and end, otherwise
   * print an empty string.
   */


  function wrap(start, maybeString, end) {
    return maybeString ? start + maybeString + (end || '') : '';
  }

  function indent(maybeString) {
    return maybeString && '  ' + maybeString.replace(/\n/g, '\n  ');
  }

  function isMultiline(string) {
    return string.indexOf('\n') !== -1;
  }

  function hasMultilineItems(maybeArray) {
    return maybeArray && maybeArray.some(isMultiline);
  }

  function validateOperation(operation) {
      var OPERATION_FIELDS = [
          'query',
          'operationName',
          'variables',
          'extensions',
          'context',
      ];
      for (var _i = 0, _a = Object.keys(operation); _i < _a.length; _i++) {
          var key = _a[_i];
          if (OPERATION_FIELDS.indexOf(key) < 0) {
              throw new InvariantError$1(2);
          }
      }
      return operation;
  }
  var LinkError = (function (_super) {
      __extends(LinkError, _super);
      function LinkError(message, link) {
          var _this = _super.call(this, message) || this;
          _this.link = link;
          return _this;
      }
      return LinkError;
  }(Error));
  function isTerminating(link) {
      return link.request.length <= 1;
  }
  function fromError(errorValue) {
      return new Observable$1(function (observer) {
          observer.error(errorValue);
      });
  }
  function transformOperation(operation) {
      var transformedOperation = {
          variables: operation.variables || {},
          extensions: operation.extensions || {},
          operationName: operation.operationName,
          query: operation.query,
      };
      if (!transformedOperation.operationName) {
          transformedOperation.operationName =
              typeof transformedOperation.query !== 'string'
                  ? getOperationName(transformedOperation.query)
                  : '';
      }
      return transformedOperation;
  }
  function createOperation(starting, operation) {
      var context = __assign({}, starting);
      var setContext = function (next) {
          if (typeof next === 'function') {
              context = __assign({}, context, next(context));
          }
          else {
              context = __assign({}, context, next);
          }
      };
      var getContext = function () { return (__assign({}, context)); };
      Object.defineProperty(operation, 'setContext', {
          enumerable: false,
          value: setContext,
      });
      Object.defineProperty(operation, 'getContext', {
          enumerable: false,
          value: getContext,
      });
      Object.defineProperty(operation, 'toKey', {
          enumerable: false,
          value: function () { return getKey(operation); },
      });
      return operation;
  }
  function getKey(operation) {
      return print(operation.query) + "|" + JSON.stringify(operation.variables) + "|" + operation.operationName;
  }

  function passthrough(op, forward) {
      return forward ? forward(op) : Observable$1.of();
  }
  function toLink(handler) {
      return typeof handler === 'function' ? new ApolloLink(handler) : handler;
  }
  function empty() {
      return new ApolloLink(function () { return Observable$1.of(); });
  }
  function from(links) {
      if (links.length === 0)
          return empty();
      return links.map(toLink).reduce(function (x, y) { return x.concat(y); });
  }
  function split(test, left, right) {
      var leftLink = toLink(left);
      var rightLink = toLink(right || new ApolloLink(passthrough));
      if (isTerminating(leftLink) && isTerminating(rightLink)) {
          return new ApolloLink(function (operation) {
              return test(operation)
                  ? leftLink.request(operation) || Observable$1.of()
                  : rightLink.request(operation) || Observable$1.of();
          });
      }
      else {
          return new ApolloLink(function (operation, forward) {
              return test(operation)
                  ? leftLink.request(operation, forward) || Observable$1.of()
                  : rightLink.request(operation, forward) || Observable$1.of();
          });
      }
  }
  var concat = function (first, second) {
      var firstLink = toLink(first);
      if (isTerminating(firstLink)) {
          return firstLink;
      }
      var nextLink = toLink(second);
      if (isTerminating(nextLink)) {
          return new ApolloLink(function (operation) {
              return firstLink.request(operation, function (op) { return nextLink.request(op) || Observable$1.of(); }) || Observable$1.of();
          });
      }
      else {
          return new ApolloLink(function (operation, forward) {
              return (firstLink.request(operation, function (op) {
                  return nextLink.request(op, forward) || Observable$1.of();
              }) || Observable$1.of());
          });
      }
  };
  var ApolloLink = (function () {
      function ApolloLink(request) {
          if (request)
              this.request = request;
      }
      ApolloLink.prototype.split = function (test, left, right) {
          return this.concat(split(test, left, right || new ApolloLink(passthrough)));
      };
      ApolloLink.prototype.concat = function (next) {
          return concat(this, next);
      };
      ApolloLink.prototype.request = function (operation, forward) {
          throw new InvariantError$1(1);
      };
      ApolloLink.empty = empty;
      ApolloLink.from = from;
      ApolloLink.split = split;
      ApolloLink.execute = execute;
      return ApolloLink;
  }());
  function execute(link, operation) {
      return (link.request(createOperation(operation.context, transformOperation(validateOperation(operation)))) || Observable$1.of());
  }
  //# sourceMappingURL=bundle.esm.js.map

  function symbolObservablePonyfill(root) {
  	var result;
  	var Symbol = root.Symbol;

  	if (typeof Symbol === 'function') {
  		if (Symbol.observable) {
  			result = Symbol.observable;
  		} else {
  			result = Symbol('observable');
  			Symbol.observable = result;
  		}
  	} else {
  		result = '@@observable';
  	}

  	return result;
  }

  /* global window */

  var root;

  if (typeof self !== 'undefined') {
    root = self;
  } else if (typeof window !== 'undefined') {
    root = window;
  } else if (typeof global !== 'undefined') {
    root = global;
  } else if (typeof module !== 'undefined') {
    root = module;
  } else {
    root = Function('return this')();
  }

  var result = symbolObservablePonyfill(root);

  var genericMessage$2 = "Invariant Violation";
  var _a$2 = Object.setPrototypeOf, setPrototypeOf$2 = _a$2 === void 0 ? function (obj, proto) {
      obj.__proto__ = proto;
      return obj;
  } : _a$2;
  var InvariantError$2 = /** @class */ (function (_super) {
      __extends(InvariantError, _super);
      function InvariantError(message) {
          if (message === void 0) { message = genericMessage$2; }
          var _this = _super.call(this, message) || this;
          _this.framesToPop = 1;
          _this.name = genericMessage$2;
          setPrototypeOf$2(_this, InvariantError.prototype);
          return _this;
      }
      return InvariantError;
  }(Error));
  function invariant$3(condition, message) {
      if (!condition) {
          throw new InvariantError$2(message);
      }
  }
  (function (invariant) {
      function warn() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          return console.warn.apply(console, args);
      }
      invariant.warn = warn;
      function error() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          return console.error.apply(console, args);
      }
      invariant.error = error;
  })(invariant$3 || (invariant$3 = {}));

  var DedupLink = (function (_super) {
      __extends(DedupLink, _super);
      function DedupLink() {
          var _this = _super !== null && _super.apply(this, arguments) || this;
          _this.inFlightRequestObservables = new Map();
          _this.subscribers = new Map();
          return _this;
      }
      DedupLink.prototype.request = function (operation, forward) {
          var _this = this;
          if (operation.getContext().forceFetch) {
              return forward(operation);
          }
          var key = operation.toKey();
          if (!this.inFlightRequestObservables.get(key)) {
              var singleObserver_1 = forward(operation);
              var subscription_1;
              var sharedObserver = new Observable$1(function (observer) {
                  if (!_this.subscribers.has(key))
                      _this.subscribers.set(key, new Set());
                  _this.subscribers.get(key).add(observer);
                  if (!subscription_1) {
                      subscription_1 = singleObserver_1.subscribe({
                          next: function (result) {
                              var subscribers = _this.subscribers.get(key);
                              _this.subscribers.delete(key);
                              _this.inFlightRequestObservables.delete(key);
                              if (subscribers) {
                                  subscribers.forEach(function (obs) { return obs.next(result); });
                                  subscribers.forEach(function (obs) { return obs.complete(); });
                              }
                          },
                          error: function (error) {
                              var subscribers = _this.subscribers.get(key);
                              _this.subscribers.delete(key);
                              _this.inFlightRequestObservables.delete(key);
                              if (subscribers) {
                                  subscribers.forEach(function (obs) { return obs.error(error); });
                              }
                          },
                      });
                  }
                  return function () {
                      if (_this.subscribers.has(key)) {
                          _this.subscribers.get(key).delete(observer);
                          if (_this.subscribers.get(key).size === 0) {
                              _this.inFlightRequestObservables.delete(key);
                              if (subscription_1)
                                  subscription_1.unsubscribe();
                          }
                      }
                  };
              });
              this.inFlightRequestObservables.set(key, sharedObserver);
          }
          return this.inFlightRequestObservables.get(key);
      };
      return DedupLink;
  }(ApolloLink));
  //# sourceMappingURL=bundle.esm.js.map

  var NetworkStatus;
  (function (NetworkStatus) {
      NetworkStatus[NetworkStatus["loading"] = 1] = "loading";
      NetworkStatus[NetworkStatus["setVariables"] = 2] = "setVariables";
      NetworkStatus[NetworkStatus["fetchMore"] = 3] = "fetchMore";
      NetworkStatus[NetworkStatus["refetch"] = 4] = "refetch";
      NetworkStatus[NetworkStatus["poll"] = 6] = "poll";
      NetworkStatus[NetworkStatus["ready"] = 7] = "ready";
      NetworkStatus[NetworkStatus["error"] = 8] = "error";
  })(NetworkStatus || (NetworkStatus = {}));
  function isNetworkRequestInFlight(networkStatus) {
      return networkStatus < 7;
  }

  var Observable$2 = (function (_super) {
      __extends(Observable$$1, _super);
      function Observable$$1() {
          return _super !== null && _super.apply(this, arguments) || this;
      }
      Observable$$1.prototype[result] = function () {
          return this;
      };
      Observable$$1.prototype['@@observable'] = function () {
          return this;
      };
      return Observable$$1;
  }(Observable$1));

  function isApolloError(err) {
      return err.hasOwnProperty('graphQLErrors');
  }
  var generateErrorMessage = function (err) {
      var message = '';
      if (Array.isArray(err.graphQLErrors) && err.graphQLErrors.length !== 0) {
          err.graphQLErrors.forEach(function (graphQLError) {
              var errorMessage = graphQLError
                  ? graphQLError.message
                  : 'Error message not found.';
              message += "GraphQL error: " + errorMessage + "\n";
          });
      }
      if (err.networkError) {
          message += 'Network error: ' + err.networkError.message + '\n';
      }
      message = message.replace(/\n$/, '');
      return message;
  };
  var ApolloError = (function (_super) {
      __extends(ApolloError, _super);
      function ApolloError(_a) {
          var graphQLErrors = _a.graphQLErrors, networkError = _a.networkError, errorMessage = _a.errorMessage, extraInfo = _a.extraInfo;
          var _this = _super.call(this, errorMessage) || this;
          _this.graphQLErrors = graphQLErrors || [];
          _this.networkError = networkError || null;
          if (!errorMessage) {
              _this.message = generateErrorMessage(_this);
          }
          else {
              _this.message = errorMessage;
          }
          _this.extraInfo = extraInfo;
          _this.__proto__ = ApolloError.prototype;
          return _this;
      }
      return ApolloError;
  }(Error));

  var FetchType;
  (function (FetchType) {
      FetchType[FetchType["normal"] = 1] = "normal";
      FetchType[FetchType["refetch"] = 2] = "refetch";
      FetchType[FetchType["poll"] = 3] = "poll";
  })(FetchType || (FetchType = {}));

  var hasError = function (storeValue, policy) {
      if (policy === void 0) { policy = 'none'; }
      return storeValue &&
          ((storeValue.graphQLErrors &&
              storeValue.graphQLErrors.length > 0 &&
              policy === 'none') ||
              storeValue.networkError);
  };
  var ObservableQuery = (function (_super) {
      __extends(ObservableQuery, _super);
      function ObservableQuery(_a) {
          var queryManager = _a.queryManager, options = _a.options, _b = _a.shouldSubscribe, shouldSubscribe = _b === void 0 ? true : _b;
          var _this = _super.call(this, function (observer) {
              return _this.onSubscribe(observer);
          }) || this;
          _this.isTornDown = false;
          _this.options = options;
          _this.variables = options.variables || {};
          _this.queryId = queryManager.generateQueryId();
          _this.shouldSubscribe = shouldSubscribe;
          _this.queryManager = queryManager;
          _this.observers = [];
          _this.subscriptionHandles = [];
          return _this;
      }
      ObservableQuery.prototype.result = function () {
          var that = this;
          return new Promise(function (resolve, reject) {
              var subscription;
              var observer = {
                  next: function (result$$1) {
                      resolve(result$$1);
                      if (!that.observers.some(function (obs) { return obs !== observer; })) {
                          that.queryManager.removeQuery(that.queryId);
                      }
                      setTimeout(function () {
                          subscription.unsubscribe();
                      }, 0);
                  },
                  error: function (error) {
                      reject(error);
                  },
              };
              subscription = that.subscribe(observer);
          });
      };
      ObservableQuery.prototype.currentResult = function () {
          var result$$1 = this.getCurrentResult();
          if (result$$1.data === undefined) {
              result$$1.data = {};
          }
          return result$$1;
      };
      ObservableQuery.prototype.getCurrentResult = function () {
          if (this.isTornDown) {
              return {
                  data: this.lastError
                      ? undefined
                      : this.lastResult
                          ? this.lastResult.data
                          : undefined,
                  error: this.lastError,
                  loading: false,
                  networkStatus: NetworkStatus.error,
              };
          }
          var queryStoreValue = this.queryManager.queryStore.get(this.queryId);
          if (hasError(queryStoreValue, this.options.errorPolicy)) {
              return {
                  data: undefined,
                  loading: false,
                  networkStatus: queryStoreValue.networkStatus,
                  error: new ApolloError({
                      graphQLErrors: queryStoreValue.graphQLErrors,
                      networkError: queryStoreValue.networkError,
                  }),
              };
          }
          if (queryStoreValue && queryStoreValue.variables) {
              this.options.variables = Object.assign({}, this.options.variables, queryStoreValue.variables);
          }
          var _a = this.queryManager.getCurrentQueryResult(this), data = _a.data, partial = _a.partial;
          var queryLoading = !queryStoreValue ||
              queryStoreValue.networkStatus === NetworkStatus.loading;
          var loading = (this.options.fetchPolicy === 'network-only' && queryLoading) ||
              (partial && this.options.fetchPolicy !== 'cache-only');
          var networkStatus;
          if (queryStoreValue) {
              networkStatus = queryStoreValue.networkStatus;
          }
          else {
              networkStatus = loading ? NetworkStatus.loading : NetworkStatus.ready;
          }
          var result$$1 = {
              data: data,
              loading: isNetworkRequestInFlight(networkStatus),
              networkStatus: networkStatus,
          };
          if (queryStoreValue &&
              queryStoreValue.graphQLErrors &&
              this.options.errorPolicy === 'all') {
              result$$1.errors = queryStoreValue.graphQLErrors;
          }
          if (!partial) {
              this.lastResult = __assign({}, result$$1, { stale: false });
              this.lastResultSnapshot = cloneDeep(this.lastResult);
          }
          return __assign({}, result$$1, { partial: partial });
      };
      ObservableQuery.prototype.isDifferentFromLastResult = function (newResult) {
          var snapshot = this.lastResultSnapshot;
          return !(snapshot &&
              newResult &&
              snapshot.networkStatus === newResult.networkStatus &&
              snapshot.stale === newResult.stale &&
              isEqual(snapshot.data, newResult.data));
      };
      ObservableQuery.prototype.getLastResult = function () {
          return this.lastResult;
      };
      ObservableQuery.prototype.getLastError = function () {
          return this.lastError;
      };
      ObservableQuery.prototype.resetLastResults = function () {
          delete this.lastResult;
          delete this.lastResultSnapshot;
          delete this.lastError;
          this.isTornDown = false;
      };
      ObservableQuery.prototype.refetch = function (variables) {
          var fetchPolicy = this.options.fetchPolicy;
          if (fetchPolicy === 'cache-only') {
              return Promise.reject(new Error('cache-only fetchPolicy option should not be used together with query refetch.'));
          }
          if (!isEqual(this.variables, variables)) {
              this.variables = Object.assign({}, this.variables, variables);
          }
          if (!isEqual(this.options.variables, this.variables)) {
              this.options.variables = Object.assign({}, this.options.variables, this.variables);
          }
          var isNetworkFetchPolicy = fetchPolicy === 'network-only' || fetchPolicy === 'no-cache';
          var combinedOptions = __assign({}, this.options, { fetchPolicy: isNetworkFetchPolicy ? fetchPolicy : 'network-only' });
          return this.queryManager
              .fetchQuery(this.queryId, combinedOptions, FetchType.refetch)
              .then(function (result$$1) { return result$$1; });
      };
      ObservableQuery.prototype.fetchMore = function (fetchMoreOptions) {
          var _this = this;
          invariant$3(fetchMoreOptions.updateQuery);
          var combinedOptions;
          return Promise.resolve()
              .then(function () {
              var qid = _this.queryManager.generateQueryId();
              if (fetchMoreOptions.query) {
                  combinedOptions = fetchMoreOptions;
              }
              else {
                  combinedOptions = __assign({}, _this.options, fetchMoreOptions, { variables: Object.assign({}, _this.variables, fetchMoreOptions.variables) });
              }
              combinedOptions.fetchPolicy = 'network-only';
              return _this.queryManager.fetchQuery(qid, combinedOptions, FetchType.normal, _this.queryId);
          })
              .then(function (fetchMoreResult) {
              _this.updateQuery(function (previousResult) {
                  return fetchMoreOptions.updateQuery(previousResult, {
                      fetchMoreResult: fetchMoreResult.data,
                      variables: combinedOptions.variables,
                  });
              });
              return fetchMoreResult;
          });
      };
      ObservableQuery.prototype.subscribeToMore = function (options) {
          var _this = this;
          var subscription = this.queryManager
              .startGraphQLSubscription({
              query: options.document,
              variables: options.variables,
          })
              .subscribe({
              next: function (subscriptionData) {
                  if (options.updateQuery) {
                      _this.updateQuery(function (previous, _a) {
                          var variables = _a.variables;
                          return options.updateQuery(previous, {
                              subscriptionData: subscriptionData,
                              variables: variables,
                          });
                      });
                  }
              },
              error: function (err) {
                  if (options.onError) {
                      options.onError(err);
                      return;
                  }
                  console.error('Unhandled GraphQL subscription error', err);
              },
          });
          this.subscriptionHandles.push(subscription);
          return function () {
              var i = _this.subscriptionHandles.indexOf(subscription);
              if (i >= 0) {
                  _this.subscriptionHandles.splice(i, 1);
                  subscription.unsubscribe();
              }
          };
      };
      ObservableQuery.prototype.setOptions = function (opts) {
          var oldOptions = this.options;
          this.options = Object.assign({}, this.options, opts);
          if (opts.pollInterval) {
              this.startPolling(opts.pollInterval);
          }
          else if (opts.pollInterval === 0) {
              this.stopPolling();
          }
          var tryFetch = (oldOptions.fetchPolicy !== 'network-only' &&
              opts.fetchPolicy === 'network-only') ||
              (oldOptions.fetchPolicy === 'cache-only' &&
                  opts.fetchPolicy !== 'cache-only') ||
              (oldOptions.fetchPolicy === 'standby' &&
                  opts.fetchPolicy !== 'standby') ||
              false;
          return this.setVariables(this.options.variables, tryFetch, opts.fetchResults);
      };
      ObservableQuery.prototype.setVariables = function (variables, tryFetch, fetchResults) {
          if (tryFetch === void 0) { tryFetch = false; }
          if (fetchResults === void 0) { fetchResults = true; }
          this.isTornDown = false;
          var newVariables = variables ? variables : this.variables;
          if (isEqual(newVariables, this.variables) && !tryFetch) {
              if (this.observers.length === 0 || !fetchResults) {
                  return new Promise(function (resolve) { return resolve(); });
              }
              return this.result();
          }
          else {
              this.variables = newVariables;
              this.options.variables = newVariables;
              if (this.observers.length === 0) {
                  return new Promise(function (resolve) { return resolve(); });
              }
              return this.queryManager
                  .fetchQuery(this.queryId, __assign({}, this.options, { variables: this.variables }))
                  .then(function (result$$1) { return result$$1; });
          }
      };
      ObservableQuery.prototype.updateQuery = function (mapFn) {
          var _a = this.queryManager.getQueryWithPreviousResult(this.queryId), previousResult = _a.previousResult, variables = _a.variables, document = _a.document;
          var newResult = tryFunctionOrLogError(function () {
              return mapFn(previousResult, { variables: variables });
          });
          if (newResult) {
              this.queryManager.dataStore.markUpdateQueryResult(document, variables, newResult);
              this.queryManager.broadcastQueries();
          }
      };
      ObservableQuery.prototype.stopPolling = function () {
          this.queryManager.stopPollingQuery(this.queryId);
          this.options.pollInterval = undefined;
      };
      ObservableQuery.prototype.startPolling = function (pollInterval) {
          assertNotCacheFirstOrOnly(this);
          this.options.pollInterval = pollInterval;
          this.queryManager.startPollingQuery(this.options, this.queryId);
      };
      ObservableQuery.prototype.onSubscribe = function (observer) {
          var _this = this;
          if (observer._subscription &&
              observer._subscription._observer &&
              !observer._subscription._observer.error) {
              observer._subscription._observer.error = function (error) {
                  console.error('Unhandled error', error.message, error.stack);
              };
          }
          this.observers.push(observer);
          if (observer.next && this.lastResult)
              observer.next(this.lastResult);
          if (observer.error && this.lastError)
              observer.error(this.lastError);
          if (this.observers.length === 1)
              this.setUpQuery();
          return function () {
              _this.observers = _this.observers.filter(function (obs) { return obs !== observer; });
              if (_this.observers.length === 0) {
                  _this.tearDownQuery();
              }
          };
      };
      ObservableQuery.prototype.setUpQuery = function () {
          var _this = this;
          if (this.shouldSubscribe) {
              this.queryManager.addObservableQuery(this.queryId, this);
          }
          if (!!this.options.pollInterval) {
              assertNotCacheFirstOrOnly(this);
              this.queryManager.startPollingQuery(this.options, this.queryId);
          }
          var observer = {
              next: function (result$$1) {
                  _this.lastResult = result$$1;
                  _this.lastResultSnapshot = cloneDeep(result$$1);
                  _this.observers.forEach(function (obs) { return obs.next && obs.next(result$$1); });
              },
              error: function (error) {
                  _this.lastError = error;
                  _this.observers.forEach(function (obs) { return obs.error && obs.error(error); });
              },
          };
          this.queryManager.startQuery(this.queryId, this.options, this.queryManager.queryListenerForObserver(this.queryId, this.options, observer));
      };
      ObservableQuery.prototype.tearDownQuery = function () {
          this.isTornDown = true;
          this.queryManager.stopPollingQuery(this.queryId);
          this.subscriptionHandles.forEach(function (sub) { return sub.unsubscribe(); });
          this.subscriptionHandles = [];
          this.queryManager.removeObservableQuery(this.queryId);
          this.queryManager.stopQuery(this.queryId);
          this.observers = [];
      };
      return ObservableQuery;
  }(Observable$2));
  function assertNotCacheFirstOrOnly(obsQuery) {
      var fetchPolicy = obsQuery.options.fetchPolicy;
      invariant$3(fetchPolicy !== 'cache-first' && fetchPolicy !== 'cache-only');
  }

  var MutationStore = (function () {
      function MutationStore() {
          this.store = {};
      }
      MutationStore.prototype.getStore = function () {
          return this.store;
      };
      MutationStore.prototype.get = function (mutationId) {
          return this.store[mutationId];
      };
      MutationStore.prototype.initMutation = function (mutationId, mutation, variables) {
          this.store[mutationId] = {
              mutation: mutation,
              variables: variables || {},
              loading: true,
              error: null,
          };
      };
      MutationStore.prototype.markMutationError = function (mutationId, error) {
          var mutation = this.store[mutationId];
          if (!mutation) {
              return;
          }
          mutation.loading = false;
          mutation.error = error;
      };
      MutationStore.prototype.markMutationResult = function (mutationId) {
          var mutation = this.store[mutationId];
          if (!mutation) {
              return;
          }
          mutation.loading = false;
          mutation.error = null;
      };
      MutationStore.prototype.reset = function () {
          this.store = {};
      };
      return MutationStore;
  }());

  var QueryStore = (function () {
      function QueryStore() {
          this.store = {};
      }
      QueryStore.prototype.getStore = function () {
          return this.store;
      };
      QueryStore.prototype.get = function (queryId) {
          return this.store[queryId];
      };
      QueryStore.prototype.initQuery = function (query) {
          var previousQuery = this.store[query.queryId];
          if (previousQuery &&
              previousQuery.document !== query.document &&
              !isEqual(previousQuery.document, query.document)) {
              throw new InvariantError$2();
          }
          var isSetVariables = false;
          var previousVariables = null;
          if (query.storePreviousVariables &&
              previousQuery &&
              previousQuery.networkStatus !== NetworkStatus.loading) {
              if (!isEqual(previousQuery.variables, query.variables)) {
                  isSetVariables = true;
                  previousVariables = previousQuery.variables;
              }
          }
          var networkStatus;
          if (isSetVariables) {
              networkStatus = NetworkStatus.setVariables;
          }
          else if (query.isPoll) {
              networkStatus = NetworkStatus.poll;
          }
          else if (query.isRefetch) {
              networkStatus = NetworkStatus.refetch;
          }
          else {
              networkStatus = NetworkStatus.loading;
          }
          var graphQLErrors = [];
          if (previousQuery && previousQuery.graphQLErrors) {
              graphQLErrors = previousQuery.graphQLErrors;
          }
          this.store[query.queryId] = {
              document: query.document,
              variables: query.variables,
              previousVariables: previousVariables,
              networkError: null,
              graphQLErrors: graphQLErrors,
              networkStatus: networkStatus,
              metadata: query.metadata,
          };
          if (typeof query.fetchMoreForQueryId === 'string' &&
              this.store[query.fetchMoreForQueryId]) {
              this.store[query.fetchMoreForQueryId].networkStatus =
                  NetworkStatus.fetchMore;
          }
      };
      QueryStore.prototype.markQueryResult = function (queryId, result$$1, fetchMoreForQueryId) {
          if (!this.store || !this.store[queryId])
              return;
          this.store[queryId].networkError = null;
          this.store[queryId].graphQLErrors =
              result$$1.errors && result$$1.errors.length ? result$$1.errors : [];
          this.store[queryId].previousVariables = null;
          this.store[queryId].networkStatus = NetworkStatus.ready;
          if (typeof fetchMoreForQueryId === 'string' &&
              this.store[fetchMoreForQueryId]) {
              this.store[fetchMoreForQueryId].networkStatus = NetworkStatus.ready;
          }
      };
      QueryStore.prototype.markQueryError = function (queryId, error, fetchMoreForQueryId) {
          if (!this.store || !this.store[queryId])
              return;
          this.store[queryId].networkError = error;
          this.store[queryId].networkStatus = NetworkStatus.error;
          if (typeof fetchMoreForQueryId === 'string') {
              this.markQueryResultClient(fetchMoreForQueryId, true);
          }
      };
      QueryStore.prototype.markQueryResultClient = function (queryId, complete) {
          if (!this.store || !this.store[queryId])
              return;
          this.store[queryId].networkError = null;
          this.store[queryId].previousVariables = null;
          this.store[queryId].networkStatus = complete
              ? NetworkStatus.ready
              : NetworkStatus.loading;
      };
      QueryStore.prototype.stopQuery = function (queryId) {
          delete this.store[queryId];
      };
      QueryStore.prototype.reset = function (observableQueryIds) {
          var _this = this;
          this.store = Object.keys(this.store)
              .filter(function (queryId) {
              return observableQueryIds.indexOf(queryId) > -1;
          })
              .reduce(function (res, key) {
              res[key] = __assign({}, _this.store[key], { networkStatus: NetworkStatus.loading });
              return res;
          }, {});
      };
      return QueryStore;
  }());

  function capitalizeFirstLetter(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
  }

  var LocalState = (function () {
      function LocalState(_a) {
          var cache = _a.cache, client = _a.client, resolvers = _a.resolvers, fragmentMatcher = _a.fragmentMatcher;
          this.cache = cache;
          if (client) {
              this.client = client;
          }
          if (resolvers) {
              this.addResolvers(resolvers);
          }
          if (fragmentMatcher) {
              this.setFragmentMatcher(fragmentMatcher);
          }
      }
      LocalState.prototype.addResolvers = function (resolvers) {
          var _this = this;
          this.resolvers = this.resolvers || {};
          if (Array.isArray(resolvers)) {
              resolvers.forEach(function (resolverGroup) {
                  _this.resolvers = mergeDeep(_this.resolvers, resolverGroup);
              });
          }
          else {
              this.resolvers = mergeDeep(this.resolvers, resolvers);
          }
      };
      LocalState.prototype.setResolvers = function (resolvers) {
          this.resolvers = {};
          this.addResolvers(resolvers);
      };
      LocalState.prototype.getResolvers = function () {
          return this.resolvers || {};
      };
      LocalState.prototype.runResolvers = function (_a) {
          var document = _a.document, remoteResult = _a.remoteResult, context = _a.context, variables = _a.variables, _b = _a.onlyRunForcedResolvers, onlyRunForcedResolvers = _b === void 0 ? false : _b;
          return __awaiter(this, void 0, void 0, function () {
              return __generator(this, function (_c) {
                  if (document) {
                      return [2, this.resolveDocument(document, remoteResult.data, context, variables, this.fragmentMatcher, onlyRunForcedResolvers).then(function (localResult) { return (__assign({}, remoteResult, { data: localResult.result })); })];
                  }
                  return [2, remoteResult];
              });
          });
      };
      LocalState.prototype.setFragmentMatcher = function (fragmentMatcher) {
          this.fragmentMatcher = fragmentMatcher;
      };
      LocalState.prototype.getFragmentMatcher = function () {
          return this.fragmentMatcher;
      };
      LocalState.prototype.clientQuery = function (document) {
          if (hasDirectives(['client'], document)) {
              if (this.resolvers) {
                  return document;
              }
          }
          return null;
      };
      LocalState.prototype.serverQuery = function (document) {
          return this.resolvers ? removeClientSetsFromDocument(document) : document;
      };
      LocalState.prototype.prepareContext = function (context) {
          if (context === void 0) { context = {}; }
          var cache = this.cache;
          var newContext = __assign({}, context, { cache: cache, getCacheKey: function (obj) {
                  if (cache.config) {
                      return cache.config.dataIdFromObject(obj);
                  }
                  else {
                      invariant$3(false);
                  }
              } });
          return newContext;
      };
      LocalState.prototype.addExportedVariables = function (document, variables, context) {
          if (variables === void 0) { variables = {}; }
          if (context === void 0) { context = {}; }
          return __awaiter(this, void 0, void 0, function () {
              return __generator(this, function (_a) {
                  if (document) {
                      return [2, this.resolveDocument(document, this.buildRootValueFromCache(document, variables) || {}, this.prepareContext(context), variables).then(function (data) { return (__assign({}, variables, data.exportedVariables)); })];
                  }
                  return [2, __assign({}, variables)];
              });
          });
      };
      LocalState.prototype.shouldForceResolvers = function (document) {
          var forceResolvers = false;
          visit(document, {
              Directive: {
                  enter: function (node) {
                      if (node.name.value === 'client' && node.arguments) {
                          forceResolvers = node.arguments.some(function (arg) {
                              return arg.name.value === 'always' &&
                                  arg.value.kind === 'BooleanValue' &&
                                  arg.value.value === true;
                          });
                          if (forceResolvers) {
                              return BREAK;
                          }
                      }
                  },
              },
          });
          return forceResolvers;
      };
      LocalState.prototype.shouldForceResolver = function (field) {
          return this.shouldForceResolvers(field);
      };
      LocalState.prototype.buildRootValueFromCache = function (document, variables) {
          return this.cache.diff({
              query: buildQueryFromSelectionSet(document),
              variables: variables,
              optimistic: false,
          }).result;
      };
      LocalState.prototype.resolveDocument = function (document, rootValue, context, variables, fragmentMatcher, onlyRunForcedResolvers) {
          if (context === void 0) { context = {}; }
          if (variables === void 0) { variables = {}; }
          if (fragmentMatcher === void 0) { fragmentMatcher = function () { return true; }; }
          if (onlyRunForcedResolvers === void 0) { onlyRunForcedResolvers = false; }
          return __awaiter(this, void 0, void 0, function () {
              var mainDefinition, fragments, fragmentMap, definitionOperation, defaultOperationType, _a, cache, client, execContext;
              return __generator(this, function (_b) {
                  mainDefinition = getMainDefinition(document);
                  fragments = getFragmentDefinitions(document);
                  fragmentMap = createFragmentMap(fragments);
                  definitionOperation = mainDefinition
                      .operation;
                  defaultOperationType = definitionOperation
                      ? capitalizeFirstLetter(definitionOperation)
                      : 'Query';
                  _a = this, cache = _a.cache, client = _a.client;
                  execContext = {
                      fragmentMap: fragmentMap,
                      context: __assign({}, context, { cache: cache,
                          client: client }),
                      variables: variables,
                      fragmentMatcher: fragmentMatcher,
                      defaultOperationType: defaultOperationType,
                      exportedVariables: {},
                      onlyRunForcedResolvers: onlyRunForcedResolvers,
                  };
                  return [2, this.resolveSelectionSet(mainDefinition.selectionSet, rootValue, execContext).then(function (result$$1) { return ({
                          result: result$$1,
                          exportedVariables: execContext.exportedVariables,
                      }); })];
              });
          });
      };
      LocalState.prototype.resolveSelectionSet = function (selectionSet, rootValue, execContext) {
          return __awaiter(this, void 0, void 0, function () {
              var fragmentMap, context, variables, resultsToMerge, execute$$1;
              var _this = this;
              return __generator(this, function (_a) {
                  fragmentMap = execContext.fragmentMap, context = execContext.context, variables = execContext.variables;
                  resultsToMerge = [rootValue];
                  execute$$1 = function (selection) { return __awaiter(_this, void 0, void 0, function () {
                      var fragment, typeCondition;
                      return __generator(this, function (_a) {
                          if (!shouldInclude(selection, variables)) {
                              return [2];
                          }
                          if (isField(selection)) {
                              return [2, this.resolveField(selection, rootValue, execContext).then(function (fieldResult) {
                                      var _a;
                                      if (typeof fieldResult !== 'undefined') {
                                          resultsToMerge.push((_a = {},
                                              _a[resultKeyNameFromField(selection)] = fieldResult,
                                              _a));
                                      }
                                  })];
                          }
                          if (isInlineFragment(selection)) {
                              fragment = selection;
                          }
                          else {
                              fragment = fragmentMap[selection.name.value];
                              invariant$3(fragment);
                          }
                          if (fragment && fragment.typeCondition) {
                              typeCondition = fragment.typeCondition.name.value;
                              if (execContext.fragmentMatcher(rootValue, typeCondition, context)) {
                                  return [2, this.resolveSelectionSet(fragment.selectionSet, rootValue, execContext).then(function (fragmentResult) {
                                          resultsToMerge.push(fragmentResult);
                                      })];
                              }
                          }
                          return [2];
                      });
                  }); };
                  return [2, Promise.all(selectionSet.selections.map(execute$$1)).then(function () {
                          return mergeDeepArray(resultsToMerge);
                      })];
              });
          });
      };
      LocalState.prototype.resolveField = function (field, rootValue, execContext) {
          return __awaiter(this, void 0, void 0, function () {
              var variables, fieldName, aliasedFieldName, aliasUsed, defaultResult, resultPromise, resolverType, resolverMap, resolve;
              var _this = this;
              return __generator(this, function (_a) {
                  variables = execContext.variables;
                  fieldName = field.name.value;
                  aliasedFieldName = resultKeyNameFromField(field);
                  aliasUsed = fieldName !== aliasedFieldName;
                  defaultResult = rootValue[aliasedFieldName] || rootValue[fieldName];
                  resultPromise = Promise.resolve(defaultResult);
                  if (!execContext.onlyRunForcedResolvers ||
                      this.shouldForceResolver(field)) {
                      resolverType = rootValue.__typename || execContext.defaultOperationType;
                      resolverMap = this.resolvers && this.resolvers[resolverType];
                      if (resolverMap) {
                          resolve = resolverMap[aliasUsed ? fieldName : aliasedFieldName];
                          if (resolve) {
                              resultPromise = Promise.resolve(resolve(rootValue, argumentsObjectFromField(field, variables), execContext.context, { field: field }));
                          }
                      }
                  }
                  return [2, resultPromise.then(function (result$$1) {
                          if (result$$1 === void 0) { result$$1 = defaultResult; }
                          if (field.directives) {
                              field.directives.forEach(function (directive) {
                                  if (directive.name.value === 'export' && directive.arguments) {
                                      directive.arguments.forEach(function (arg) {
                                          if (arg.name.value === 'as' && arg.value.kind === 'StringValue') {
                                              execContext.exportedVariables[arg.value.value] = result$$1;
                                          }
                                      });
                                  }
                              });
                          }
                          if (!field.selectionSet) {
                              return result$$1;
                          }
                          if (result$$1 == null) {
                              return result$$1;
                          }
                          if (Array.isArray(result$$1)) {
                              return _this.resolveSubSelectedArray(field, result$$1, execContext);
                          }
                          if (field.selectionSet) {
                              return _this.resolveSelectionSet(field.selectionSet, result$$1, execContext);
                          }
                      })];
              });
          });
      };
      LocalState.prototype.resolveSubSelectedArray = function (field, result$$1, execContext) {
          var _this = this;
          return Promise.all(result$$1.map(function (item) {
              if (item === null) {
                  return null;
              }
              if (Array.isArray(item)) {
                  return _this.resolveSubSelectedArray(field, item, execContext);
              }
              if (field.selectionSet) {
                  return _this.resolveSelectionSet(field.selectionSet, item, execContext);
              }
          }));
      };
      return LocalState;
  }());

  var QueryManager = (function () {
      function QueryManager(_a) {
          var link = _a.link, _b = _a.queryDeduplication, queryDeduplication = _b === void 0 ? false : _b, store = _a.store, _c = _a.onBroadcast, onBroadcast = _c === void 0 ? function () { return undefined; } : _c, _d = _a.ssrMode, ssrMode = _d === void 0 ? false : _d, _e = _a.clientAwareness, clientAwareness = _e === void 0 ? {} : _e, localState = _a.localState;
          this.mutationStore = new MutationStore();
          this.queryStore = new QueryStore();
          this.clientAwareness = {};
          this.idCounter = 1;
          this.queries = new Map();
          this.fetchQueryRejectFns = new Map();
          this.queryIdsByName = {};
          this.pollingInfoByQueryId = new Map();
          this.nextPoll = null;
          this.link = link;
          this.deduplicator = ApolloLink.from([new DedupLink(), link]);
          this.queryDeduplication = queryDeduplication;
          this.dataStore = store;
          this.onBroadcast = onBroadcast;
          this.clientAwareness = clientAwareness;
          this.localState = localState || new LocalState({ cache: store.getCache() });
          this.ssrMode = ssrMode;
      }
      QueryManager.prototype.stop = function () {
          var _this = this;
          this.queries.forEach(function (_info, queryId) {
              _this.stopQueryNoBroadcast(queryId);
          });
          this.fetchQueryRejectFns.forEach(function (reject) {
              reject(new Error('QueryManager stopped while query was in flight'));
          });
      };
      QueryManager.prototype.mutate = function (_a) {
          var mutation = _a.mutation, variables = _a.variables, optimisticResponse = _a.optimisticResponse, updateQueriesByName = _a.updateQueries, _b = _a.refetchQueries, refetchQueries = _b === void 0 ? [] : _b, _c = _a.awaitRefetchQueries, awaitRefetchQueries = _c === void 0 ? false : _c, updateWithProxyFn = _a.update, _d = _a.errorPolicy, errorPolicy = _d === void 0 ? 'none' : _d, fetchPolicy = _a.fetchPolicy, _e = _a.context, context = _e === void 0 ? {} : _e;
          return __awaiter(this, void 0, void 0, function () {
              var mutationId, cache, generateUpdateQueriesInfo, updatedVariables, _f;
              var _this = this;
              return __generator(this, function (_g) {
                  switch (_g.label) {
                      case 0:
                          invariant$3(mutation);
                          invariant$3(!fetchPolicy || fetchPolicy === 'no-cache');
                          mutationId = this.generateQueryId();
                          cache = this.dataStore.getCache();
                          (mutation = cache.transformDocument(mutation)),
                              (variables = assign({}, getDefaultValues(getMutationDefinition(mutation)), variables));
                          this.setQuery(mutationId, function () { return ({ document: mutation }); });
                          generateUpdateQueriesInfo = function () {
                              var ret = {};
                              if (updateQueriesByName) {
                                  Object.keys(updateQueriesByName).forEach(function (queryName) {
                                      return (_this.queryIdsByName[queryName] || []).forEach(function (queryId) {
                                          ret[queryId] = {
                                              updater: updateQueriesByName[queryName],
                                              query: _this.queryStore.get(queryId),
                                          };
                                      });
                                  });
                              }
                              return ret;
                          };
                          if (!hasClientExports(mutation)) return [3, 2];
                          return [4, this.localState.addExportedVariables(mutation, variables, context)];
                      case 1:
                          _f = _g.sent();
                          return [3, 3];
                      case 2:
                          _f = variables;
                          _g.label = 3;
                      case 3:
                          updatedVariables = _f;
                          this.mutationStore.initMutation(mutationId, mutation, updatedVariables);
                          this.dataStore.markMutationInit({
                              mutationId: mutationId,
                              document: mutation,
                              variables: updatedVariables || {},
                              updateQueries: generateUpdateQueriesInfo(),
                              update: updateWithProxyFn,
                              optimisticResponse: optimisticResponse,
                          });
                          this.broadcastQueries();
                          return [2, new Promise(function (resolve, reject) {
                                  var storeResult;
                                  var error;
                                  var operation = _this.buildOperationForLink(mutation, updatedVariables, __assign({}, context, { optimisticResponse: optimisticResponse }));
                                  var completeMutation = function () {
                                      if (error) {
                                          _this.mutationStore.markMutationError(mutationId, error);
                                      }
                                      _this.dataStore.markMutationComplete({
                                          mutationId: mutationId,
                                          optimisticResponse: optimisticResponse,
                                      });
                                      _this.broadcastQueries();
                                      if (error) {
                                          return Promise.reject(error);
                                      }
                                      if (typeof refetchQueries === 'function') {
                                          refetchQueries = refetchQueries(storeResult);
                                      }
                                      var refetchQueryPromises = [];
                                      for (var _i = 0, refetchQueries_1 = refetchQueries; _i < refetchQueries_1.length; _i++) {
                                          var refetchQuery = refetchQueries_1[_i];
                                          if (typeof refetchQuery === 'string') {
                                              var promise = _this.refetchQueryByName(refetchQuery);
                                              if (promise) {
                                                  refetchQueryPromises.push(promise);
                                              }
                                              continue;
                                          }
                                          var queryOptions = {
                                              query: refetchQuery.query,
                                              variables: refetchQuery.variables,
                                              fetchPolicy: 'network-only',
                                          };
                                          if (refetchQuery.context) {
                                              queryOptions.context = refetchQuery.context;
                                          }
                                          refetchQueryPromises.push(_this.query(queryOptions));
                                      }
                                      return Promise.all(awaitRefetchQueries ? refetchQueryPromises : []).then(function () {
                                          _this.setQuery(mutationId, function () { return ({ document: null }); });
                                          if (errorPolicy === 'ignore' &&
                                              storeResult &&
                                              graphQLResultHasError(storeResult)) {
                                              delete storeResult.errors;
                                          }
                                          return storeResult;
                                      });
                                  };
                                  var clientQuery = _this.localState.clientQuery(operation.query);
                                  var serverQuery = _this.localState.serverQuery(operation.query);
                                  if (serverQuery) {
                                      operation.query = serverQuery;
                                  }
                                  var obs = serverQuery
                                      ? execute(_this.link, operation)
                                      : Observable$2.of({
                                          data: {},
                                      });
                                  var self = _this;
                                  var complete = false;
                                  var handlingNext = false;
                                  obs.subscribe({
                                      next: function (result$$1) { return __awaiter(_this, void 0, void 0, function () {
                                          var updatedResult, context, variables;
                                          return __generator(this, function (_a) {
                                              switch (_a.label) {
                                                  case 0:
                                                      handlingNext = true;
                                                      if (graphQLResultHasError(result$$1) && errorPolicy === 'none') {
                                                          handlingNext = false;
                                                          error = new ApolloError({
                                                              graphQLErrors: result$$1.errors,
                                                          });
                                                          return [2];
                                                      }
                                                      self.mutationStore.markMutationResult(mutationId);
                                                      updatedResult = result$$1;
                                                      context = operation.context, variables = operation.variables;
                                                      if (!(clientQuery && hasDirectives(['client'], clientQuery))) return [3, 2];
                                                      return [4, self.localState
                                                              .runResolvers({
                                                              document: clientQuery,
                                                              remoteResult: result$$1,
                                                              context: context,
                                                              variables: variables,
                                                          })
                                                              .catch(function (error) {
                                                              handlingNext = false;
                                                              reject(error);
                                                              return result$$1;
                                                          })];
                                                  case 1:
                                                      updatedResult = _a.sent();
                                                      _a.label = 2;
                                                  case 2:
                                                      if (fetchPolicy !== 'no-cache') {
                                                          self.dataStore.markMutationResult({
                                                              mutationId: mutationId,
                                                              result: updatedResult,
                                                              document: mutation,
                                                              variables: updatedVariables || {},
                                                              updateQueries: generateUpdateQueriesInfo(),
                                                              update: updateWithProxyFn,
                                                          });
                                                      }
                                                      storeResult = updatedResult;
                                                      handlingNext = false;
                                                      if (complete) {
                                                          completeMutation().then(resolve, reject);
                                                      }
                                                      return [2];
                                              }
                                          });
                                      }); },
                                      error: function (err) {
                                          self.mutationStore.markMutationError(mutationId, err);
                                          self.dataStore.markMutationComplete({
                                              mutationId: mutationId,
                                              optimisticResponse: optimisticResponse,
                                          });
                                          self.broadcastQueries();
                                          self.setQuery(mutationId, function () { return ({ document: null }); });
                                          reject(new ApolloError({
                                              networkError: err,
                                          }));
                                      },
                                      complete: function () {
                                          if (!handlingNext) {
                                              completeMutation().then(resolve, reject);
                                          }
                                          complete = true;
                                      },
                                  });
                              })];
                  }
              });
          });
      };
      QueryManager.prototype.fetchQuery = function (queryId, options, fetchType, fetchMoreForQueryId) {
          return __awaiter(this, void 0, void 0, function () {
              var _a, variables, _b, metadata, _c, fetchPolicy, _d, context, cache, query, updatedVariables, _e, updatedOptions, storeResult, needToFetch, _f, complete, result$$1, shouldFetch, requestId, cancel, shouldDispatchClientResult, networkResult;
              var _this = this;
              return __generator(this, function (_g) {
                  switch (_g.label) {
                      case 0:
                          _a = options.variables, variables = _a === void 0 ? {} : _a, _b = options.metadata, metadata = _b === void 0 ? null : _b, _c = options.fetchPolicy, fetchPolicy = _c === void 0 ? 'cache-first' : _c, _d = options.context, context = _d === void 0 ? {} : _d;
                          cache = this.dataStore.getCache();
                          query = cache.transformDocument(options.query);
                          if (!hasClientExports(query)) return [3, 2];
                          return [4, this.localState.addExportedVariables(query, variables, context)];
                      case 1:
                          _e = _g.sent();
                          return [3, 3];
                      case 2:
                          _e = variables;
                          _g.label = 3;
                      case 3:
                          updatedVariables = _e;
                          updatedOptions = __assign({}, options, { variables: updatedVariables });
                          needToFetch = fetchPolicy === 'network-only' || fetchPolicy === 'no-cache';
                          if (fetchType !== FetchType.refetch &&
                              fetchPolicy !== 'network-only' &&
                              fetchPolicy !== 'no-cache') {
                              _f = this.dataStore.getCache().diff({
                                  query: query,
                                  variables: updatedVariables,
                                  returnPartialData: true,
                                  optimistic: false,
                              }), complete = _f.complete, result$$1 = _f.result;
                              needToFetch = !complete || fetchPolicy === 'cache-and-network';
                              storeResult = result$$1;
                          }
                          shouldFetch = needToFetch && fetchPolicy !== 'cache-only' && fetchPolicy !== 'standby';
                          if (hasDirectives(['live'], query))
                              shouldFetch = true;
                          requestId = this.generateRequestId();
                          cancel = this.updateQueryWatch(queryId, query, updatedOptions);
                          this.setQuery(queryId, function () { return ({
                              document: query,
                              lastRequestId: requestId,
                              invalidated: true,
                              cancel: cancel,
                          }); });
                          this.invalidate(true, fetchMoreForQueryId);
                          this.queryStore.initQuery({
                              queryId: queryId,
                              document: query,
                              storePreviousVariables: shouldFetch,
                              variables: updatedVariables,
                              isPoll: fetchType === FetchType.poll,
                              isRefetch: fetchType === FetchType.refetch,
                              metadata: metadata,
                              fetchMoreForQueryId: fetchMoreForQueryId,
                          });
                          this.broadcastQueries();
                          shouldDispatchClientResult = !shouldFetch || fetchPolicy === 'cache-and-network';
                          if (shouldDispatchClientResult) {
                              this.queryStore.markQueryResultClient(queryId, !shouldFetch);
                              this.invalidate(true, queryId, fetchMoreForQueryId);
                              this.broadcastQueries(this.localState.shouldForceResolvers(query));
                          }
                          if (shouldFetch) {
                              networkResult = this.fetchRequest({
                                  requestId: requestId,
                                  queryId: queryId,
                                  document: query,
                                  options: updatedOptions,
                                  fetchMoreForQueryId: fetchMoreForQueryId,
                              }).catch(function (error) {
                                  if (isApolloError(error)) {
                                      throw error;
                                  }
                                  else {
                                      var lastRequestId = _this.getQuery(queryId).lastRequestId;
                                      if (requestId >= (lastRequestId || 1)) {
                                          _this.queryStore.markQueryError(queryId, error, fetchMoreForQueryId);
                                          _this.invalidate(true, queryId, fetchMoreForQueryId);
                                          _this.broadcastQueries();
                                      }
                                      throw new ApolloError({ networkError: error });
                                  }
                              });
                              if (fetchPolicy !== 'cache-and-network') {
                                  return [2, networkResult];
                              }
                              else {
                                  networkResult.catch(function () { });
                              }
                          }
                          return [2, Promise.resolve({ data: storeResult })];
                  }
              });
          });
      };
      QueryManager.prototype.queryListenerForObserver = function (queryId, options, observer) {
          var _this = this;
          var previouslyHadError = false;
          return function (queryStoreValue, newData, forceResolvers) { return __awaiter(_this, void 0, void 0, function () {
              var observableQuery, fetchPolicy, errorPolicy, lastResult, lastError, shouldNotifyIfLoading, networkStatusChanged, errorStatusChanged, apolloError_1, data, isMissing, document_1, readResult, resultFromStore, query, variables, context, updatedResult, e_1, error_1;
              return __generator(this, function (_a) {
                  switch (_a.label) {
                      case 0:
                          this.invalidate(false, queryId);
                          if (!queryStoreValue)
                              return [2];
                          observableQuery = this.getQuery(queryId).observableQuery;
                          fetchPolicy = observableQuery
                              ? observableQuery.options.fetchPolicy
                              : options.fetchPolicy;
                          if (fetchPolicy === 'standby')
                              return [2];
                          errorPolicy = observableQuery
                              ? observableQuery.options.errorPolicy
                              : options.errorPolicy;
                          lastResult = observableQuery
                              ? observableQuery.getLastResult()
                              : null;
                          lastError = observableQuery ? observableQuery.getLastError() : null;
                          shouldNotifyIfLoading = (!newData && queryStoreValue.previousVariables != null) ||
                              fetchPolicy === 'cache-only' ||
                              fetchPolicy === 'cache-and-network';
                          networkStatusChanged = Boolean(lastResult &&
                              queryStoreValue.networkStatus !== lastResult.networkStatus);
                          errorStatusChanged = errorPolicy &&
                              (lastError && lastError.graphQLErrors) !==
                                  queryStoreValue.graphQLErrors &&
                              errorPolicy !== 'none';
                          if (!(!isNetworkRequestInFlight(queryStoreValue.networkStatus) ||
                              (networkStatusChanged && options.notifyOnNetworkStatusChange) ||
                              shouldNotifyIfLoading)) return [3, 8];
                          if (((!errorPolicy || errorPolicy === 'none') &&
                              queryStoreValue.graphQLErrors &&
                              queryStoreValue.graphQLErrors.length > 0) ||
                              queryStoreValue.networkError) {
                              apolloError_1 = new ApolloError({
                                  graphQLErrors: queryStoreValue.graphQLErrors,
                                  networkError: queryStoreValue.networkError,
                              });
                              previouslyHadError = true;
                              if (observer.error) {
                                  try {
                                      observer.error(apolloError_1);
                                  }
                                  catch (e) {
                                      setTimeout(function () {
                                          throw e;
                                      }, 0);
                                  }
                              }
                              else {
                                  setTimeout(function () {
                                      throw apolloError_1;
                                  }, 0);
                              }
                              return [2];
                          }
                          _a.label = 1;
                      case 1:
                          _a.trys.push([1, 7, , 8]);
                          data = void 0;
                          isMissing = void 0;
                          if (newData) {
                              if (fetchPolicy !== 'no-cache' && fetchPolicy !== 'network-only') {
                                  this.setQuery(queryId, function () { return ({ newData: null }); });
                              }
                              data = newData.result;
                              isMissing = !newData.complete || false;
                          }
                          else {
                              if (lastResult && lastResult.data && !errorStatusChanged) {
                                  data = lastResult.data;
                                  isMissing = false;
                              }
                              else {
                                  document_1 = this.getQuery(queryId).document;
                                  readResult = this.dataStore.getCache().diff({
                                      query: document_1,
                                      variables: queryStoreValue.previousVariables ||
                                          queryStoreValue.variables,
                                      optimistic: true,
                                  });
                                  data = readResult.result;
                                  isMissing = !readResult.complete;
                              }
                          }
                          resultFromStore = void 0;
                          if (isMissing && fetchPolicy !== 'cache-only') {
                              resultFromStore = {
                                  data: lastResult && lastResult.data,
                                  loading: isNetworkRequestInFlight(queryStoreValue.networkStatus),
                                  networkStatus: queryStoreValue.networkStatus,
                                  stale: true,
                              };
                          }
                          else {
                              resultFromStore = {
                                  data: data,
                                  loading: isNetworkRequestInFlight(queryStoreValue.networkStatus),
                                  networkStatus: queryStoreValue.networkStatus,
                                  stale: false,
                              };
                          }
                          if (errorPolicy === 'all' &&
                              queryStoreValue.graphQLErrors &&
                              queryStoreValue.graphQLErrors.length > 0) {
                              resultFromStore.errors = queryStoreValue.graphQLErrors;
                          }
                          if (!observer.next) return [3, 6];
                          if (!(previouslyHadError ||
                              !observableQuery ||
                              observableQuery.isDifferentFromLastResult(resultFromStore))) return [3, 6];
                          _a.label = 2;
                      case 2:
                          _a.trys.push([2, 5, , 6]);
                          if (!forceResolvers) return [3, 4];
                          query = options.query, variables = options.variables, context = options.context;
                          return [4, this.localState.runResolvers({
                                  document: query,
                                  remoteResult: resultFromStore,
                                  context: context,
                                  variables: variables,
                                  onlyRunForcedResolvers: forceResolvers,
                              })];
                      case 3:
                          updatedResult = _a.sent();
                          resultFromStore = __assign({}, resultFromStore, updatedResult);
                          _a.label = 4;
                      case 4:
                          observer.next(resultFromStore);
                          return [3, 6];
                      case 5:
                          e_1 = _a.sent();
                          setTimeout(function () {
                              throw e_1;
                          }, 0);
                          return [3, 6];
                      case 6:
                          previouslyHadError = false;
                          return [3, 8];
                      case 7:
                          error_1 = _a.sent();
                          previouslyHadError = true;
                          if (observer.error)
                              observer.error(new ApolloError({ networkError: error_1 }));
                          return [2];
                      case 8: return [2];
                  }
              });
          }); };
      };
      QueryManager.prototype.watchQuery = function (options, shouldSubscribe) {
          if (shouldSubscribe === void 0) { shouldSubscribe = true; }
          invariant$3(options.fetchPolicy !== 'standby');
          var queryDefinition = getQueryDefinition(options.query);
          if (queryDefinition.variableDefinitions &&
              queryDefinition.variableDefinitions.length) {
              var defaultValues = getDefaultValues(queryDefinition);
              options.variables = assign({}, defaultValues, options.variables);
          }
          if (typeof options.notifyOnNetworkStatusChange === 'undefined') {
              options.notifyOnNetworkStatusChange = false;
          }
          var transformedOptions = __assign({}, options);
          return new ObservableQuery({
              queryManager: this,
              options: transformedOptions,
              shouldSubscribe: shouldSubscribe,
          });
      };
      QueryManager.prototype.query = function (options) {
          var _this = this;
          invariant$3(options.query);
          invariant$3(options.query.kind === 'Document');
          invariant$3(!options.returnPartialData);
          invariant$3(!options.pollInterval);
          return new Promise(function (resolve, reject) {
              var watchedQuery = _this.watchQuery(options, false);
              _this.fetchQueryRejectFns.set("query:" + watchedQuery.queryId, reject);
              watchedQuery
                  .result()
                  .then(resolve, reject)
                  .then(function () {
                  return _this.fetchQueryRejectFns.delete("query:" + watchedQuery.queryId);
              });
          });
      };
      QueryManager.prototype.generateQueryId = function () {
          var queryId = this.idCounter.toString();
          this.idCounter++;
          return queryId;
      };
      QueryManager.prototype.stopQueryInStore = function (queryId) {
          this.stopQueryInStoreNoBroadcast(queryId);
          this.broadcastQueries();
      };
      QueryManager.prototype.stopQueryInStoreNoBroadcast = function (queryId) {
          this.stopPollingQuery(queryId);
          this.queryStore.stopQuery(queryId);
          this.invalidate(true, queryId);
      };
      QueryManager.prototype.addQueryListener = function (queryId, listener) {
          this.setQuery(queryId, function (_a) {
              var _b = _a.listeners, listeners = _b === void 0 ? [] : _b;
              return ({
                  listeners: listeners.concat([listener]),
                  invalidated: false,
              });
          });
      };
      QueryManager.prototype.updateQueryWatch = function (queryId, document, options) {
          var _this = this;
          var cancel = this.getQuery(queryId).cancel;
          if (cancel)
              cancel();
          var previousResult = function () {
              var previousResult = null;
              var observableQuery = _this.getQuery(queryId).observableQuery;
              if (observableQuery) {
                  var lastResult = observableQuery.getLastResult();
                  if (lastResult) {
                      previousResult = lastResult.data;
                  }
              }
              return previousResult;
          };
          return this.dataStore.getCache().watch({
              query: document,
              variables: options.variables,
              optimistic: true,
              previousResult: previousResult,
              callback: function (newData) {
                  _this.setQuery(queryId, function () { return ({ invalidated: true, newData: newData }); });
              },
          });
      };
      QueryManager.prototype.addObservableQuery = function (queryId, observableQuery) {
          this.setQuery(queryId, function () { return ({ observableQuery: observableQuery }); });
          var queryDef = getQueryDefinition(observableQuery.options.query);
          if (queryDef.name && queryDef.name.value) {
              var queryName = queryDef.name.value;
              this.queryIdsByName[queryName] = this.queryIdsByName[queryName] || [];
              this.queryIdsByName[queryName].push(observableQuery.queryId);
          }
      };
      QueryManager.prototype.removeObservableQuery = function (queryId) {
          var _a = this.getQuery(queryId), observableQuery = _a.observableQuery, cancel = _a.cancel;
          if (cancel)
              cancel();
          if (!observableQuery)
              return;
          var definition = getQueryDefinition(observableQuery.options.query);
          var queryName = definition.name ? definition.name.value : null;
          this.setQuery(queryId, function () { return ({ observableQuery: null }); });
          if (queryName) {
              this.queryIdsByName[queryName] = this.queryIdsByName[queryName].filter(function (val) {
                  return !(observableQuery.queryId === val);
              });
          }
      };
      QueryManager.prototype.clearStore = function () {
          this.fetchQueryRejectFns.forEach(function (reject) {
              reject(new Error('Store reset while query was in flight(not completed in link chain)'));
          });
          var resetIds = [];
          this.queries.forEach(function (_a, queryId) {
              var observableQuery = _a.observableQuery;
              if (observableQuery)
                  resetIds.push(queryId);
          });
          this.queryStore.reset(resetIds);
          this.mutationStore.reset();
          var reset = this.dataStore.reset();
          return reset;
      };
      QueryManager.prototype.resetStore = function () {
          var _this = this;
          return this.clearStore().then(function () {
              return _this.reFetchObservableQueries();
          });
      };
      QueryManager.prototype.reFetchObservableQueries = function (includeStandby) {
          var observableQueryPromises = this.getObservableQueryPromises(includeStandby);
          this.broadcastQueries();
          return Promise.all(observableQueryPromises);
      };
      QueryManager.prototype.startQuery = function (queryId, options, listener) {
          this.addQueryListener(queryId, listener);
          this.fetchQuery(queryId, options)
              .catch(function () { return undefined; });
          return queryId;
      };
      QueryManager.prototype.startGraphQLSubscription = function (options) {
          var _this = this;
          var query = options.query;
          var isCacheEnabled = !(options.fetchPolicy && options.fetchPolicy === 'no-cache');
          var cache = this.dataStore.getCache();
          var transformedDoc = cache.transformDocument(query);
          var variables = assign({}, getDefaultValues(getOperationDefinition(query)), options.variables);
          var updatedVariables = variables;
          var sub;
          var observers = [];
          var clientQuery = this.localState.clientQuery(transformedDoc);
          return new Observable$2(function (observer) {
              observers.push(observer);
              if (observers.length === 1) {
                  var activeNextCalls_1 = 0;
                  var complete_1 = false;
                  var handler_1 = {
                      next: function (result$$1) { return __awaiter(_this, void 0, void 0, function () {
                          var updatedResult;
                          return __generator(this, function (_a) {
                              switch (_a.label) {
                                  case 0:
                                      activeNextCalls_1 += 1;
                                      updatedResult = result$$1;
                                      if (!(clientQuery && hasDirectives(['client'], clientQuery))) return [3, 2];
                                      return [4, this.localState.runResolvers({
                                              document: clientQuery,
                                              remoteResult: result$$1,
                                              context: {},
                                              variables: updatedVariables,
                                          })];
                                  case 1:
                                      updatedResult = _a.sent();
                                      _a.label = 2;
                                  case 2:
                                      if (isCacheEnabled) {
                                          this.dataStore.markSubscriptionResult(updatedResult, transformedDoc, updatedVariables);
                                          this.broadcastQueries();
                                      }
                                      observers.forEach(function (obs) {
                                          if (graphQLResultHasError(updatedResult) && obs.error) {
                                              obs.error(new ApolloError({
                                                  graphQLErrors: updatedResult.errors,
                                              }));
                                          }
                                          else if (obs.next) {
                                              obs.next(updatedResult);
                                          }
                                          activeNextCalls_1 -= 1;
                                      });
                                      if (activeNextCalls_1 === 0 && complete_1) {
                                          handler_1.complete();
                                      }
                                      return [2];
                              }
                          });
                      }); },
                      error: function (error) {
                          observers.forEach(function (obs) {
                              if (obs.error) {
                                  obs.error(error);
                              }
                          });
                      },
                      complete: function () {
                          if (activeNextCalls_1 === 0) {
                              observers.forEach(function (obs) {
                                  if (obs.complete) {
                                      obs.complete();
                                  }
                              });
                          }
                          complete_1 = true;
                      }
                  };
                  (function () { return __awaiter(_this, void 0, void 0, function () {
                      var updatedVariables, _a, serverQuery, operation;
                      return __generator(this, function (_b) {
                          switch (_b.label) {
                              case 0:
                                  if (!hasClientExports(transformedDoc)) return [3, 2];
                                  return [4, this.localState.addExportedVariables(transformedDoc, variables)];
                              case 1:
                                  _a = _b.sent();
                                  return [3, 3];
                              case 2:
                                  _a = variables;
                                  _b.label = 3;
                              case 3:
                                  updatedVariables = _a;
                                  serverQuery = this.localState.serverQuery(transformedDoc);
                                  if (serverQuery) {
                                      operation = this.buildOperationForLink(serverQuery, updatedVariables);
                                      sub = execute(this.link, operation).subscribe(handler_1);
                                  }
                                  else {
                                      sub = Observable$2.of({ data: {} }).subscribe(handler_1);
                                  }
                                  return [2];
                          }
                      });
                  }); })();
              }
              return function () {
                  observers = observers.filter(function (obs) { return obs !== observer; });
                  if (observers.length === 0 && sub) {
                      sub.unsubscribe();
                  }
              };
          });
      };
      QueryManager.prototype.stopQuery = function (queryId) {
          this.stopQueryNoBroadcast(queryId);
          this.broadcastQueries();
      };
      QueryManager.prototype.stopQueryNoBroadcast = function (queryId) {
          this.stopQueryInStoreNoBroadcast(queryId);
          this.removeQuery(queryId);
      };
      QueryManager.prototype.removeQuery = function (queryId) {
          var subscriptions = this.getQuery(queryId).subscriptions;
          this.fetchQueryRejectFns.delete("query:" + queryId);
          this.fetchQueryRejectFns.delete("fetchRequest:" + queryId);
          subscriptions.forEach(function (x) { return x.unsubscribe(); });
          this.queries.delete(queryId);
      };
      QueryManager.prototype.getCurrentQueryResult = function (observableQuery, optimistic) {
          if (optimistic === void 0) { optimistic = true; }
          var _a = observableQuery.options, variables = _a.variables, query = _a.query, fetchPolicy = _a.fetchPolicy;
          var lastResult = observableQuery.getLastResult();
          var newData = this.getQuery(observableQuery.queryId).newData;
          if (newData && newData.complete) {
              return { data: newData.result, partial: false };
          }
          else if (fetchPolicy === 'no-cache' || fetchPolicy === 'network-only') {
              return { data: undefined, partial: false };
          }
          else {
              try {
                  var data = this.dataStore.getCache().read({
                      query: query,
                      variables: variables,
                      previousResult: lastResult ? lastResult.data : undefined,
                      optimistic: optimistic,
                  }) || undefined;
                  return { data: data, partial: false };
              }
              catch (e) {
                  return { data: undefined, partial: true };
              }
          }
      };
      QueryManager.prototype.getQueryWithPreviousResult = function (queryIdOrObservable) {
          var observableQuery;
          if (typeof queryIdOrObservable === 'string') {
              var foundObserveableQuery = this.getQuery(queryIdOrObservable).observableQuery;
              invariant$3(foundObserveableQuery);
              observableQuery = foundObserveableQuery;
          }
          else {
              observableQuery = queryIdOrObservable;
          }
          var _a = observableQuery.options, variables = _a.variables, query = _a.query;
          var data = this.getCurrentQueryResult(observableQuery, false).data;
          return {
              previousResult: data,
              variables: variables,
              document: query,
          };
      };
      QueryManager.prototype.broadcastQueries = function (forceResolvers) {
          var _this = this;
          if (forceResolvers === void 0) { forceResolvers = false; }
          this.onBroadcast();
          this.queries.forEach(function (info, id) {
              if (!info.invalidated || !info.listeners)
                  return;
              info.listeners
                  .filter(function (x) { return !!x; })
                  .forEach(function (listener) {
                  listener(_this.queryStore.get(id), info.newData, forceResolvers);
              });
          });
      };
      QueryManager.prototype.getLocalState = function () {
          return this.localState;
      };
      QueryManager.prototype.getObservableQueryPromises = function (includeStandby) {
          var _this = this;
          var observableQueryPromises = [];
          this.queries.forEach(function (_a, queryId) {
              var observableQuery = _a.observableQuery;
              if (!observableQuery)
                  return;
              var fetchPolicy = observableQuery.options.fetchPolicy;
              observableQuery.resetLastResults();
              if (fetchPolicy !== 'cache-only' &&
                  (includeStandby || fetchPolicy !== 'standby')) {
                  observableQueryPromises.push(observableQuery.refetch());
              }
              _this.setQuery(queryId, function () { return ({ newData: null }); });
              _this.invalidate(true, queryId);
          });
          return observableQueryPromises;
      };
      QueryManager.prototype.fetchRequest = function (_a) {
          var _this = this;
          var requestId = _a.requestId, queryId = _a.queryId, document = _a.document, options = _a.options, fetchMoreForQueryId = _a.fetchMoreForQueryId;
          var variables = options.variables, context = options.context, _b = options.errorPolicy, errorPolicy = _b === void 0 ? 'none' : _b, fetchPolicy = options.fetchPolicy;
          var resultFromStore;
          var errorsFromStore;
          return new Promise(function (resolve, reject) {
              var obs;
              var updatedContext = {};
              var clientQuery = _this.localState.clientQuery(document);
              var serverQuery = _this.localState.serverQuery(document);
              if (serverQuery) {
                  var operation = _this.buildOperationForLink(serverQuery, variables, __assign({}, context, { forceFetch: !_this.queryDeduplication }));
                  updatedContext = operation.context;
                  obs = execute(_this.deduplicator, operation);
              }
              else {
                  updatedContext = _this.prepareContext(context);
                  obs = Observable$2.of({ data: {} });
              }
              _this.fetchQueryRejectFns.set("fetchRequest:" + queryId, reject);
              var complete = false;
              var handlingNext = true;
              var subscriber = {
                  next: function (result$$1) { return __awaiter(_this, void 0, void 0, function () {
                      var updatedResult, lastRequestId;
                      return __generator(this, function (_a) {
                          switch (_a.label) {
                              case 0:
                                  handlingNext = true;
                                  updatedResult = result$$1;
                                  lastRequestId = this.getQuery(queryId).lastRequestId;
                                  if (!(requestId >= (lastRequestId || 1))) return [3, 3];
                                  if (!(clientQuery && hasDirectives(['client'], clientQuery))) return [3, 2];
                                  return [4, this.localState
                                          .runResolvers({
                                          document: clientQuery,
                                          remoteResult: result$$1,
                                          context: updatedContext,
                                          variables: variables,
                                      })
                                          .catch(function (error) {
                                          handlingNext = false;
                                          reject(error);
                                          return result$$1;
                                      })];
                              case 1:
                                  updatedResult = _a.sent();
                                  _a.label = 2;
                              case 2:
                                  if (fetchPolicy !== 'no-cache') {
                                      try {
                                          this.dataStore.markQueryResult(updatedResult, document, variables, fetchMoreForQueryId, errorPolicy === 'ignore' || errorPolicy === 'all');
                                      }
                                      catch (e) {
                                          handlingNext = false;
                                          reject(e);
                                          return [2];
                                      }
                                  }
                                  else {
                                      this.setQuery(queryId, function () { return ({
                                          newData: { result: updatedResult.data, complete: true },
                                      }); });
                                  }
                                  this.queryStore.markQueryResult(queryId, updatedResult, fetchMoreForQueryId);
                                  this.invalidate(true, queryId, fetchMoreForQueryId);
                                  this.broadcastQueries();
                                  _a.label = 3;
                              case 3:
                                  if (updatedResult.errors && errorPolicy === 'none') {
                                      handlingNext = false;
                                      reject(new ApolloError({
                                          graphQLErrors: updatedResult.errors,
                                      }));
                                      return [2];
                                  }
                                  else if (errorPolicy === 'all') {
                                      errorsFromStore = updatedResult.errors;
                                  }
                                  if (fetchMoreForQueryId || fetchPolicy === 'no-cache') {
                                      resultFromStore = updatedResult.data;
                                  }
                                  else {
                                      try {
                                          resultFromStore = this.dataStore.getCache().read({
                                              variables: variables,
                                              query: document,
                                              optimistic: false,
                                          });
                                      }
                                      catch (e) { }
                                  }
                                  handlingNext = false;
                                  if (complete) {
                                      subscriber.complete();
                                  }
                                  return [2];
                          }
                      });
                  }); },
                  error: function (error) {
                      _this.fetchQueryRejectFns.delete("fetchRequest:" + queryId);
                      _this.setQuery(queryId, function (_a) {
                          var subscriptions = _a.subscriptions;
                          return ({
                              subscriptions: subscriptions.filter(function (x) { return x !== subscription; }),
                          });
                      });
                      reject(error);
                  },
                  complete: function () {
                      if (!handlingNext) {
                          _this.fetchQueryRejectFns.delete("fetchRequest:" + queryId);
                          _this.setQuery(queryId, function (_a) {
                              var subscriptions = _a.subscriptions;
                              return ({
                                  subscriptions: subscriptions.filter(function (x) { return x !== subscription; }),
                              });
                          });
                          resolve({
                              data: resultFromStore,
                              errors: errorsFromStore,
                              loading: false,
                              networkStatus: NetworkStatus.ready,
                              stale: false,
                          });
                      }
                      complete = true;
                  },
              };
              var subscription = obs.subscribe(subscriber);
              _this.setQuery(queryId, function (_a) {
                  var subscriptions = _a.subscriptions;
                  return ({
                      subscriptions: subscriptions.concat([subscription]),
                  });
              });
          }).catch(function (error) {
              _this.fetchQueryRejectFns.delete("fetchRequest:" + queryId);
              throw error;
          });
      };
      QueryManager.prototype.refetchQueryByName = function (queryName) {
          var _this = this;
          var refetchedQueries = this.queryIdsByName[queryName];
          if (refetchedQueries === undefined)
              return;
          return Promise.all(refetchedQueries
              .map(function (id) { return _this.getQuery(id).observableQuery; })
              .filter(function (x) { return !!x; })
              .map(function (x) { return x.refetch(); }));
      };
      QueryManager.prototype.generateRequestId = function () {
          var requestId = this.idCounter;
          this.idCounter++;
          return requestId;
      };
      QueryManager.prototype.getQuery = function (queryId) {
          return (this.queries.get(queryId) || {
              listeners: [],
              invalidated: false,
              document: null,
              newData: null,
              lastRequestId: null,
              observableQuery: null,
              subscriptions: [],
          });
      };
      QueryManager.prototype.setQuery = function (queryId, updater) {
          var prev = this.getQuery(queryId);
          var newInfo = __assign({}, prev, updater(prev));
          this.queries.set(queryId, newInfo);
      };
      QueryManager.prototype.invalidate = function (invalidated, queryId, fetchMoreForQueryId) {
          if (queryId)
              this.setQuery(queryId, function () { return ({ invalidated: invalidated }); });
          if (fetchMoreForQueryId) {
              this.setQuery(fetchMoreForQueryId, function () { return ({ invalidated: invalidated }); });
          }
      };
      QueryManager.prototype.buildOperationForLink = function (document, variables, extraContext) {
          var cache = this.dataStore.getCache();
          return {
              query: cache.transformForLink
                  ? cache.transformForLink(document)
                  : document,
              variables: variables,
              operationName: getOperationName(document) || undefined,
              context: this.prepareContext(extraContext),
          };
      };
      QueryManager.prototype.prepareContext = function (context) {
          if (context === void 0) { context = {}; }
          var newContext = this.localState.prepareContext(context);
          return __assign({}, newContext, { clientAwareness: this.clientAwareness });
      };
      QueryManager.prototype.checkInFlight = function (queryId) {
          var query = this.queryStore.get(queryId);
          return (query &&
              query.networkStatus !== NetworkStatus.ready &&
              query.networkStatus !== NetworkStatus.error);
      };
      QueryManager.prototype.startPollingQuery = function (options, queryId, listener) {
          var pollInterval = options.pollInterval;
          invariant$3(pollInterval);
          if (!this.ssrMode) {
              this.pollingInfoByQueryId.set(queryId, {
                  interval: pollInterval,
                  lastPollTimeMs: Date.now() - 10,
                  options: __assign({}, options, { fetchPolicy: 'network-only' }),
              });
              if (listener) {
                  this.addQueryListener(queryId, listener);
              }
              this.schedulePoll(pollInterval);
          }
          return queryId;
      };
      QueryManager.prototype.stopPollingQuery = function (queryId) {
          this.pollingInfoByQueryId.delete(queryId);
      };
      QueryManager.prototype.schedulePoll = function (timeLimitMs) {
          var _this = this;
          var now = Date.now();
          if (this.nextPoll) {
              if (timeLimitMs < this.nextPoll.time - now) {
                  clearTimeout(this.nextPoll.timeout);
              }
              else {
                  return;
              }
          }
          this.nextPoll = {
              time: now + timeLimitMs,
              timeout: setTimeout(function () {
                  _this.nextPoll = null;
                  var nextTimeLimitMs = Infinity;
                  _this.pollingInfoByQueryId.forEach(function (info, queryId) {
                      if (info.interval < nextTimeLimitMs) {
                          nextTimeLimitMs = info.interval;
                      }
                      if (!_this.checkInFlight(queryId)) {
                          if (Date.now() - info.lastPollTimeMs >= info.interval) {
                              var updateLastPollTime = function () {
                                  info.lastPollTimeMs = Date.now();
                              };
                              _this.fetchQuery(queryId, info.options, FetchType.poll).then(updateLastPollTime, updateLastPollTime);
                          }
                      }
                  });
                  if (isFinite(nextTimeLimitMs)) {
                      _this.schedulePoll(nextTimeLimitMs);
                  }
              }, timeLimitMs),
          };
      };
      return QueryManager;
  }());

  var DataStore = (function () {
      function DataStore(initialCache) {
          this.cache = initialCache;
      }
      DataStore.prototype.getCache = function () {
          return this.cache;
      };
      DataStore.prototype.markQueryResult = function (result$$1, document, variables, fetchMoreForQueryId, ignoreErrors) {
          if (ignoreErrors === void 0) { ignoreErrors = false; }
          var writeWithErrors = !graphQLResultHasError(result$$1);
          if (ignoreErrors && graphQLResultHasError(result$$1) && result$$1.data) {
              writeWithErrors = true;
          }
          if (!fetchMoreForQueryId && writeWithErrors) {
              this.cache.write({
                  result: result$$1.data,
                  dataId: 'ROOT_QUERY',
                  query: document,
                  variables: variables,
              });
          }
      };
      DataStore.prototype.markSubscriptionResult = function (result$$1, document, variables) {
          if (!graphQLResultHasError(result$$1)) {
              this.cache.write({
                  result: result$$1.data,
                  dataId: 'ROOT_SUBSCRIPTION',
                  query: document,
                  variables: variables,
              });
          }
      };
      DataStore.prototype.markMutationInit = function (mutation) {
          var _this = this;
          if (mutation.optimisticResponse) {
              var optimistic_1;
              if (typeof mutation.optimisticResponse === 'function') {
                  optimistic_1 = mutation.optimisticResponse(mutation.variables);
              }
              else {
                  optimistic_1 = mutation.optimisticResponse;
              }
              var changeFn_1 = function () {
                  _this.markMutationResult({
                      mutationId: mutation.mutationId,
                      result: { data: optimistic_1 },
                      document: mutation.document,
                      variables: mutation.variables,
                      updateQueries: mutation.updateQueries,
                      update: mutation.update,
                  });
              };
              this.cache.recordOptimisticTransaction(function (c) {
                  var orig = _this.cache;
                  _this.cache = c;
                  try {
                      changeFn_1();
                  }
                  finally {
                      _this.cache = orig;
                  }
              }, mutation.mutationId);
          }
      };
      DataStore.prototype.markMutationResult = function (mutation) {
          var _this = this;
          if (!graphQLResultHasError(mutation.result)) {
              var cacheWrites_1 = [];
              cacheWrites_1.push({
                  result: mutation.result.data,
                  dataId: 'ROOT_MUTATION',
                  query: mutation.document,
                  variables: mutation.variables,
              });
              if (mutation.updateQueries) {
                  Object.keys(mutation.updateQueries)
                      .filter(function (id) { return mutation.updateQueries[id]; })
                      .forEach(function (queryId) {
                      var _a = mutation.updateQueries[queryId], query = _a.query, updater = _a.updater;
                      var _b = _this.cache.diff({
                          query: query.document,
                          variables: query.variables,
                          returnPartialData: true,
                          optimistic: false,
                      }), currentQueryResult = _b.result, complete = _b.complete;
                      if (!complete) {
                          return;
                      }
                      var nextQueryResult = tryFunctionOrLogError(function () {
                          return updater(currentQueryResult, {
                              mutationResult: mutation.result,
                              queryName: getOperationName(query.document) || undefined,
                              queryVariables: query.variables,
                          });
                      });
                      if (nextQueryResult) {
                          cacheWrites_1.push({
                              result: nextQueryResult,
                              dataId: 'ROOT_QUERY',
                              query: query.document,
                              variables: query.variables,
                          });
                      }
                  });
              }
              this.cache.performTransaction(function (c) {
                  cacheWrites_1.forEach(function (write) { return c.write(write); });
              });
              var update_1 = mutation.update;
              if (update_1) {
                  this.cache.performTransaction(function (c) {
                      tryFunctionOrLogError(function () { return update_1(c, mutation.result); });
                  });
              }
          }
      };
      DataStore.prototype.markMutationComplete = function (_a) {
          var mutationId = _a.mutationId, optimisticResponse = _a.optimisticResponse;
          if (!optimisticResponse)
              return;
          this.cache.removeOptimistic(mutationId);
      };
      DataStore.prototype.markUpdateQueryResult = function (document, variables, newResult) {
          this.cache.write({
              result: newResult,
              dataId: 'ROOT_QUERY',
              variables: variables,
              query: document,
          });
      };
      DataStore.prototype.reset = function () {
          return this.cache.reset();
      };
      return DataStore;
  }());

  var version = "2.5.1";

  var hasSuggestedDevtools = false;
  var ApolloClient = (function () {
      function ApolloClient(options) {
          var _this = this;
          this.defaultOptions = {};
          this.resetStoreCallbacks = [];
          this.clearStoreCallbacks = [];
          this.clientAwareness = {};
          var cache = options.cache, _a = options.ssrMode, ssrMode = _a === void 0 ? false : _a, _b = options.ssrForceFetchDelay, ssrForceFetchDelay = _b === void 0 ? 0 : _b, connectToDevTools = options.connectToDevTools, _c = options.queryDeduplication, queryDeduplication = _c === void 0 ? true : _c, defaultOptions = options.defaultOptions, resolvers = options.resolvers, typeDefs = options.typeDefs, fragmentMatcher = options.fragmentMatcher, clientAwarenessName = options.name, clientAwarenessVersion = options.version;
          var link = options.link;
          if (!link && resolvers) {
              link = ApolloLink.empty();
          }
          if (!link || !cache) {
              throw new InvariantError$2();
          }
          var supportedCache = new Map();
          var supportedDirectives = new ApolloLink(function (operation, forward) {
              var result$$1 = supportedCache.get(operation.query);
              if (!result$$1) {
                  result$$1 = removeConnectionDirectiveFromDocument(operation.query);
                  supportedCache.set(operation.query, result$$1);
                  supportedCache.set(result$$1, result$$1);
              }
              operation.query = result$$1;
              return forward(operation);
          });
          this.link = supportedDirectives.concat(link);
          this.cache = cache;
          this.store = new DataStore(cache);
          this.disableNetworkFetches = ssrMode || ssrForceFetchDelay > 0;
          this.queryDeduplication = queryDeduplication;
          this.ssrMode = ssrMode;
          this.defaultOptions = defaultOptions || {};
          this.typeDefs = typeDefs;
          if (ssrForceFetchDelay) {
              setTimeout(function () { return (_this.disableNetworkFetches = false); }, ssrForceFetchDelay);
          }
          this.watchQuery = this.watchQuery.bind(this);
          this.query = this.query.bind(this);
          this.mutate = this.mutate.bind(this);
          this.resetStore = this.resetStore.bind(this);
          this.reFetchObservableQueries = this.reFetchObservableQueries.bind(this);
          var defaultConnectToDevTools = "production" !== 'production' &&
              !window.__APOLLO_CLIENT__;
          if (typeof connectToDevTools === 'undefined'
              ? defaultConnectToDevTools
              : connectToDevTools && typeof window !== 'undefined') {
              window.__APOLLO_CLIENT__ = this;
          }
          if (!hasSuggestedDevtools && "production" !== 'production') {
              hasSuggestedDevtools = true;
              if (typeof window !== 'undefined' &&
                  window.document &&
                  window.top === window.self) {
                  if (typeof window.__APOLLO_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
                      if (window.navigator &&
                          window.navigator.userAgent &&
                          window.navigator.userAgent.indexOf('Chrome') > -1) {
                          console.debug('Download the Apollo DevTools ' +
                              'for a better development experience: ' +
                              'https://chrome.google.com/webstore/detail/apollo-client-developer-t/jdkknkkbebbapilgoeccciglkfbmbnfm');
                      }
                  }
              }
          }
          this.version = version;
          if (clientAwarenessName) {
              this.clientAwareness.name = clientAwarenessName;
          }
          if (clientAwarenessVersion) {
              this.clientAwareness.version = clientAwarenessVersion;
          }
          this.localState = new LocalState({
              cache: cache,
              client: this,
              resolvers: resolvers,
              fragmentMatcher: fragmentMatcher,
          });
      }
      ApolloClient.prototype.stop = function () {
          if (this.queryManager) {
              this.queryManager.stop();
          }
      };
      ApolloClient.prototype.watchQuery = function (options) {
          if (this.defaultOptions.watchQuery) {
              options = __assign({}, this.defaultOptions.watchQuery, options);
          }
          if (this.disableNetworkFetches &&
              (options.fetchPolicy === 'network-only' ||
                  options.fetchPolicy === 'cache-and-network')) {
              options = __assign({}, options, { fetchPolicy: 'cache-first' });
          }
          return this.initQueryManager().watchQuery(options);
      };
      ApolloClient.prototype.query = function (options) {
          if (this.defaultOptions.query) {
              options = __assign({}, this.defaultOptions.query, options);
          }
          invariant$3(options.fetchPolicy !== 'cache-and-network');
          if (this.disableNetworkFetches && options.fetchPolicy === 'network-only') {
              options = __assign({}, options, { fetchPolicy: 'cache-first' });
          }
          return this.initQueryManager().query(options);
      };
      ApolloClient.prototype.mutate = function (options) {
          if (this.defaultOptions.mutate) {
              options = __assign({}, this.defaultOptions.mutate, options);
          }
          return this.initQueryManager().mutate(options);
      };
      ApolloClient.prototype.subscribe = function (options) {
          return this.initQueryManager().startGraphQLSubscription(options);
      };
      ApolloClient.prototype.readQuery = function (options, optimistic) {
          if (optimistic === void 0) { optimistic = false; }
          return this.initProxy().readQuery(options, optimistic);
      };
      ApolloClient.prototype.readFragment = function (options, optimistic) {
          if (optimistic === void 0) { optimistic = false; }
          return this.initProxy().readFragment(options, optimistic);
      };
      ApolloClient.prototype.writeQuery = function (options) {
          var result$$1 = this.initProxy().writeQuery(options);
          this.initQueryManager().broadcastQueries();
          return result$$1;
      };
      ApolloClient.prototype.writeFragment = function (options) {
          var result$$1 = this.initProxy().writeFragment(options);
          this.initQueryManager().broadcastQueries();
          return result$$1;
      };
      ApolloClient.prototype.writeData = function (options) {
          var result$$1 = this.initProxy().writeData(options);
          this.initQueryManager().broadcastQueries();
          return result$$1;
      };
      ApolloClient.prototype.__actionHookForDevTools = function (cb) {
          this.devToolsHookCb = cb;
      };
      ApolloClient.prototype.__requestRaw = function (payload) {
          return execute(this.link, payload);
      };
      ApolloClient.prototype.initQueryManager = function () {
          var _this = this;
          if (!this.queryManager) {
              this.queryManager = new QueryManager({
                  link: this.link,
                  store: this.store,
                  queryDeduplication: this.queryDeduplication,
                  ssrMode: this.ssrMode,
                  clientAwareness: this.clientAwareness,
                  localState: this.localState,
                  onBroadcast: function () {
                      if (_this.devToolsHookCb) {
                          _this.devToolsHookCb({
                              action: {},
                              state: {
                                  queries: _this.queryManager
                                      ? _this.queryManager.queryStore.getStore()
                                      : {},
                                  mutations: _this.queryManager
                                      ? _this.queryManager.mutationStore.getStore()
                                      : {},
                              },
                              dataWithOptimisticResults: _this.cache.extract(true),
                          });
                      }
                  },
              });
          }
          return this.queryManager;
      };
      ApolloClient.prototype.resetStore = function () {
          var _this = this;
          return Promise.resolve()
              .then(function () {
              return _this.queryManager
                  ? _this.queryManager.clearStore()
                  : Promise.resolve(null);
          })
              .then(function () { return Promise.all(_this.resetStoreCallbacks.map(function (fn) { return fn(); })); })
              .then(function () {
              return _this.queryManager && _this.queryManager.reFetchObservableQueries
                  ? _this.queryManager.reFetchObservableQueries()
                  : Promise.resolve(null);
          });
      };
      ApolloClient.prototype.clearStore = function () {
          var _this = this;
          var queryManager = this.queryManager;
          return Promise.resolve()
              .then(function () { return Promise.all(_this.clearStoreCallbacks.map(function (fn) { return fn(); })); })
              .then(function () {
              return queryManager ? queryManager.clearStore() : Promise.resolve(null);
          });
      };
      ApolloClient.prototype.onResetStore = function (cb) {
          var _this = this;
          this.resetStoreCallbacks.push(cb);
          return function () {
              _this.resetStoreCallbacks = _this.resetStoreCallbacks.filter(function (c) { return c !== cb; });
          };
      };
      ApolloClient.prototype.onClearStore = function (cb) {
          var _this = this;
          this.clearStoreCallbacks.push(cb);
          return function () {
              _this.clearStoreCallbacks = _this.clearStoreCallbacks.filter(function (c) { return c !== cb; });
          };
      };
      ApolloClient.prototype.reFetchObservableQueries = function (includeStandby) {
          return this.queryManager
              ? this.queryManager.reFetchObservableQueries(includeStandby)
              : Promise.resolve(null);
      };
      ApolloClient.prototype.extract = function (optimistic) {
          return this.initProxy().extract(optimistic);
      };
      ApolloClient.prototype.restore = function (serializedState) {
          return this.initProxy().restore(serializedState);
      };
      ApolloClient.prototype.addResolvers = function (resolvers) {
          this.localState.addResolvers(resolvers);
      };
      ApolloClient.prototype.setResolvers = function (resolvers) {
          this.localState.setResolvers(resolvers);
      };
      ApolloClient.prototype.getResolvers = function () {
          return this.localState.getResolvers();
      };
      ApolloClient.prototype.setLocalStateFragmentMatcher = function (fragmentMatcher) {
          this.localState.setFragmentMatcher(fragmentMatcher);
      };
      ApolloClient.prototype.initProxy = function () {
          if (!this.proxy) {
              this.initQueryManager();
              this.proxy = this.cache;
          }
          return this.proxy;
      };
      return ApolloClient;
  }());
  //# sourceMappingURL=bundle.esm.js.map

  function queryFromPojo(obj) {
      var op = {
          kind: 'OperationDefinition',
          operation: 'query',
          name: {
              kind: 'Name',
              value: 'GeneratedClientQuery',
          },
          selectionSet: selectionSetFromObj(obj),
      };
      var out = {
          kind: 'Document',
          definitions: [op],
      };
      return out;
  }
  function fragmentFromPojo(obj, typename) {
      var frag = {
          kind: 'FragmentDefinition',
          typeCondition: {
              kind: 'NamedType',
              name: {
                  kind: 'Name',
                  value: typename || '__FakeType',
              },
          },
          name: {
              kind: 'Name',
              value: 'GeneratedClientQuery',
          },
          selectionSet: selectionSetFromObj(obj),
      };
      var out = {
          kind: 'Document',
          definitions: [frag],
      };
      return out;
  }
  function selectionSetFromObj(obj) {
      if (typeof obj === 'number' ||
          typeof obj === 'boolean' ||
          typeof obj === 'string' ||
          typeof obj === 'undefined' ||
          obj === null) {
          return null;
      }
      if (Array.isArray(obj)) {
          return selectionSetFromObj(obj[0]);
      }
      var selections = [];
      Object.keys(obj).forEach(function (key) {
          var nestedSelSet = selectionSetFromObj(obj[key]);
          var field = {
              kind: 'Field',
              name: {
                  kind: 'Name',
                  value: key,
              },
              selectionSet: nestedSelSet || undefined,
          };
          selections.push(field);
      });
      var selectionSet = {
          kind: 'SelectionSet',
          selections: selections,
      };
      return selectionSet;
  }
  var justTypenameQuery = {
      kind: 'Document',
      definitions: [
          {
              kind: 'OperationDefinition',
              operation: 'query',
              name: null,
              variableDefinitions: null,
              directives: [],
              selectionSet: {
                  kind: 'SelectionSet',
                  selections: [
                      {
                          kind: 'Field',
                          alias: null,
                          name: {
                              kind: 'Name',
                              value: '__typename',
                          },
                          arguments: [],
                          directives: [],
                          selectionSet: null,
                      },
                  ],
              },
          },
      ],
  };

  var ApolloCache = (function () {
      function ApolloCache() {
      }
      ApolloCache.prototype.transformDocument = function (document) {
          return document;
      };
      ApolloCache.prototype.transformForLink = function (document) {
          return document;
      };
      ApolloCache.prototype.readQuery = function (options, optimistic) {
          if (optimistic === void 0) { optimistic = false; }
          return this.read({
              query: options.query,
              variables: options.variables,
              optimistic: optimistic,
          });
      };
      ApolloCache.prototype.readFragment = function (options, optimistic) {
          if (optimistic === void 0) { optimistic = false; }
          return this.read({
              query: getFragmentQueryDocument(options.fragment, options.fragmentName),
              variables: options.variables,
              rootId: options.id,
              optimistic: optimistic,
          });
      };
      ApolloCache.prototype.writeQuery = function (options) {
          this.write({
              dataId: 'ROOT_QUERY',
              result: options.data,
              query: options.query,
              variables: options.variables,
          });
      };
      ApolloCache.prototype.writeFragment = function (options) {
          this.write({
              dataId: options.id,
              result: options.data,
              variables: options.variables,
              query: getFragmentQueryDocument(options.fragment, options.fragmentName),
          });
      };
      ApolloCache.prototype.writeData = function (_a) {
          var id = _a.id, data = _a.data;
          if (typeof id !== 'undefined') {
              var typenameResult = null;
              try {
                  typenameResult = this.read({
                      rootId: id,
                      optimistic: false,
                      query: justTypenameQuery,
                  });
              }
              catch (e) {
              }
              var __typename = (typenameResult && typenameResult.__typename) || '__ClientData';
              var dataToWrite = Object.assign({ __typename: __typename }, data);
              this.writeFragment({
                  id: id,
                  fragment: fragmentFromPojo(dataToWrite, __typename),
                  data: dataToWrite,
              });
          }
          else {
              this.writeQuery({ query: queryFromPojo(data), data: data });
          }
      };
      return ApolloCache;
  }());
  //# sourceMappingURL=bundle.esm.js.map

  function Cache$1(options) {
    this.map = new Map;
    this.newest = null;
    this.oldest = null;
    this.max = options && options.max;
    this.dispose = options && options.dispose;
  }

  var Cache_1 = Cache$1;

  var Cp = Cache$1.prototype;

  Cp.has = function (key) {
    return this.map.has(key);
  };

  Cp.get = function (key) {
    var entry = getEntry(this, key);
    return entry && entry.value;
  };

  function getEntry(cache, key) {
    var entry = cache.map.get(key);
    if (entry &&
        entry !== cache.newest) {
      var older = entry.older;
      var newer = entry.newer;

      if (newer) {
        newer.older = older;
      }

      if (older) {
        older.newer = newer;
      }

      entry.older = cache.newest;
      entry.older.newer = entry;

      entry.newer = null;
      cache.newest = entry;

      if (entry === cache.oldest) {
        cache.oldest = newer;
      }
    }

    return entry;
  }

  Cp.set = function (key, value) {
    var entry = getEntry(this, key);
    if (entry) {
      return entry.value = value;
    }

    entry = {
      key: key,
      value: value,
      newer: null,
      older: this.newest
    };

    if (this.newest) {
      this.newest.newer = entry;
    }

    this.newest = entry;
    this.oldest = this.oldest || entry;

    this.map.set(key, entry);

    return entry.value;
  };

  Cp.clean = function () {
    if (typeof this.max === "number") {
      while (this.oldest &&
             this.map.size > this.max) {
        this.delete(this.oldest.key);
      }
    }
  };

  Cp.delete = function (key) {
    var entry = this.map.get(key);
    if (entry) {
      if (entry === this.newest) {
        this.newest = entry.older;
      }

      if (entry === this.oldest) {
        this.oldest = entry.newer;
      }

      if (entry.newer) {
        entry.newer.older = entry.older;
      }

      if (entry.older) {
        entry.older.newer = entry.newer;
      }

      this.map.delete(key);

      if (typeof this.dispose === "function") {
        this.dispose(key, entry.value);
      }

      return true;
    }

    return false;
  };

  var cache = {
  	Cache: Cache_1
  };

  // Although `Symbol` is widely supported these days, we can safely fall
  // back to using a non-enumerable string property without violating any
  // assumptions elsewhere in the implementation.
  var useSymbol =
    typeof Symbol === "function" &&
    typeof Symbol.for === "function";

  // Used to mark `tuple.prototype` so that all objects that inherit from
  // any `tuple.prototype` object (there could be more than one) will test
  // positive according to `tuple.isTuple`.
  var brand = useSymbol
    ? Symbol.for("immutable-tuple")
    : "@@__IMMUTABLE_TUPLE__@@";

  // Used to save a reference to the globally shared `UniversalWeakMap` that
  // stores all known `tuple` objects.
  var globalKey = useSymbol
    ? Symbol.for("immutable-tuple-root")
    : "@@__IMMUTABLE_TUPLE_ROOT__@@";

  // Convenient helper for defining hidden immutable properties.
  function def(obj, name, value, enumerable) {
    Object.defineProperty(obj, name, {
      value: value,
      enumerable: !! enumerable,
      writable: false,
      configurable: false
    });
    return value;
  }

  var freeze = Object.freeze || function (obj) {
    return obj;
  };

  function isObjRef(value) {
    switch (typeof value) {
    case "object":
      if (value === null) {
        return false;
      }
    case "function":
      return true;
    default:
      return false;
    }
  }

  // The `mustConvertThisToArray` value is true when the corresponding
  // `Array` method does not attempt to modify `this`, which means we can
  // pass a `tuple` object as `this` without first converting it to an
  // `Array`.
  function forEachArrayMethod(fn) {
    function call(name, mustConvertThisToArray) {
      var desc = Object.getOwnPropertyDescriptor(Array.prototype, name);
      fn(name, desc, !! mustConvertThisToArray);
    }

    call("every");
    call("filter");
    call("find");
    call("findIndex");
    call("forEach");
    call("includes");
    call("indexOf");
    call("join");
    call("lastIndexOf");
    call("map");
    call("reduce");
    call("reduceRight");
    call("slice");
    call("some");
    call("toLocaleString");
    call("toString");

    // The `reverse` and `sort` methods are usually destructive, but for
    // `tuple` objects they return a new `tuple` object that has been
    // appropriately reversed/sorted.
    call("reverse", true);
    call("sort", true);

    // Make `[...someTuple]` work.
    call(useSymbol && Symbol.iterator || "@@iterator");
  }

  // A map data structure that holds object keys weakly, yet can also hold
  // non-object keys, unlike the native `WeakMap`.
  var UniversalWeakMap = function UniversalWeakMap() {
    // Since a `WeakMap` cannot hold primitive values as keys, we need a
    // backup `Map` instance to hold primitive keys. Both `this._weakMap`
    // and `this._strongMap` are lazily initialized.
    this._weakMap = null;
    this._strongMap = null;
    this.data = null;
  };

  // Since `get` and `set` are the only methods used, that's all I've
  // implemented here.

  UniversalWeakMap.prototype.get = function get (key) {
    var map = this._getMap(key, false);
    if (map) {
      return map.get(key);
    }
  };

  UniversalWeakMap.prototype.set = function set (key, value) {
    this._getMap(key, true).set(key, value);
    // An actual `Map` or `WeakMap` would return `this` here, but
    // returning the `value` is more convenient for the `tuple`
    // implementation.
    return value;
  };

  UniversalWeakMap.prototype._getMap = function _getMap (key, canCreate) {
    if (! canCreate) {
      return isObjRef(key) ? this._weakMap : this._strongMap;
    }
    if (isObjRef(key)) {
      return this._weakMap || (this._weakMap = new WeakMap);
    }
    return this._strongMap || (this._strongMap = new Map);
  };

  // See [`universal-weak-map.js`](universal-weak-map.html).
  // See [`util.js`](util.html).
  // If this package is installed multiple times, there could be mutiple
  // implementations of the `tuple` function with distinct `tuple.prototype`
  // objects, but the shared pool of `tuple` objects must be the same across
  // all implementations. While it would be ideal to use the `global`
  // object, there's no reliable way to get the global object across all JS
  // environments without using the `Function` constructor, so instead we
  // use the global `Array` constructor as a shared namespace.
  var root$1 = Array[globalKey] || def(Array, globalKey, new UniversalWeakMap, false);

  function lookup() {
    return lookupArray(arguments);
  }

  function lookupArray(array) {
    var node = root$1;

    // Because we are building a tree of *weak* maps, the tree will not
    // prevent objects in tuples from being garbage collected, since the
    // tree itself will be pruned over time when the corresponding `tuple`
    // objects become unreachable. In addition to internalization, this
    // property is a key advantage of the `immutable-tuple` package.
    var len = array.length;
    for (var i = 0; i < len; ++i) {
      var item = array[i];
      node = node.get(item) || node.set(item, new UniversalWeakMap);
    }

    // Return node.data rather than node itself to prevent tampering with
    // the UniversalWeakMap tree.
    return node.data || (node.data = Object.create(null));
  }

  // See [`lookup.js`](lookup.html).
  // See [`util.js`](util.html).
  // When called with any number of arguments, this function returns an
  // object that inherits from `tuple.prototype` and is guaranteed to be
  // `===` any other `tuple` object that has exactly the same items. In
  // computer science jargon, `tuple` instances are "internalized" or just
  // "interned," which allows for constant-time equality checking, and makes
  // it possible for tuple objects to be used as `Map` or `WeakMap` keys, or
  // stored in a `Set`.
  function tuple() {
    var arguments$1 = arguments;

    var node = lookup.apply(null, arguments);

    if (node.tuple) {
      return node.tuple;
    }

    var t = Object.create(tuple.prototype);

    // Define immutable items with numeric indexes, and permanently fix the
    // `.length` property.
    var argc = arguments.length;
    for (var i = 0; i < argc; ++i) {
      t[i] = arguments$1[i];
    }

    def(t, "length", argc, false);

    // Remember this new `tuple` object so that we can return the same object
    // earlier next time.
    return freeze(node.tuple = t);
  }

  // Since the `immutable-tuple` package could be installed multiple times
  // in an application, there is no guarantee that the `tuple` constructor
  // or `tuple.prototype` will be unique, so `value instanceof tuple` is
  // unreliable. Instead, to test if a value is a tuple, you should use
  // `tuple.isTuple(value)`.
  def(tuple.prototype, brand, true, false);
  function isTuple(that) {
    return !! (that && that[brand] === true);
  }

  tuple.isTuple = isTuple;

  function toArray(tuple) {
    var array = [];
    var i = tuple.length;
    while (i--) { array[i] = tuple[i]; }
    return array;
  }

  // Copy all generic non-destructive Array methods to `tuple.prototype`.
  // This works because (for example) `Array.prototype.slice` can be invoked
  // against any `Array`-like object.
  forEachArrayMethod(function (name, desc, mustConvertThisToArray) {
    var method = desc && desc.value;
    if (typeof method === "function") {
      desc.value = function () {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        var result = method.apply(
          mustConvertThisToArray ? toArray(this) : this,
          args
        );
        // Of course, `tuple.prototype.slice` should return a `tuple` object,
        // not a new `Array`.
        return Array.isArray(result) ? tuple.apply(void 0, result) : result;
      };
      Object.defineProperty(tuple.prototype, name, desc);
    }
  });

  // Like `Array.prototype.concat`, except for the extra effort required to
  // convert any tuple arguments to arrays, so that
  // ```
  // tuple(1).concat(tuple(2), 3) === tuple(1, 2, 3)
  // ```
  var ref = Array.prototype;
  var concat$1 = ref.concat;
  tuple.prototype.concat = function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return tuple.apply(void 0, concat$1.apply(toArray(this), args.map(
      function (item) { return isTuple(item) ? toArray(item) : item; }
    )));
  };

  var tuple$1 = /*#__PURE__*/Object.freeze({
    default: tuple,
    tuple: tuple,
    lookup: lookup,
    lookupArray: lookupArray
  });

  var local = createCommonjsModule(function (module, exports) {

  var fakeNullFiber = new (function Fiber(){});
  var localKey = "_optimism_local";

  function getCurrentFiber() {
    return fakeNullFiber;
  }

  {
    try {
      var Fiber = module["eriuqer".split("").reverse().join("")]("fibers");
      // If we were able to require fibers, redefine the getCurrentFiber
      // function so that it has a chance to return Fiber.current.
      getCurrentFiber = function () {
        return Fiber.current || fakeNullFiber;
      };
    } catch (e) {}
  }

  // Returns an object unique to Fiber.current, if fibers are enabled.
  // This object is used for Fiber-local storage in ./entry.js.
  exports.get = function () {
    var fiber = getCurrentFiber();
    return fiber[localKey] || (fiber[localKey] = Object.create(null));
  };
  });
  var local_1 = local.get;

  var entry = createCommonjsModule(function (module, exports) {

  var getLocal = local.get;
  var UNKNOWN_VALUE = Object.create(null);
  var emptySetPool = [];
  var entryPool = [];

  // Don't let the emptySetPool or entryPool grow larger than this size,
  // since unconstrained pool growth could lead to memory leaks.
  exports.POOL_TARGET_SIZE = 100;

  // Since this package might be used browsers, we should avoid using the
  // Node built-in assert module.
  function assert(condition, optionalMessage) {
    if (! condition) {
      throw new Error(optionalMessage || "assertion failure");
    }
  }

  function Entry(fn, key, args) {
    this.parents = new Set;
    this.childValues = new Map;

    // When this Entry has children that are dirty, this property becomes
    // a Set containing other Entry objects, borrowed from emptySetPool.
    // When the set becomes empty, it gets recycled back to emptySetPool.
    this.dirtyChildren = null;

    reset(this, fn, key, args);

    ++Entry.count;
  }

  Entry.count = 0;

  function reset(entry, fn, key, args) {
    entry.fn = fn;
    entry.key = key;
    entry.args = args;
    entry.value = UNKNOWN_VALUE;
    entry.dirty = true;
    entry.subscribe = null;
    entry.unsubscribe = null;
    entry.recomputing = false;
    // Optional callback that will be invoked when entry.parents becomes
    // empty. The Entry object is given as the first parameter. If the
    // callback returns true, then this entry can be removed from the graph
    // and safely recycled into the entryPool.
    entry.reportOrphan = null;
  }

  Entry.acquire = function (fn, key, args) {
    var entry = entryPool.pop();
    if (entry) {
      reset(entry, fn, key, args);
      return entry;
    }
    return new Entry(fn, key, args);
  };

  function release(entry) {
    assert(entry.parents.size === 0);
    assert(entry.childValues.size === 0);
    assert(entry.dirtyChildren === null);
    if (entryPool.length < exports.POOL_TARGET_SIZE) {
      entryPool.push(entry);
    }
  }

  exports.Entry = Entry;

  var Ep = Entry.prototype;

  // The public API of Entry objects consists of the Entry constructor,
  // along with the recompute, setDirty, and dispose methods.

  Ep.recompute = function recompute() {
    if (! rememberParent(this) &&
        maybeReportOrphan(this)) {
      // The recipient of the entry.reportOrphan callback decided to dispose
      // of this orphan entry by calling entry.dispos(), which recycles it
      // into the entryPool, so we don't need to (and should not) proceed
      // with the recomputation.
      return;
    }

    return recomputeIfDirty(this);
  };

  // If the given entry has a reportOrphan method, and no remaining parents,
  // call entry.reportOrphan and return true iff it returns true. The
  // reportOrphan function should return true to indicate entry.dispose()
  // has been called, and the entry has been removed from any other caches
  // (see index.js for the only current example).
  function maybeReportOrphan(entry) {
    var report = entry.reportOrphan;
    return typeof report === "function" &&
      entry.parents.size === 0 &&
      report(entry) === true;
  }

  Ep.setDirty = function setDirty() {
    if (this.dirty) return;
    this.dirty = true;
    this.value = UNKNOWN_VALUE;
    reportDirty(this);
    // We can go ahead and unsubscribe here, since any further dirty
    // notifications we receive will be redundant, and unsubscribing may
    // free up some resources, e.g. file watchers.
    unsubscribe(this);
  };

  Ep.dispose = function dispose() {
    var entry = this;
    forgetChildren(entry).forEach(maybeReportOrphan);
    unsubscribe(entry);

    // Because this entry has been kicked out of the cache (in index.js),
    // we've lost the ability to find out if/when this entry becomes dirty,
    // whether that happens through a subscription, because of a direct call
    // to entry.setDirty(), or because one of its children becomes dirty.
    // Because of this loss of future information, we have to assume the
    // worst (that this entry might have become dirty very soon), so we must
    // immediately mark this entry's parents as dirty. Normally we could
    // just call entry.setDirty() rather than calling parent.setDirty() for
    // each parent, but that would leave this entry in parent.childValues
    // and parent.dirtyChildren, which would prevent the child from being
    // truly forgotten.
    entry.parents.forEach(function (parent) {
      parent.setDirty();
      forgetChild(parent, entry);
    });

    // Since this entry has no parents and no children anymore, and the
    // caller of Entry#dispose has indicated that entry.value no longer
    // matters, we can safely recycle this Entry object for later use.
    release(entry);
  };

  function setClean(entry) {
    entry.dirty = false;

    if (mightBeDirty(entry)) {
      // This Entry may still have dirty children, in which case we can't
      // let our parents know we're clean just yet.
      return;
    }

    reportClean(entry);
  }

  function reportDirty(entry) {
    entry.parents.forEach(function (parent) {
      reportDirtyChild(parent, entry);
    });
  }

  function reportClean(entry) {
    entry.parents.forEach(function (parent) {
      reportCleanChild(parent, entry);
    });
  }

  function mightBeDirty(entry) {
    return entry.dirty ||
      (entry.dirtyChildren &&
       entry.dirtyChildren.size);
  }

  // Let a parent Entry know that one of its children may be dirty.
  function reportDirtyChild(entry, child) {
    // Must have called rememberParent(child) before calling
    // reportDirtyChild(parent, child).
    assert(entry.childValues.has(child));
    assert(mightBeDirty(child));

    if (! entry.dirtyChildren) {
      entry.dirtyChildren = emptySetPool.pop() || new Set;

    } else if (entry.dirtyChildren.has(child)) {
      // If we already know this child is dirty, then we must have already
      // informed our own parents that we are dirty, so we can terminate
      // the recursion early.
      return;
    }

    entry.dirtyChildren.add(child);
    reportDirty(entry);
  }

  // Let a parent Entry know that one of its children is no longer dirty.
  function reportCleanChild(entry, child) {
    var cv = entry.childValues;

    // Must have called rememberChild(child) before calling
    // reportCleanChild(parent, child).
    assert(cv.has(child));
    assert(! mightBeDirty(child));

    var childValue = cv.get(child);
    if (childValue === UNKNOWN_VALUE) {
      cv.set(child, child.value);
    } else if (childValue !== child.value) {
      entry.setDirty();
    }

    removeDirtyChild(entry, child);

    if (mightBeDirty(entry)) {
      return;
    }

    reportClean(entry);
  }

  function removeDirtyChild(entry, child) {
    var dc = entry.dirtyChildren;
    if (dc) {
      dc.delete(child);
      if (dc.size === 0) {
        if (emptySetPool.length < exports.POOL_TARGET_SIZE) {
          emptySetPool.push(dc);
        }
        entry.dirtyChildren = null;
      }
    }
  }

  function rememberParent(entry) {
    var local$$1 = getLocal();
    var parent = local$$1.currentParentEntry;
    if (parent) {
      entry.parents.add(parent);

      if (! parent.childValues.has(entry)) {
        parent.childValues.set(entry, UNKNOWN_VALUE);
      }

      if (mightBeDirty(entry)) {
        reportDirtyChild(parent, entry);
      } else {
        reportCleanChild(parent, entry);
      }

      return parent;
    }
  }

  // This is the most important method of the Entry API, because it
  // determines whether the cached entry.value can be returned immediately,
  // or must be recomputed. The overall performance of the caching system
  // depends on the truth of the following observations: (1) this.dirty is
  // usually false, (2) this.dirtyChildren is usually null/empty, and thus
  // (3) this.value is usally returned very quickly, without recomputation.
  function recomputeIfDirty(entry) {
    if (entry.dirty) {
      // If this Entry is explicitly dirty because someone called
      // entry.setDirty(), recompute.
      return reallyRecompute(entry);
    }

    if (mightBeDirty(entry)) {
      // Get fresh values for any dirty children, and if those values
      // disagree with this.childValues, mark this Entry explicitly dirty.
      entry.dirtyChildren.forEach(function (child) {
        assert(entry.childValues.has(child));
        try {
          recomputeIfDirty(child);
        } catch (e) {
          entry.setDirty();
        }
      });

      if (entry.dirty) {
        // If this Entry has become explicitly dirty after comparing the fresh
        // values of its dirty children against this.childValues, recompute.
        return reallyRecompute(entry);
      }
    }

    assert(entry.value !== UNKNOWN_VALUE);

    return entry.value;
  }

  function reallyRecompute(entry) {
    assert(! entry.recomputing, "already recomputing");
    entry.recomputing = true;

    // Since this recomputation is likely to re-remember some of this
    // entry's children, we forget our children here but do not call
    // maybeReportOrphan until after the recomputation finishes.
    var originalChildren = forgetChildren(entry);

    var local$$1 = getLocal();
    var parent = local$$1.currentParentEntry;
    local$$1.currentParentEntry = entry;

    var threw = true;
    try {
      entry.value = entry.fn.apply(null, entry.args);
      threw = false;

    } finally {
      entry.recomputing = false;

      assert(local$$1.currentParentEntry === entry);
      local$$1.currentParentEntry = parent;

      if (threw || ! subscribe(entry)) {
        // Mark this Entry dirty if entry.fn threw or we failed to
        // resubscribe. This is important because, if we have a subscribe
        // function and it failed, then we're going to miss important
        // notifications about the potential dirtiness of entry.value.
        entry.setDirty();
      } else {
        // If we successfully recomputed entry.value and did not fail to
        // (re)subscribe, then this Entry is no longer explicitly dirty.
        setClean(entry);
      }
    }

    // Now that we've had a chance to re-remember any children that were
    // involved in the recomputation, we can safely report any orphan
    // children that remain.
    originalChildren.forEach(maybeReportOrphan);

    return entry.value;
  }

  var reusableEmptyArray = [];

  // Removes all children from this entry and returns an array of the
  // removed children.
  function forgetChildren(entry) {
    var children = reusableEmptyArray;

    if (entry.childValues.size > 0) {
      children = [];
      entry.childValues.forEach(function (value, child) {
        forgetChild(entry, child);
        children.push(child);
      });
    }

    // After we forget all our children, this.dirtyChildren must be empty
    // and therefor must have been reset to null.
    assert(entry.dirtyChildren === null);

    return children;
  }

  function forgetChild(entry, child) {
    child.parents.delete(entry);
    entry.childValues.delete(child);
    removeDirtyChild(entry, child);
  }

  function subscribe(entry) {
    if (typeof entry.subscribe === "function") {
      try {
        unsubscribe(entry); // Prevent double subscriptions.
        entry.unsubscribe = entry.subscribe.apply(null, entry.args);
      } catch (e) {
        // If this Entry has a subscribe function and it threw an exception
        // (or an unsubscribe function it previously returned now throws),
        // return false to indicate that we were not able to subscribe (or
        // unsubscribe), and this Entry should remain dirty.
        entry.setDirty();
        return false;
      }
    }

    // Returning true indicates either that there was no entry.subscribe
    // function or that it succeeded.
    return true;
  }

  function unsubscribe(entry) {
    var unsub = entry.unsubscribe;
    if (typeof unsub === "function") {
      entry.unsubscribe = null;
      unsub();
    }
  }
  });
  var entry_1 = entry.POOL_TARGET_SIZE;
  var entry_2 = entry.Entry;

  var require$$1 = getCjsExportFromNamespace(tuple$1);

  var Cache$2 = cache.Cache;
  var tuple$2 = require$$1.tuple;
  var Entry = entry.Entry;
  var getLocal = local.get;

  function normalizeOptions(options) {
    options = options || Object.create(null);

    if (typeof options.makeCacheKey !== "function") {
      options.makeCacheKey = tuple$2;
    }

    if (typeof options.max !== "number") {
      options.max = Math.pow(2, 16);
    }

    return options;
  }

  function wrap$1(fn, options) {
    options = normalizeOptions(options);

    // If this wrapped function is disposable, then its creator does not
    // care about its return value, and it should be removed from the cache
    // immediately when it no longer has any parents that depend on it.
    var disposable = !! options.disposable;

    var cache$$1 = new Cache$2({
      max: options.max,
      dispose: function (key, entry$$1) {
        entry$$1.dispose();
      }
    });

    function reportOrphan(entry$$1) {
      if (disposable) {
        // Triggers the entry.dispose() call above.
        cache$$1.delete(entry$$1.key);
        return true;
      }
    }

    function optimistic() {
      if (disposable && ! getLocal().currentParentEntry) {
        // If there's no current parent computation, and this wrapped
        // function is disposable (meaning we don't care about entry.value,
        // just dependency tracking), then we can short-cut everything else
        // in this function, because entry.recompute() is going to recycle
        // the entry object without recomputing anything, anyway.
        return;
      }

      var key = options.makeCacheKey.apply(null, arguments);
      if (! key) {
        return fn.apply(null, arguments);
      }

      var args = [], len = arguments.length;
      while (len--) args[len] = arguments[len];

      var entry$$1 = cache$$1.get(key);
      if (entry$$1) {
        entry$$1.args = args;
      } else {
        cache$$1.set(key, entry$$1 = Entry.acquire(fn, key, args));
        entry$$1.subscribe = options.subscribe;
        if (disposable) {
          entry$$1.reportOrphan = reportOrphan;
        }
      }

      var value = entry$$1.recompute();

      // Move this entry to the front of the least-recently used queue,
      // since we just finished computing its value.
      cache$$1.set(key, entry$$1);

      // Clean up any excess entries in the cache, but only if this entry
      // has no parents, which means we're not in the middle of a larger
      // computation that might be flummoxed by the cleaning.
      if (entry$$1.parents.size === 0) {
        cache$$1.clean();
      }

      // If options.disposable is truthy, the caller of wrap is telling us
      // they don't care about the result of entry.recompute(), so we should
      // avoid returning the value, so it won't be accidentally used.
      if (! disposable) {
        return value;
      }
    }

    optimistic.dirty = function () {
      var key = options.makeCacheKey.apply(null, arguments);
      if (! key) {
        return;
      }

      if (! cache$$1.has(key)) {
        return;
      }

      cache$$1.get(key).setDirty();
    };

    return optimistic;
  }

  var wrap_1 = wrap$1;

  var genericMessage$3 = "Invariant Violation";
  var _a$3 = Object.setPrototypeOf, setPrototypeOf$3 = _a$3 === void 0 ? function (obj, proto) {
      obj.__proto__ = proto;
      return obj;
  } : _a$3;
  var InvariantError$3 = /** @class */ (function (_super) {
      __extends(InvariantError, _super);
      function InvariantError(message) {
          if (message === void 0) { message = genericMessage$3; }
          var _this = _super.call(this, message) || this;
          _this.framesToPop = 1;
          _this.name = genericMessage$3;
          setPrototypeOf$3(_this, InvariantError.prototype);
          return _this;
      }
      return InvariantError;
  }(Error));
  function invariant$4(condition, message) {
      if (!condition) {
          throw new InvariantError$3(message);
      }
  }
  (function (invariant) {
      function warn() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          return console.warn.apply(console, args);
      }
      invariant.warn = warn;
      function error() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          return console.error.apply(console, args);
      }
      invariant.error = error;
  })(invariant$4 || (invariant$4 = {}));

  var testMap = new Map();
  if (testMap.set(1, 2) !== testMap) {
      var set_1 = testMap.set;
      Map.prototype.set = function () {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          set_1.apply(this, args);
          return this;
      };
  }
  var testSet = new Set();
  if (testSet.add(3) !== testSet) {
      var add_1 = testSet.add;
      Set.prototype.add = function () {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          add_1.apply(this, args);
          return this;
      };
  }
  var frozen = {};
  if (typeof Object.freeze === 'function') {
      Object.freeze(frozen);
  }
  try {
      testMap.set(frozen, frozen).delete(frozen);
  }
  catch (_a) {
      var wrap$2 = function (method) {
          return method && (function (obj) {
              try {
                  testMap.set(obj, obj).delete(obj);
              }
              finally {
                  return method.call(Object, obj);
              }
          });
      };
      Object.freeze = wrap$2(Object.freeze);
      Object.seal = wrap$2(Object.seal);
      Object.preventExtensions = wrap$2(Object.preventExtensions);
  }
  var HeuristicFragmentMatcher = (function () {
      function HeuristicFragmentMatcher() {
      }
      HeuristicFragmentMatcher.prototype.ensureReady = function () {
          return Promise.resolve();
      };
      HeuristicFragmentMatcher.prototype.canBypassInit = function () {
          return true;
      };
      HeuristicFragmentMatcher.prototype.match = function (idValue, typeCondition, context) {
          var obj = context.store.get(idValue.id);
          if (!obj && idValue.id === 'ROOT_QUERY') {
              return true;
          }
          if (!obj) {
              return false;
          }
          if (!obj.__typename) {
              return 'heuristic';
          }
          if (obj.__typename === typeCondition) {
              return true;
          }
          return 'heuristic';
      };
      return HeuristicFragmentMatcher;
  }());

  var CacheKeyNode = (function () {
      function CacheKeyNode() {
          this.children = null;
          this.key = null;
      }
      CacheKeyNode.prototype.lookup = function () {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          return this.lookupArray(args);
      };
      CacheKeyNode.prototype.lookupArray = function (array) {
          var node = this;
          array.forEach(function (value) {
              node = node.getOrCreate(value);
          });
          return node.key || (node.key = Object.create(null));
      };
      CacheKeyNode.prototype.getOrCreate = function (value) {
          var map = this.children || (this.children = new Map());
          var node = map.get(value);
          if (!node) {
              map.set(value, (node = new CacheKeyNode()));
          }
          return node;
      };
      return CacheKeyNode;
  }());

  var hasOwn = Object.prototype.hasOwnProperty;
  var DepTrackingCache = (function () {
      function DepTrackingCache(data) {
          if (data === void 0) { data = Object.create(null); }
          var _this = this;
          this.data = data;
          this.depend = wrap_1(function (dataId) { return _this.data[dataId]; }, {
              disposable: true,
              makeCacheKey: function (dataId) {
                  return dataId;
              }
          });
      }
      DepTrackingCache.prototype.toObject = function () {
          return this.data;
      };
      DepTrackingCache.prototype.get = function (dataId) {
          this.depend(dataId);
          return this.data[dataId];
      };
      DepTrackingCache.prototype.set = function (dataId, value) {
          var oldValue = this.data[dataId];
          if (value !== oldValue) {
              this.data[dataId] = value;
              this.depend.dirty(dataId);
          }
      };
      DepTrackingCache.prototype.delete = function (dataId) {
          if (hasOwn.call(this.data, dataId)) {
              delete this.data[dataId];
              this.depend.dirty(dataId);
          }
      };
      DepTrackingCache.prototype.clear = function () {
          this.replace(null);
      };
      DepTrackingCache.prototype.replace = function (newData) {
          var _this = this;
          if (newData) {
              Object.keys(newData).forEach(function (dataId) {
                  _this.set(dataId, newData[dataId]);
              });
              Object.keys(this.data).forEach(function (dataId) {
                  if (!hasOwn.call(newData, dataId)) {
                      _this.delete(dataId);
                  }
              });
          }
          else {
              Object.keys(this.data).forEach(function (dataId) {
                  _this.delete(dataId);
              });
          }
      };
      return DepTrackingCache;
  }());
  function defaultNormalizedCacheFactory(seed) {
      return new DepTrackingCache(seed);
  }

  var StoreReader = (function () {
      function StoreReader(cacheKeyRoot) {
          if (cacheKeyRoot === void 0) { cacheKeyRoot = new CacheKeyNode; }
          var _this = this;
          this.cacheKeyRoot = cacheKeyRoot;
          var reader = this;
          var executeStoreQuery = reader.executeStoreQuery, executeSelectionSet = reader.executeSelectionSet;
          this.executeStoreQuery = wrap_1(function (options) {
              return executeStoreQuery.call(_this, options);
          }, {
              makeCacheKey: function (_a) {
                  var query = _a.query, rootValue = _a.rootValue, contextValue = _a.contextValue, variableValues = _a.variableValues, fragmentMatcher = _a.fragmentMatcher;
                  if (contextValue.store instanceof DepTrackingCache) {
                      return reader.cacheKeyRoot.lookup(query, contextValue.store, fragmentMatcher, JSON.stringify(variableValues), rootValue.id);
                  }
                  return;
              }
          });
          this.executeSelectionSet = wrap_1(function (options) {
              return executeSelectionSet.call(_this, options);
          }, {
              makeCacheKey: function (_a) {
                  var selectionSet = _a.selectionSet, rootValue = _a.rootValue, execContext = _a.execContext;
                  if (execContext.contextValue.store instanceof DepTrackingCache) {
                      return reader.cacheKeyRoot.lookup(selectionSet, execContext.contextValue.store, execContext.fragmentMatcher, JSON.stringify(execContext.variableValues), rootValue.id);
                  }
                  return;
              }
          });
      }
      StoreReader.prototype.readQueryFromStore = function (options) {
          var optsPatch = { returnPartialData: false };
          return this.diffQueryAgainstStore(__assign({}, options, optsPatch)).result;
      };
      StoreReader.prototype.diffQueryAgainstStore = function (_a) {
          var store = _a.store, query = _a.query, variables = _a.variables, previousResult = _a.previousResult, _b = _a.returnPartialData, returnPartialData = _b === void 0 ? true : _b, _c = _a.rootId, rootId = _c === void 0 ? 'ROOT_QUERY' : _c, fragmentMatcherFunction = _a.fragmentMatcherFunction, config = _a.config;
          var queryDefinition = getQueryDefinition(query);
          variables = assign({}, getDefaultValues(queryDefinition), variables);
          var context = {
              store: store,
              dataIdFromObject: (config && config.dataIdFromObject) || null,
              cacheRedirects: (config && config.cacheRedirects) || {},
          };
          var execResult = this.executeStoreQuery({
              query: query,
              rootValue: {
                  type: 'id',
                  id: rootId,
                  generated: true,
                  typename: 'Query',
              },
              contextValue: context,
              variableValues: variables,
              fragmentMatcher: fragmentMatcherFunction,
          });
          var hasMissingFields = execResult.missing && execResult.missing.length > 0;
          if (hasMissingFields && !returnPartialData) {
              execResult.missing.forEach(function (info) {
                  if (info.tolerable)
                      return;
                  throw new InvariantError$3();
              });
          }
          if (previousResult) {
              if (isEqual(previousResult, execResult.result)) {
                  execResult.result = previousResult;
              }
          }
          return {
              result: execResult.result,
              complete: !hasMissingFields,
          };
      };
      StoreReader.prototype.executeStoreQuery = function (_a) {
          var query = _a.query, rootValue = _a.rootValue, contextValue = _a.contextValue, variableValues = _a.variableValues, _b = _a.fragmentMatcher, fragmentMatcher = _b === void 0 ? defaultFragmentMatcher : _b;
          var mainDefinition = getMainDefinition(query);
          var fragments = getFragmentDefinitions(query);
          var fragmentMap = createFragmentMap(fragments);
          var execContext = {
              query: query,
              fragmentMap: fragmentMap,
              contextValue: contextValue,
              variableValues: variableValues,
              fragmentMatcher: fragmentMatcher,
          };
          return this.executeSelectionSet({
              selectionSet: mainDefinition.selectionSet,
              rootValue: rootValue,
              execContext: execContext,
          });
      };
      StoreReader.prototype.executeSelectionSet = function (_a) {
          var _this = this;
          var selectionSet = _a.selectionSet, rootValue = _a.rootValue, execContext = _a.execContext;
          var fragmentMap = execContext.fragmentMap, contextValue = execContext.contextValue, variables = execContext.variableValues;
          var finalResult = { result: null };
          var objectsToMerge = [];
          var object = contextValue.store.get(rootValue.id);
          var typename = (object && object.__typename) ||
              (rootValue.id === 'ROOT_QUERY' && 'Query') ||
              void 0;
          function handleMissing(result) {
              var _a;
              if (result.missing) {
                  finalResult.missing = finalResult.missing || [];
                  (_a = finalResult.missing).push.apply(_a, result.missing);
              }
              return result.result;
          }
          selectionSet.selections.forEach(function (selection) {
              var _a;
              if (!shouldInclude(selection, variables)) {
                  return;
              }
              if (isField(selection)) {
                  var fieldResult = handleMissing(_this.executeField(object, typename, selection, execContext));
                  if (typeof fieldResult !== 'undefined') {
                      objectsToMerge.push((_a = {},
                          _a[resultKeyNameFromField(selection)] = fieldResult,
                          _a));
                  }
              }
              else {
                  var fragment = void 0;
                  if (isInlineFragment(selection)) {
                      fragment = selection;
                  }
                  else {
                      fragment = fragmentMap[selection.name.value];
                      if (!fragment) {
                          throw new InvariantError$3();
                      }
                  }
                  var typeCondition = fragment.typeCondition.name.value;
                  var match = execContext.fragmentMatcher(rootValue, typeCondition, contextValue);
                  if (match) {
                      var fragmentExecResult = _this.executeSelectionSet({
                          selectionSet: fragment.selectionSet,
                          rootValue: rootValue,
                          execContext: execContext,
                      });
                      if (match === 'heuristic' && fragmentExecResult.missing) {
                          fragmentExecResult = __assign({}, fragmentExecResult, { missing: fragmentExecResult.missing.map(function (info) {
                                  return __assign({}, info, { tolerable: true });
                              }) });
                      }
                      objectsToMerge.push(handleMissing(fragmentExecResult));
                  }
              }
          });
          finalResult.result = mergeDeepArray(objectsToMerge);
          return finalResult;
      };
      StoreReader.prototype.executeField = function (object, typename, field, execContext) {
          var variables = execContext.variableValues, contextValue = execContext.contextValue;
          var fieldName = field.name.value;
          var args = argumentsObjectFromField(field, variables);
          var info = {
              resultKey: resultKeyNameFromField(field),
              directives: getDirectiveInfoFromField(field, variables),
          };
          var readStoreResult = readStoreResolver(object, typename, fieldName, args, contextValue, info);
          if (Array.isArray(readStoreResult.result)) {
              return this.combineExecResults(readStoreResult, this.executeSubSelectedArray(field, readStoreResult.result, execContext));
          }
          if (!field.selectionSet) {
              assertSelectionSetForIdValue(field, readStoreResult.result);
              return readStoreResult;
          }
          if (readStoreResult.result == null) {
              return readStoreResult;
          }
          return this.combineExecResults(readStoreResult, this.executeSelectionSet({
              selectionSet: field.selectionSet,
              rootValue: readStoreResult.result,
              execContext: execContext,
          }));
      };
      StoreReader.prototype.combineExecResults = function () {
          var execResults = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              execResults[_i] = arguments[_i];
          }
          var missing = null;
          execResults.forEach(function (execResult) {
              if (execResult.missing) {
                  missing = missing || [];
                  missing.push.apply(missing, execResult.missing);
              }
          });
          return {
              result: execResults.pop().result,
              missing: missing,
          };
      };
      StoreReader.prototype.executeSubSelectedArray = function (field, result, execContext) {
          var _this = this;
          var missing = null;
          function handleMissing(childResult) {
              if (childResult.missing) {
                  missing = missing || [];
                  missing.push.apply(missing, childResult.missing);
              }
              return childResult.result;
          }
          result = result.map(function (item) {
              if (item === null) {
                  return null;
              }
              if (Array.isArray(item)) {
                  return handleMissing(_this.executeSubSelectedArray(field, item, execContext));
              }
              if (field.selectionSet) {
                  return handleMissing(_this.executeSelectionSet({
                      selectionSet: field.selectionSet,
                      rootValue: item,
                      execContext: execContext,
                  }));
              }
              assertSelectionSetForIdValue(field, item);
              return item;
          });
          return { result: result, missing: missing };
      };
      return StoreReader;
  }());
  function assertSelectionSetForIdValue(field, value) {
      if (!field.selectionSet && isIdValue(value)) {
          throw new InvariantError$3();
      }
  }
  function defaultFragmentMatcher() {
      return true;
  }
  function readStoreResolver(object, typename, fieldName, args, context, _a) {
      var resultKey = _a.resultKey, directives = _a.directives;
      var storeKeyName = fieldName;
      if (args || directives) {
          storeKeyName = getStoreKeyName(storeKeyName, args, directives);
      }
      var fieldValue = void 0;
      if (object) {
          fieldValue = object[storeKeyName];
          if (typeof fieldValue === 'undefined' &&
              context.cacheRedirects &&
              typeof typename === 'string') {
              var type = context.cacheRedirects[typename];
              if (type) {
                  var resolver = type[fieldName];
                  if (resolver) {
                      fieldValue = resolver(object, args, {
                          getCacheKey: function (storeObj) {
                              return toIdValue({
                                  id: context.dataIdFromObject(storeObj),
                                  typename: storeObj.__typename,
                              });
                          },
                      });
                  }
              }
          }
      }
      if (typeof fieldValue === 'undefined') {
          return {
              result: fieldValue,
              missing: [{
                      object: object,
                      fieldName: storeKeyName,
                      tolerable: false,
                  }],
          };
      }
      if (isJsonValue(fieldValue)) {
          fieldValue = fieldValue.json;
      }
      return {
          result: fieldValue,
      };
  }

  var ObjectCache = (function () {
      function ObjectCache(data) {
          if (data === void 0) { data = Object.create(null); }
          this.data = data;
      }
      ObjectCache.prototype.toObject = function () {
          return this.data;
      };
      ObjectCache.prototype.get = function (dataId) {
          return this.data[dataId];
      };
      ObjectCache.prototype.set = function (dataId, value) {
          this.data[dataId] = value;
      };
      ObjectCache.prototype.delete = function (dataId) {
          this.data[dataId] = void 0;
      };
      ObjectCache.prototype.clear = function () {
          this.data = Object.create(null);
      };
      ObjectCache.prototype.replace = function (newData) {
          this.data = newData || Object.create(null);
      };
      return ObjectCache;
  }());

  var WriteError = (function (_super) {
      __extends(WriteError, _super);
      function WriteError() {
          var _this = _super !== null && _super.apply(this, arguments) || this;
          _this.type = 'WriteError';
          return _this;
      }
      return WriteError;
  }(Error));
  function enhanceErrorWithDocument(error, document) {
      var enhancedError = new WriteError("Error writing result to store for query:\n " + JSON.stringify(document));
      enhancedError.message += '\n' + error.message;
      enhancedError.stack = error.stack;
      return enhancedError;
  }
  var StoreWriter = (function () {
      function StoreWriter() {
      }
      StoreWriter.prototype.writeQueryToStore = function (_a) {
          var query = _a.query, result = _a.result, _b = _a.store, store = _b === void 0 ? defaultNormalizedCacheFactory() : _b, variables = _a.variables, dataIdFromObject = _a.dataIdFromObject, fragmentMatcherFunction = _a.fragmentMatcherFunction;
          return this.writeResultToStore({
              dataId: 'ROOT_QUERY',
              result: result,
              document: query,
              store: store,
              variables: variables,
              dataIdFromObject: dataIdFromObject,
              fragmentMatcherFunction: fragmentMatcherFunction,
          });
      };
      StoreWriter.prototype.writeResultToStore = function (_a) {
          var dataId = _a.dataId, result = _a.result, document = _a.document, _b = _a.store, store = _b === void 0 ? defaultNormalizedCacheFactory() : _b, variables = _a.variables, dataIdFromObject = _a.dataIdFromObject, fragmentMatcherFunction = _a.fragmentMatcherFunction;
          var operationDefinition = getOperationDefinition(document);
          try {
              return this.writeSelectionSetToStore({
                  result: result,
                  dataId: dataId,
                  selectionSet: operationDefinition.selectionSet,
                  context: {
                      store: store,
                      processedData: {},
                      variables: assign({}, getDefaultValues(operationDefinition), variables),
                      dataIdFromObject: dataIdFromObject,
                      fragmentMap: createFragmentMap(getFragmentDefinitions(document)),
                      fragmentMatcherFunction: fragmentMatcherFunction,
                  },
              });
          }
          catch (e) {
              throw enhanceErrorWithDocument(e, document);
          }
      };
      StoreWriter.prototype.writeSelectionSetToStore = function (_a) {
          var _this = this;
          var result = _a.result, dataId = _a.dataId, selectionSet = _a.selectionSet, context = _a.context;
          var variables = context.variables, store = context.store, fragmentMap = context.fragmentMap;
          selectionSet.selections.forEach(function (selection) {
              if (!shouldInclude(selection, variables)) {
                  return;
              }
              if (isField(selection)) {
                  var resultFieldKey = resultKeyNameFromField(selection);
                  var value = result[resultFieldKey];
                  if (typeof value !== 'undefined') {
                      _this.writeFieldToStore({
                          dataId: dataId,
                          value: value,
                          field: selection,
                          context: context,
                      });
                  }
                  else {
                      var isDefered = false;
                      var isClient = false;
                      if (selection.directives && selection.directives.length) {
                          isDefered = selection.directives.some(function (directive) { return directive.name && directive.name.value === 'defer'; });
                          isClient = selection.directives.some(function (directive) { return directive.name && directive.name.value === 'client'; });
                      }
                      if (!isDefered && !isClient && context.fragmentMatcherFunction) ;
                  }
              }
              else {
                  var fragment = void 0;
                  if (isInlineFragment(selection)) {
                      fragment = selection;
                  }
                  else {
                      fragment = (fragmentMap || {})[selection.name.value];
                      invariant$4(fragment);
                  }
                  var matches = true;
                  if (context.fragmentMatcherFunction && fragment.typeCondition) {
                      var idValue = toIdValue({ id: 'self', typename: undefined });
                      var fakeContext = {
                          store: new ObjectCache({ self: result }),
                          cacheRedirects: {},
                      };
                      var match = context.fragmentMatcherFunction(idValue, fragment.typeCondition.name.value, fakeContext);
                      matches = !!match;
                  }
                  if (matches) {
                      _this.writeSelectionSetToStore({
                          result: result,
                          selectionSet: fragment.selectionSet,
                          dataId: dataId,
                          context: context,
                      });
                  }
              }
          });
          return store;
      };
      StoreWriter.prototype.writeFieldToStore = function (_a) {
          var field = _a.field, value = _a.value, dataId = _a.dataId, context = _a.context;
          var _b;
          var variables = context.variables, dataIdFromObject = context.dataIdFromObject, store = context.store;
          var storeValue;
          var storeObject;
          var storeFieldName = storeKeyNameFromField(field, variables);
          if (!field.selectionSet || value === null) {
              storeValue =
                  value != null && typeof value === 'object'
                      ?
                          { type: 'json', json: value }
                      :
                          value;
          }
          else if (Array.isArray(value)) {
              var generatedId = dataId + "." + storeFieldName;
              storeValue = this.processArrayValue(value, generatedId, field.selectionSet, context);
          }
          else {
              var valueDataId = dataId + "." + storeFieldName;
              var generated = true;
              if (!isGeneratedId(valueDataId)) {
                  valueDataId = '$' + valueDataId;
              }
              if (dataIdFromObject) {
                  var semanticId = dataIdFromObject(value);
                  invariant$4(!semanticId || !isGeneratedId(semanticId));
                  if (semanticId ||
                      (typeof semanticId === 'number' && semanticId === 0)) {
                      valueDataId = semanticId;
                      generated = false;
                  }
              }
              if (!isDataProcessed(valueDataId, field, context.processedData)) {
                  this.writeSelectionSetToStore({
                      dataId: valueDataId,
                      result: value,
                      selectionSet: field.selectionSet,
                      context: context,
                  });
              }
              var typename = value.__typename;
              storeValue = toIdValue({ id: valueDataId, typename: typename }, generated);
              storeObject = store.get(dataId);
              var escapedId = storeObject && storeObject[storeFieldName];
              if (escapedId !== storeValue && isIdValue(escapedId)) {
                  var hadTypename = escapedId.typename !== undefined;
                  var hasTypename = typename !== undefined;
                  var typenameChanged = hadTypename && hasTypename && escapedId.typename !== typename;
                  invariant$4(!generated || escapedId.generated || typenameChanged);
                  invariant$4(!hadTypename || hasTypename);
                  if (escapedId.generated) {
                      if (typenameChanged) {
                          if (!generated) {
                              store.delete(escapedId.id);
                          }
                      }
                      else {
                          mergeWithGenerated(escapedId.id, storeValue.id, store);
                      }
                  }
              }
          }
          storeObject = store.get(dataId);
          if (!storeObject || !isEqual(storeValue, storeObject[storeFieldName])) {
              store.set(dataId, __assign({}, storeObject, (_b = {}, _b[storeFieldName] = storeValue, _b)));
          }
      };
      StoreWriter.prototype.processArrayValue = function (value, generatedId, selectionSet, context) {
          var _this = this;
          return value.map(function (item, index) {
              if (item === null) {
                  return null;
              }
              var itemDataId = generatedId + "." + index;
              if (Array.isArray(item)) {
                  return _this.processArrayValue(item, itemDataId, selectionSet, context);
              }
              var generated = true;
              if (context.dataIdFromObject) {
                  var semanticId = context.dataIdFromObject(item);
                  if (semanticId) {
                      itemDataId = semanticId;
                      generated = false;
                  }
              }
              if (!isDataProcessed(itemDataId, selectionSet, context.processedData)) {
                  _this.writeSelectionSetToStore({
                      dataId: itemDataId,
                      result: item,
                      selectionSet: selectionSet,
                      context: context,
                  });
              }
              return toIdValue({ id: itemDataId, typename: item.__typename }, generated);
          });
      };
      return StoreWriter;
  }());
  function isGeneratedId(id) {
      return id[0] === '$';
  }
  function mergeWithGenerated(generatedKey, realKey, cache) {
      if (generatedKey === realKey) {
          return false;
      }
      var generated = cache.get(generatedKey);
      var real = cache.get(realKey);
      var madeChanges = false;
      Object.keys(generated).forEach(function (key) {
          var value = generated[key];
          var realValue = real[key];
          if (isIdValue(value) &&
              isGeneratedId(value.id) &&
              isIdValue(realValue) &&
              !isEqual(value, realValue) &&
              mergeWithGenerated(value.id, realValue.id, cache)) {
              madeChanges = true;
          }
      });
      cache.delete(generatedKey);
      var newRealValue = __assign({}, generated, real);
      if (isEqual(newRealValue, real)) {
          return madeChanges;
      }
      cache.set(realKey, newRealValue);
      return true;
  }
  function isDataProcessed(dataId, field, processedData) {
      if (!processedData) {
          return false;
      }
      if (processedData[dataId]) {
          if (processedData[dataId].indexOf(field) >= 0) {
              return true;
          }
          else {
              processedData[dataId].push(field);
          }
      }
      else {
          processedData[dataId] = [field];
      }
      return false;
  }

  var defaultConfig = {
      fragmentMatcher: new HeuristicFragmentMatcher(),
      dataIdFromObject: defaultDataIdFromObject,
      addTypename: true,
      resultCaching: true,
  };
  function defaultDataIdFromObject(result) {
      if (result.__typename) {
          if (result.id !== undefined) {
              return result.__typename + ":" + result.id;
          }
          if (result._id !== undefined) {
              return result.__typename + ":" + result._id;
          }
      }
      return null;
  }
  var hasOwn$1 = Object.prototype.hasOwnProperty;
  var OptimisticCacheLayer = (function (_super) {
      __extends(OptimisticCacheLayer, _super);
      function OptimisticCacheLayer(optimisticId, parent, transaction) {
          var _this = _super.call(this, Object.create(null)) || this;
          _this.optimisticId = optimisticId;
          _this.parent = parent;
          _this.transaction = transaction;
          return _this;
      }
      OptimisticCacheLayer.prototype.toObject = function () {
          return __assign({}, this.parent.toObject(), this.data);
      };
      OptimisticCacheLayer.prototype.get = function (dataId) {
          return hasOwn$1.call(this.data, dataId)
              ? this.data[dataId]
              : this.parent.get(dataId);
      };
      return OptimisticCacheLayer;
  }(ObjectCache));
  var InMemoryCache = (function (_super) {
      __extends(InMemoryCache, _super);
      function InMemoryCache(config) {
          if (config === void 0) { config = {}; }
          var _this = _super.call(this) || this;
          _this.watches = new Set();
          _this.typenameDocumentCache = new Map();
          _this.cacheKeyRoot = new CacheKeyNode();
          _this.silenceBroadcast = false;
          _this.config = __assign({}, defaultConfig, config);
          if (_this.config.customResolvers) {
              _this.config.cacheRedirects = _this.config.customResolvers;
          }
          if (_this.config.cacheResolvers) {
              _this.config.cacheRedirects = _this.config.cacheResolvers;
          }
          _this.addTypename = _this.config.addTypename;
          _this.data = _this.config.resultCaching
              ? new DepTrackingCache()
              : new ObjectCache();
          _this.optimisticData = _this.data;
          _this.storeReader = new StoreReader(_this.cacheKeyRoot);
          _this.storeWriter = new StoreWriter();
          var cache = _this;
          var maybeBroadcastWatch = cache.maybeBroadcastWatch;
          _this.maybeBroadcastWatch = wrap_1(function (c) {
              return maybeBroadcastWatch.call(_this, c);
          }, {
              makeCacheKey: function (c) {
                  if (c.optimistic) {
                      return;
                  }
                  if (c.previousResult) {
                      return;
                  }
                  if (cache.data instanceof DepTrackingCache) {
                      return cache.cacheKeyRoot.lookup(c.query, JSON.stringify(c.variables));
                  }
              }
          });
          return _this;
      }
      InMemoryCache.prototype.restore = function (data) {
          if (data)
              this.data.replace(data);
          return this;
      };
      InMemoryCache.prototype.extract = function (optimistic) {
          if (optimistic === void 0) { optimistic = false; }
          return (optimistic ? this.optimisticData : this.data).toObject();
      };
      InMemoryCache.prototype.read = function (options) {
          if (typeof options.rootId === 'string' &&
              typeof this.data.get(options.rootId) === 'undefined') {
              return null;
          }
          return this.storeReader.readQueryFromStore({
              store: options.optimistic ? this.optimisticData : this.data,
              query: this.transformDocument(options.query),
              variables: options.variables,
              rootId: options.rootId,
              fragmentMatcherFunction: this.config.fragmentMatcher.match,
              previousResult: options.previousResult,
              config: this.config,
          });
      };
      InMemoryCache.prototype.write = function (write) {
          this.storeWriter.writeResultToStore({
              dataId: write.dataId,
              result: write.result,
              variables: write.variables,
              document: this.transformDocument(write.query),
              store: this.data,
              dataIdFromObject: this.config.dataIdFromObject,
              fragmentMatcherFunction: this.config.fragmentMatcher.match,
          });
          this.broadcastWatches();
      };
      InMemoryCache.prototype.diff = function (query) {
          return this.storeReader.diffQueryAgainstStore({
              store: query.optimistic ? this.optimisticData : this.data,
              query: this.transformDocument(query.query),
              variables: query.variables,
              returnPartialData: query.returnPartialData,
              previousResult: query.previousResult,
              fragmentMatcherFunction: this.config.fragmentMatcher.match,
              config: this.config,
          });
      };
      InMemoryCache.prototype.watch = function (watch) {
          var _this = this;
          this.watches.add(watch);
          return function () {
              _this.watches.delete(watch);
          };
      };
      InMemoryCache.prototype.evict = function (query) {
          throw new InvariantError$3();
      };
      InMemoryCache.prototype.reset = function () {
          this.data.clear();
          this.broadcastWatches();
          return Promise.resolve();
      };
      InMemoryCache.prototype.removeOptimistic = function (idToRemove) {
          var toReapply = [];
          var removedCount = 0;
          var layer = this.optimisticData;
          while (layer instanceof OptimisticCacheLayer) {
              if (layer.optimisticId === idToRemove) {
                  ++removedCount;
              }
              else {
                  toReapply.push(layer);
              }
              layer = layer.parent;
          }
          if (removedCount > 0) {
              this.optimisticData = layer;
              while (toReapply.length > 0) {
                  var layer_1 = toReapply.pop();
                  this.performTransaction(layer_1.transaction, layer_1.optimisticId);
              }
              this.broadcastWatches();
          }
      };
      InMemoryCache.prototype.performTransaction = function (transaction, optimisticId) {
          var _a = this, data = _a.data, silenceBroadcast = _a.silenceBroadcast;
          this.silenceBroadcast = true;
          if (typeof optimisticId === 'string') {
              this.data = this.optimisticData = new OptimisticCacheLayer(optimisticId, this.optimisticData, transaction);
          }
          try {
              transaction(this);
          }
          finally {
              this.silenceBroadcast = silenceBroadcast;
              this.data = data;
          }
          this.broadcastWatches();
      };
      InMemoryCache.prototype.recordOptimisticTransaction = function (transaction, id) {
          return this.performTransaction(transaction, id);
      };
      InMemoryCache.prototype.transformDocument = function (document) {
          if (this.addTypename) {
              var result = this.typenameDocumentCache.get(document);
              if (!result) {
                  result = addTypenameToDocument(document);
                  this.typenameDocumentCache.set(document, result);
                  this.typenameDocumentCache.set(result, result);
              }
              return result;
          }
          return document;
      };
      InMemoryCache.prototype.broadcastWatches = function () {
          var _this = this;
          if (!this.silenceBroadcast) {
              this.watches.forEach(function (c) { return _this.maybeBroadcastWatch(c); });
          }
      };
      InMemoryCache.prototype.maybeBroadcastWatch = function (c) {
          c.callback(this.diff({
              query: c.query,
              variables: c.variables,
              previousResult: c.previousResult && c.previousResult(),
              optimistic: c.optimistic,
          }));
      };
      return InMemoryCache;
  }(ApolloCache));
  //# sourceMappingURL=bundle.esm.js.map

  var defaultHttpOptions = {
      includeQuery: true,
      includeExtensions: false,
  };
  var defaultHeaders = {
      accept: '*/*',
      'content-type': 'application/json',
  };
  var defaultOptions = {
      method: 'POST',
  };
  var fallbackHttpConfig = {
      http: defaultHttpOptions,
      headers: defaultHeaders,
      options: defaultOptions,
  };
  var throwServerError = function (response, result, message) {
      var error = new Error(message);
      error.name = 'ServerError';
      error.response = response;
      error.statusCode = response.status;
      error.result = result;
      throw error;
  };
  var parseAndCheckHttpResponse = function (operations) { return function (response) {
      return (response
          .text()
          .then(function (bodyText) {
          try {
              return JSON.parse(bodyText);
          }
          catch (err) {
              var parseError = err;
              parseError.name = 'ServerParseError';
              parseError.response = response;
              parseError.statusCode = response.status;
              parseError.bodyText = bodyText;
              return Promise.reject(parseError);
          }
      })
          .then(function (result) {
          if (response.status >= 300) {
              throwServerError(response, result, "Response not successful: Received status code " + response.status);
          }
          if (!Array.isArray(result) &&
              !result.hasOwnProperty('data') &&
              !result.hasOwnProperty('errors')) {
              throwServerError(response, result, "Server response was missing for query '" + (Array.isArray(operations)
                  ? operations.map(function (op) { return op.operationName; })
                  : operations.operationName) + "'.");
          }
          return result;
      }));
  }; };
  var checkFetcher = function (fetcher) {
      if (!fetcher && typeof fetch === 'undefined') {
          throw new InvariantError$1(1);
      }
  };
  var createSignalIfSupported = function () {
      if (typeof AbortController === 'undefined')
          return { controller: false, signal: false };
      var controller = new AbortController();
      var signal = controller.signal;
      return { controller: controller, signal: signal };
  };
  var selectHttpOptionsAndBody = function (operation, fallbackConfig) {
      var configs = [];
      for (var _i = 2; _i < arguments.length; _i++) {
          configs[_i - 2] = arguments[_i];
      }
      var options = __assign({}, fallbackConfig.options, { headers: fallbackConfig.headers, credentials: fallbackConfig.credentials });
      var http = fallbackConfig.http;
      configs.forEach(function (config) {
          options = __assign({}, options, config.options, { headers: __assign({}, options.headers, config.headers) });
          if (config.credentials)
              options.credentials = config.credentials;
          http = __assign({}, http, config.http);
      });
      var operationName = operation.operationName, extensions = operation.extensions, variables = operation.variables, query = operation.query;
      var body = { operationName: operationName, variables: variables };
      if (http.includeExtensions)
          body.extensions = extensions;
      if (http.includeQuery)
          body.query = print(query);
      return {
          options: options,
          body: body,
      };
  };
  var serializeFetchParameter = function (p, label) {
      var serialized;
      try {
          serialized = JSON.stringify(p);
      }
      catch (e) {
          var parseError = new InvariantError$1(2);
          parseError.parseError = e;
          throw parseError;
      }
      return serialized;
  };
  var selectURI = function (operation, fallbackURI) {
      var context = operation.getContext();
      var contextURI = context.uri;
      if (contextURI) {
          return contextURI;
      }
      else if (typeof fallbackURI === 'function') {
          return fallbackURI(operation);
      }
      else {
          return fallbackURI || '/graphql';
      }
  };
  //# sourceMappingURL=bundle.esm.js.map

  var createHttpLink = function (linkOptions) {
      if (linkOptions === void 0) { linkOptions = {}; }
      var _a = linkOptions.uri, uri = _a === void 0 ? '/graphql' : _a, fetcher = linkOptions.fetch, includeExtensions = linkOptions.includeExtensions, useGETForQueries = linkOptions.useGETForQueries, requestOptions = __rest(linkOptions, ["uri", "fetch", "includeExtensions", "useGETForQueries"]);
      checkFetcher(fetcher);
      if (!fetcher) {
          fetcher = fetch;
      }
      var linkConfig = {
          http: { includeExtensions: includeExtensions },
          options: requestOptions.fetchOptions,
          credentials: requestOptions.credentials,
          headers: requestOptions.headers,
      };
      return new ApolloLink(function (operation) {
          var chosenURI = selectURI(operation, uri);
          var context = operation.getContext();
          var clientAwarenessHeaders = {};
          if (context.clientAwareness) {
              var _a = context.clientAwareness, name_1 = _a.name, version = _a.version;
              if (name_1) {
                  clientAwarenessHeaders['apollographql-client-name'] = name_1;
              }
              if (version) {
                  clientAwarenessHeaders['apollographql-client-version'] = version;
              }
          }
          var contextHeaders = __assign({}, clientAwarenessHeaders, context.headers);
          var contextConfig = {
              http: context.http,
              options: context.fetchOptions,
              credentials: context.credentials,
              headers: contextHeaders,
          };
          var _b = selectHttpOptionsAndBody(operation, fallbackHttpConfig, linkConfig, contextConfig), options = _b.options, body = _b.body;
          var controller;
          if (!options.signal) {
              var _c = createSignalIfSupported(), _controller = _c.controller, signal = _c.signal;
              controller = _controller;
              if (controller)
                  options.signal = signal;
          }
          var definitionIsMutation = function (d) {
              return d.kind === 'OperationDefinition' && d.operation === 'mutation';
          };
          if (useGETForQueries &&
              !operation.query.definitions.some(definitionIsMutation)) {
              options.method = 'GET';
          }
          if (options.method === 'GET') {
              var _d = rewriteURIForGET(chosenURI, body), newURI = _d.newURI, parseError = _d.parseError;
              if (parseError) {
                  return fromError(parseError);
              }
              chosenURI = newURI;
          }
          else {
              try {
                  options.body = serializeFetchParameter(body, 'Payload');
              }
              catch (parseError) {
                  return fromError(parseError);
              }
          }
          return new Observable$1(function (observer) {
              fetcher(chosenURI, options)
                  .then(function (response) {
                  operation.setContext({ response: response });
                  return response;
              })
                  .then(parseAndCheckHttpResponse(operation))
                  .then(function (result) {
                  observer.next(result);
                  observer.complete();
                  return result;
              })
                  .catch(function (err) {
                  if (err.name === 'AbortError')
                      return;
                  if (err.result && err.result.errors && err.result.data) {
                      observer.next(err.result);
                  }
                  observer.error(err);
              });
              return function () {
                  if (controller)
                      controller.abort();
              };
          });
      });
  };
  function rewriteURIForGET(chosenURI, body) {
      var queryParams = [];
      var addQueryParam = function (key, value) {
          queryParams.push(key + "=" + encodeURIComponent(value));
      };
      if ('query' in body) {
          addQueryParam('query', body.query);
      }
      if (body.operationName) {
          addQueryParam('operationName', body.operationName);
      }
      if (body.variables) {
          var serializedVariables = void 0;
          try {
              serializedVariables = serializeFetchParameter(body.variables, 'Variables map');
          }
          catch (parseError) {
              return { parseError: parseError };
          }
          addQueryParam('variables', serializedVariables);
      }
      if (body.extensions) {
          var serializedExtensions = void 0;
          try {
              serializedExtensions = serializeFetchParameter(body.extensions, 'Extensions map');
          }
          catch (parseError) {
              return { parseError: parseError };
          }
          addQueryParam('extensions', serializedExtensions);
      }
      var fragment = '', preFragment = chosenURI;
      var fragmentStart = chosenURI.indexOf('#');
      if (fragmentStart !== -1) {
          fragment = chosenURI.substr(fragmentStart);
          preFragment = chosenURI.substr(0, fragmentStart);
      }
      var queryParamsPrefix = preFragment.indexOf('?') === -1 ? '?' : '&';
      var newURI = preFragment + queryParamsPrefix + queryParams.join('&') + fragment;
      return { newURI: newURI };
  }
  var HttpLink = (function (_super) {
      __extends(HttpLink, _super);
      function HttpLink(opts) {
          return _super.call(this, createHttpLink(opts).request) || this;
      }
      return HttpLink;
  }(ApolloLink));
  //# sourceMappingURL=bundle.esm.js.map

  function onError(errorHandler) {
      return new ApolloLink(function (operation, forward) {
          return new Observable$1(function (observer) {
              var sub;
              var retriedSub;
              var retriedResult;
              try {
                  sub = forward(operation).subscribe({
                      next: function (result) {
                          if (result.errors) {
                              retriedResult = errorHandler({
                                  graphQLErrors: result.errors,
                                  response: result,
                                  operation: operation,
                                  forward: forward,
                              });
                              if (retriedResult) {
                                  retriedSub = retriedResult.subscribe({
                                      next: observer.next.bind(observer),
                                      error: observer.error.bind(observer),
                                      complete: observer.complete.bind(observer),
                                  });
                                  return;
                              }
                          }
                          observer.next(result);
                      },
                      error: function (networkError) {
                          retriedResult = errorHandler({
                              operation: operation,
                              networkError: networkError,
                              graphQLErrors: networkError &&
                                  networkError.result &&
                                  networkError.result.errors,
                              forward: forward,
                          });
                          if (retriedResult) {
                              retriedSub = retriedResult.subscribe({
                                  next: observer.next.bind(observer),
                                  error: observer.error.bind(observer),
                                  complete: observer.complete.bind(observer),
                              });
                              return;
                          }
                          observer.error(networkError);
                      },
                      complete: function () {
                          if (!retriedResult) {
                              observer.complete.bind(observer)();
                          }
                      },
                  });
              }
              catch (e) {
                  errorHandler({ networkError: e, operation: operation, forward: forward });
                  observer.error(e);
              }
              return function () {
                  if (sub)
                      sub.unsubscribe();
                  if (retriedSub)
                      sub.unsubscribe();
              };
          });
      });
  }
  var ErrorLink = (function (_super) {
      __extends(ErrorLink, _super);
      function ErrorLink(errorHandler) {
          var _this = _super.call(this) || this;
          _this.link = onError(errorHandler);
          return _this;
      }
      ErrorLink.prototype.request = function (operation, forward) {
          return this.link.request(operation, forward);
      };
      return ErrorLink;
  }(ApolloLink));
  //# sourceMappingURL=bundle.esm.js.map

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  /**
   * The `defineToJSON()` function defines toJSON() and inspect() prototype
   * methods, if no function provided they become aliases for toString().
   */

  function defineToJSON( // eslint-disable-next-line flowtype/no-weak-types
  classObject) {
    var fn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : classObject.prototype.toString;
    classObject.prototype.toJSON = fn;
    classObject.prototype.inspect = fn;

    if (nodejsCustomInspectSymbol) {
      classObject.prototype[nodejsCustomInspectSymbol] = fn;
    }
  }

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  function invariant$5(condition, message) {
    /* istanbul ignore else */
    if (!condition) {
      throw new Error(message);
    }
  }

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * The `defineToStringTag()` function checks first to see if the runtime
   * supports the `Symbol` class and then if the `Symbol.toStringTag` constant
   * is defined as a `Symbol` instance. If both conditions are met, the
   * Symbol.toStringTag property is defined as a getter that returns the
   * supplied class constructor's name.
   *
   * @method defineToStringTag
   *
   * @param {Class<any>} classObject a class such as Object, String, Number but
   * typically one of your own creation through the class keyword; `class A {}`,
   * for example.
   */
  function defineToStringTag(classObject) {
    if (typeof Symbol === 'function' && Symbol.toStringTag) {
      Object.defineProperty(classObject.prototype, Symbol.toStringTag, {
        get: function get() {
          return this.constructor.name;
        }
      });
    }
  }

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * A representation of source input to GraphQL.
   * `name` and `locationOffset` are optional. They are useful for clients who
   * store GraphQL documents in source files; for example, if the GraphQL input
   * starts at line 40 in a file named Foo.graphql, it might be useful for name to
   * be "Foo.graphql" and location to be `{ line: 40, column: 0 }`.
   * line and column in locationOffset are 1-indexed
   */
  var Source = function Source(body, name, locationOffset) {
    this.body = body;
    this.name = name || 'GraphQL request';
    this.locationOffset = locationOffset || {
      line: 1,
      column: 1
    };
    !(this.locationOffset.line > 0) ? invariant$5(0, 'line in locationOffset is 1-indexed and must be positive') : void 0;
    !(this.locationOffset.column > 0) ? invariant$5(0, 'column in locationOffset is 1-indexed and must be positive') : void 0;
  }; // Conditionally apply `[Symbol.toStringTag]` if `Symbol`s are supported

  defineToStringTag(Source);

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * Represents a location in a Source.
   */

  /**
   * Takes a Source and a UTF-8 character offset, and returns the corresponding
   * line and column as a SourceLocation.
   */
  function getLocation(source, position) {
    var lineRegexp = /\r\n|[\n\r]/g;
    var line = 1;
    var column = position + 1;
    var match;

    while ((match = lineRegexp.exec(source.body)) && match.index < position) {
      line += 1;
      column = position + 1 - (match.index + match[0].length);
    }

    return {
      line: line,
      column: column
    };
  }

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * Prints a GraphQLError to a string, representing useful location information
   * about the error's position in the source.
   */
  function printError(error) {
    var printedLocations = [];

    if (error.nodes) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = error.nodes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var node = _step.value;

          if (node.loc) {
            printedLocations.push(highlightSourceAtLocation(node.loc.source, getLocation(node.loc.source, node.loc.start)));
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    } else if (error.source && error.locations) {
      var source = error.source;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = error.locations[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var location = _step2.value;
          printedLocations.push(highlightSourceAtLocation(source, location));
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }

    return printedLocations.length === 0 ? error.message : [error.message].concat(printedLocations).join('\n\n') + '\n';
  }
  /**
   * Render a helpful description of the location of the error in the GraphQL
   * Source document.
   */

  function highlightSourceAtLocation(source, location) {
    var firstLineColumnOffset = source.locationOffset.column - 1;
    var body = whitespace(firstLineColumnOffset) + source.body;
    var lineIndex = location.line - 1;
    var lineOffset = source.locationOffset.line - 1;
    var lineNum = location.line + lineOffset;
    var columnOffset = location.line === 1 ? firstLineColumnOffset : 0;
    var columnNum = location.column + columnOffset;
    var lines = body.split(/\r\n|[\n\r]/g);
    return "".concat(source.name, " (").concat(lineNum, ":").concat(columnNum, ")\n") + printPrefixedLines([// Lines specified like this: ["prefix", "string"],
    ["".concat(lineNum - 1, ": "), lines[lineIndex - 1]], ["".concat(lineNum, ": "), lines[lineIndex]], ['', whitespace(columnNum - 1) + '^'], ["".concat(lineNum + 1, ": "), lines[lineIndex + 1]]]);
  }

  function printPrefixedLines(lines) {
    var existingLines = lines.filter(function (_ref) {
      var _ = _ref[0],
          line = _ref[1];
      return line !== undefined;
    });
    var padLen = 0;
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = existingLines[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var _ref4 = _step3.value;
        var prefix = _ref4[0];
        padLen = Math.max(padLen, prefix.length);
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    return existingLines.map(function (_ref3) {
      var prefix = _ref3[0],
          line = _ref3[1];
      return lpad(padLen, prefix) + line;
    }).join('\n');
  }

  function whitespace(len) {
    return Array(len + 1).join(' ');
  }

  function lpad(len, str) {
    return whitespace(len - str.length) + str;
  }

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  /**
   * A GraphQLError describes an Error found during the parse, validate, or
   * execute phases of performing a GraphQL operation. In addition to a message
   * and stack trace, it also includes information about the locations in a
   * GraphQL document and/or execution result that correspond to the Error.
   */

  function GraphQLError( // eslint-disable-line no-redeclare
  message, nodes, source, positions, path, originalError, extensions) {
    // Compute list of blame nodes.
    var _nodes = Array.isArray(nodes) ? nodes.length !== 0 ? nodes : undefined : nodes ? [nodes] : undefined; // Compute locations in the source for the given nodes/positions.


    var _source = source;

    if (!_source && _nodes) {
      var node = _nodes[0];
      _source = node && node.loc && node.loc.source;
    }

    var _positions = positions;

    if (!_positions && _nodes) {
      _positions = _nodes.reduce(function (list, node) {
        if (node.loc) {
          list.push(node.loc.start);
        }

        return list;
      }, []);
    }

    if (_positions && _positions.length === 0) {
      _positions = undefined;
    }

    var _locations;

    if (positions && source) {
      _locations = positions.map(function (pos) {
        return getLocation(source, pos);
      });
    } else if (_nodes) {
      _locations = _nodes.reduce(function (list, node) {
        if (node.loc) {
          list.push(getLocation(node.loc.source, node.loc.start));
        }

        return list;
      }, []);
    }

    var _extensions = extensions || originalError && originalError.extensions;

    Object.defineProperties(this, {
      message: {
        value: message,
        // By being enumerable, JSON.stringify will include `message` in the
        // resulting output. This ensures that the simplest possible GraphQL
        // service adheres to the spec.
        enumerable: true,
        writable: true
      },
      locations: {
        // Coercing falsey values to undefined ensures they will not be included
        // in JSON.stringify() when not provided.
        value: _locations || undefined,
        // By being enumerable, JSON.stringify will include `locations` in the
        // resulting output. This ensures that the simplest possible GraphQL
        // service adheres to the spec.
        enumerable: Boolean(_locations)
      },
      path: {
        // Coercing falsey values to undefined ensures they will not be included
        // in JSON.stringify() when not provided.
        value: path || undefined,
        // By being enumerable, JSON.stringify will include `path` in the
        // resulting output. This ensures that the simplest possible GraphQL
        // service adheres to the spec.
        enumerable: Boolean(path)
      },
      nodes: {
        value: _nodes || undefined
      },
      source: {
        value: _source || undefined
      },
      positions: {
        value: _positions || undefined
      },
      originalError: {
        value: originalError
      },
      extensions: {
        // Coercing falsey values to undefined ensures they will not be included
        // in JSON.stringify() when not provided.
        value: _extensions || undefined,
        // By being enumerable, JSON.stringify will include `path` in the
        // resulting output. This ensures that the simplest possible GraphQL
        // service adheres to the spec.
        enumerable: Boolean(_extensions)
      }
    }); // Include (non-enumerable) stack trace.

    if (originalError && originalError.stack) {
      Object.defineProperty(this, 'stack', {
        value: originalError.stack,
        writable: true,
        configurable: true
      });
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GraphQLError);
    } else {
      Object.defineProperty(this, 'stack', {
        value: Error().stack,
        writable: true,
        configurable: true
      });
    }
  }
  GraphQLError.prototype = Object.create(Error.prototype, {
    constructor: {
      value: GraphQLError
    },
    name: {
      value: 'GraphQLError'
    },
    toString: {
      value: function toString() {
        return printError(this);
      }
    }
  });

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  /**
   * Produces a GraphQLError representing a syntax error, containing useful
   * descriptive information about the syntax error's position in the source.
   */

  function syntaxError(source, position, description) {
    return new GraphQLError("Syntax Error: ".concat(description), undefined, source, [position]);
  }

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  /**
   * Given a Source object, this returns a Lexer for that source.
   * A Lexer is a stateful stream generator in that every time
   * it is advanced, it returns the next token in the Source. Assuming the
   * source lexes, the final Token emitted by the lexer will be of kind
   * EOF, after which the lexer will repeatedly return the same EOF token
   * whenever called.
   */

  function createLexer(source, options) {
    var startOfFileToken = new Tok(TokenKind.SOF, 0, 0, 0, 0, null);
    var lexer = {
      source: source,
      options: options,
      lastToken: startOfFileToken,
      token: startOfFileToken,
      line: 1,
      lineStart: 0,
      advance: advanceLexer,
      lookahead: lookahead
    };
    return lexer;
  }

  function advanceLexer() {
    this.lastToken = this.token;
    var token = this.token = this.lookahead();
    return token;
  }

  function lookahead() {
    var token = this.token;

    if (token.kind !== TokenKind.EOF) {
      do {
        // Note: next is only mutable during parsing, so we cast to allow this.
        token = token.next || (token.next = readToken(this, token));
      } while (token.kind === TokenKind.COMMENT);
    }

    return token;
  }
  /**
   * The return type of createLexer.
   */


  /**
   * An exported enum describing the different kinds of tokens that the
   * lexer emits.
   */
  var TokenKind = Object.freeze({
    SOF: '<SOF>',
    EOF: '<EOF>',
    BANG: '!',
    DOLLAR: '$',
    AMP: '&',
    PAREN_L: '(',
    PAREN_R: ')',
    SPREAD: '...',
    COLON: ':',
    EQUALS: '=',
    AT: '@',
    BRACKET_L: '[',
    BRACKET_R: ']',
    BRACE_L: '{',
    PIPE: '|',
    BRACE_R: '}',
    NAME: 'Name',
    INT: 'Int',
    FLOAT: 'Float',
    STRING: 'String',
    BLOCK_STRING: 'BlockString',
    COMMENT: 'Comment'
  });
  /**
   * A helper function to describe a token as a string for debugging
   */

  function getTokenDesc(token) {
    var value = token.value;
    return value ? "".concat(token.kind, " \"").concat(value, "\"") : token.kind;
  }
  /**
   * Helper function for constructing the Token object.
   */

  function Tok(kind, start, end, line, column, prev, value) {
    this.kind = kind;
    this.start = start;
    this.end = end;
    this.line = line;
    this.column = column;
    this.value = value;
    this.prev = prev;
    this.next = null;
  } // Print a simplified form when appearing in JSON/util.inspect.


  defineToJSON(Tok, function () {
    return {
      kind: this.kind,
      value: this.value,
      line: this.line,
      column: this.column
    };
  });

  function printCharCode(code) {
    return (// NaN/undefined represents access beyond the end of the file.
      isNaN(code) ? TokenKind.EOF : // Trust JSON for ASCII.
      code < 0x007f ? JSON.stringify(String.fromCharCode(code)) : // Otherwise print the escaped form.
      "\"\\u".concat(('00' + code.toString(16).toUpperCase()).slice(-4), "\"")
    );
  }
  /**
   * Gets the next token from the source starting at the given position.
   *
   * This skips over whitespace until it finds the next lexable token, then lexes
   * punctuators immediately or calls the appropriate helper function for more
   * complicated tokens.
   */


  function readToken(lexer, prev) {
    var source = lexer.source;
    var body = source.body;
    var bodyLength = body.length;
    var pos = positionAfterWhitespace(body, prev.end, lexer);
    var line = lexer.line;
    var col = 1 + pos - lexer.lineStart;

    if (pos >= bodyLength) {
      return new Tok(TokenKind.EOF, bodyLength, bodyLength, line, col, prev);
    }

    var code = body.charCodeAt(pos); // SourceCharacter

    switch (code) {
      // !
      case 33:
        return new Tok(TokenKind.BANG, pos, pos + 1, line, col, prev);
      // #

      case 35:
        return readComment(source, pos, line, col, prev);
      // $

      case 36:
        return new Tok(TokenKind.DOLLAR, pos, pos + 1, line, col, prev);
      // &

      case 38:
        return new Tok(TokenKind.AMP, pos, pos + 1, line, col, prev);
      // (

      case 40:
        return new Tok(TokenKind.PAREN_L, pos, pos + 1, line, col, prev);
      // )

      case 41:
        return new Tok(TokenKind.PAREN_R, pos, pos + 1, line, col, prev);
      // .

      case 46:
        if (body.charCodeAt(pos + 1) === 46 && body.charCodeAt(pos + 2) === 46) {
          return new Tok(TokenKind.SPREAD, pos, pos + 3, line, col, prev);
        }

        break;
      // :

      case 58:
        return new Tok(TokenKind.COLON, pos, pos + 1, line, col, prev);
      // =

      case 61:
        return new Tok(TokenKind.EQUALS, pos, pos + 1, line, col, prev);
      // @

      case 64:
        return new Tok(TokenKind.AT, pos, pos + 1, line, col, prev);
      // [

      case 91:
        return new Tok(TokenKind.BRACKET_L, pos, pos + 1, line, col, prev);
      // ]

      case 93:
        return new Tok(TokenKind.BRACKET_R, pos, pos + 1, line, col, prev);
      // {

      case 123:
        return new Tok(TokenKind.BRACE_L, pos, pos + 1, line, col, prev);
      // |

      case 124:
        return new Tok(TokenKind.PIPE, pos, pos + 1, line, col, prev);
      // }

      case 125:
        return new Tok(TokenKind.BRACE_R, pos, pos + 1, line, col, prev);
      // A-Z _ a-z

      case 65:
      case 66:
      case 67:
      case 68:
      case 69:
      case 70:
      case 71:
      case 72:
      case 73:
      case 74:
      case 75:
      case 76:
      case 77:
      case 78:
      case 79:
      case 80:
      case 81:
      case 82:
      case 83:
      case 84:
      case 85:
      case 86:
      case 87:
      case 88:
      case 89:
      case 90:
      case 95:
      case 97:
      case 98:
      case 99:
      case 100:
      case 101:
      case 102:
      case 103:
      case 104:
      case 105:
      case 106:
      case 107:
      case 108:
      case 109:
      case 110:
      case 111:
      case 112:
      case 113:
      case 114:
      case 115:
      case 116:
      case 117:
      case 118:
      case 119:
      case 120:
      case 121:
      case 122:
        return readName(source, pos, line, col, prev);
      // - 0-9

      case 45:
      case 48:
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        return readNumber(source, pos, code, line, col, prev);
      // "

      case 34:
        if (body.charCodeAt(pos + 1) === 34 && body.charCodeAt(pos + 2) === 34) {
          return readBlockString(source, pos, line, col, prev, lexer);
        }

        return readString(source, pos, line, col, prev);
    }

    throw syntaxError(source, pos, unexpectedCharacterMessage(code));
  }
  /**
   * Report a message that an unexpected character was encountered.
   */


  function unexpectedCharacterMessage(code) {
    if (code < 0x0020 && code !== 0x0009 && code !== 0x000a && code !== 0x000d) {
      return "Cannot contain the invalid character ".concat(printCharCode(code), ".");
    }

    if (code === 39) {
      // '
      return "Unexpected single quote character ('), did you mean to use " + 'a double quote (")?';
    }

    return "Cannot parse the unexpected character ".concat(printCharCode(code), ".");
  }
  /**
   * Reads from body starting at startPosition until it finds a non-whitespace
   * character, then returns the position of that character for lexing.
   */


  function positionAfterWhitespace(body, startPosition, lexer) {
    var bodyLength = body.length;
    var position = startPosition;

    while (position < bodyLength) {
      var code = body.charCodeAt(position); // tab | space | comma | BOM

      if (code === 9 || code === 32 || code === 44 || code === 0xfeff) {
        ++position;
      } else if (code === 10) {
        // new line
        ++position;
        ++lexer.line;
        lexer.lineStart = position;
      } else if (code === 13) {
        // carriage return
        if (body.charCodeAt(position + 1) === 10) {
          position += 2;
        } else {
          ++position;
        }

        ++lexer.line;
        lexer.lineStart = position;
      } else {
        break;
      }
    }

    return position;
  }
  /**
   * Reads a comment token from the source file.
   *
   * #[\u0009\u0020-\uFFFF]*
   */


  function readComment(source, start, line, col, prev) {
    var body = source.body;
    var code;
    var position = start;

    do {
      code = body.charCodeAt(++position);
    } while (!isNaN(code) && ( // SourceCharacter but not LineTerminator
    code > 0x001f || code === 0x0009));

    return new Tok(TokenKind.COMMENT, start, position, line, col, prev, body.slice(start + 1, position));
  }
  /**
   * Reads a number token from the source file, either a float
   * or an int depending on whether a decimal point appears.
   *
   * Int:   -?(0|[1-9][0-9]*)
   * Float: -?(0|[1-9][0-9]*)(\.[0-9]+)?((E|e)(+|-)?[0-9]+)?
   */


  function readNumber(source, start, firstCode, line, col, prev) {
    var body = source.body;
    var code = firstCode;
    var position = start;
    var isFloat = false;

    if (code === 45) {
      // -
      code = body.charCodeAt(++position);
    }

    if (code === 48) {
      // 0
      code = body.charCodeAt(++position);

      if (code >= 48 && code <= 57) {
        throw syntaxError(source, position, "Invalid number, unexpected digit after 0: ".concat(printCharCode(code), "."));
      }
    } else {
      position = readDigits(source, position, code);
      code = body.charCodeAt(position);
    }

    if (code === 46) {
      // .
      isFloat = true;
      code = body.charCodeAt(++position);
      position = readDigits(source, position, code);
      code = body.charCodeAt(position);
    }

    if (code === 69 || code === 101) {
      // E e
      isFloat = true;
      code = body.charCodeAt(++position);

      if (code === 43 || code === 45) {
        // + -
        code = body.charCodeAt(++position);
      }

      position = readDigits(source, position, code);
    }

    return new Tok(isFloat ? TokenKind.FLOAT : TokenKind.INT, start, position, line, col, prev, body.slice(start, position));
  }
  /**
   * Returns the new position in the source after reading digits.
   */


  function readDigits(source, start, firstCode) {
    var body = source.body;
    var position = start;
    var code = firstCode;

    if (code >= 48 && code <= 57) {
      // 0 - 9
      do {
        code = body.charCodeAt(++position);
      } while (code >= 48 && code <= 57); // 0 - 9


      return position;
    }

    throw syntaxError(source, position, "Invalid number, expected digit but got: ".concat(printCharCode(code), "."));
  }
  /**
   * Reads a string token from the source file.
   *
   * "([^"\\\u000A\u000D]|(\\(u[0-9a-fA-F]{4}|["\\/bfnrt])))*"
   */


  function readString(source, start, line, col, prev) {
    var body = source.body;
    var position = start + 1;
    var chunkStart = position;
    var code = 0;
    var value = '';

    while (position < body.length && !isNaN(code = body.charCodeAt(position)) && // not LineTerminator
    code !== 0x000a && code !== 0x000d) {
      // Closing Quote (")
      if (code === 34) {
        value += body.slice(chunkStart, position);
        return new Tok(TokenKind.STRING, start, position + 1, line, col, prev, value);
      } // SourceCharacter


      if (code < 0x0020 && code !== 0x0009) {
        throw syntaxError(source, position, "Invalid character within String: ".concat(printCharCode(code), "."));
      }

      ++position;

      if (code === 92) {
        // \
        value += body.slice(chunkStart, position - 1);
        code = body.charCodeAt(position);

        switch (code) {
          case 34:
            value += '"';
            break;

          case 47:
            value += '/';
            break;

          case 92:
            value += '\\';
            break;

          case 98:
            value += '\b';
            break;

          case 102:
            value += '\f';
            break;

          case 110:
            value += '\n';
            break;

          case 114:
            value += '\r';
            break;

          case 116:
            value += '\t';
            break;

          case 117:
            // u
            var charCode = uniCharCode(body.charCodeAt(position + 1), body.charCodeAt(position + 2), body.charCodeAt(position + 3), body.charCodeAt(position + 4));

            if (charCode < 0) {
              throw syntaxError(source, position, 'Invalid character escape sequence: ' + "\\u".concat(body.slice(position + 1, position + 5), "."));
            }

            value += String.fromCharCode(charCode);
            position += 4;
            break;

          default:
            throw syntaxError(source, position, "Invalid character escape sequence: \\".concat(String.fromCharCode(code), "."));
        }

        ++position;
        chunkStart = position;
      }
    }

    throw syntaxError(source, position, 'Unterminated string.');
  }
  /**
   * Reads a block string token from the source file.
   *
   * """("?"?(\\"""|\\(?!=""")|[^"\\]))*"""
   */


  function readBlockString(source, start, line, col, prev, lexer) {
    var body = source.body;
    var position = start + 3;
    var chunkStart = position;
    var code = 0;
    var rawValue = '';

    while (position < body.length && !isNaN(code = body.charCodeAt(position))) {
      // Closing Triple-Quote (""")
      if (code === 34 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34) {
        rawValue += body.slice(chunkStart, position);
        return new Tok(TokenKind.BLOCK_STRING, start, position + 3, line, col, prev, dedentBlockStringValue(rawValue));
      } // SourceCharacter


      if (code < 0x0020 && code !== 0x0009 && code !== 0x000a && code !== 0x000d) {
        throw syntaxError(source, position, "Invalid character within String: ".concat(printCharCode(code), "."));
      }

      if (code === 10) {
        // new line
        ++position;
        ++lexer.line;
        lexer.lineStart = position;
      } else if (code === 13) {
        // carriage return
        if (body.charCodeAt(position + 1) === 10) {
          position += 2;
        } else {
          ++position;
        }

        ++lexer.line;
        lexer.lineStart = position;
      } else if ( // Escape Triple-Quote (\""")
      code === 92 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34 && body.charCodeAt(position + 3) === 34) {
        rawValue += body.slice(chunkStart, position) + '"""';
        position += 4;
        chunkStart = position;
      } else {
        ++position;
      }
    }

    throw syntaxError(source, position, 'Unterminated string.');
  }
  /**
   * Converts four hexadecimal chars to the integer that the
   * string represents. For example, uniCharCode('0','0','0','f')
   * will return 15, and uniCharCode('0','0','f','f') returns 255.
   *
   * Returns a negative number on error, if a char was invalid.
   *
   * This is implemented by noting that char2hex() returns -1 on error,
   * which means the result of ORing the char2hex() will also be negative.
   */


  function uniCharCode(a, b, c, d) {
    return char2hex(a) << 12 | char2hex(b) << 8 | char2hex(c) << 4 | char2hex(d);
  }
  /**
   * Converts a hex character to its integer value.
   * '0' becomes 0, '9' becomes 9
   * 'A' becomes 10, 'F' becomes 15
   * 'a' becomes 10, 'f' becomes 15
   *
   * Returns -1 on error.
   */


  function char2hex(a) {
    return a >= 48 && a <= 57 ? a - 48 // 0-9
    : a >= 65 && a <= 70 ? a - 55 // A-F
    : a >= 97 && a <= 102 ? a - 87 // a-f
    : -1;
  }
  /**
   * Reads an alphanumeric + underscore name from the source.
   *
   * [_A-Za-z][_0-9A-Za-z]*
   */


  function readName(source, start, line, col, prev) {
    var body = source.body;
    var bodyLength = body.length;
    var position = start + 1;
    var code = 0;

    while (position !== bodyLength && !isNaN(code = body.charCodeAt(position)) && (code === 95 || // _
    code >= 48 && code <= 57 || // 0-9
    code >= 65 && code <= 90 || // A-Z
    code >= 97 && code <= 122) // a-z
    ) {
      ++position;
    }

    return new Tok(TokenKind.NAME, start, position, line, col, prev, body.slice(start, position));
  }

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * The set of allowed kind values for AST nodes.
   */
  var Kind = Object.freeze({
    // Name
    NAME: 'Name',
    // Document
    DOCUMENT: 'Document',
    OPERATION_DEFINITION: 'OperationDefinition',
    VARIABLE_DEFINITION: 'VariableDefinition',
    SELECTION_SET: 'SelectionSet',
    FIELD: 'Field',
    ARGUMENT: 'Argument',
    // Fragments
    FRAGMENT_SPREAD: 'FragmentSpread',
    INLINE_FRAGMENT: 'InlineFragment',
    FRAGMENT_DEFINITION: 'FragmentDefinition',
    // Values
    VARIABLE: 'Variable',
    INT: 'IntValue',
    FLOAT: 'FloatValue',
    STRING: 'StringValue',
    BOOLEAN: 'BooleanValue',
    NULL: 'NullValue',
    ENUM: 'EnumValue',
    LIST: 'ListValue',
    OBJECT: 'ObjectValue',
    OBJECT_FIELD: 'ObjectField',
    // Directives
    DIRECTIVE: 'Directive',
    // Types
    NAMED_TYPE: 'NamedType',
    LIST_TYPE: 'ListType',
    NON_NULL_TYPE: 'NonNullType',
    // Type System Definitions
    SCHEMA_DEFINITION: 'SchemaDefinition',
    OPERATION_TYPE_DEFINITION: 'OperationTypeDefinition',
    // Type Definitions
    SCALAR_TYPE_DEFINITION: 'ScalarTypeDefinition',
    OBJECT_TYPE_DEFINITION: 'ObjectTypeDefinition',
    FIELD_DEFINITION: 'FieldDefinition',
    INPUT_VALUE_DEFINITION: 'InputValueDefinition',
    INTERFACE_TYPE_DEFINITION: 'InterfaceTypeDefinition',
    UNION_TYPE_DEFINITION: 'UnionTypeDefinition',
    ENUM_TYPE_DEFINITION: 'EnumTypeDefinition',
    ENUM_VALUE_DEFINITION: 'EnumValueDefinition',
    INPUT_OBJECT_TYPE_DEFINITION: 'InputObjectTypeDefinition',
    // Directive Definitions
    DIRECTIVE_DEFINITION: 'DirectiveDefinition',
    // Type System Extensions
    SCHEMA_EXTENSION: 'SchemaExtension',
    // Type Extensions
    SCALAR_TYPE_EXTENSION: 'ScalarTypeExtension',
    OBJECT_TYPE_EXTENSION: 'ObjectTypeExtension',
    INTERFACE_TYPE_EXTENSION: 'InterfaceTypeExtension',
    UNION_TYPE_EXTENSION: 'UnionTypeExtension',
    ENUM_TYPE_EXTENSION: 'EnumTypeExtension',
    INPUT_OBJECT_TYPE_EXTENSION: 'InputObjectTypeExtension'
  });
  /**
   * The enum type representing the possible kind values of AST nodes.
   */

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * The set of allowed directive location values.
   */
  var DirectiveLocation = Object.freeze({
    // Request Definitions
    QUERY: 'QUERY',
    MUTATION: 'MUTATION',
    SUBSCRIPTION: 'SUBSCRIPTION',
    FIELD: 'FIELD',
    FRAGMENT_DEFINITION: 'FRAGMENT_DEFINITION',
    FRAGMENT_SPREAD: 'FRAGMENT_SPREAD',
    INLINE_FRAGMENT: 'INLINE_FRAGMENT',
    VARIABLE_DEFINITION: 'VARIABLE_DEFINITION',
    // Type System Definitions
    SCHEMA: 'SCHEMA',
    SCALAR: 'SCALAR',
    OBJECT: 'OBJECT',
    FIELD_DEFINITION: 'FIELD_DEFINITION',
    ARGUMENT_DEFINITION: 'ARGUMENT_DEFINITION',
    INTERFACE: 'INTERFACE',
    UNION: 'UNION',
    ENUM: 'ENUM',
    ENUM_VALUE: 'ENUM_VALUE',
    INPUT_OBJECT: 'INPUT_OBJECT',
    INPUT_FIELD_DEFINITION: 'INPUT_FIELD_DEFINITION'
  });
  /**
   * The enum type representing the directive location values.
   */

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  /**
   * Configuration options to control parser behavior
   */

  /**
   * Given a GraphQL source, parses it into a Document.
   * Throws GraphQLError if a syntax error is encountered.
   */
  function parse$1(source, options) {
    var sourceObj = typeof source === 'string' ? new Source(source) : source;

    if (!(sourceObj instanceof Source)) {
      throw new TypeError("Must provide Source. Received: ".concat(inspect(sourceObj)));
    }

    var lexer = createLexer(sourceObj, options || {});
    return parseDocument(lexer);
  }
  /**
   * Given a string containing a GraphQL value (ex. `[42]`), parse the AST for
   * that value.
   * Throws GraphQLError if a syntax error is encountered.
   *
   * This is useful within tools that operate upon GraphQL Values directly and
   * in isolation of complete GraphQL documents.
   *
   * Consider providing the results to the utility function: valueFromAST().
   */

  function parseValue(source, options) {
    var sourceObj = typeof source === 'string' ? new Source(source) : source;
    var lexer = createLexer(sourceObj, options || {});
    expectToken(lexer, TokenKind.SOF);
    var value = parseValueLiteral(lexer, false);
    expectToken(lexer, TokenKind.EOF);
    return value;
  }
  /**
   * Given a string containing a GraphQL Type (ex. `[Int!]`), parse the AST for
   * that type.
   * Throws GraphQLError if a syntax error is encountered.
   *
   * This is useful within tools that operate upon GraphQL Types directly and
   * in isolation of complete GraphQL documents.
   *
   * Consider providing the results to the utility function: typeFromAST().
   */

  function parseType(source, options) {
    var sourceObj = typeof source === 'string' ? new Source(source) : source;
    var lexer = createLexer(sourceObj, options || {});
    expectToken(lexer, TokenKind.SOF);
    var type = parseTypeReference(lexer);
    expectToken(lexer, TokenKind.EOF);
    return type;
  }
  /**
   * Converts a name lex token into a name parse node.
   */

  function parseName(lexer) {
    var token = expectToken(lexer, TokenKind.NAME);
    return {
      kind: Kind.NAME,
      value: token.value,
      loc: loc(lexer, token)
    };
  } // Implements the parsing rules in the Document section.

  /**
   * Document : Definition+
   */


  function parseDocument(lexer) {
    var start = lexer.token;
    return {
      kind: Kind.DOCUMENT,
      definitions: many(lexer, TokenKind.SOF, parseDefinition, TokenKind.EOF),
      loc: loc(lexer, start)
    };
  }
  /**
   * Definition :
   *   - ExecutableDefinition
   *   - TypeSystemDefinition
   *   - TypeSystemExtension
   */


  function parseDefinition(lexer) {
    if (peek(lexer, TokenKind.NAME)) {
      switch (lexer.token.value) {
        case 'query':
        case 'mutation':
        case 'subscription':
        case 'fragment':
          return parseExecutableDefinition(lexer);

        case 'schema':
        case 'scalar':
        case 'type':
        case 'interface':
        case 'union':
        case 'enum':
        case 'input':
        case 'directive':
          return parseTypeSystemDefinition(lexer);

        case 'extend':
          return parseTypeSystemExtension(lexer);
      }
    } else if (peek(lexer, TokenKind.BRACE_L)) {
      return parseExecutableDefinition(lexer);
    } else if (peekDescription(lexer)) {
      return parseTypeSystemDefinition(lexer);
    }

    throw unexpected(lexer);
  }
  /**
   * ExecutableDefinition :
   *   - OperationDefinition
   *   - FragmentDefinition
   */


  function parseExecutableDefinition(lexer) {
    if (peek(lexer, TokenKind.NAME)) {
      switch (lexer.token.value) {
        case 'query':
        case 'mutation':
        case 'subscription':
          return parseOperationDefinition(lexer);

        case 'fragment':
          return parseFragmentDefinition(lexer);
      }
    } else if (peek(lexer, TokenKind.BRACE_L)) {
      return parseOperationDefinition(lexer);
    }

    throw unexpected(lexer);
  } // Implements the parsing rules in the Operations section.

  /**
   * OperationDefinition :
   *  - SelectionSet
   *  - OperationType Name? VariableDefinitions? Directives? SelectionSet
   */


  function parseOperationDefinition(lexer) {
    var start = lexer.token;

    if (peek(lexer, TokenKind.BRACE_L)) {
      return {
        kind: Kind.OPERATION_DEFINITION,
        operation: 'query',
        name: undefined,
        variableDefinitions: [],
        directives: [],
        selectionSet: parseSelectionSet(lexer),
        loc: loc(lexer, start)
      };
    }

    var operation = parseOperationType(lexer);
    var name;

    if (peek(lexer, TokenKind.NAME)) {
      name = parseName(lexer);
    }

    return {
      kind: Kind.OPERATION_DEFINITION,
      operation: operation,
      name: name,
      variableDefinitions: parseVariableDefinitions(lexer),
      directives: parseDirectives(lexer, false),
      selectionSet: parseSelectionSet(lexer),
      loc: loc(lexer, start)
    };
  }
  /**
   * OperationType : one of query mutation subscription
   */


  function parseOperationType(lexer) {
    var operationToken = expectToken(lexer, TokenKind.NAME);

    switch (operationToken.value) {
      case 'query':
        return 'query';

      case 'mutation':
        return 'mutation';

      case 'subscription':
        return 'subscription';
    }

    throw unexpected(lexer, operationToken);
  }
  /**
   * VariableDefinitions : ( VariableDefinition+ )
   */


  function parseVariableDefinitions(lexer) {
    return peek(lexer, TokenKind.PAREN_L) ? many(lexer, TokenKind.PAREN_L, parseVariableDefinition, TokenKind.PAREN_R) : [];
  }
  /**
   * VariableDefinition : Variable : Type DefaultValue? Directives[Const]?
   */


  function parseVariableDefinition(lexer) {
    var start = lexer.token;
    return {
      kind: Kind.VARIABLE_DEFINITION,
      variable: parseVariable(lexer),
      type: (expectToken(lexer, TokenKind.COLON), parseTypeReference(lexer)),
      defaultValue: expectOptionalToken(lexer, TokenKind.EQUALS) ? parseValueLiteral(lexer, true) : undefined,
      directives: parseDirectives(lexer, true),
      loc: loc(lexer, start)
    };
  }
  /**
   * Variable : $ Name
   */


  function parseVariable(lexer) {
    var start = lexer.token;
    expectToken(lexer, TokenKind.DOLLAR);
    return {
      kind: Kind.VARIABLE,
      name: parseName(lexer),
      loc: loc(lexer, start)
    };
  }
  /**
   * SelectionSet : { Selection+ }
   */


  function parseSelectionSet(lexer) {
    var start = lexer.token;
    return {
      kind: Kind.SELECTION_SET,
      selections: many(lexer, TokenKind.BRACE_L, parseSelection, TokenKind.BRACE_R),
      loc: loc(lexer, start)
    };
  }
  /**
   * Selection :
   *   - Field
   *   - FragmentSpread
   *   - InlineFragment
   */


  function parseSelection(lexer) {
    return peek(lexer, TokenKind.SPREAD) ? parseFragment(lexer) : parseField(lexer);
  }
  /**
   * Field : Alias? Name Arguments? Directives? SelectionSet?
   *
   * Alias : Name :
   */


  function parseField(lexer) {
    var start = lexer.token;
    var nameOrAlias = parseName(lexer);
    var alias;
    var name;

    if (expectOptionalToken(lexer, TokenKind.COLON)) {
      alias = nameOrAlias;
      name = parseName(lexer);
    } else {
      name = nameOrAlias;
    }

    return {
      kind: Kind.FIELD,
      alias: alias,
      name: name,
      arguments: parseArguments(lexer, false),
      directives: parseDirectives(lexer, false),
      selectionSet: peek(lexer, TokenKind.BRACE_L) ? parseSelectionSet(lexer) : undefined,
      loc: loc(lexer, start)
    };
  }
  /**
   * Arguments[Const] : ( Argument[?Const]+ )
   */


  function parseArguments(lexer, isConst) {
    var item = isConst ? parseConstArgument : parseArgument;
    return peek(lexer, TokenKind.PAREN_L) ? many(lexer, TokenKind.PAREN_L, item, TokenKind.PAREN_R) : [];
  }
  /**
   * Argument[Const] : Name : Value[?Const]
   */


  function parseArgument(lexer) {
    var start = lexer.token;
    var name = parseName(lexer);
    expectToken(lexer, TokenKind.COLON);
    return {
      kind: Kind.ARGUMENT,
      name: name,
      value: parseValueLiteral(lexer, false),
      loc: loc(lexer, start)
    };
  }

  function parseConstArgument(lexer) {
    var start = lexer.token;
    return {
      kind: Kind.ARGUMENT,
      name: parseName(lexer),
      value: (expectToken(lexer, TokenKind.COLON), parseConstValue(lexer)),
      loc: loc(lexer, start)
    };
  } // Implements the parsing rules in the Fragments section.

  /**
   * Corresponds to both FragmentSpread and InlineFragment in the spec.
   *
   * FragmentSpread : ... FragmentName Directives?
   *
   * InlineFragment : ... TypeCondition? Directives? SelectionSet
   */


  function parseFragment(lexer) {
    var start = lexer.token;
    expectToken(lexer, TokenKind.SPREAD);
    var hasTypeCondition = expectOptionalKeyword(lexer, 'on');

    if (!hasTypeCondition && peek(lexer, TokenKind.NAME)) {
      return {
        kind: Kind.FRAGMENT_SPREAD,
        name: parseFragmentName(lexer),
        directives: parseDirectives(lexer, false),
        loc: loc(lexer, start)
      };
    }

    return {
      kind: Kind.INLINE_FRAGMENT,
      typeCondition: hasTypeCondition ? parseNamedType(lexer) : undefined,
      directives: parseDirectives(lexer, false),
      selectionSet: parseSelectionSet(lexer),
      loc: loc(lexer, start)
    };
  }
  /**
   * FragmentDefinition :
   *   - fragment FragmentName on TypeCondition Directives? SelectionSet
   *
   * TypeCondition : NamedType
   */


  function parseFragmentDefinition(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'fragment'); // Experimental support for defining variables within fragments changes
    // the grammar of FragmentDefinition:
    //   - fragment FragmentName VariableDefinitions? on TypeCondition Directives? SelectionSet

    if (lexer.options.experimentalFragmentVariables) {
      return {
        kind: Kind.FRAGMENT_DEFINITION,
        name: parseFragmentName(lexer),
        variableDefinitions: parseVariableDefinitions(lexer),
        typeCondition: (expectKeyword(lexer, 'on'), parseNamedType(lexer)),
        directives: parseDirectives(lexer, false),
        selectionSet: parseSelectionSet(lexer),
        loc: loc(lexer, start)
      };
    }

    return {
      kind: Kind.FRAGMENT_DEFINITION,
      name: parseFragmentName(lexer),
      typeCondition: (expectKeyword(lexer, 'on'), parseNamedType(lexer)),
      directives: parseDirectives(lexer, false),
      selectionSet: parseSelectionSet(lexer),
      loc: loc(lexer, start)
    };
  }
  /**
   * FragmentName : Name but not `on`
   */


  function parseFragmentName(lexer) {
    if (lexer.token.value === 'on') {
      throw unexpected(lexer);
    }

    return parseName(lexer);
  } // Implements the parsing rules in the Values section.

  /**
   * Value[Const] :
   *   - [~Const] Variable
   *   - IntValue
   *   - FloatValue
   *   - StringValue
   *   - BooleanValue
   *   - NullValue
   *   - EnumValue
   *   - ListValue[?Const]
   *   - ObjectValue[?Const]
   *
   * BooleanValue : one of `true` `false`
   *
   * NullValue : `null`
   *
   * EnumValue : Name but not `true`, `false` or `null`
   */


  function parseValueLiteral(lexer, isConst) {
    var token = lexer.token;

    switch (token.kind) {
      case TokenKind.BRACKET_L:
        return parseList(lexer, isConst);

      case TokenKind.BRACE_L:
        return parseObject(lexer, isConst);

      case TokenKind.INT:
        lexer.advance();
        return {
          kind: Kind.INT,
          value: token.value,
          loc: loc(lexer, token)
        };

      case TokenKind.FLOAT:
        lexer.advance();
        return {
          kind: Kind.FLOAT,
          value: token.value,
          loc: loc(lexer, token)
        };

      case TokenKind.STRING:
      case TokenKind.BLOCK_STRING:
        return parseStringLiteral(lexer);

      case TokenKind.NAME:
        if (token.value === 'true' || token.value === 'false') {
          lexer.advance();
          return {
            kind: Kind.BOOLEAN,
            value: token.value === 'true',
            loc: loc(lexer, token)
          };
        } else if (token.value === 'null') {
          lexer.advance();
          return {
            kind: Kind.NULL,
            loc: loc(lexer, token)
          };
        }

        lexer.advance();
        return {
          kind: Kind.ENUM,
          value: token.value,
          loc: loc(lexer, token)
        };

      case TokenKind.DOLLAR:
        if (!isConst) {
          return parseVariable(lexer);
        }

        break;
    }

    throw unexpected(lexer);
  }

  function parseStringLiteral(lexer) {
    var token = lexer.token;
    lexer.advance();
    return {
      kind: Kind.STRING,
      value: token.value,
      block: token.kind === TokenKind.BLOCK_STRING,
      loc: loc(lexer, token)
    };
  }

  function parseConstValue(lexer) {
    return parseValueLiteral(lexer, true);
  }

  function parseValueValue(lexer) {
    return parseValueLiteral(lexer, false);
  }
  /**
   * ListValue[Const] :
   *   - [ ]
   *   - [ Value[?Const]+ ]
   */


  function parseList(lexer, isConst) {
    var start = lexer.token;
    var item = isConst ? parseConstValue : parseValueValue;
    return {
      kind: Kind.LIST,
      values: any(lexer, TokenKind.BRACKET_L, item, TokenKind.BRACKET_R),
      loc: loc(lexer, start)
    };
  }
  /**
   * ObjectValue[Const] :
   *   - { }
   *   - { ObjectField[?Const]+ }
   */


  function parseObject(lexer, isConst) {
    var start = lexer.token;

    var item = function item() {
      return parseObjectField(lexer, isConst);
    };

    return {
      kind: Kind.OBJECT,
      fields: any(lexer, TokenKind.BRACE_L, item, TokenKind.BRACE_R),
      loc: loc(lexer, start)
    };
  }
  /**
   * ObjectField[Const] : Name : Value[?Const]
   */


  function parseObjectField(lexer, isConst) {
    var start = lexer.token;
    var name = parseName(lexer);
    expectToken(lexer, TokenKind.COLON);
    return {
      kind: Kind.OBJECT_FIELD,
      name: name,
      value: parseValueLiteral(lexer, isConst),
      loc: loc(lexer, start)
    };
  } // Implements the parsing rules in the Directives section.

  /**
   * Directives[Const] : Directive[?Const]+
   */


  function parseDirectives(lexer, isConst) {
    var directives = [];

    while (peek(lexer, TokenKind.AT)) {
      directives.push(parseDirective(lexer, isConst));
    }

    return directives;
  }
  /**
   * Directive[Const] : @ Name Arguments[?Const]?
   */


  function parseDirective(lexer, isConst) {
    var start = lexer.token;
    expectToken(lexer, TokenKind.AT);
    return {
      kind: Kind.DIRECTIVE,
      name: parseName(lexer),
      arguments: parseArguments(lexer, isConst),
      loc: loc(lexer, start)
    };
  } // Implements the parsing rules in the Types section.

  /**
   * Type :
   *   - NamedType
   *   - ListType
   *   - NonNullType
   */


  function parseTypeReference(lexer) {
    var start = lexer.token;
    var type;

    if (expectOptionalToken(lexer, TokenKind.BRACKET_L)) {
      type = parseTypeReference(lexer);
      expectToken(lexer, TokenKind.BRACKET_R);
      type = {
        kind: Kind.LIST_TYPE,
        type: type,
        loc: loc(lexer, start)
      };
    } else {
      type = parseNamedType(lexer);
    }

    if (expectOptionalToken(lexer, TokenKind.BANG)) {
      return {
        kind: Kind.NON_NULL_TYPE,
        type: type,
        loc: loc(lexer, start)
      };
    }

    return type;
  }
  /**
   * NamedType : Name
   */

  function parseNamedType(lexer) {
    var start = lexer.token;
    return {
      kind: Kind.NAMED_TYPE,
      name: parseName(lexer),
      loc: loc(lexer, start)
    };
  } // Implements the parsing rules in the Type Definition section.

  /**
   * TypeSystemDefinition :
   *   - SchemaDefinition
   *   - TypeDefinition
   *   - DirectiveDefinition
   *
   * TypeDefinition :
   *   - ScalarTypeDefinition
   *   - ObjectTypeDefinition
   *   - InterfaceTypeDefinition
   *   - UnionTypeDefinition
   *   - EnumTypeDefinition
   *   - InputObjectTypeDefinition
   */

  function parseTypeSystemDefinition(lexer) {
    // Many definitions begin with a description and require a lookahead.
    var keywordToken = peekDescription(lexer) ? lexer.lookahead() : lexer.token;

    if (keywordToken.kind === TokenKind.NAME) {
      switch (keywordToken.value) {
        case 'schema':
          return parseSchemaDefinition(lexer);

        case 'scalar':
          return parseScalarTypeDefinition(lexer);

        case 'type':
          return parseObjectTypeDefinition(lexer);

        case 'interface':
          return parseInterfaceTypeDefinition(lexer);

        case 'union':
          return parseUnionTypeDefinition(lexer);

        case 'enum':
          return parseEnumTypeDefinition(lexer);

        case 'input':
          return parseInputObjectTypeDefinition(lexer);

        case 'directive':
          return parseDirectiveDefinition(lexer);
      }
    }

    throw unexpected(lexer, keywordToken);
  }

  function peekDescription(lexer) {
    return peek(lexer, TokenKind.STRING) || peek(lexer, TokenKind.BLOCK_STRING);
  }
  /**
   * Description : StringValue
   */


  function parseDescription(lexer) {
    if (peekDescription(lexer)) {
      return parseStringLiteral(lexer);
    }
  }
  /**
   * SchemaDefinition : schema Directives[Const]? { OperationTypeDefinition+ }
   */


  function parseSchemaDefinition(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'schema');
    var directives = parseDirectives(lexer, true);
    var operationTypes = many(lexer, TokenKind.BRACE_L, parseOperationTypeDefinition, TokenKind.BRACE_R);
    return {
      kind: Kind.SCHEMA_DEFINITION,
      directives: directives,
      operationTypes: operationTypes,
      loc: loc(lexer, start)
    };
  }
  /**
   * OperationTypeDefinition : OperationType : NamedType
   */


  function parseOperationTypeDefinition(lexer) {
    var start = lexer.token;
    var operation = parseOperationType(lexer);
    expectToken(lexer, TokenKind.COLON);
    var type = parseNamedType(lexer);
    return {
      kind: Kind.OPERATION_TYPE_DEFINITION,
      operation: operation,
      type: type,
      loc: loc(lexer, start)
    };
  }
  /**
   * ScalarTypeDefinition : Description? scalar Name Directives[Const]?
   */


  function parseScalarTypeDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    expectKeyword(lexer, 'scalar');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    return {
      kind: Kind.SCALAR_TYPE_DEFINITION,
      description: description,
      name: name,
      directives: directives,
      loc: loc(lexer, start)
    };
  }
  /**
   * ObjectTypeDefinition :
   *   Description?
   *   type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition?
   */


  function parseObjectTypeDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    expectKeyword(lexer, 'type');
    var name = parseName(lexer);
    var interfaces = parseImplementsInterfaces(lexer);
    var directives = parseDirectives(lexer, true);
    var fields = parseFieldsDefinition(lexer);
    return {
      kind: Kind.OBJECT_TYPE_DEFINITION,
      description: description,
      name: name,
      interfaces: interfaces,
      directives: directives,
      fields: fields,
      loc: loc(lexer, start)
    };
  }
  /**
   * ImplementsInterfaces :
   *   - implements `&`? NamedType
   *   - ImplementsInterfaces & NamedType
   */


  function parseImplementsInterfaces(lexer) {
    var types = [];

    if (expectOptionalKeyword(lexer, 'implements')) {
      // Optional leading ampersand
      expectOptionalToken(lexer, TokenKind.AMP);

      do {
        types.push(parseNamedType(lexer));
      } while (expectOptionalToken(lexer, TokenKind.AMP) || // Legacy support for the SDL?
      lexer.options.allowLegacySDLImplementsInterfaces && peek(lexer, TokenKind.NAME));
    }

    return types;
  }
  /**
   * FieldsDefinition : { FieldDefinition+ }
   */


  function parseFieldsDefinition(lexer) {
    // Legacy support for the SDL?
    if (lexer.options.allowLegacySDLEmptyFields && peek(lexer, TokenKind.BRACE_L) && lexer.lookahead().kind === TokenKind.BRACE_R) {
      lexer.advance();
      lexer.advance();
      return [];
    }

    return peek(lexer, TokenKind.BRACE_L) ? many(lexer, TokenKind.BRACE_L, parseFieldDefinition, TokenKind.BRACE_R) : [];
  }
  /**
   * FieldDefinition :
   *   - Description? Name ArgumentsDefinition? : Type Directives[Const]?
   */


  function parseFieldDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    var name = parseName(lexer);
    var args = parseArgumentDefs(lexer);
    expectToken(lexer, TokenKind.COLON);
    var type = parseTypeReference(lexer);
    var directives = parseDirectives(lexer, true);
    return {
      kind: Kind.FIELD_DEFINITION,
      description: description,
      name: name,
      arguments: args,
      type: type,
      directives: directives,
      loc: loc(lexer, start)
    };
  }
  /**
   * ArgumentsDefinition : ( InputValueDefinition+ )
   */


  function parseArgumentDefs(lexer) {
    if (!peek(lexer, TokenKind.PAREN_L)) {
      return [];
    }

    return many(lexer, TokenKind.PAREN_L, parseInputValueDef, TokenKind.PAREN_R);
  }
  /**
   * InputValueDefinition :
   *   - Description? Name : Type DefaultValue? Directives[Const]?
   */


  function parseInputValueDef(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    var name = parseName(lexer);
    expectToken(lexer, TokenKind.COLON);
    var type = parseTypeReference(lexer);
    var defaultValue;

    if (expectOptionalToken(lexer, TokenKind.EQUALS)) {
      defaultValue = parseConstValue(lexer);
    }

    var directives = parseDirectives(lexer, true);
    return {
      kind: Kind.INPUT_VALUE_DEFINITION,
      description: description,
      name: name,
      type: type,
      defaultValue: defaultValue,
      directives: directives,
      loc: loc(lexer, start)
    };
  }
  /**
   * InterfaceTypeDefinition :
   *   - Description? interface Name Directives[Const]? FieldsDefinition?
   */


  function parseInterfaceTypeDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    expectKeyword(lexer, 'interface');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    var fields = parseFieldsDefinition(lexer);
    return {
      kind: Kind.INTERFACE_TYPE_DEFINITION,
      description: description,
      name: name,
      directives: directives,
      fields: fields,
      loc: loc(lexer, start)
    };
  }
  /**
   * UnionTypeDefinition :
   *   - Description? union Name Directives[Const]? UnionMemberTypes?
   */


  function parseUnionTypeDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    expectKeyword(lexer, 'union');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    var types = parseUnionMemberTypes(lexer);
    return {
      kind: Kind.UNION_TYPE_DEFINITION,
      description: description,
      name: name,
      directives: directives,
      types: types,
      loc: loc(lexer, start)
    };
  }
  /**
   * UnionMemberTypes :
   *   - = `|`? NamedType
   *   - UnionMemberTypes | NamedType
   */


  function parseUnionMemberTypes(lexer) {
    var types = [];

    if (expectOptionalToken(lexer, TokenKind.EQUALS)) {
      // Optional leading pipe
      expectOptionalToken(lexer, TokenKind.PIPE);

      do {
        types.push(parseNamedType(lexer));
      } while (expectOptionalToken(lexer, TokenKind.PIPE));
    }

    return types;
  }
  /**
   * EnumTypeDefinition :
   *   - Description? enum Name Directives[Const]? EnumValuesDefinition?
   */


  function parseEnumTypeDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    expectKeyword(lexer, 'enum');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    var values = parseEnumValuesDefinition(lexer);
    return {
      kind: Kind.ENUM_TYPE_DEFINITION,
      description: description,
      name: name,
      directives: directives,
      values: values,
      loc: loc(lexer, start)
    };
  }
  /**
   * EnumValuesDefinition : { EnumValueDefinition+ }
   */


  function parseEnumValuesDefinition(lexer) {
    return peek(lexer, TokenKind.BRACE_L) ? many(lexer, TokenKind.BRACE_L, parseEnumValueDefinition, TokenKind.BRACE_R) : [];
  }
  /**
   * EnumValueDefinition : Description? EnumValue Directives[Const]?
   *
   * EnumValue : Name
   */


  function parseEnumValueDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    return {
      kind: Kind.ENUM_VALUE_DEFINITION,
      description: description,
      name: name,
      directives: directives,
      loc: loc(lexer, start)
    };
  }
  /**
   * InputObjectTypeDefinition :
   *   - Description? input Name Directives[Const]? InputFieldsDefinition?
   */


  function parseInputObjectTypeDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    expectKeyword(lexer, 'input');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    var fields = parseInputFieldsDefinition(lexer);
    return {
      kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
      description: description,
      name: name,
      directives: directives,
      fields: fields,
      loc: loc(lexer, start)
    };
  }
  /**
   * InputFieldsDefinition : { InputValueDefinition+ }
   */


  function parseInputFieldsDefinition(lexer) {
    return peek(lexer, TokenKind.BRACE_L) ? many(lexer, TokenKind.BRACE_L, parseInputValueDef, TokenKind.BRACE_R) : [];
  }
  /**
   * TypeSystemExtension :
   *   - SchemaExtension
   *   - TypeExtension
   *
   * TypeExtension :
   *   - ScalarTypeExtension
   *   - ObjectTypeExtension
   *   - InterfaceTypeExtension
   *   - UnionTypeExtension
   *   - EnumTypeExtension
   *   - InputObjectTypeDefinition
   */


  function parseTypeSystemExtension(lexer) {
    var keywordToken = lexer.lookahead();

    if (keywordToken.kind === TokenKind.NAME) {
      switch (keywordToken.value) {
        case 'schema':
          return parseSchemaExtension(lexer);

        case 'scalar':
          return parseScalarTypeExtension(lexer);

        case 'type':
          return parseObjectTypeExtension(lexer);

        case 'interface':
          return parseInterfaceTypeExtension(lexer);

        case 'union':
          return parseUnionTypeExtension(lexer);

        case 'enum':
          return parseEnumTypeExtension(lexer);

        case 'input':
          return parseInputObjectTypeExtension(lexer);
      }
    }

    throw unexpected(lexer, keywordToken);
  }
  /**
   * SchemaExtension :
   *  - extend schema Directives[Const]? { OperationTypeDefinition+ }
   *  - extend schema Directives[Const]
   */


  function parseSchemaExtension(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'extend');
    expectKeyword(lexer, 'schema');
    var directives = parseDirectives(lexer, true);
    var operationTypes = peek(lexer, TokenKind.BRACE_L) ? many(lexer, TokenKind.BRACE_L, parseOperationTypeDefinition, TokenKind.BRACE_R) : [];

    if (directives.length === 0 && operationTypes.length === 0) {
      throw unexpected(lexer);
    }

    return {
      kind: Kind.SCHEMA_EXTENSION,
      directives: directives,
      operationTypes: operationTypes,
      loc: loc(lexer, start)
    };
  }
  /**
   * ScalarTypeExtension :
   *   - extend scalar Name Directives[Const]
   */


  function parseScalarTypeExtension(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'extend');
    expectKeyword(lexer, 'scalar');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);

    if (directives.length === 0) {
      throw unexpected(lexer);
    }

    return {
      kind: Kind.SCALAR_TYPE_EXTENSION,
      name: name,
      directives: directives,
      loc: loc(lexer, start)
    };
  }
  /**
   * ObjectTypeExtension :
   *  - extend type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
   *  - extend type Name ImplementsInterfaces? Directives[Const]
   *  - extend type Name ImplementsInterfaces
   */


  function parseObjectTypeExtension(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'extend');
    expectKeyword(lexer, 'type');
    var name = parseName(lexer);
    var interfaces = parseImplementsInterfaces(lexer);
    var directives = parseDirectives(lexer, true);
    var fields = parseFieldsDefinition(lexer);

    if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
      throw unexpected(lexer);
    }

    return {
      kind: Kind.OBJECT_TYPE_EXTENSION,
      name: name,
      interfaces: interfaces,
      directives: directives,
      fields: fields,
      loc: loc(lexer, start)
    };
  }
  /**
   * InterfaceTypeExtension :
   *   - extend interface Name Directives[Const]? FieldsDefinition
   *   - extend interface Name Directives[Const]
   */


  function parseInterfaceTypeExtension(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'extend');
    expectKeyword(lexer, 'interface');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    var fields = parseFieldsDefinition(lexer);

    if (directives.length === 0 && fields.length === 0) {
      throw unexpected(lexer);
    }

    return {
      kind: Kind.INTERFACE_TYPE_EXTENSION,
      name: name,
      directives: directives,
      fields: fields,
      loc: loc(lexer, start)
    };
  }
  /**
   * UnionTypeExtension :
   *   - extend union Name Directives[Const]? UnionMemberTypes
   *   - extend union Name Directives[Const]
   */


  function parseUnionTypeExtension(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'extend');
    expectKeyword(lexer, 'union');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    var types = parseUnionMemberTypes(lexer);

    if (directives.length === 0 && types.length === 0) {
      throw unexpected(lexer);
    }

    return {
      kind: Kind.UNION_TYPE_EXTENSION,
      name: name,
      directives: directives,
      types: types,
      loc: loc(lexer, start)
    };
  }
  /**
   * EnumTypeExtension :
   *   - extend enum Name Directives[Const]? EnumValuesDefinition
   *   - extend enum Name Directives[Const]
   */


  function parseEnumTypeExtension(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'extend');
    expectKeyword(lexer, 'enum');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    var values = parseEnumValuesDefinition(lexer);

    if (directives.length === 0 && values.length === 0) {
      throw unexpected(lexer);
    }

    return {
      kind: Kind.ENUM_TYPE_EXTENSION,
      name: name,
      directives: directives,
      values: values,
      loc: loc(lexer, start)
    };
  }
  /**
   * InputObjectTypeExtension :
   *   - extend input Name Directives[Const]? InputFieldsDefinition
   *   - extend input Name Directives[Const]
   */


  function parseInputObjectTypeExtension(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'extend');
    expectKeyword(lexer, 'input');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    var fields = parseInputFieldsDefinition(lexer);

    if (directives.length === 0 && fields.length === 0) {
      throw unexpected(lexer);
    }

    return {
      kind: Kind.INPUT_OBJECT_TYPE_EXTENSION,
      name: name,
      directives: directives,
      fields: fields,
      loc: loc(lexer, start)
    };
  }
  /**
   * DirectiveDefinition :
   *   - Description? directive @ Name ArgumentsDefinition? on DirectiveLocations
   */


  function parseDirectiveDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    expectKeyword(lexer, 'directive');
    expectToken(lexer, TokenKind.AT);
    var name = parseName(lexer);
    var args = parseArgumentDefs(lexer);
    expectKeyword(lexer, 'on');
    var locations = parseDirectiveLocations(lexer);
    return {
      kind: Kind.DIRECTIVE_DEFINITION,
      description: description,
      name: name,
      arguments: args,
      locations: locations,
      loc: loc(lexer, start)
    };
  }
  /**
   * DirectiveLocations :
   *   - `|`? DirectiveLocation
   *   - DirectiveLocations | DirectiveLocation
   */


  function parseDirectiveLocations(lexer) {
    // Optional leading pipe
    expectOptionalToken(lexer, TokenKind.PIPE);
    var locations = [];

    do {
      locations.push(parseDirectiveLocation(lexer));
    } while (expectOptionalToken(lexer, TokenKind.PIPE));

    return locations;
  }
  /*
   * DirectiveLocation :
   *   - ExecutableDirectiveLocation
   *   - TypeSystemDirectiveLocation
   *
   * ExecutableDirectiveLocation : one of
   *   `QUERY`
   *   `MUTATION`
   *   `SUBSCRIPTION`
   *   `FIELD`
   *   `FRAGMENT_DEFINITION`
   *   `FRAGMENT_SPREAD`
   *   `INLINE_FRAGMENT`
   *
   * TypeSystemDirectiveLocation : one of
   *   `SCHEMA`
   *   `SCALAR`
   *   `OBJECT`
   *   `FIELD_DEFINITION`
   *   `ARGUMENT_DEFINITION`
   *   `INTERFACE`
   *   `UNION`
   *   `ENUM`
   *   `ENUM_VALUE`
   *   `INPUT_OBJECT`
   *   `INPUT_FIELD_DEFINITION`
   */


  function parseDirectiveLocation(lexer) {
    var start = lexer.token;
    var name = parseName(lexer);

    if (DirectiveLocation.hasOwnProperty(name.value)) {
      return name;
    }

    throw unexpected(lexer, start);
  } // Core parsing utility functions

  /**
   * Returns a location object, used to identify the place in
   * the source that created a given parsed object.
   */


  function loc(lexer, startToken) {
    if (!lexer.options.noLocation) {
      return new Loc(startToken, lexer.lastToken, lexer.source);
    }
  }

  function Loc(startToken, endToken, source) {
    this.start = startToken.start;
    this.end = endToken.end;
    this.startToken = startToken;
    this.endToken = endToken;
    this.source = source;
  } // Print a simplified form when appearing in JSON/util.inspect.


  defineToJSON(Loc, function () {
    return {
      start: this.start,
      end: this.end
    };
  });
  /**
   * Determines if the next token is of a given kind
   */

  function peek(lexer, kind) {
    return lexer.token.kind === kind;
  }
  /**
   * If the next token is of the given kind, return that token after advancing
   * the lexer. Otherwise, do not change the parser state and throw an error.
   */


  function expectToken(lexer, kind) {
    var token = lexer.token;

    if (token.kind === kind) {
      lexer.advance();
      return token;
    }

    throw syntaxError(lexer.source, token.start, "Expected ".concat(kind, ", found ").concat(getTokenDesc(token)));
  }
  /**
   * If the next token is of the given kind, return that token after advancing
   * the lexer. Otherwise, do not change the parser state and return undefined.
   */


  function expectOptionalToken(lexer, kind) {
    var token = lexer.token;

    if (token.kind === kind) {
      lexer.advance();
      return token;
    }

    return undefined;
  }
  /**
   * If the next token is a given keyword, return that token after advancing
   * the lexer. Otherwise, do not change the parser state and throw an error.
   */


  function expectKeyword(lexer, value) {
    var token = lexer.token;

    if (token.kind === TokenKind.NAME && token.value === value) {
      lexer.advance();
      return token;
    }

    throw syntaxError(lexer.source, token.start, "Expected \"".concat(value, "\", found ").concat(getTokenDesc(token)));
  }
  /**
   * If the next token is a given keyword, return that token after advancing
   * the lexer. Otherwise, do not change the parser state and return undefined.
   */


  function expectOptionalKeyword(lexer, value) {
    var token = lexer.token;

    if (token.kind === TokenKind.NAME && token.value === value) {
      lexer.advance();
      return token;
    }

    return undefined;
  }
  /**
   * Helper function for creating an error when an unexpected lexed token
   * is encountered.
   */


  function unexpected(lexer, atToken) {
    var token = atToken || lexer.token;
    return syntaxError(lexer.source, token.start, "Unexpected ".concat(getTokenDesc(token)));
  }
  /**
   * Returns a possibly empty list of parse nodes, determined by
   * the parseFn. This list begins with a lex token of openKind
   * and ends with a lex token of closeKind. Advances the parser
   * to the next lex token after the closing token.
   */


  function any(lexer, openKind, parseFn, closeKind) {
    expectToken(lexer, openKind);
    var nodes = [];

    while (!expectOptionalToken(lexer, closeKind)) {
      nodes.push(parseFn(lexer));
    }

    return nodes;
  }
  /**
   * Returns a non-empty list of parse nodes, determined by
   * the parseFn. This list begins with a lex token of openKind
   * and ends with a lex token of closeKind. Advances the parser
   * to the next lex token after the closing token.
   */


  function many(lexer, openKind, parseFn, closeKind) {
    expectToken(lexer, openKind);
    var nodes = [parseFn(lexer)];

    while (!expectOptionalToken(lexer, closeKind)) {
      nodes.push(parseFn(lexer));
    }

    return nodes;
  }

  var parser = /*#__PURE__*/Object.freeze({
    parse: parse$1,
    parseValue: parseValue,
    parseType: parseType,
    parseConstValue: parseConstValue,
    parseTypeReference: parseTypeReference,
    parseNamedType: parseNamedType
  });

  var parser$1 = getCjsExportFromNamespace(parser);

  var parse$2 = parser$1.parse;

  // Strip insignificant whitespace
  // Note that this could do a lot more, such as reorder fields etc.
  function normalize(string) {
    return string.replace(/[\s,]+/g, ' ').trim();
  }

  // A map docString -> graphql document
  var docCache = {};

  // A map fragmentName -> [normalized source]
  var fragmentSourceMap = {};

  function cacheKeyFromLoc(loc) {
    return normalize(loc.source.body.substring(loc.start, loc.end));
  }

  // For testing.
  function resetCaches() {
    docCache = {};
    fragmentSourceMap = {};
  }

  // Take a unstripped parsed document (query/mutation or even fragment), and
  // check all fragment definitions, checking for name->source uniqueness.
  // We also want to make sure only unique fragments exist in the document.
  var printFragmentWarnings = true;
  function processFragments(ast) {
    var astFragmentMap = {};
    var definitions = [];

    for (var i = 0; i < ast.definitions.length; i++) {
      var fragmentDefinition = ast.definitions[i];

      if (fragmentDefinition.kind === 'FragmentDefinition') {
        var fragmentName = fragmentDefinition.name.value;
        var sourceKey = cacheKeyFromLoc(fragmentDefinition.loc);

        // We know something about this fragment
        if (fragmentSourceMap.hasOwnProperty(fragmentName) && !fragmentSourceMap[fragmentName][sourceKey]) {

          // this is a problem because the app developer is trying to register another fragment with
          // the same name as one previously registered. So, we tell them about it.
          if (printFragmentWarnings) {
            console.warn("Warning: fragment with name " + fragmentName + " already exists.\n"
              + "graphql-tag enforces all fragment names across your application to be unique; read more about\n"
              + "this in the docs: http://dev.apollodata.com/core/fragments.html#unique-names");
          }

          fragmentSourceMap[fragmentName][sourceKey] = true;

        } else if (!fragmentSourceMap.hasOwnProperty(fragmentName)) {
          fragmentSourceMap[fragmentName] = {};
          fragmentSourceMap[fragmentName][sourceKey] = true;
        }

        if (!astFragmentMap[sourceKey]) {
          astFragmentMap[sourceKey] = true;
          definitions.push(fragmentDefinition);
        }
      } else {
        definitions.push(fragmentDefinition);
      }
    }

    ast.definitions = definitions;
    return ast;
  }

  function disableFragmentWarnings() {
    printFragmentWarnings = false;
  }

  function stripLoc(doc, removeLocAtThisLevel) {
    var docType = Object.prototype.toString.call(doc);

    if (docType === '[object Array]') {
      return doc.map(function (d) {
        return stripLoc(d, removeLocAtThisLevel);
      });
    }

    if (docType !== '[object Object]') {
      throw new Error('Unexpected input.');
    }

    // We don't want to remove the root loc field so we can use it
    // for fragment substitution (see below)
    if (removeLocAtThisLevel && doc.loc) {
      delete doc.loc;
    }

    // https://github.com/apollographql/graphql-tag/issues/40
    if (doc.loc) {
      delete doc.loc.startToken;
      delete doc.loc.endToken;
    }

    var keys = Object.keys(doc);
    var key;
    var value;
    var valueType;

    for (key in keys) {
      if (keys.hasOwnProperty(key)) {
        value = doc[keys[key]];
        valueType = Object.prototype.toString.call(value);

        if (valueType === '[object Object]' || valueType === '[object Array]') {
          doc[keys[key]] = stripLoc(value, true);
        }
      }
    }

    return doc;
  }

  var experimentalFragmentVariables = false;
  function parseDocument$1(doc) {
    var cacheKey = normalize(doc);

    if (docCache[cacheKey]) {
      return docCache[cacheKey];
    }

    var parsed = parse$2(doc, { experimentalFragmentVariables: experimentalFragmentVariables });
    if (!parsed || parsed.kind !== 'Document') {
      throw new Error('Not a valid GraphQL document.');
    }

    // check that all "new" fragments inside the documents are consistent with
    // existing fragments of the same name
    parsed = processFragments(parsed);
    parsed = stripLoc(parsed, false);
    docCache[cacheKey] = parsed;

    return parsed;
  }

  function enableExperimentalFragmentVariables() {
    experimentalFragmentVariables = true;
  }

  function disableExperimentalFragmentVariables() {
    experimentalFragmentVariables = false;
  }

  // XXX This should eventually disallow arbitrary string interpolation, like Relay does
  function gql(/* arguments */) {
    var args = Array.prototype.slice.call(arguments);

    var literals = args[0];

    // We always get literals[0] and then matching post literals for each arg given
    var result = (typeof(literals) === "string") ? literals : literals[0];

    for (var i = 1; i < args.length; i++) {
      if (args[i] && args[i].kind && args[i].kind === 'Document') {
        result += args[i].loc.source.body;
      } else {
        result += args[i];
      }

      result += literals[i];
    }

    return parseDocument$1(result);
  }

  // Support typescript, which isn't as nice as Babel about default exports
  gql.default = gql;
  gql.resetCaches = resetCaches;
  gql.disableFragmentWarnings = disableFragmentWarnings;
  gql.enableExperimentalFragmentVariables = enableExperimentalFragmentVariables;
  gql.disableExperimentalFragmentVariables = disableExperimentalFragmentVariables;

  var src = gql;

  var genericMessage$4 = "Invariant Violation";
  var _a$4 = Object.setPrototypeOf, setPrototypeOf$4 = _a$4 === void 0 ? function (obj, proto) {
      obj.__proto__ = proto;
      return obj;
  } : _a$4;
  var InvariantError$4 = /** @class */ (function (_super) {
      __extends(InvariantError, _super);
      function InvariantError(message) {
          if (message === void 0) { message = genericMessage$4; }
          var _this = _super.call(this, message) || this;
          _this.framesToPop = 1;
          _this.name = genericMessage$4;
          setPrototypeOf$4(_this, InvariantError.prototype);
          return _this;
      }
      return InvariantError;
  }(Error));
  function invariant$6(condition, message) {
      if (!condition) {
          throw new InvariantError$4(message);
      }
  }
  (function (invariant) {
      function warn() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          return console.warn.apply(console, args);
      }
      invariant.warn = warn;
      function error() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          return console.error.apply(console, args);
      }
      invariant.error = error;
  })(invariant$6 || (invariant$6 = {}));

  var PRESET_CONFIG_KEYS = [
      'request',
      'uri',
      'credentials',
      'headers',
      'fetch',
      'fetchOptions',
      'clientState',
      'onError',
      'cacheRedirects',
      'cache',
      'name',
      'version',
      'resolvers',
      'typeDefs',
      'fragmentMatcher',
  ];
  var DefaultClient = (function (_super) {
      __extends(DefaultClient, _super);
      function DefaultClient(config) {
          if (config === void 0) { config = {}; }
          var _this = this;
          if (config) {
              var diff = Object.keys(config).filter(function (key) { return PRESET_CONFIG_KEYS.indexOf(key) === -1; });
              if (diff.length > 0) ;
          }
          var request = config.request, uri = config.uri, credentials = config.credentials, headers = config.headers, fetch = config.fetch, fetchOptions = config.fetchOptions, clientState = config.clientState, cacheRedirects = config.cacheRedirects, errorCallback = config.onError, name = config.name, version = config.version, resolvers = config.resolvers, typeDefs = config.typeDefs, fragmentMatcher = config.fragmentMatcher;
          var cache = config.cache;
          invariant$6(!cache || !cacheRedirects);
          if (!cache) {
              cache = cacheRedirects
                  ? new InMemoryCache({ cacheRedirects: cacheRedirects })
                  : new InMemoryCache();
          }
          var errorLink = errorCallback
              ? onError(errorCallback)
              : onError(function (_a) {
                  var graphQLErrors = _a.graphQLErrors, networkError = _a.networkError;
                  if (graphQLErrors) {
                      graphQLErrors.map(function (_a) {
                          var message = _a.message, locations = _a.locations, path = _a.path;
                          return "production" === "production" || invariant$6.warn("[GraphQL error]: Message: " + message + ", Location: " +
                              (locations + ", Path: " + path));
                      });
                  }
              });
          var requestHandler = request
              ? new ApolloLink(function (operation, forward) {
                  return new Observable$1(function (observer) {
                      var handle;
                      Promise.resolve(operation)
                          .then(function (oper) { return request(oper); })
                          .then(function () {
                          handle = forward(operation).subscribe({
                              next: observer.next.bind(observer),
                              error: observer.error.bind(observer),
                              complete: observer.complete.bind(observer),
                          });
                      })
                          .catch(observer.error.bind(observer));
                      return function () {
                          if (handle) {
                              handle.unsubscribe();
                          }
                      };
                  });
              })
              : false;
          var httpLink = new HttpLink({
              uri: uri || '/graphql',
              fetch: fetch,
              fetchOptions: fetchOptions || {},
              credentials: credentials || 'same-origin',
              headers: headers || {},
          });
          var link = ApolloLink.from([errorLink, requestHandler, httpLink].filter(function (x) { return !!x; }));
          var activeResolvers = resolvers;
          var activeTypeDefs = typeDefs;
          var activeFragmentMatcher = fragmentMatcher;
          if (clientState) {
              if (clientState.defaults) {
                  cache.writeData({
                      data: clientState.defaults,
                  });
              }
              activeResolvers = clientState.resolvers;
              activeTypeDefs = clientState.typeDefs;
              activeFragmentMatcher = clientState.fragmentMatcher;
          }
          _this = _super.call(this, {
              cache: cache,
              link: link,
              name: name,
              version: version,
              resolvers: activeResolvers,
              typeDefs: activeTypeDefs,
              fragmentMatcher: activeFragmentMatcher,
          }) || this;
          return _this;
      }
      return DefaultClient;
  }(ApolloClient));
  //# sourceMappingURL=bundle.esm.js.map

  /**
   * A specialized version of `_.map` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the new mapped array.
   */
  function arrayMap(array, iteratee) {
    var index = -1,
        length = array == null ? 0 : array.length,
        result = Array(length);

    while (++index < length) {
      result[index] = iteratee(array[index], index, array);
    }
    return result;
  }

  var _arrayMap = arrayMap;

  /**
   * Removes all key-value entries from the list cache.
   *
   * @private
   * @name clear
   * @memberOf ListCache
   */
  function listCacheClear() {
    this.__data__ = [];
    this.size = 0;
  }

  var _listCacheClear = listCacheClear;

  /**
   * Performs a
   * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * comparison between two values to determine if they are equivalent.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   * @example
   *
   * var object = { 'a': 1 };
   * var other = { 'a': 1 };
   *
   * _.eq(object, object);
   * // => true
   *
   * _.eq(object, other);
   * // => false
   *
   * _.eq('a', 'a');
   * // => true
   *
   * _.eq('a', Object('a'));
   * // => false
   *
   * _.eq(NaN, NaN);
   * // => true
   */
  function eq(value, other) {
    return value === other || (value !== value && other !== other);
  }

  var eq_1 = eq;

  /**
   * Gets the index at which the `key` is found in `array` of key-value pairs.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} key The key to search for.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function assocIndexOf(array, key) {
    var length = array.length;
    while (length--) {
      if (eq_1(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }

  var _assocIndexOf = assocIndexOf;

  /** Used for built-in method references. */
  var arrayProto = Array.prototype;

  /** Built-in value references. */
  var splice = arrayProto.splice;

  /**
   * Removes `key` and its value from the list cache.
   *
   * @private
   * @name delete
   * @memberOf ListCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function listCacheDelete(key) {
    var data = this.__data__,
        index = _assocIndexOf(data, key);

    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    --this.size;
    return true;
  }

  var _listCacheDelete = listCacheDelete;

  /**
   * Gets the list cache value for `key`.
   *
   * @private
   * @name get
   * @memberOf ListCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function listCacheGet(key) {
    var data = this.__data__,
        index = _assocIndexOf(data, key);

    return index < 0 ? undefined : data[index][1];
  }

  var _listCacheGet = listCacheGet;

  /**
   * Checks if a list cache value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf ListCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function listCacheHas(key) {
    return _assocIndexOf(this.__data__, key) > -1;
  }

  var _listCacheHas = listCacheHas;

  /**
   * Sets the list cache `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf ListCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the list cache instance.
   */
  function listCacheSet(key, value) {
    var data = this.__data__,
        index = _assocIndexOf(data, key);

    if (index < 0) {
      ++this.size;
      data.push([key, value]);
    } else {
      data[index][1] = value;
    }
    return this;
  }

  var _listCacheSet = listCacheSet;

  /**
   * Creates an list cache object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function ListCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  // Add methods to `ListCache`.
  ListCache.prototype.clear = _listCacheClear;
  ListCache.prototype['delete'] = _listCacheDelete;
  ListCache.prototype.get = _listCacheGet;
  ListCache.prototype.has = _listCacheHas;
  ListCache.prototype.set = _listCacheSet;

  var _ListCache = ListCache;

  /**
   * Removes all key-value entries from the stack.
   *
   * @private
   * @name clear
   * @memberOf Stack
   */
  function stackClear() {
    this.__data__ = new _ListCache;
    this.size = 0;
  }

  var _stackClear = stackClear;

  /**
   * Removes `key` and its value from the stack.
   *
   * @private
   * @name delete
   * @memberOf Stack
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function stackDelete(key) {
    var data = this.__data__,
        result = data['delete'](key);

    this.size = data.size;
    return result;
  }

  var _stackDelete = stackDelete;

  /**
   * Gets the stack value for `key`.
   *
   * @private
   * @name get
   * @memberOf Stack
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function stackGet(key) {
    return this.__data__.get(key);
  }

  var _stackGet = stackGet;

  /**
   * Checks if a stack value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Stack
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function stackHas(key) {
    return this.__data__.has(key);
  }

  var _stackHas = stackHas;

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

  var _freeGlobal = freeGlobal;

  /** Detect free variable `self`. */
  var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

  /** Used as a reference to the global object. */
  var root$2 = _freeGlobal || freeSelf || Function('return this')();

  var _root = root$2;

  /** Built-in value references. */
  var Symbol$1 = _root.Symbol;

  var _Symbol = Symbol$1;

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$2 = objectProto.hasOwnProperty;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString = objectProto.toString;

  /** Built-in value references. */
  var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

  /**
   * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the raw `toStringTag`.
   */
  function getRawTag(value) {
    var isOwn = hasOwnProperty$2.call(value, symToStringTag),
        tag = value[symToStringTag];

    try {
      value[symToStringTag] = undefined;
    } catch (e) {}

    var result = nativeObjectToString.call(value);
    {
      if (isOwn) {
        value[symToStringTag] = tag;
      } else {
        delete value[symToStringTag];
      }
    }
    return result;
  }

  var _getRawTag = getRawTag;

  /** Used for built-in method references. */
  var objectProto$1 = Object.prototype;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString$1 = objectProto$1.toString;

  /**
   * Converts `value` to a string using `Object.prototype.toString`.
   *
   * @private
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   */
  function objectToString(value) {
    return nativeObjectToString$1.call(value);
  }

  var _objectToString = objectToString;

  /** `Object#toString` result references. */
  var nullTag = '[object Null]',
      undefinedTag = '[object Undefined]';

  /** Built-in value references. */
  var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

  /**
   * The base implementation of `getTag` without fallbacks for buggy environments.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  function baseGetTag(value) {
    if (value == null) {
      return value === undefined ? undefinedTag : nullTag;
    }
    return (symToStringTag$1 && symToStringTag$1 in Object(value))
      ? _getRawTag(value)
      : _objectToString(value);
  }

  var _baseGetTag = baseGetTag;

  /**
   * Checks if `value` is the
   * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
   * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(_.noop);
   * // => true
   *
   * _.isObject(null);
   * // => false
   */
  function isObject$1(value) {
    var type = typeof value;
    return value != null && (type == 'object' || type == 'function');
  }

  var isObject_1 = isObject$1;

  /** `Object#toString` result references. */
  var asyncTag = '[object AsyncFunction]',
      funcTag = '[object Function]',
      genTag = '[object GeneratorFunction]',
      proxyTag = '[object Proxy]';

  /**
   * Checks if `value` is classified as a `Function` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a function, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   *
   * _.isFunction(/abc/);
   * // => false
   */
  function isFunction(value) {
    if (!isObject_1(value)) {
      return false;
    }
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 9 which returns 'object' for typed arrays and other constructors.
    var tag = _baseGetTag(value);
    return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
  }

  var isFunction_1 = isFunction;

  /** Used to detect overreaching core-js shims. */
  var coreJsData = _root['__core-js_shared__'];

  var _coreJsData = coreJsData;

  /** Used to detect methods masquerading as native. */
  var maskSrcKey = (function() {
    var uid = /[^.]+$/.exec(_coreJsData && _coreJsData.keys && _coreJsData.keys.IE_PROTO || '');
    return uid ? ('Symbol(src)_1.' + uid) : '';
  }());

  /**
   * Checks if `func` has its source masked.
   *
   * @private
   * @param {Function} func The function to check.
   * @returns {boolean} Returns `true` if `func` is masked, else `false`.
   */
  function isMasked(func) {
    return !!maskSrcKey && (maskSrcKey in func);
  }

  var _isMasked = isMasked;

  /** Used for built-in method references. */
  var funcProto = Function.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString;

  /**
   * Converts `func` to its source code.
   *
   * @private
   * @param {Function} func The function to convert.
   * @returns {string} Returns the source code.
   */
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString.call(func);
      } catch (e) {}
      try {
        return (func + '');
      } catch (e) {}
    }
    return '';
  }

  var _toSource = toSource;

  /**
   * Used to match `RegExp`
   * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
   */
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

  /** Used to detect host constructors (Safari). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used for built-in method references. */
  var funcProto$1 = Function.prototype,
      objectProto$2 = Object.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString$1 = funcProto$1.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty$3 = objectProto$2.hasOwnProperty;

  /** Used to detect if a method is native. */
  var reIsNative = RegExp('^' +
    funcToString$1.call(hasOwnProperty$3).replace(reRegExpChar, '\\$&')
    .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
  );

  /**
   * The base implementation of `_.isNative` without bad shim checks.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a native function,
   *  else `false`.
   */
  function baseIsNative(value) {
    if (!isObject_1(value) || _isMasked(value)) {
      return false;
    }
    var pattern = isFunction_1(value) ? reIsNative : reIsHostCtor;
    return pattern.test(_toSource(value));
  }

  var _baseIsNative = baseIsNative;

  /**
   * Gets the value at `key` of `object`.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function getValue(object, key) {
    return object == null ? undefined : object[key];
  }

  var _getValue = getValue;

  /**
   * Gets the native function at `key` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the method to get.
   * @returns {*} Returns the function if it's native, else `undefined`.
   */
  function getNative(object, key) {
    var value = _getValue(object, key);
    return _baseIsNative(value) ? value : undefined;
  }

  var _getNative = getNative;

  /* Built-in method references that are verified to be native. */
  var Map$2 = _getNative(_root, 'Map');

  var _Map = Map$2;

  /* Built-in method references that are verified to be native. */
  var nativeCreate = _getNative(Object, 'create');

  var _nativeCreate = nativeCreate;

  /**
   * Removes all key-value entries from the hash.
   *
   * @private
   * @name clear
   * @memberOf Hash
   */
  function hashClear() {
    this.__data__ = _nativeCreate ? _nativeCreate(null) : {};
    this.size = 0;
  }

  var _hashClear = hashClear;

  /**
   * Removes `key` and its value from the hash.
   *
   * @private
   * @name delete
   * @memberOf Hash
   * @param {Object} hash The hash to modify.
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function hashDelete(key) {
    var result = this.has(key) && delete this.__data__[key];
    this.size -= result ? 1 : 0;
    return result;
  }

  var _hashDelete = hashDelete;

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = '__lodash_hash_undefined__';

  /** Used for built-in method references. */
  var objectProto$3 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$4 = objectProto$3.hasOwnProperty;

  /**
   * Gets the hash value for `key`.
   *
   * @private
   * @name get
   * @memberOf Hash
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function hashGet(key) {
    var data = this.__data__;
    if (_nativeCreate) {
      var result = data[key];
      return result === HASH_UNDEFINED ? undefined : result;
    }
    return hasOwnProperty$4.call(data, key) ? data[key] : undefined;
  }

  var _hashGet = hashGet;

  /** Used for built-in method references. */
  var objectProto$4 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$5 = objectProto$4.hasOwnProperty;

  /**
   * Checks if a hash value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Hash
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function hashHas(key) {
    var data = this.__data__;
    return _nativeCreate ? (data[key] !== undefined) : hasOwnProperty$5.call(data, key);
  }

  var _hashHas = hashHas;

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

  /**
   * Sets the hash `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Hash
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the hash instance.
   */
  function hashSet(key, value) {
    var data = this.__data__;
    this.size += this.has(key) ? 0 : 1;
    data[key] = (_nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
    return this;
  }

  var _hashSet = hashSet;

  /**
   * Creates a hash object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Hash(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  // Add methods to `Hash`.
  Hash.prototype.clear = _hashClear;
  Hash.prototype['delete'] = _hashDelete;
  Hash.prototype.get = _hashGet;
  Hash.prototype.has = _hashHas;
  Hash.prototype.set = _hashSet;

  var _Hash = Hash;

  /**
   * Removes all key-value entries from the map.
   *
   * @private
   * @name clear
   * @memberOf MapCache
   */
  function mapCacheClear() {
    this.size = 0;
    this.__data__ = {
      'hash': new _Hash,
      'map': new (_Map || _ListCache),
      'string': new _Hash
    };
  }

  var _mapCacheClear = mapCacheClear;

  /**
   * Checks if `value` is suitable for use as unique object key.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
   */
  function isKeyable(value) {
    var type = typeof value;
    return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
      ? (value !== '__proto__')
      : (value === null);
  }

  var _isKeyable = isKeyable;

  /**
   * Gets the data for `map`.
   *
   * @private
   * @param {Object} map The map to query.
   * @param {string} key The reference key.
   * @returns {*} Returns the map data.
   */
  function getMapData(map, key) {
    var data = map.__data__;
    return _isKeyable(key)
      ? data[typeof key == 'string' ? 'string' : 'hash']
      : data.map;
  }

  var _getMapData = getMapData;

  /**
   * Removes `key` and its value from the map.
   *
   * @private
   * @name delete
   * @memberOf MapCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function mapCacheDelete(key) {
    var result = _getMapData(this, key)['delete'](key);
    this.size -= result ? 1 : 0;
    return result;
  }

  var _mapCacheDelete = mapCacheDelete;

  /**
   * Gets the map value for `key`.
   *
   * @private
   * @name get
   * @memberOf MapCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function mapCacheGet(key) {
    return _getMapData(this, key).get(key);
  }

  var _mapCacheGet = mapCacheGet;

  /**
   * Checks if a map value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf MapCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function mapCacheHas(key) {
    return _getMapData(this, key).has(key);
  }

  var _mapCacheHas = mapCacheHas;

  /**
   * Sets the map `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf MapCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the map cache instance.
   */
  function mapCacheSet(key, value) {
    var data = _getMapData(this, key),
        size = data.size;

    data.set(key, value);
    this.size += data.size == size ? 0 : 1;
    return this;
  }

  var _mapCacheSet = mapCacheSet;

  /**
   * Creates a map cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function MapCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  // Add methods to `MapCache`.
  MapCache.prototype.clear = _mapCacheClear;
  MapCache.prototype['delete'] = _mapCacheDelete;
  MapCache.prototype.get = _mapCacheGet;
  MapCache.prototype.has = _mapCacheHas;
  MapCache.prototype.set = _mapCacheSet;

  var _MapCache = MapCache;

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /**
   * Sets the stack `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Stack
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the stack cache instance.
   */
  function stackSet(key, value) {
    var data = this.__data__;
    if (data instanceof _ListCache) {
      var pairs = data.__data__;
      if (!_Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
        pairs.push([key, value]);
        this.size = ++data.size;
        return this;
      }
      data = this.__data__ = new _MapCache(pairs);
    }
    data.set(key, value);
    this.size = data.size;
    return this;
  }

  var _stackSet = stackSet;

  /**
   * Creates a stack cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Stack(entries) {
    var data = this.__data__ = new _ListCache(entries);
    this.size = data.size;
  }

  // Add methods to `Stack`.
  Stack.prototype.clear = _stackClear;
  Stack.prototype['delete'] = _stackDelete;
  Stack.prototype.get = _stackGet;
  Stack.prototype.has = _stackHas;
  Stack.prototype.set = _stackSet;

  var _Stack = Stack;

  /**
   * A specialized version of `_.forEach` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns `array`.
   */
  function arrayEach(array, iteratee) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      if (iteratee(array[index], index, array) === false) {
        break;
      }
    }
    return array;
  }

  var _arrayEach = arrayEach;

  var defineProperty = (function() {
    try {
      var func = _getNative(Object, 'defineProperty');
      func({}, '', {});
      return func;
    } catch (e) {}
  }());

  var _defineProperty = defineProperty;

  /**
   * The base implementation of `assignValue` and `assignMergeValue` without
   * value checks.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {string} key The key of the property to assign.
   * @param {*} value The value to assign.
   */
  function baseAssignValue(object, key, value) {
    if (key == '__proto__' && _defineProperty) {
      _defineProperty(object, key, {
        'configurable': true,
        'enumerable': true,
        'value': value,
        'writable': true
      });
    } else {
      object[key] = value;
    }
  }

  var _baseAssignValue = baseAssignValue;

  /** Used for built-in method references. */
  var objectProto$5 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$6 = objectProto$5.hasOwnProperty;

  /**
   * Assigns `value` to `key` of `object` if the existing value is not equivalent
   * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * for equality comparisons.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {string} key The key of the property to assign.
   * @param {*} value The value to assign.
   */
  function assignValue(object, key, value) {
    var objValue = object[key];
    if (!(hasOwnProperty$6.call(object, key) && eq_1(objValue, value)) ||
        (value === undefined && !(key in object))) {
      _baseAssignValue(object, key, value);
    }
  }

  var _assignValue = assignValue;

  /**
   * Copies properties of `source` to `object`.
   *
   * @private
   * @param {Object} source The object to copy properties from.
   * @param {Array} props The property identifiers to copy.
   * @param {Object} [object={}] The object to copy properties to.
   * @param {Function} [customizer] The function to customize copied values.
   * @returns {Object} Returns `object`.
   */
  function copyObject(source, props, object, customizer) {
    var isNew = !object;
    object || (object = {});

    var index = -1,
        length = props.length;

    while (++index < length) {
      var key = props[index];

      var newValue = customizer
        ? customizer(object[key], source[key], key, object, source)
        : undefined;

      if (newValue === undefined) {
        newValue = source[key];
      }
      if (isNew) {
        _baseAssignValue(object, key, newValue);
      } else {
        _assignValue(object, key, newValue);
      }
    }
    return object;
  }

  var _copyObject = copyObject;

  /**
   * The base implementation of `_.times` without support for iteratee shorthands
   * or max array length checks.
   *
   * @private
   * @param {number} n The number of times to invoke `iteratee`.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the array of results.
   */
  function baseTimes(n, iteratee) {
    var index = -1,
        result = Array(n);

    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }

  var _baseTimes = baseTimes;

  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return value != null && typeof value == 'object';
  }

  var isObjectLike_1 = isObjectLike;

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]';

  /**
   * The base implementation of `_.isArguments`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   */
  function baseIsArguments(value) {
    return isObjectLike_1(value) && _baseGetTag(value) == argsTag;
  }

  var _baseIsArguments = baseIsArguments;

  /** Used for built-in method references. */
  var objectProto$6 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$7 = objectProto$6.hasOwnProperty;

  /** Built-in value references. */
  var propertyIsEnumerable = objectProto$6.propertyIsEnumerable;

  /**
   * Checks if `value` is likely an `arguments` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   *  else `false`.
   * @example
   *
   * _.isArguments(function() { return arguments; }());
   * // => true
   *
   * _.isArguments([1, 2, 3]);
   * // => false
   */
  var isArguments = _baseIsArguments(function() { return arguments; }()) ? _baseIsArguments : function(value) {
    return isObjectLike_1(value) && hasOwnProperty$7.call(value, 'callee') &&
      !propertyIsEnumerable.call(value, 'callee');
  };

  var isArguments_1 = isArguments;

  /**
   * Checks if `value` is classified as an `Array` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array, else `false`.
   * @example
   *
   * _.isArray([1, 2, 3]);
   * // => true
   *
   * _.isArray(document.body.children);
   * // => false
   *
   * _.isArray('abc');
   * // => false
   *
   * _.isArray(_.noop);
   * // => false
   */
  var isArray$1 = Array.isArray;

  var isArray_1 = isArray$1;

  /**
   * This method returns `false`.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {boolean} Returns `false`.
   * @example
   *
   * _.times(2, _.stubFalse);
   * // => [false, false]
   */
  function stubFalse() {
    return false;
  }

  var stubFalse_1 = stubFalse;

  var isBuffer_1 = createCommonjsModule(function (module, exports) {
  /** Detect free variable `exports`. */
  var freeExports = exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Built-in value references. */
  var Buffer = moduleExports ? _root.Buffer : undefined;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

  /**
   * Checks if `value` is a buffer.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
   * @example
   *
   * _.isBuffer(new Buffer(2));
   * // => true
   *
   * _.isBuffer(new Uint8Array(2));
   * // => false
   */
  var isBuffer = nativeIsBuffer || stubFalse_1;

  module.exports = isBuffer;
  });

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER = 9007199254740991;

  /** Used to detect unsigned integer values. */
  var reIsUint = /^(?:0|[1-9]\d*)$/;

  /**
   * Checks if `value` is a valid array-like index.
   *
   * @private
   * @param {*} value The value to check.
   * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
   * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
   */
  function isIndex(value, length) {
    var type = typeof value;
    length = length == null ? MAX_SAFE_INTEGER : length;

    return !!length &&
      (type == 'number' ||
        (type != 'symbol' && reIsUint.test(value))) &&
          (value > -1 && value % 1 == 0 && value < length);
  }

  var _isIndex = isIndex;

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER$1 = 9007199254740991;

  /**
   * Checks if `value` is a valid array-like length.
   *
   * **Note:** This method is loosely based on
   * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
   * @example
   *
   * _.isLength(3);
   * // => true
   *
   * _.isLength(Number.MIN_VALUE);
   * // => false
   *
   * _.isLength(Infinity);
   * // => false
   *
   * _.isLength('3');
   * // => false
   */
  function isLength(value) {
    return typeof value == 'number' &&
      value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
  }

  var isLength_1 = isLength;

  /** `Object#toString` result references. */
  var argsTag$1 = '[object Arguments]',
      arrayTag = '[object Array]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      funcTag$1 = '[object Function]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      objectTag = '[object Object]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      weakMapTag = '[object WeakMap]';

  var arrayBufferTag = '[object ArrayBuffer]',
      dataViewTag = '[object DataView]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
  typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
  typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
  typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
  typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag$1] = typedArrayTags[arrayTag] =
  typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
  typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
  typedArrayTags[errorTag] = typedArrayTags[funcTag$1] =
  typedArrayTags[mapTag] = typedArrayTags[numberTag] =
  typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
  typedArrayTags[setTag] = typedArrayTags[stringTag] =
  typedArrayTags[weakMapTag] = false;

  /**
   * The base implementation of `_.isTypedArray` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   */
  function baseIsTypedArray(value) {
    return isObjectLike_1(value) &&
      isLength_1(value.length) && !!typedArrayTags[_baseGetTag(value)];
  }

  var _baseIsTypedArray = baseIsTypedArray;

  /**
   * The base implementation of `_.unary` without support for storing metadata.
   *
   * @private
   * @param {Function} func The function to cap arguments for.
   * @returns {Function} Returns the new capped function.
   */
  function baseUnary(func) {
    return function(value) {
      return func(value);
    };
  }

  var _baseUnary = baseUnary;

  var _nodeUtil = createCommonjsModule(function (module, exports) {
  /** Detect free variable `exports`. */
  var freeExports = exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Detect free variable `process` from Node.js. */
  var freeProcess = moduleExports && _freeGlobal.process;

  /** Used to access faster Node.js helpers. */
  var nodeUtil = (function() {
    try {
      // Use `util.types` for Node.js 10+.
      var types = freeModule && freeModule.require && freeModule.require('util').types;

      if (types) {
        return types;
      }

      // Legacy `process.binding('util')` for Node.js < 10.
      return freeProcess && freeProcess.binding && freeProcess.binding('util');
    } catch (e) {}
  }());

  module.exports = nodeUtil;
  });

  /* Node.js helper references. */
  var nodeIsTypedArray = _nodeUtil && _nodeUtil.isTypedArray;

  /**
   * Checks if `value` is classified as a typed array.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   * @example
   *
   * _.isTypedArray(new Uint8Array);
   * // => true
   *
   * _.isTypedArray([]);
   * // => false
   */
  var isTypedArray = nodeIsTypedArray ? _baseUnary(nodeIsTypedArray) : _baseIsTypedArray;

  var isTypedArray_1 = isTypedArray;

  /** Used for built-in method references. */
  var objectProto$7 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$8 = objectProto$7.hasOwnProperty;

  /**
   * Creates an array of the enumerable property names of the array-like `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @param {boolean} inherited Specify returning inherited property names.
   * @returns {Array} Returns the array of property names.
   */
  function arrayLikeKeys(value, inherited) {
    var isArr = isArray_1(value),
        isArg = !isArr && isArguments_1(value),
        isBuff = !isArr && !isArg && isBuffer_1(value),
        isType = !isArr && !isArg && !isBuff && isTypedArray_1(value),
        skipIndexes = isArr || isArg || isBuff || isType,
        result = skipIndexes ? _baseTimes(value.length, String) : [],
        length = result.length;

    for (var key in value) {
      if ((inherited || hasOwnProperty$8.call(value, key)) &&
          !(skipIndexes && (
             // Safari 9 has enumerable `arguments.length` in strict mode.
             key == 'length' ||
             // Node.js 0.10 has enumerable non-index properties on buffers.
             (isBuff && (key == 'offset' || key == 'parent')) ||
             // PhantomJS 2 has enumerable non-index properties on typed arrays.
             (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
             // Skip index properties.
             _isIndex(key, length)
          ))) {
        result.push(key);
      }
    }
    return result;
  }

  var _arrayLikeKeys = arrayLikeKeys;

  /** Used for built-in method references. */
  var objectProto$8 = Object.prototype;

  /**
   * Checks if `value` is likely a prototype object.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
   */
  function isPrototype(value) {
    var Ctor = value && value.constructor,
        proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$8;

    return value === proto;
  }

  var _isPrototype = isPrototype;

  /**
   * Creates a unary function that invokes `func` with its argument transformed.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {Function} transform The argument transform.
   * @returns {Function} Returns the new function.
   */
  function overArg(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }

  var _overArg = overArg;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeKeys = _overArg(Object.keys, Object);

  var _nativeKeys = nativeKeys;

  /** Used for built-in method references. */
  var objectProto$9 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$9 = objectProto$9.hasOwnProperty;

  /**
   * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeys(object) {
    if (!_isPrototype(object)) {
      return _nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty$9.call(object, key) && key != 'constructor') {
        result.push(key);
      }
    }
    return result;
  }

  var _baseKeys = baseKeys;

  /**
   * Checks if `value` is array-like. A value is considered array-like if it's
   * not a function and has a `value.length` that's an integer greater than or
   * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
   * @example
   *
   * _.isArrayLike([1, 2, 3]);
   * // => true
   *
   * _.isArrayLike(document.body.children);
   * // => true
   *
   * _.isArrayLike('abc');
   * // => true
   *
   * _.isArrayLike(_.noop);
   * // => false
   */
  function isArrayLike(value) {
    return value != null && isLength_1(value.length) && !isFunction_1(value);
  }

  var isArrayLike_1 = isArrayLike;

  /**
   * Creates an array of the own enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects. See the
   * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * for more details.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keys(new Foo);
   * // => ['a', 'b'] (iteration order is not guaranteed)
   *
   * _.keys('hi');
   * // => ['0', '1']
   */
  function keys$1(object) {
    return isArrayLike_1(object) ? _arrayLikeKeys(object) : _baseKeys(object);
  }

  var keys_1 = keys$1;

  /**
   * The base implementation of `_.assign` without support for multiple sources
   * or `customizer` functions.
   *
   * @private
   * @param {Object} object The destination object.
   * @param {Object} source The source object.
   * @returns {Object} Returns `object`.
   */
  function baseAssign(object, source) {
    return object && _copyObject(source, keys_1(source), object);
  }

  var _baseAssign = baseAssign;

  /**
   * This function is like
   * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * except that it includes inherited enumerable properties.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function nativeKeysIn(object) {
    var result = [];
    if (object != null) {
      for (var key in Object(object)) {
        result.push(key);
      }
    }
    return result;
  }

  var _nativeKeysIn = nativeKeysIn;

  /** Used for built-in method references. */
  var objectProto$a = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$a = objectProto$a.hasOwnProperty;

  /**
   * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeysIn(object) {
    if (!isObject_1(object)) {
      return _nativeKeysIn(object);
    }
    var isProto = _isPrototype(object),
        result = [];

    for (var key in object) {
      if (!(key == 'constructor' && (isProto || !hasOwnProperty$a.call(object, key)))) {
        result.push(key);
      }
    }
    return result;
  }

  var _baseKeysIn = baseKeysIn;

  /**
   * Creates an array of the own and inherited enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keysIn(new Foo);
   * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
   */
  function keysIn$1(object) {
    return isArrayLike_1(object) ? _arrayLikeKeys(object, true) : _baseKeysIn(object);
  }

  var keysIn_1 = keysIn$1;

  /**
   * The base implementation of `_.assignIn` without support for multiple sources
   * or `customizer` functions.
   *
   * @private
   * @param {Object} object The destination object.
   * @param {Object} source The source object.
   * @returns {Object} Returns `object`.
   */
  function baseAssignIn(object, source) {
    return object && _copyObject(source, keysIn_1(source), object);
  }

  var _baseAssignIn = baseAssignIn;

  var _cloneBuffer = createCommonjsModule(function (module, exports) {
  /** Detect free variable `exports`. */
  var freeExports = exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Built-in value references. */
  var Buffer = moduleExports ? _root.Buffer : undefined,
      allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;

  /**
   * Creates a clone of  `buffer`.
   *
   * @private
   * @param {Buffer} buffer The buffer to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Buffer} Returns the cloned buffer.
   */
  function cloneBuffer(buffer, isDeep) {
    if (isDeep) {
      return buffer.slice();
    }
    var length = buffer.length,
        result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

    buffer.copy(result);
    return result;
  }

  module.exports = cloneBuffer;
  });

  /**
   * Copies the values of `source` to `array`.
   *
   * @private
   * @param {Array} source The array to copy values from.
   * @param {Array} [array=[]] The array to copy values to.
   * @returns {Array} Returns `array`.
   */
  function copyArray(source, array) {
    var index = -1,
        length = source.length;

    array || (array = Array(length));
    while (++index < length) {
      array[index] = source[index];
    }
    return array;
  }

  var _copyArray = copyArray;

  /**
   * A specialized version of `_.filter` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {Array} Returns the new filtered array.
   */
  function arrayFilter(array, predicate) {
    var index = -1,
        length = array == null ? 0 : array.length,
        resIndex = 0,
        result = [];

    while (++index < length) {
      var value = array[index];
      if (predicate(value, index, array)) {
        result[resIndex++] = value;
      }
    }
    return result;
  }

  var _arrayFilter = arrayFilter;

  /**
   * This method returns a new empty array.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {Array} Returns the new empty array.
   * @example
   *
   * var arrays = _.times(2, _.stubArray);
   *
   * console.log(arrays);
   * // => [[], []]
   *
   * console.log(arrays[0] === arrays[1]);
   * // => false
   */
  function stubArray() {
    return [];
  }

  var stubArray_1 = stubArray;

  /** Used for built-in method references. */
  var objectProto$b = Object.prototype;

  /** Built-in value references. */
  var propertyIsEnumerable$1 = objectProto$b.propertyIsEnumerable;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeGetSymbols = Object.getOwnPropertySymbols;

  /**
   * Creates an array of the own enumerable symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of symbols.
   */
  var getSymbols = !nativeGetSymbols ? stubArray_1 : function(object) {
    if (object == null) {
      return [];
    }
    object = Object(object);
    return _arrayFilter(nativeGetSymbols(object), function(symbol) {
      return propertyIsEnumerable$1.call(object, symbol);
    });
  };

  var _getSymbols = getSymbols;

  /**
   * Copies own symbols of `source` to `object`.
   *
   * @private
   * @param {Object} source The object to copy symbols from.
   * @param {Object} [object={}] The object to copy symbols to.
   * @returns {Object} Returns `object`.
   */
  function copySymbols(source, object) {
    return _copyObject(source, _getSymbols(source), object);
  }

  var _copySymbols = copySymbols;

  /**
   * Appends the elements of `values` to `array`.
   *
   * @private
   * @param {Array} array The array to modify.
   * @param {Array} values The values to append.
   * @returns {Array} Returns `array`.
   */
  function arrayPush(array, values) {
    var index = -1,
        length = values.length,
        offset = array.length;

    while (++index < length) {
      array[offset + index] = values[index];
    }
    return array;
  }

  var _arrayPush = arrayPush;

  /** Built-in value references. */
  var getPrototype = _overArg(Object.getPrototypeOf, Object);

  var _getPrototype = getPrototype;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeGetSymbols$1 = Object.getOwnPropertySymbols;

  /**
   * Creates an array of the own and inherited enumerable symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of symbols.
   */
  var getSymbolsIn = !nativeGetSymbols$1 ? stubArray_1 : function(object) {
    var result = [];
    while (object) {
      _arrayPush(result, _getSymbols(object));
      object = _getPrototype(object);
    }
    return result;
  };

  var _getSymbolsIn = getSymbolsIn;

  /**
   * Copies own and inherited symbols of `source` to `object`.
   *
   * @private
   * @param {Object} source The object to copy symbols from.
   * @param {Object} [object={}] The object to copy symbols to.
   * @returns {Object} Returns `object`.
   */
  function copySymbolsIn(source, object) {
    return _copyObject(source, _getSymbolsIn(source), object);
  }

  var _copySymbolsIn = copySymbolsIn;

  /**
   * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
   * `keysFunc` and `symbolsFunc` to get the enumerable property names and
   * symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Function} keysFunc The function to get the keys of `object`.
   * @param {Function} symbolsFunc The function to get the symbols of `object`.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function baseGetAllKeys(object, keysFunc, symbolsFunc) {
    var result = keysFunc(object);
    return isArray_1(object) ? result : _arrayPush(result, symbolsFunc(object));
  }

  var _baseGetAllKeys = baseGetAllKeys;

  /**
   * Creates an array of own enumerable property names and symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function getAllKeys(object) {
    return _baseGetAllKeys(object, keys_1, _getSymbols);
  }

  var _getAllKeys = getAllKeys;

  /**
   * Creates an array of own and inherited enumerable property names and
   * symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function getAllKeysIn(object) {
    return _baseGetAllKeys(object, keysIn_1, _getSymbolsIn);
  }

  var _getAllKeysIn = getAllKeysIn;

  /* Built-in method references that are verified to be native. */
  var DataView = _getNative(_root, 'DataView');

  var _DataView = DataView;

  /* Built-in method references that are verified to be native. */
  var Promise$1 = _getNative(_root, 'Promise');

  var _Promise = Promise$1;

  /* Built-in method references that are verified to be native. */
  var Set$1 = _getNative(_root, 'Set');

  var _Set = Set$1;

  /* Built-in method references that are verified to be native. */
  var WeakMap$2 = _getNative(_root, 'WeakMap');

  var _WeakMap = WeakMap$2;

  /** `Object#toString` result references. */
  var mapTag$1 = '[object Map]',
      objectTag$1 = '[object Object]',
      promiseTag = '[object Promise]',
      setTag$1 = '[object Set]',
      weakMapTag$1 = '[object WeakMap]';

  var dataViewTag$1 = '[object DataView]';

  /** Used to detect maps, sets, and weakmaps. */
  var dataViewCtorString = _toSource(_DataView),
      mapCtorString = _toSource(_Map),
      promiseCtorString = _toSource(_Promise),
      setCtorString = _toSource(_Set),
      weakMapCtorString = _toSource(_WeakMap);

  /**
   * Gets the `toStringTag` of `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  var getTag = _baseGetTag;

  // Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
  if ((_DataView && getTag(new _DataView(new ArrayBuffer(1))) != dataViewTag$1) ||
      (_Map && getTag(new _Map) != mapTag$1) ||
      (_Promise && getTag(_Promise.resolve()) != promiseTag) ||
      (_Set && getTag(new _Set) != setTag$1) ||
      (_WeakMap && getTag(new _WeakMap) != weakMapTag$1)) {
    getTag = function(value) {
      var result = _baseGetTag(value),
          Ctor = result == objectTag$1 ? value.constructor : undefined,
          ctorString = Ctor ? _toSource(Ctor) : '';

      if (ctorString) {
        switch (ctorString) {
          case dataViewCtorString: return dataViewTag$1;
          case mapCtorString: return mapTag$1;
          case promiseCtorString: return promiseTag;
          case setCtorString: return setTag$1;
          case weakMapCtorString: return weakMapTag$1;
        }
      }
      return result;
    };
  }

  var _getTag = getTag;

  /** Used for built-in method references. */
  var objectProto$c = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$b = objectProto$c.hasOwnProperty;

  /**
   * Initializes an array clone.
   *
   * @private
   * @param {Array} array The array to clone.
   * @returns {Array} Returns the initialized clone.
   */
  function initCloneArray(array) {
    var length = array.length,
        result = new array.constructor(length);

    // Add properties assigned by `RegExp#exec`.
    if (length && typeof array[0] == 'string' && hasOwnProperty$b.call(array, 'index')) {
      result.index = array.index;
      result.input = array.input;
    }
    return result;
  }

  var _initCloneArray = initCloneArray;

  /** Built-in value references. */
  var Uint8Array = _root.Uint8Array;

  var _Uint8Array = Uint8Array;

  /**
   * Creates a clone of `arrayBuffer`.
   *
   * @private
   * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
   * @returns {ArrayBuffer} Returns the cloned array buffer.
   */
  function cloneArrayBuffer(arrayBuffer) {
    var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
    new _Uint8Array(result).set(new _Uint8Array(arrayBuffer));
    return result;
  }

  var _cloneArrayBuffer = cloneArrayBuffer;

  /**
   * Creates a clone of `dataView`.
   *
   * @private
   * @param {Object} dataView The data view to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the cloned data view.
   */
  function cloneDataView(dataView, isDeep) {
    var buffer = isDeep ? _cloneArrayBuffer(dataView.buffer) : dataView.buffer;
    return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
  }

  var _cloneDataView = cloneDataView;

  /** Used to match `RegExp` flags from their coerced string values. */
  var reFlags = /\w*$/;

  /**
   * Creates a clone of `regexp`.
   *
   * @private
   * @param {Object} regexp The regexp to clone.
   * @returns {Object} Returns the cloned regexp.
   */
  function cloneRegExp(regexp) {
    var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
    result.lastIndex = regexp.lastIndex;
    return result;
  }

  var _cloneRegExp = cloneRegExp;

  /** Used to convert symbols to primitives and strings. */
  var symbolProto = _Symbol ? _Symbol.prototype : undefined,
      symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

  /**
   * Creates a clone of the `symbol` object.
   *
   * @private
   * @param {Object} symbol The symbol object to clone.
   * @returns {Object} Returns the cloned symbol object.
   */
  function cloneSymbol(symbol) {
    return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
  }

  var _cloneSymbol = cloneSymbol;

  /**
   * Creates a clone of `typedArray`.
   *
   * @private
   * @param {Object} typedArray The typed array to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the cloned typed array.
   */
  function cloneTypedArray(typedArray, isDeep) {
    var buffer = isDeep ? _cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
    return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
  }

  var _cloneTypedArray = cloneTypedArray;

  /** `Object#toString` result references. */
  var boolTag$1 = '[object Boolean]',
      dateTag$1 = '[object Date]',
      mapTag$2 = '[object Map]',
      numberTag$1 = '[object Number]',
      regexpTag$1 = '[object RegExp]',
      setTag$2 = '[object Set]',
      stringTag$1 = '[object String]',
      symbolTag = '[object Symbol]';

  var arrayBufferTag$1 = '[object ArrayBuffer]',
      dataViewTag$2 = '[object DataView]',
      float32Tag$1 = '[object Float32Array]',
      float64Tag$1 = '[object Float64Array]',
      int8Tag$1 = '[object Int8Array]',
      int16Tag$1 = '[object Int16Array]',
      int32Tag$1 = '[object Int32Array]',
      uint8Tag$1 = '[object Uint8Array]',
      uint8ClampedTag$1 = '[object Uint8ClampedArray]',
      uint16Tag$1 = '[object Uint16Array]',
      uint32Tag$1 = '[object Uint32Array]';

  /**
   * Initializes an object clone based on its `toStringTag`.
   *
   * **Note:** This function only supports cloning values with tags of
   * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
   *
   * @private
   * @param {Object} object The object to clone.
   * @param {string} tag The `toStringTag` of the object to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the initialized clone.
   */
  function initCloneByTag(object, tag, isDeep) {
    var Ctor = object.constructor;
    switch (tag) {
      case arrayBufferTag$1:
        return _cloneArrayBuffer(object);

      case boolTag$1:
      case dateTag$1:
        return new Ctor(+object);

      case dataViewTag$2:
        return _cloneDataView(object, isDeep);

      case float32Tag$1: case float64Tag$1:
      case int8Tag$1: case int16Tag$1: case int32Tag$1:
      case uint8Tag$1: case uint8ClampedTag$1: case uint16Tag$1: case uint32Tag$1:
        return _cloneTypedArray(object, isDeep);

      case mapTag$2:
        return new Ctor;

      case numberTag$1:
      case stringTag$1:
        return new Ctor(object);

      case regexpTag$1:
        return _cloneRegExp(object);

      case setTag$2:
        return new Ctor;

      case symbolTag:
        return _cloneSymbol(object);
    }
  }

  var _initCloneByTag = initCloneByTag;

  /** Built-in value references. */
  var objectCreate = Object.create;

  /**
   * The base implementation of `_.create` without support for assigning
   * properties to the created object.
   *
   * @private
   * @param {Object} proto The object to inherit from.
   * @returns {Object} Returns the new object.
   */
  var baseCreate = (function() {
    function object() {}
    return function(proto) {
      if (!isObject_1(proto)) {
        return {};
      }
      if (objectCreate) {
        return objectCreate(proto);
      }
      object.prototype = proto;
      var result = new object;
      object.prototype = undefined;
      return result;
    };
  }());

  var _baseCreate = baseCreate;

  /**
   * Initializes an object clone.
   *
   * @private
   * @param {Object} object The object to clone.
   * @returns {Object} Returns the initialized clone.
   */
  function initCloneObject(object) {
    return (typeof object.constructor == 'function' && !_isPrototype(object))
      ? _baseCreate(_getPrototype(object))
      : {};
  }

  var _initCloneObject = initCloneObject;

  /** `Object#toString` result references. */
  var mapTag$3 = '[object Map]';

  /**
   * The base implementation of `_.isMap` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a map, else `false`.
   */
  function baseIsMap(value) {
    return isObjectLike_1(value) && _getTag(value) == mapTag$3;
  }

  var _baseIsMap = baseIsMap;

  /* Node.js helper references. */
  var nodeIsMap = _nodeUtil && _nodeUtil.isMap;

  /**
   * Checks if `value` is classified as a `Map` object.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a map, else `false`.
   * @example
   *
   * _.isMap(new Map);
   * // => true
   *
   * _.isMap(new WeakMap);
   * // => false
   */
  var isMap = nodeIsMap ? _baseUnary(nodeIsMap) : _baseIsMap;

  var isMap_1 = isMap;

  /** `Object#toString` result references. */
  var setTag$3 = '[object Set]';

  /**
   * The base implementation of `_.isSet` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a set, else `false`.
   */
  function baseIsSet(value) {
    return isObjectLike_1(value) && _getTag(value) == setTag$3;
  }

  var _baseIsSet = baseIsSet;

  /* Node.js helper references. */
  var nodeIsSet = _nodeUtil && _nodeUtil.isSet;

  /**
   * Checks if `value` is classified as a `Set` object.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a set, else `false`.
   * @example
   *
   * _.isSet(new Set);
   * // => true
   *
   * _.isSet(new WeakSet);
   * // => false
   */
  var isSet = nodeIsSet ? _baseUnary(nodeIsSet) : _baseIsSet;

  var isSet_1 = isSet;

  /** Used to compose bitmasks for cloning. */
  var CLONE_DEEP_FLAG = 1,
      CLONE_FLAT_FLAG = 2,
      CLONE_SYMBOLS_FLAG = 4;

  /** `Object#toString` result references. */
  var argsTag$2 = '[object Arguments]',
      arrayTag$1 = '[object Array]',
      boolTag$2 = '[object Boolean]',
      dateTag$2 = '[object Date]',
      errorTag$1 = '[object Error]',
      funcTag$2 = '[object Function]',
      genTag$1 = '[object GeneratorFunction]',
      mapTag$4 = '[object Map]',
      numberTag$2 = '[object Number]',
      objectTag$2 = '[object Object]',
      regexpTag$2 = '[object RegExp]',
      setTag$4 = '[object Set]',
      stringTag$2 = '[object String]',
      symbolTag$1 = '[object Symbol]',
      weakMapTag$2 = '[object WeakMap]';

  var arrayBufferTag$2 = '[object ArrayBuffer]',
      dataViewTag$3 = '[object DataView]',
      float32Tag$2 = '[object Float32Array]',
      float64Tag$2 = '[object Float64Array]',
      int8Tag$2 = '[object Int8Array]',
      int16Tag$2 = '[object Int16Array]',
      int32Tag$2 = '[object Int32Array]',
      uint8Tag$2 = '[object Uint8Array]',
      uint8ClampedTag$2 = '[object Uint8ClampedArray]',
      uint16Tag$2 = '[object Uint16Array]',
      uint32Tag$2 = '[object Uint32Array]';

  /** Used to identify `toStringTag` values supported by `_.clone`. */
  var cloneableTags = {};
  cloneableTags[argsTag$2] = cloneableTags[arrayTag$1] =
  cloneableTags[arrayBufferTag$2] = cloneableTags[dataViewTag$3] =
  cloneableTags[boolTag$2] = cloneableTags[dateTag$2] =
  cloneableTags[float32Tag$2] = cloneableTags[float64Tag$2] =
  cloneableTags[int8Tag$2] = cloneableTags[int16Tag$2] =
  cloneableTags[int32Tag$2] = cloneableTags[mapTag$4] =
  cloneableTags[numberTag$2] = cloneableTags[objectTag$2] =
  cloneableTags[regexpTag$2] = cloneableTags[setTag$4] =
  cloneableTags[stringTag$2] = cloneableTags[symbolTag$1] =
  cloneableTags[uint8Tag$2] = cloneableTags[uint8ClampedTag$2] =
  cloneableTags[uint16Tag$2] = cloneableTags[uint32Tag$2] = true;
  cloneableTags[errorTag$1] = cloneableTags[funcTag$2] =
  cloneableTags[weakMapTag$2] = false;

  /**
   * The base implementation of `_.clone` and `_.cloneDeep` which tracks
   * traversed objects.
   *
   * @private
   * @param {*} value The value to clone.
   * @param {boolean} bitmask The bitmask flags.
   *  1 - Deep clone
   *  2 - Flatten inherited properties
   *  4 - Clone symbols
   * @param {Function} [customizer] The function to customize cloning.
   * @param {string} [key] The key of `value`.
   * @param {Object} [object] The parent object of `value`.
   * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
   * @returns {*} Returns the cloned value.
   */
  function baseClone(value, bitmask, customizer, key, object, stack) {
    var result,
        isDeep = bitmask & CLONE_DEEP_FLAG,
        isFlat = bitmask & CLONE_FLAT_FLAG,
        isFull = bitmask & CLONE_SYMBOLS_FLAG;

    if (customizer) {
      result = object ? customizer(value, key, object, stack) : customizer(value);
    }
    if (result !== undefined) {
      return result;
    }
    if (!isObject_1(value)) {
      return value;
    }
    var isArr = isArray_1(value);
    if (isArr) {
      result = _initCloneArray(value);
      if (!isDeep) {
        return _copyArray(value, result);
      }
    } else {
      var tag = _getTag(value),
          isFunc = tag == funcTag$2 || tag == genTag$1;

      if (isBuffer_1(value)) {
        return _cloneBuffer(value, isDeep);
      }
      if (tag == objectTag$2 || tag == argsTag$2 || (isFunc && !object)) {
        result = (isFlat || isFunc) ? {} : _initCloneObject(value);
        if (!isDeep) {
          return isFlat
            ? _copySymbolsIn(value, _baseAssignIn(result, value))
            : _copySymbols(value, _baseAssign(result, value));
        }
      } else {
        if (!cloneableTags[tag]) {
          return object ? value : {};
        }
        result = _initCloneByTag(value, tag, isDeep);
      }
    }
    // Check for circular references and return its corresponding clone.
    stack || (stack = new _Stack);
    var stacked = stack.get(value);
    if (stacked) {
      return stacked;
    }
    stack.set(value, result);

    if (isSet_1(value)) {
      value.forEach(function(subValue) {
        result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
      });

      return result;
    }

    if (isMap_1(value)) {
      value.forEach(function(subValue, key) {
        result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
      });

      return result;
    }

    var keysFunc = isFull
      ? (isFlat ? _getAllKeysIn : _getAllKeys)
      : (isFlat ? keysIn : keys_1);

    var props = isArr ? undefined : keysFunc(value);
    _arrayEach(props || value, function(subValue, key) {
      if (props) {
        key = subValue;
        subValue = value[key];
      }
      // Recursively populate clone (susceptible to call stack limits).
      _assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
    });
    return result;
  }

  var _baseClone = baseClone;

  /** `Object#toString` result references. */
  var symbolTag$2 = '[object Symbol]';

  /**
   * Checks if `value` is classified as a `Symbol` primitive or object.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
   * @example
   *
   * _.isSymbol(Symbol.iterator);
   * // => true
   *
   * _.isSymbol('abc');
   * // => false
   */
  function isSymbol(value) {
    return typeof value == 'symbol' ||
      (isObjectLike_1(value) && _baseGetTag(value) == symbolTag$2);
  }

  var isSymbol_1 = isSymbol;

  /** Used to match property names within property paths. */
  var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
      reIsPlainProp = /^\w*$/;

  /**
   * Checks if `value` is a property name and not a property path.
   *
   * @private
   * @param {*} value The value to check.
   * @param {Object} [object] The object to query keys on.
   * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
   */
  function isKey(value, object) {
    if (isArray_1(value)) {
      return false;
    }
    var type = typeof value;
    if (type == 'number' || type == 'symbol' || type == 'boolean' ||
        value == null || isSymbol_1(value)) {
      return true;
    }
    return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
      (object != null && value in Object(object));
  }

  var _isKey = isKey;

  /** Error message constants. */
  var FUNC_ERROR_TEXT = 'Expected a function';

  /**
   * Creates a function that memoizes the result of `func`. If `resolver` is
   * provided, it determines the cache key for storing the result based on the
   * arguments provided to the memoized function. By default, the first argument
   * provided to the memoized function is used as the map cache key. The `func`
   * is invoked with the `this` binding of the memoized function.
   *
   * **Note:** The cache is exposed as the `cache` property on the memoized
   * function. Its creation may be customized by replacing the `_.memoize.Cache`
   * constructor with one whose instances implement the
   * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
   * method interface of `clear`, `delete`, `get`, `has`, and `set`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Function
   * @param {Function} func The function to have its output memoized.
   * @param {Function} [resolver] The function to resolve the cache key.
   * @returns {Function} Returns the new memoized function.
   * @example
   *
   * var object = { 'a': 1, 'b': 2 };
   * var other = { 'c': 3, 'd': 4 };
   *
   * var values = _.memoize(_.values);
   * values(object);
   * // => [1, 2]
   *
   * values(other);
   * // => [3, 4]
   *
   * object.a = 2;
   * values(object);
   * // => [1, 2]
   *
   * // Modify the result cache.
   * values.cache.set(object, ['a', 'b']);
   * values(object);
   * // => ['a', 'b']
   *
   * // Replace `_.memoize.Cache`.
   * _.memoize.Cache = WeakMap;
   */
  function memoize(func, resolver) {
    if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    var memoized = function() {
      var args = arguments,
          key = resolver ? resolver.apply(this, args) : args[0],
          cache = memoized.cache;

      if (cache.has(key)) {
        return cache.get(key);
      }
      var result = func.apply(this, args);
      memoized.cache = cache.set(key, result) || cache;
      return result;
    };
    memoized.cache = new (memoize.Cache || _MapCache);
    return memoized;
  }

  // Expose `MapCache`.
  memoize.Cache = _MapCache;

  var memoize_1 = memoize;

  /** Used as the maximum memoize cache size. */
  var MAX_MEMOIZE_SIZE = 500;

  /**
   * A specialized version of `_.memoize` which clears the memoized function's
   * cache when it exceeds `MAX_MEMOIZE_SIZE`.
   *
   * @private
   * @param {Function} func The function to have its output memoized.
   * @returns {Function} Returns the new memoized function.
   */
  function memoizeCapped(func) {
    var result = memoize_1(func, function(key) {
      if (cache.size === MAX_MEMOIZE_SIZE) {
        cache.clear();
      }
      return key;
    });

    var cache = result.cache;
    return result;
  }

  var _memoizeCapped = memoizeCapped;

  /** Used to match property names within property paths. */
  var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

  /** Used to match backslashes in property paths. */
  var reEscapeChar = /\\(\\)?/g;

  /**
   * Converts `string` to a property path array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the property path array.
   */
  var stringToPath = _memoizeCapped(function(string) {
    var result = [];
    if (string.charCodeAt(0) === 46 /* . */) {
      result.push('');
    }
    string.replace(rePropName, function(match, number, quote, subString) {
      result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
    });
    return result;
  });

  var _stringToPath = stringToPath;

  /** Used as references for various `Number` constants. */
  var INFINITY = 1 / 0;

  /** Used to convert symbols to primitives and strings. */
  var symbolProto$1 = _Symbol ? _Symbol.prototype : undefined,
      symbolToString = symbolProto$1 ? symbolProto$1.toString : undefined;

  /**
   * The base implementation of `_.toString` which doesn't convert nullish
   * values to empty strings.
   *
   * @private
   * @param {*} value The value to process.
   * @returns {string} Returns the string.
   */
  function baseToString(value) {
    // Exit early for strings to avoid a performance hit in some environments.
    if (typeof value == 'string') {
      return value;
    }
    if (isArray_1(value)) {
      // Recursively convert values (susceptible to call stack limits).
      return _arrayMap(value, baseToString) + '';
    }
    if (isSymbol_1(value)) {
      return symbolToString ? symbolToString.call(value) : '';
    }
    var result = (value + '');
    return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
  }

  var _baseToString = baseToString;

  /**
   * Converts `value` to a string. An empty string is returned for `null`
   * and `undefined` values. The sign of `-0` is preserved.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   * @example
   *
   * _.toString(null);
   * // => ''
   *
   * _.toString(-0);
   * // => '-0'
   *
   * _.toString([1, 2, 3]);
   * // => '1,2,3'
   */
  function toString$1(value) {
    return value == null ? '' : _baseToString(value);
  }

  var toString_1 = toString$1;

  /**
   * Casts `value` to a path array if it's not one.
   *
   * @private
   * @param {*} value The value to inspect.
   * @param {Object} [object] The object to query keys on.
   * @returns {Array} Returns the cast property path array.
   */
  function castPath(value, object) {
    if (isArray_1(value)) {
      return value;
    }
    return _isKey(value, object) ? [value] : _stringToPath(toString_1(value));
  }

  var _castPath = castPath;

  /**
   * Gets the last element of `array`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Array
   * @param {Array} array The array to query.
   * @returns {*} Returns the last element of `array`.
   * @example
   *
   * _.last([1, 2, 3]);
   * // => 3
   */
  function last(array) {
    var length = array == null ? 0 : array.length;
    return length ? array[length - 1] : undefined;
  }

  var last_1 = last;

  /** Used as references for various `Number` constants. */
  var INFINITY$1 = 1 / 0;

  /**
   * Converts `value` to a string key if it's not a string or symbol.
   *
   * @private
   * @param {*} value The value to inspect.
   * @returns {string|symbol} Returns the key.
   */
  function toKey(value) {
    if (typeof value == 'string' || isSymbol_1(value)) {
      return value;
    }
    var result = (value + '');
    return (result == '0' && (1 / value) == -INFINITY$1) ? '-0' : result;
  }

  var _toKey = toKey;

  /**
   * The base implementation of `_.get` without support for default values.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to get.
   * @returns {*} Returns the resolved value.
   */
  function baseGet(object, path) {
    path = _castPath(path, object);

    var index = 0,
        length = path.length;

    while (object != null && index < length) {
      object = object[_toKey(path[index++])];
    }
    return (index && index == length) ? object : undefined;
  }

  var _baseGet = baseGet;

  /**
   * The base implementation of `_.slice` without an iteratee call guard.
   *
   * @private
   * @param {Array} array The array to slice.
   * @param {number} [start=0] The start position.
   * @param {number} [end=array.length] The end position.
   * @returns {Array} Returns the slice of `array`.
   */
  function baseSlice(array, start, end) {
    var index = -1,
        length = array.length;

    if (start < 0) {
      start = -start > length ? 0 : (length + start);
    }
    end = end > length ? length : end;
    if (end < 0) {
      end += length;
    }
    length = start > end ? 0 : ((end - start) >>> 0);
    start >>>= 0;

    var result = Array(length);
    while (++index < length) {
      result[index] = array[index + start];
    }
    return result;
  }

  var _baseSlice = baseSlice;

  /**
   * Gets the parent value at `path` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array} path The path to get the parent value of.
   * @returns {*} Returns the parent value.
   */
  function parent(object, path) {
    return path.length < 2 ? object : _baseGet(object, _baseSlice(path, 0, -1));
  }

  var _parent = parent;

  /**
   * The base implementation of `_.unset`.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {Array|string} path The property path to unset.
   * @returns {boolean} Returns `true` if the property is deleted, else `false`.
   */
  function baseUnset(object, path) {
    path = _castPath(path, object);
    object = _parent(object, path);
    return object == null || delete object[_toKey(last_1(path))];
  }

  var _baseUnset = baseUnset;

  /** `Object#toString` result references. */
  var objectTag$3 = '[object Object]';

  /** Used for built-in method references. */
  var funcProto$2 = Function.prototype,
      objectProto$d = Object.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString$2 = funcProto$2.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty$c = objectProto$d.hasOwnProperty;

  /** Used to infer the `Object` constructor. */
  var objectCtorString = funcToString$2.call(Object);

  /**
   * Checks if `value` is a plain object, that is, an object created by the
   * `Object` constructor or one with a `[[Prototype]]` of `null`.
   *
   * @static
   * @memberOf _
   * @since 0.8.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   * }
   *
   * _.isPlainObject(new Foo);
   * // => false
   *
   * _.isPlainObject([1, 2, 3]);
   * // => false
   *
   * _.isPlainObject({ 'x': 0, 'y': 0 });
   * // => true
   *
   * _.isPlainObject(Object.create(null));
   * // => true
   */
  function isPlainObject(value) {
    if (!isObjectLike_1(value) || _baseGetTag(value) != objectTag$3) {
      return false;
    }
    var proto = _getPrototype(value);
    if (proto === null) {
      return true;
    }
    var Ctor = hasOwnProperty$c.call(proto, 'constructor') && proto.constructor;
    return typeof Ctor == 'function' && Ctor instanceof Ctor &&
      funcToString$2.call(Ctor) == objectCtorString;
  }

  var isPlainObject_1 = isPlainObject;

  /**
   * Used by `_.omit` to customize its `_.cloneDeep` use to only clone plain
   * objects.
   *
   * @private
   * @param {*} value The value to inspect.
   * @param {string} key The key of the property to inspect.
   * @returns {*} Returns the uncloned value or `undefined` to defer cloning to `_.cloneDeep`.
   */
  function customOmitClone(value) {
    return isPlainObject_1(value) ? undefined : value;
  }

  var _customOmitClone = customOmitClone;

  /** Built-in value references. */
  var spreadableSymbol = _Symbol ? _Symbol.isConcatSpreadable : undefined;

  /**
   * Checks if `value` is a flattenable `arguments` object or array.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
   */
  function isFlattenable(value) {
    return isArray_1(value) || isArguments_1(value) ||
      !!(spreadableSymbol && value && value[spreadableSymbol]);
  }

  var _isFlattenable = isFlattenable;

  /**
   * The base implementation of `_.flatten` with support for restricting flattening.
   *
   * @private
   * @param {Array} array The array to flatten.
   * @param {number} depth The maximum recursion depth.
   * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
   * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
   * @param {Array} [result=[]] The initial result value.
   * @returns {Array} Returns the new flattened array.
   */
  function baseFlatten(array, depth, predicate, isStrict, result) {
    var index = -1,
        length = array.length;

    predicate || (predicate = _isFlattenable);
    result || (result = []);

    while (++index < length) {
      var value = array[index];
      if (depth > 0 && predicate(value)) {
        if (depth > 1) {
          // Recursively flatten arrays (susceptible to call stack limits).
          baseFlatten(value, depth - 1, predicate, isStrict, result);
        } else {
          _arrayPush(result, value);
        }
      } else if (!isStrict) {
        result[result.length] = value;
      }
    }
    return result;
  }

  var _baseFlatten = baseFlatten;

  /**
   * Flattens `array` a single level deep.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Array
   * @param {Array} array The array to flatten.
   * @returns {Array} Returns the new flattened array.
   * @example
   *
   * _.flatten([1, [2, [3, [4]], 5]]);
   * // => [1, 2, [3, [4]], 5]
   */
  function flatten(array) {
    var length = array == null ? 0 : array.length;
    return length ? _baseFlatten(array, 1) : [];
  }

  var flatten_1 = flatten;

  /**
   * A faster alternative to `Function#apply`, this function invokes `func`
   * with the `this` binding of `thisArg` and the arguments of `args`.
   *
   * @private
   * @param {Function} func The function to invoke.
   * @param {*} thisArg The `this` binding of `func`.
   * @param {Array} args The arguments to invoke `func` with.
   * @returns {*} Returns the result of `func`.
   */
  function apply(func, thisArg, args) {
    switch (args.length) {
      case 0: return func.call(thisArg);
      case 1: return func.call(thisArg, args[0]);
      case 2: return func.call(thisArg, args[0], args[1]);
      case 3: return func.call(thisArg, args[0], args[1], args[2]);
    }
    return func.apply(thisArg, args);
  }

  var _apply = apply;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeMax = Math.max;

  /**
   * A specialized version of `baseRest` which transforms the rest array.
   *
   * @private
   * @param {Function} func The function to apply a rest parameter to.
   * @param {number} [start=func.length-1] The start position of the rest parameter.
   * @param {Function} transform The rest array transform.
   * @returns {Function} Returns the new function.
   */
  function overRest(func, start, transform) {
    start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
    return function() {
      var args = arguments,
          index = -1,
          length = nativeMax(args.length - start, 0),
          array = Array(length);

      while (++index < length) {
        array[index] = args[start + index];
      }
      index = -1;
      var otherArgs = Array(start + 1);
      while (++index < start) {
        otherArgs[index] = args[index];
      }
      otherArgs[start] = transform(array);
      return _apply(func, this, otherArgs);
    };
  }

  var _overRest = overRest;

  /**
   * Creates a function that returns `value`.
   *
   * @static
   * @memberOf _
   * @since 2.4.0
   * @category Util
   * @param {*} value The value to return from the new function.
   * @returns {Function} Returns the new constant function.
   * @example
   *
   * var objects = _.times(2, _.constant({ 'a': 1 }));
   *
   * console.log(objects);
   * // => [{ 'a': 1 }, { 'a': 1 }]
   *
   * console.log(objects[0] === objects[1]);
   * // => true
   */
  function constant(value) {
    return function() {
      return value;
    };
  }

  var constant_1 = constant;

  /**
   * This method returns the first argument it receives.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Util
   * @param {*} value Any value.
   * @returns {*} Returns `value`.
   * @example
   *
   * var object = { 'a': 1 };
   *
   * console.log(_.identity(object) === object);
   * // => true
   */
  function identity$1(value) {
    return value;
  }

  var identity_1 = identity$1;

  /**
   * The base implementation of `setToString` without support for hot loop shorting.
   *
   * @private
   * @param {Function} func The function to modify.
   * @param {Function} string The `toString` result.
   * @returns {Function} Returns `func`.
   */
  var baseSetToString = !_defineProperty ? identity_1 : function(func, string) {
    return _defineProperty(func, 'toString', {
      'configurable': true,
      'enumerable': false,
      'value': constant_1(string),
      'writable': true
    });
  };

  var _baseSetToString = baseSetToString;

  /** Used to detect hot functions by number of calls within a span of milliseconds. */
  var HOT_COUNT = 800,
      HOT_SPAN = 16;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeNow = Date.now;

  /**
   * Creates a function that'll short out and invoke `identity` instead
   * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
   * milliseconds.
   *
   * @private
   * @param {Function} func The function to restrict.
   * @returns {Function} Returns the new shortable function.
   */
  function shortOut(func) {
    var count = 0,
        lastCalled = 0;

    return function() {
      var stamp = nativeNow(),
          remaining = HOT_SPAN - (stamp - lastCalled);

      lastCalled = stamp;
      if (remaining > 0) {
        if (++count >= HOT_COUNT) {
          return arguments[0];
        }
      } else {
        count = 0;
      }
      return func.apply(undefined, arguments);
    };
  }

  var _shortOut = shortOut;

  /**
   * Sets the `toString` method of `func` to return `string`.
   *
   * @private
   * @param {Function} func The function to modify.
   * @param {Function} string The `toString` result.
   * @returns {Function} Returns `func`.
   */
  var setToString = _shortOut(_baseSetToString);

  var _setToString = setToString;

  /**
   * A specialized version of `baseRest` which flattens the rest array.
   *
   * @private
   * @param {Function} func The function to apply a rest parameter to.
   * @returns {Function} Returns the new function.
   */
  function flatRest(func) {
    return _setToString(_overRest(func, undefined, flatten_1), func + '');
  }

  var _flatRest = flatRest;

  /** Used to compose bitmasks for cloning. */
  var CLONE_DEEP_FLAG$1 = 1,
      CLONE_FLAT_FLAG$1 = 2,
      CLONE_SYMBOLS_FLAG$1 = 4;

  /**
   * The opposite of `_.pick`; this method creates an object composed of the
   * own and inherited enumerable property paths of `object` that are not omitted.
   *
   * **Note:** This method is considerably slower than `_.pick`.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The source object.
   * @param {...(string|string[])} [paths] The property paths to omit.
   * @returns {Object} Returns the new object.
   * @example
   *
   * var object = { 'a': 1, 'b': '2', 'c': 3 };
   *
   * _.omit(object, ['a', 'c']);
   * // => { 'b': '2' }
   */
  var omit = _flatRest(function(object, paths) {
    var result = {};
    if (object == null) {
      return result;
    }
    var isDeep = false;
    paths = _arrayMap(paths, function(path) {
      path = _castPath(path, object);
      isDeep || (isDeep = path.length > 1);
      return path;
    });
    _copyObject(object, _getAllKeysIn(object), result);
    if (isDeep) {
      result = _baseClone(result, CLONE_DEEP_FLAG$1 | CLONE_FLAT_FLAG$1 | CLONE_SYMBOLS_FLAG$1, _customOmitClone);
    }
    var length = paths.length;
    while (length--) {
      _baseUnset(result, paths[length]);
    }
    return result;
  });

  var omit_1 = omit;

  var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();



  var lib$2 = function omitDeepLodash(input, props) {
    function omitDeepOnOwnProps(obj) {
      if (typeof input === "undefined") {
        return input;
      }

      if (!Array.isArray(obj) && !isObject$2(obj)) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return omitDeepLodash(obj, props);
      }

      var o = {};
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.entries(obj)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _step$value = _slicedToArray(_step.value, 2),
              key = _step$value[0],
              value = _step$value[1];

          o[key] = !isNil(value) ? omitDeepLodash(value, props) : value;
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

      return omit_1(o, props);
    }

    if (arguments.length > 2) {
      props = Array.prototype.slice.call(arguments).slice(1);
    }

    if (Array.isArray(input)) {
      return input.map(omitDeepOnOwnProps);
    }

    return omitDeepOnOwnProps(input);
  };

  function isNil(value) {
    return value === null || value === undefined;
  }

  function isObject$2(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
  }

  function getHouseById(lot) {
      console.log('lot: ', lot);
      const MY_QUERY = src`
        query getHouseById($lot: ID!) {
            house(lot: $lot) {
                _id
                lot
                address
                contactInfo {
                    mobile
                    phone
                    email
                }
                owners {
                    firstName
                    lastName
                }
                hoaFeePaid {
                    year
                    paid
                    lateFee
                    value
                }
                violations {
                    type
                    noticeSent
                    value
                    paid
                }
                requests {
                    type
                    approved
                }
            }
        }
    `;

      const hostname = window.location.hostname;
      let uri = '';
      if (hostname === 'localhost') {
          uri = 'http://localhost:4000';
      } else {
          uri = 'https://hoa-manager-services.herokuapp.com';
      }
      const client = new ApolloClient({
          link: createHttpLink({uri: `${uri}/graphql`}),
          cache: new InMemoryCache()
      });

      return client.query({
          query: MY_QUERY,
          variables: {lot},
          context: {
              headers: {
                  special: "Special header value"
              }
          }
      })
      .then(response => response);
  }

  function getHouseByAddress(number) {
      const MY_QUERY = src`
        query getHouseByAddress($number: String!) {
            address(number: $number) {
                _id
                lot
                address
                contactInfo {
                    mobile
                    phone
                    email
                }
                owners {
                    firstName
                    lastName
                }
                hoaFeePaid {
                    year
                    paid
                    lateFee
                    value
                }
                violations {
                    type
                    noticeSent
                    value
                    paid
                }
                requests {
                    type
                    approved
                }
            }
        }
    `;

      const hostname = window.location.hostname;
      let uri = '';
      if (hostname === 'localhost') {
          uri = 'http://localhost:4000';
      } else {
          uri = 'https://ajb-trivia-game-services.herokuapp.com';
      }
      const client = new ApolloClient({
          link: createHttpLink({ uri: `${uri}/graphql` }),
          cache: new InMemoryCache()
      });

      return client.query({
          query: MY_QUERY,
          variables: { number },
          context: {
              headers: {
                  special: "Special header value"
              }
          }
      })
      .then(response => response);
  }

  function updateHouse(houseInput) {
      const errorLink = onError(({ graphQLErrors }) => {
          if (graphQLErrors) graphQLErrors.map(({ message }) => console.log(message));
      });
      const MY_MUTATION = src`
        mutation UpdateHouse($houseInput: HouseInput!) {
            updateHouse(houseInput: $houseInput) {
                _id
                lot
                address
                contactInfo {
                    mobile
                    email
                    phone
                }
                owners {
                    firstName
                    lastName
                }
                hoaFeePaid {
                    year
                    paid
                    value
                    lateFee
                }
                requests {
                    type
                    approved
                }
                violations {
                    type
                    noticeSent
                    value
                    paid
                }
            }
        }
    `;

      const hostname = window.location.hostname;
      let uri = '';
      if (hostname === 'localhost') {
          uri = 'http://localhost:4000';
      } else {
          uri = 'https://ajb-trivia-game-services.herokuapp.com';
      }
      const client = new ApolloClient({
          // link: createHttpLink({ uri: `${uri}/graphql` }),
          link: ApolloLink.from([errorLink, createHttpLink({ uri: `${uri}/graphql` })]),
          cache: new InMemoryCache()
      });

      return client
          .mutate({
              mutation: MY_MUTATION,
              variables: { houseInput: lib$2(houseInput, '__typename') }
          })
          .then(response => response);
  }

  function dispatchEvents(specs) {
      const {name, el, value} = specs;
      el.dispatchEvent(new CustomEvent(name, {bubbles: true, detail: value}));
  }

  function styleInject(css, ref) {
    if ( ref === void 0 ) ref = {};
    var insertAt = ref.insertAt;

    if (!css || typeof document === 'undefined') { return; }

    var head = document.head || document.getElementsByTagName('head')[0];
    var style = document.createElement('style');
    style.type = 'text/css';

    if (insertAt === 'top') {
      if (head.firstChild) {
        head.insertBefore(style, head.firstChild);
      } else {
        head.appendChild(style);
      }
    } else {
      head.appendChild(style);
    }

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
  }

  var css = ":root {\n    --inactive: #aaa;\n    --active: tomato;\n    --speed: 1.2s;\n    --size: 50px;\n    --unit: var(--size) / 16;\n}\n\n@keyframes spinner {\n  0% { transform: rotate(0); }\n  100% { transform: rotate(360deg); }\n}\n\n.spinner-double-section-out {\n    position: relative;\n    display: block;\n    float: left;\n    width: var(--size);\n    height: var(--size);\n    border-radius: 50%;\n    border: var(--unit) solid var(--inactive);\n    animation: spinner var(--speed) linear infinite;\n}\n.spinner-double-section-out:before,\n.spinner-double-section-out:after {\n    content: '';\n    position: absolute;\n    top: -var(--unit);\n    left: -var(--unit);\n    display: block;\n    width: var(--size);\n    height: var(--size);\n    border-radius: 50%;\n    border: var(--unit) solid transparent;\n    border-top-color: var(--active);\n}\n.spinner-double-section-out:after {\n    border-top-color: transparent;\n    border-bottom-color: var(--active);\n    display: none;\n}\n\n.spinner-double-section-out:before,\n.spinner-double-section-out:after {\n    top: calc(var(--unit)*-2);\n    left: calc(var(--unit)*-2);\n    width: calc(var(--size) + calc(var(--unit)*2));\n    height: calc(var(--size) + calc(var(--unit)*2));\n}\n\n\n\n\nhoa-search {\n    position: absolute;\n    top: 0;\n    right: 0;\n    width: 100%;\n    background-color: #fff;\n}\n\nhoa-search #hoa-search-input-container {\n    position: relative;\n    background-color: #ebefd0;\n}\n\nhoa-search input {\n    background-color: transparent;\n}\n\nhoa-search label, hoa-search input {\n  transition: all 0.2s;\n  touch-action: manipulation;\n}\n\nhoa-search label {\n    position: absolute;\n    top: 5px;\n    left: 22px;\n    font-size: 16px;\n    font-family: 'Montserrat', sans-serif;\n    color: #085f63;\n}\n\nhoa-search input {\n    padding: 26px 50px 4px 20px;\n    font-size: 24px;\n    border: 0;\n    margin: 0;\n    border-bottom: 1px solid #085f63;\n    color: #085f63;\n    width: calc(100% - 70px);\n}\n\nhoa-search input:focus {\n    outline: 0;\n}\n\ninput:placeholder-shown + label {\n  cursor: text;\n  max-width: 66.66%;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  transform-origin: left bottom;\n  transform: translate3d(0, 31px, 0) scale(1.5);\n}\n\n/**\n* By default, the placeholder should be transparent. Also, it should\n* inherit the transition.\n*/\nhoa-search input::placeholder {\n  opacity: 0;\n  transition: inherit;\n}\n\n/**\n* Show the placeholder when the input is focused.\n*/\nhoa-search input:focus::placeholder {\n    color: #ccc;\n    opacity: 1;\n}\n\n/**\n* When the element is focused, remove the label transform.\n* Also, do this when the placeholder is _not_ shown, i.e. when\n* there's something in the input at all.\n*/\nhoa-search input:not(:placeholder-shown) + label,\nhoa-search input:focus + label {\n  transform: translate3d(0, 0, 0) scale(1);\n  cursor: pointer;\n}\n\nhoa-search input:active + label,\nhoa-search input:focus + label {\n    transform: scale(1) translate3d(0, 0, 0);\n}\n\nhoa-search .hoa-search--action {\n    position: absolute;\n    top: 0;\n    right: 0;\n}\n\nhoa-search .hoa-search--action button {\n    border: 0;\n    background: #085f63;\n    height: 59px;\n    width: 44px;\n    border-bottom: 1px solid #085f63;\n    border-left: 1px solid #085f63;\n    color: white;\n}";
  styleInject(css);

  class HoaSearch extends HTMLElement {
      // static get observedAttributes() { return ['nothing']; }

      connectedCallback() {
          this.connected = true;
          this.html = bind(this);
          this.state = {
              isActive: false
          };
          this.render();
          this.addEventListeners();
      }

      disconnectedCallback() {
          this.delegateEl.off();
      }

      attributeChangedCallback(attr, oldValue, newValue) {
          if (oldValue !== newValue) {
              this[attr] = newValue;
              this.render();
          }
      }

      propertyChangeCallback(prop, oldValue, newValue) {
          if (oldValue !== newValue) {
              this.setAttribute(prop, newValue);
              this.render();
          }
      }

      addEventListeners() {
          this.delegateEl = lib(this);

          this.delegateEl.on('focusout', '#hoa-search-input' , e => {
              const value = e.target.value;
              if (value) {
                  this.state = { ...this.state, isActive: true };
                  this.render();
              }
          });
      }

      submitHandler(e) {
          e.preventDefault();
          const value = this.querySelector('#hoa-search-input').value;
          console.log('value: ', value);
          // dispatch event to the hoa-map-app
          // listen to in the app and submit the graphQL query
          //TODO submit graphQL request for entered data.
          dispatchEvents({
              name: 'hoaSearch:submit',
              el: this,
              value
          });
      }

      clear() {
          this.querySelector('input').value = '';
          this.render();
      }

      render() {
          if (!this.connected) { return ''; }
          return this.html`
            <form onsubmit=${this.submitHandler.bind(this)}>
                <section id="hoa-search-input-container" class=${this.state.isActive ? 'is-active' : ''}>
                    <input type="text" id="hoa-search-input" placeholder="1234 Fellowship Drive" />
                    <label for="hoa-search-input">Search</label>
                    <section class="hoa-search--action">
                        <button type="submit">GO</button>
                        <span class="spinner spinner-double-section-out"></span>
                    </section>
                </section>
            </form>
        `;

      }
  }

  customElements.define('hoa-search', HoaSearch);

  var css$1 = "hoa-form {\n    display: block;\n}\n\nhoa-form .hoa-form__row {\n    line-height: 1.6em;\n    font-size: 18px;\n    font-family: 'Montserrat', sans-serif;\n    position: relative;\n}\n\nhoa-form .hoa-form__row .hoa-form__label,\nhoa-form .hoa-form__row label ,\nhoa-form .hoa-form__row .hoa-form__fees-title {\n    font-weight: 600;\n}\n\nhoa-form .hoa-form__row .hoa-form__value {\n    color: #000;\n}\n\nhoa-form form .hoa-form__row.hoa-form__name {\n    margin-top: 20px;\n}\nhoa-form label, hoa-form input[type=\"text\"] {\n    transition: all 0.2s;\n    touch-action: manipulation;\n}\nhoa-form .hoa-form__row:not(.hoa-form__fees) label {\n    position: absolute;\n    top: 5px;\n    left: 22px;\n    font-size: 16px;\n    font-family: 'Montserrat', sans-serif;\n    color: #085f63;\n}\nhoa-form .hoa-form__row input[type=\"text\"] {\n    padding: 26px 50px 4px 20px;\n    font-size: 24px;\n    border: 0;\n    margin: 0;\n    border-bottom: 1px solid #ccc;\n    width: calc(100% - 70px);\n    font-family: 'Montserrat', sans-serif;\n    color: #085f63;\n}\nhoa-form .hoa-form__row input[type=\"text\"]:focus {\n    outline: 0;\n}\nhoa-form .hoa-form__row input[type=\"text\"]:placeholder-shown + label {\n  cursor: text;\n  max-width: 66.66%;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  transform-origin: left bottom;\n  transform: translate3d(0, 31px, 0) scale(1.5);\n}\nhoa-form .hoa-form__row input[type=\"text\"]::placeholder {\n  opacity: 0;\n  transition: inherit;\n}\nhoa-form .hoa-form__row input[type=\"text\"]:focus::placeholder {\n    color: #ccc;\n    opacity: 1;\n}\nhoa-form .hoa-form__row input[type=\"text\"]:not(:placeholder-shown) + label,\nhoa-form .hoa-form__row input[type=\"text\"]:focus + label {\n  transform: translate3d(0, 0, 0) scale(1);\n  cursor: pointer;\n}\n\nhoa-form .hoa-form__row input[type=\"text\"]:active + label,\nhoa-form .hoa-form__row input[type=\"text\"]:focus + label {\n    transform: scale(1) translate3d(0, 0, 0);\n}\n\nhoa-form .hoa-form__row .hoa-search--action {\n    position: absolute;\n    top: 0;\n    right: 0;\n}\n\nhoa-form .hoa-form__row .hoa-search--action button {\n    border: 0;\n    background: #ccc;\n    height: 59px;\n    width: 44px;\n}\n\nhoa-form .hoa-form__row.hoa-form__fees label {\n    display: inline-block;\n}\nhoa-form .hoa-form__row input[type=\"radio\"] {\n    height: 20px;\n    display: inline-block;\n}\n\nhoa-form .hoa-form__action {\n    margin-top: 20px;\n}\n\nhoa-form .hoa-form__action button {\n    background: #32dbc6;\n    color: #085f63;\n    border: 1px solid #085f63;;\n    height: 40px;\n    font-size: 20px;\n    padding: 5px 20px;\n    font-family: 'Montserrat', sans-serif;\n}\nhoa-form .hoa-form__action button:hover {\n    background: #4ba5c0;\n    border: #214853;\n    color: white;\n    cursor: pointer;\n}\nhoa-form .hoa-form__action button:active {\n    transform: translate3d(0,3px,0)\n}";
  styleInject(css$1);

  class HoaForm extends HTMLElement {
      // static get observedAttributes() { return ['nothing']; }

      connectedCallback() {
          this.connected = true;
          this.html = bind(this);
          this.editMode = false;
          this.state = {
              lot: "27",
              address: "5107 Fellowship Dr.",
              contactInfo: {
                  mobile: "",
                  phone: "860-384-3921",
                  email: "ajbertra91@gmail.com"
              },
              owners: [
                  {
                      firstName: "Adam",
                      lastName: "Bertrand"
                  },
                  {
                      firstName: "Raeyoung",
                      lastName: "Park"
                  }
              ],
              hoaFeePaid: [
                  {
                      year: 2019,
                      paid: true,
                      value: 600,
                      lateFee: 0
                  }
              ]
          };
          this.render();
          // this.addEventListeners();
      }

      disconnectedCallback() {
          // this.delegateEl.off();
      }

      attributeChangedCallback(attr, oldValue, newValue) {
          if (oldValue !== newValue) {
              this[attr] = newValue;
              this.render();
          }
      }

      propertyChangeCallback(prop, oldValue, newValue) {
          if (oldValue !== newValue) {
              this.setAttribute(prop, newValue);
              this.render();
          }
      }

      addEventListeners() {
          this.delegateEl = lib(this);

          // this.delegateEl.on('click', '.hoa-modal--overlay', e => {
          //     e.preventDefault();
          //     this.close();
          // });
      }

      update(data) {
          this.state = data;
          this.editMode = false;
          this.render();
      }

      submitHandler() {
          this.editMode = false;
          // dispatchEvents({ name: 'hoaForm:submit', el: this, value: this.state})
          this.render();
      }

      onclickHandler(e) {
          console.log(e);
      }

      editHandler() {
          this.editMode = true;
          this.render();
      }

      firstNameChangeHandler(e) {
          this.state.owners[e.target.dataset.index].firstName = e.target.value;
      }

      lastNameChangeHandler(e) {
          this.state.owners[e.target.dataset.index].lastName = e.target.value;
      }

      feesPaidChangeHandler(e) {
          this.state.hoaFeePaid.paid = e.target.value === 'true' ? true : false;
          this.state.hoaFeePaid.year = new Date().getFullYear();
          console.log('this.state.hoaFeePaid.paid', this.state.hoaFeePaid.paid);
          console.log('this.state.hoaFeePaid.year', this.state.hoaFeePaid.year);
      }

      getStaticInfo() {
          return wire()`
            <div class="hoa-form__row hoa-form__lot">
                <span class="hoa-form__label">Lot: </span>
                <span class="hoa-form__value">${this.state.lot}</span>
            </div>

            <div class="hoa-form__row hoa-form__address">
                <span class="hoa-form__label">Address: </span>
                <span class="hoa-form__value">${this.state.address}</span>
            </div>
        `;
      }

      getOwnerInfo() {
          return this.state.owners.map(owner => {
              return wire(owner)`
                <div class="hoa-form__row hoa-form__name">
                    <span class="hoa-form__label">Owner: </span>
                    <span class="hoa-form__value">${owner.firstName} ${owner.lastName}</span>
                </div>
            `;
          });
      }

      getContactInfo() {
          return wire(this.state.contactInfo)`
            <div class="hoa-form__row hoa-form__contact-info">
                <span class="hoa-form__label">Phone: </span>
                <span class="hoa-form__value">${this.state.contactInfo.phone}</span>
            </div>
            <div class="hoa-form__row hoa-form__contact-info">
                <span class="hoa-form__label">Mobile: </span>
                <span class="hoa-form__value">${this.state.contactInfo.mobile}</span>
            </div>
            <div class="hoa-form__row hoa-form__contact-info">
                <span class="hoa-form__label">Email: </span>
                <span class="hoa-form__value">${this.state.contactInfo.email}</span>
            </div>
        `;
      }

      getHoaFeesInfo() {
          return this.state.hoaFeePaid.map(hoaFee => {
              return wire(hoaFee)`
                <div class="hoa-form__row hoa-form__hoa-fee">
                    <span class="hoa-form__label">${hoaFee.year} Fees: </span>
                    <span class="hoa-form__value">${hoaFee.paid ? 'Paid' : 'Not Paid'}</span>
                </div>
            `;
          });
      }

      getDisplayContent() {
          return wire()`
            <section class="hoa-form hoa-form--display-mode">
                ${this.getStaticInfo()}
                ${this.getOwnerInfo()}
                ${this.getContactInfo()}
                ${this.getHoaFeesInfo()}

                </section>
                `
                  // <div class="hoa-form__row hoa-form__action">
                  //     <button type="button" onclick=${this.editHandler.bind(this)}>Edit</button>
                  // </div>
      }

      getEditFormContent() {
          return wire()`
            ${this.getStaticInfo()}

            <form class="hoa-form hoa-form--edit-mode" onsubmit=${this.submitHandler.bind(this)}>
                ${this.state.owners.map((owner,idx) => {
                    return wire(owner)`
                        <div class="hoa-form__row hoa-form__name">
                            <label for="firstName">First Name: </label>
                            <input
                                id="firstName"
                                type="text"
                                value=${owner.firstName}
                                data-index=${idx}
                                placeholder="Jane"
                                onchange=${this.firstNameChangeHandler.bind(this)}
                            />
                        </div>
                        <div class="hoa-form__row hoa-form__name">
                            <label for="firstName">Last Name: </label>
                            <input
                                id="firstName"
                                type="text"
                                value=${owner.lastName}
                                data-index=${idx}
                                placeholder="Doe"
                                onchange=${this.lastNameChangeHandler.bind(this)}
                            />
                        </div>
                    `;
                })}
                <div class="hoa-form__row hoa-form__fees">
                    <div class="hoa-form__fees-title">Fees Paid?</div>
                    <label for="fees-paid-yes">Yes: </label>
                    <input id="fees-paid-yes" name="fees-paid-radio" type="radio" value="true" checked=${this.state.hoaFeePaid.paid === true} onchange=${this.feesPaidChangeHandler.bind(this)}/>
                    <label for="fees-paid-yes">No: </label>
                    <input id="fees-paid-no" name="fees-paid-radio" type="radio" value="false" checked=${this.state.hoaFeePaid.paid === false} onchange=${this.feesPaidChangeHandler.bind(this)}/>
                </div>
                <div class="hoa-form__row hoa-form__action">
                    <button type="submit">Save</button>
                </div>
            </form>
        `;
      }

      getErrorContent() {
          return wire()`
            <p class="error-msg">${this.state.errorMsg}</p>
        `;
      }

      render() {
          if (!this.connected) { return ''; }
          if (!this.state.errorMsg) {
              return this.html`
                ${this.editMode
                    ? this.getEditFormContent()
                    : this.getDisplayContent()
                }
            `;
          } else {
              return this.html`
                ${this.getErrorContent()}
            `;
          }

      }
  }

  customElements.define('hoa-form', HoaForm);

  var css$2 = "hoa-modal {\n    transform: translate3d(0,-120%,0);\n    transition: transform 0.2s ease-out;\n    position: absolute;\n    top: 68px;\n    left: 8px;\n    right: 8px;\n    border: 1px solid #085f63;\n    border-radius: 4px;\n    background-color: #49beb7;\n    overflow: hidden;\n}\nhoa-modal.is-visible {\n    transform: translate3d(0,0%,0);\n    transition: all 0.2s ease-in-out;\n}\n\nhoa-modal .hoa-modal__wrapper {\n    background-color: #49beb7;\n    padding: 50px 20px 20px;\n    color: #085f63;\n    position: relative;\n}\n\nhoa-modal i.far {\n    font-size: 40px;\n    height: 40px;\n    width: 40px;\n    display: inline-block;\n    color: white;\n    text-align: center;\n    position: absolute;\n    top: 10px;\n    right: 10px;\n}\nhoa-modal i.far:hover {\n    cursor: pointer;\n    color: #4ba5c0;\n}\nhoa-modal i.far:active {\n    transform: scale(0.9);\n}\n\n@media screen and (min-width: 768px) {\n    hoa-modal {\n        position: absolute;\n        z-index: 1;\n        height: 100%;\n        width: 100%;\n        top: 0;\n        left: 0;\n        right: 0;\n        bottom: 0;\n        justify-content: center;\n        align-items: center;\n    }\n    hoa-modal.is-visible {\n        display: flex;\n    }\n    hoa-modal .hoa-modal--overlay {\n        background-color: rgba(0,0,0,0.7);\n        position: absolute;\n        z-index: 1;\n        height: 100%;\n        width: 100%;\n        top: 0;\n        left: 0;\n        right: 0;\n        bottom: 0;\n    }\n\n    hoa-modal .hoa-modal__wrapper {\n        position: fixed;\n        height: auto;\n        width: 600px;\n        border: 2px solid #ffffff;\n        border-radius: 4px;\n        z-index: 2;\n        flex: 1 0 auto;\n    }\n}";
  styleInject(css$2);

  class HoaModal extends HTMLElement {
      // static get observedAttributes() { return ['nothing']; }

      connectedCallback() {
          this.connected = true;
          this.html = bind(this);
          this.render();
          this.addEventListeners();
      }

      disconnectedCallback() {
          this.delegateEl.off();
      }

      attributeChangedCallback(attr, oldValue, newValue) {
          if (oldValue !== newValue) {
              this[attr] = newValue;
              this.render();
          }
      }

      propertyChangeCallback(prop, oldValue, newValue) {
          if (oldValue !== newValue) {
              this.setAttribute(prop, newValue);
              this.render();
          }
      }

      addEventListeners() {
          this.delegateEl = lib(this);

          this.delegateEl.on('click', '.hoa-modal--overlay', e => {
              e.preventDefault();
              this.close();
          });
          this.delegateEl.on('click', '.hoa-modal--close-button', e => {
              e.preventDefault();
              this.close();
          });
      }

      update(data) {
          this.querySelector('hoa-form').update(data);
      }

      close() {
          this.classList.remove('is-visible');
          dispatchEvents({name:'hoaModal:close', el: this});
      }

      open() {
          this.classList.add('is-visible');
      }

      render() {
          if (!this.connected) { return ''; }
          return this.html`
            <div class="hoa-modal--overlay"></div>
            <section class="hoa-modal__wrapper">
                <i class="far fa-times-circle hoa-modal--close-button"></i>
                <hoa-form></hoa-form>
            </section>
        `;

      }
  }

  customElements.define('hoa-modal', HoaModal);

  var css$3 = "body {\n    margin: 0;\n    padding: 0;\n    background-color: #ebefd0;\n    color: #085f63;\n}\nhoa-map-app {\n    position: relative;\n    height: 100vh;\n    width: 100vw;\n    display: block;\n    margin: 0;\n    padding: 70px 0 0 0;\n}\nhoa-map-app .house:hover {\n    cursor: pointer;\n}\nhoa-map-app .house:hover path,\nhoa-map-app .house:hover rect {\n    fill: #4ba5c0 !important;\n}\nhoa-map-app h1 {\n    font-family: 'Montserrat', sans-serif;\n    font-weight: 200;\n    text-transform: capitalize;\n    padding-left: 10px;\n    padding-right: 10px;\n}\nhoa-map-app .hoa-map-container {\n    overflow-y:scroll;\n    padding: 20px;\n    background-color: #ebebeb;\n    border-top: 1px solid #085f63;\n    border-bottom: 1px solid #085f63;\n}";
  styleInject(css$3);

  //http://localhost:4000/graphql
  class HoaMapApp extends HTMLElement {
      // static get observedAttributes() { return ['test-type']; }

      connectedCallback() {
          this.connected = true;
          this.html = bind(this);
          this.render();
          this.addEventListeners();
      }

      disconnectedCallback() {
          this.delegateEl.off();
      }

      attributeChangedCallback(attr, oldValue, newValue) {
          if (oldValue !== newValue) {
              this[attr] = newValue;
              this.render();
          }
      }

      propertyChangeCallback(prop, oldValue, newValue) {
          if (oldValue !== newValue) {
              this.setAttribute(prop, newValue);
              this.render();
          }
      }

      getLot(e) {
          let target = e.target;
          while (!target.getAttribute('data-lot')) {
              target = target.parentNode;
          }
          return target.getAttribute('data-lot');
      }

      openModal(data) {
          const hoaModalEl = this.querySelector('hoa-modal');
          hoaModalEl.update(data);
          hoaModalEl.open();
      }

      addEventListeners() {
          this.delegateEl = lib(this);

          this.delegateEl.on('click', '.house', e => {
              e.preventDefault();
              // get lot number
              const lot = this.getLot(e);
              // look up house data
              getHouseById(lot)
                  .then(response => {
                      // display data
                      this.openModal(response.data.house);
                  });
          });

          this.delegateEl.on('hoaSearch:submit', 'hoa-search', e => {
              const value = e.detail;
              if (value.length === 1 || value.length === 2) {
                  getHouseById(value)
                      .then(response => {
                          // display data
                          this.openModal(response.data.house);
                      })
                      .catch(err => {
                          this.openModal({ errorMsg: 'No record.' });
                          console.log(err);
                      });
              }
              else if (value.length >= 4) {
                  getHouseByAddress(value)
                      .then(response => {
                          // display data
                          this.openModal(response.data.address);
                      })
                      .catch(err => {
                          this.openModal({ errorMsg: 'No record.' });
                          console.log(err);
                      });
              }
          });
          this.delegateEl.on('hoaForm:submit', 'hoa-modal', e => {
              const value = e.detail;
              updateHouse(value)
                  .then(response => {
                      // display data
                      this.openModal(response.data.updateHouse);
                  })
                  .catch(err => {
                      this.openModal({ errorMsg: 'No record.' });
                      console.log(err);
                  });
          });
          this.delegateEl.on('hoaModal:close', 'hoa-modal', () => {
              this.querySelector('hoa-search').clear();
          });
      }

      render() {
          if (!this.connected) { return ''; }
          return this.html`
            <hoa-modal></hoa-modal>
            <hoa-search></hoa-search>
            <h1>Old Friendship Place HOA - MAP</h1>

            <section class="hoa-map-container">
                <svg
                width="900px"
                height="100%"
                viewBox="0 0 1200 690"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                xml:space="preserve"
                xmlns:serif="http://www.serif.com/"
                style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;"
                >${getMapSvg()}</svg>
            </section>
        `;
      }
  }

  customElements.define('hoa-map-app', HoaMapApp);

  const REDIRECT_URI = './index.html';
  const STATE = '';
  const SCOPES = '';
  const CLIENT_ID = '1234';

  AppleID.auth.init({
      clientId: CLIENT_ID,
      scope: SCOPES,
      redirectURI: REDIRECT_URI,
      state: STATE
  });

  const buttonContainerEl = document.querySelector('.sign-in-container');
  const buttonElement = document.getElementById('sign-in-with-apple-button');
  buttonElement.addEventListener('click', () => {
      AppleID.auth.signIn();
      buttonContainerEl.classList.remove('active');
  });

  setTimeout(() => {
      buttonContainerEl.classList.add('active');
  }, 1000);

  // if ('serviceWorker' in navigator) {
  //     window.addEventListener('load', () => {
  //         navigator.serviceWorker.register('./service-worker.js')
  //             .then(registration => {
  //                 console.log('Service worker registered. ', registration);
  //             },
  //                 err => {
  //                     console.log('ServiceWorker registraion failed: ', err);
  //                 });
  //     });
  // }

}());
//# sourceMappingURL=bundle.js.map
