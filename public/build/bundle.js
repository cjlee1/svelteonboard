
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() {}

    var identity = x => x;

    function assign(tar, src) {
      // @ts-ignore
      for (var k in src) {
        tar[k] = src[k];
      }

      return tar;
    }

    function add_location(element, file, line, column, char) {
      element.__svelte_meta = {
        loc: {
          file,
          line,
          column,
          char
        }
      };
    }

    function run(fn) {
      return fn();
    }

    function blank_object() {
      return Object.create(null);
    }

    function run_all(fns) {
      fns.forEach(run);
    }

    function is_function(thing) {
      return typeof thing === 'function';
    }

    function safe_not_equal(a, b) {
      return a != a ? b == b : a !== b || a && typeof a === 'object' || typeof a === 'function';
    }

    function create_slot(definition, ctx, fn) {
      if (definition) {
        var slot_ctx = get_slot_context(definition, ctx, fn);
        return definition[0](slot_ctx);
      }
    }

    function get_slot_context(definition, ctx, fn) {
      return definition[1] ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {}))) : ctx.$$scope.ctx;
    }

    function get_slot_changes(definition, ctx, changed, fn) {
      return definition[1] ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {}))) : ctx.$$scope.changed || {};
    }

    var is_client = typeof window !== 'undefined';
    var now = is_client ? () => window.performance.now() : () => Date.now();
    var raf = is_client ? cb => requestAnimationFrame(cb) : noop; // used internally for testing

    var tasks = new Set();
    var running = false;

    function run_tasks() {
      tasks.forEach(task => {
        if (!task[0](now())) {
          tasks.delete(task);
          task[1]();
        }
      });
      running = tasks.size > 0;
      if (running) raf(run_tasks);
    }

    function loop(fn) {
      var task;

      if (!running) {
        running = true;
        raf(run_tasks);
      }

      return {
        promise: new Promise(fulfil => {
          tasks.add(task = [fn, fulfil]);
        }),

        abort() {
          tasks.delete(task);
        }

      };
    }

    function append(target, node) {
      target.appendChild(node);
    }

    function insert(target, node, anchor) {
      target.insertBefore(node, anchor || null);
    }

    function detach(node) {
      node.parentNode.removeChild(node);
    }

    function destroy_each(iterations, detaching) {
      for (var i = 0; i < iterations.length; i += 1) {
        if (iterations[i]) iterations[i].d(detaching);
      }
    }

    function element(name) {
      return document.createElement(name);
    }

    function text(data) {
      return document.createTextNode(data);
    }

    function space() {
      return text(' ');
    }

    function empty() {
      return text('');
    }

    function listen(node, event, handler, options) {
      node.addEventListener(event, handler, options);
      return () => node.removeEventListener(event, handler, options);
    }

    function attr(node, attribute, value) {
      if (value == null) node.removeAttribute(attribute);else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
    }

    function children(element) {
      return Array.from(element.childNodes);
    }

    function set_style(node, key, value, important) {
      node.style.setProperty(key, value, important ? 'important' : '');
    }

    function custom_event(type, detail) {
      var e = document.createEvent('CustomEvent');
      e.initCustomEvent(type, false, false, detail);
      return e;
    }

    var stylesheet;
    var active = 0;
    var current_rules = {}; // https://github.com/darkskyapp/string-hash/blob/master/index.js

    function hash(str) {
      var hash = 5381;
      var i = str.length;

      while (i--) {
        hash = (hash << 5) - hash ^ str.charCodeAt(i);
      }

      return hash >>> 0;
    }

    function create_rule(node, a, b, duration, delay, ease, fn) {
      var uid = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 0;
      var step = 16.666 / duration;
      var keyframes = '{\n';

      for (var p = 0; p <= 1; p += step) {
        var t = a + (b - a) * ease(p);
        keyframes += p * 100 + "%{".concat(fn(t, 1 - t), "}\n");
      }

      var rule = keyframes + "100% {".concat(fn(b, 1 - b), "}\n}");
      var name = "__svelte_".concat(hash(rule), "_").concat(uid);

      if (!current_rules[name]) {
        if (!stylesheet) {
          var style = element('style');
          document.head.appendChild(style);
          stylesheet = style.sheet;
        }

        current_rules[name] = true;
        stylesheet.insertRule("@keyframes ".concat(name, " ").concat(rule), stylesheet.cssRules.length);
      }

      var animation = node.style.animation || '';
      node.style.animation = "".concat(animation ? "".concat(animation, ", ") : "").concat(name, " ").concat(duration, "ms linear ").concat(delay, "ms 1 both");
      active += 1;
      return name;
    }

    function delete_rule(node, name) {
      node.style.animation = (node.style.animation || '').split(', ').filter(name ? anim => anim.indexOf(name) < 0 // remove specific animation
      : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
      ).join(', ');
      if (name && ! --active) clear_rules();
    }

    function clear_rules() {
      raf(() => {
        if (active) return;
        var i = stylesheet.cssRules.length;

        while (i--) {
          stylesheet.deleteRule(i);
        }

        current_rules = {};
      });
    }

    var current_component;

    function set_current_component(component) {
      current_component = component;
    }

    function get_current_component() {
      if (!current_component) throw new Error("Function called outside component initialization");
      return current_component;
    }

    function onMount(fn) {
      get_current_component().$$.on_mount.push(fn);
    }

    function onDestroy(fn) {
      get_current_component().$$.on_destroy.push(fn);
    }

    function createEventDispatcher() {
      var component = get_current_component();
      return (type, detail) => {
        var callbacks = component.$$.callbacks[type];

        if (callbacks) {
          // TODO are there situations where events could be dispatched
          // in a server (non-DOM) environment?
          var event = custom_event(type, detail);
          callbacks.slice().forEach(fn => {
            fn.call(component, event);
          });
        }
      };
    }

    var dirty_components = [];
    var binding_callbacks = [];
    var render_callbacks = [];
    var flush_callbacks = [];
    var resolved_promise = Promise.resolve();
    var update_scheduled = false;

    function schedule_update() {
      if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
      }
    }

    function add_render_callback(fn) {
      render_callbacks.push(fn);
    }

    function flush() {
      var seen_callbacks = new Set();

      do {
        // first, call beforeUpdate functions
        // and update components
        while (dirty_components.length) {
          var component = dirty_components.shift();
          set_current_component(component);
          update(component.$$);
        }

        while (binding_callbacks.length) {
          binding_callbacks.pop()();
        } // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...


        for (var i = 0; i < render_callbacks.length; i += 1) {
          var callback = render_callbacks[i];

          if (!seen_callbacks.has(callback)) {
            callback(); // ...so guard against infinite loops

            seen_callbacks.add(callback);
          }
        }

        render_callbacks.length = 0;
      } while (dirty_components.length);

      while (flush_callbacks.length) {
        flush_callbacks.pop()();
      }

      update_scheduled = false;
    }

    function update($$) {
      if ($$.fragment !== null) {
        $$.update($$.dirty);
        run_all($$.before_update);
        $$.fragment && $$.fragment.p($$.dirty, $$.ctx);
        $$.dirty = null;
        $$.after_update.forEach(add_render_callback);
      }
    }

    var promise;

    function wait() {
      if (!promise) {
        promise = Promise.resolve();
        promise.then(() => {
          promise = null;
        });
      }

      return promise;
    }

    function dispatch(node, direction, kind) {
      node.dispatchEvent(custom_event("".concat(direction ? 'intro' : 'outro').concat(kind)));
    }

    var outroing = new Set();
    var outros;

    function group_outros() {
      outros = {
        r: 0,
        c: [],
        p: outros // parent group

      };
    }

    function check_outros() {
      if (!outros.r) {
        run_all(outros.c);
      }

      outros = outros.p;
    }

    function transition_in(block, local) {
      if (block && block.i) {
        outroing.delete(block);
        block.i(local);
      }
    }

    function transition_out(block, local, detach, callback) {
      if (block && block.o) {
        if (outroing.has(block)) return;
        outroing.add(block);
        outros.c.push(() => {
          outroing.delete(block);

          if (callback) {
            if (detach) block.d(1);
            callback();
          }
        });
        block.o(local);
      }
    }

    var null_transition = {
      duration: 0
    };

    function create_bidirectional_transition(node, fn, params, intro) {
      var config = fn(node, params);
      var t = intro ? 0 : 1;
      var running_program = null;
      var pending_program = null;
      var animation_name = null;

      function clear_animation() {
        if (animation_name) delete_rule(node, animation_name);
      }

      function init(program, duration) {
        var d = program.b - t;
        duration *= Math.abs(d);
        return {
          a: t,
          b: program.b,
          d,
          duration,
          start: program.start,
          end: program.start + duration,
          group: program.group
        };
      }

      function go(b) {
        var {
          delay = 0,
          duration = 300,
          easing = identity,
          tick = noop,
          css
        } = config || null_transition;
        var program = {
          start: now() + delay,
          b
        };

        if (!b) {
          // @ts-ignore todo: improve typings
          program.group = outros;
          outros.r += 1;
        }

        if (running_program) {
          pending_program = program;
        } else {
          // if this is an intro, and there's a delay, we need to do
          // an initial tick and/or apply CSS animation immediately
          if (css) {
            clear_animation();
            animation_name = create_rule(node, t, b, duration, delay, easing, css);
          }

          if (b) tick(0, 1);
          running_program = init(program, duration);
          add_render_callback(() => dispatch(node, b, 'start'));
          loop(now => {
            if (pending_program && now > pending_program.start) {
              running_program = init(pending_program, duration);
              pending_program = null;
              dispatch(node, running_program.b, 'start');

              if (css) {
                clear_animation();
                animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
              }
            }

            if (running_program) {
              if (now >= running_program.end) {
                tick(t = running_program.b, 1 - t);
                dispatch(node, running_program.b, 'end');

                if (!pending_program) {
                  // we're done
                  if (running_program.b) {
                    // intro — we can tidy up immediately
                    clear_animation();
                  } else {
                    // outro — needs to be coordinated
                    if (! --running_program.group.r) run_all(running_program.group.c);
                  }
                }

                running_program = null;
              } else if (now >= running_program.start) {
                var p = now - running_program.start;
                t = running_program.a + running_program.d * easing(p / running_program.duration);
                tick(t, 1 - t);
              }
            }

            return !!(running_program || pending_program);
          });
        }
      }

      return {
        run(b) {
          if (is_function(config)) {
            wait().then(() => {
              // @ts-ignore
              config = config();
              go(b);
            });
          } else {
            go(b);
          }
        },

        end() {
          clear_animation();
          running_program = pending_program = null;
        }

      };
    }

    function create_component(block) {
      block && block.c();
    }

    function mount_component(component, target, anchor) {
      var {
        fragment,
        on_mount,
        on_destroy,
        after_update
      } = component.$$;
      fragment && fragment.m(target, anchor); // onMount happens before the initial afterUpdate

      add_render_callback(() => {
        var new_on_destroy = on_mount.map(run).filter(is_function);

        if (on_destroy) {
          on_destroy.push(...new_on_destroy);
        } else {
          // Edge case - component was destroyed immediately,
          // most likely as a result of a binding initialising
          run_all(new_on_destroy);
        }

        component.$$.on_mount = [];
      });
      after_update.forEach(add_render_callback);
    }

    function destroy_component(component, detaching) {
      var $$ = component.$$;

      if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching); // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)

        $$.on_destroy = $$.fragment = null;
        $$.ctx = {};
      }
    }

    function make_dirty(component, key) {
      if (!component.$$.dirty) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty = blank_object();
      }

      component.$$.dirty[key] = true;
    }

    function init(component, options, instance, create_fragment, not_equal, props) {
      var parent_component = current_component;
      set_current_component(component);
      var prop_values = options.props || {};
      var $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty: null
      };
      var ready = false;
      $$.ctx = instance ? instance(component, prop_values, function (key, ret) {
        var value = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ret;

        if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
          if ($$.bound[key]) $$.bound[key](value);
          if (ready) make_dirty(component, key);
        }

        return ret;
      }) : prop_values;
      $$.update();
      ready = true;
      run_all($$.before_update); // `false` as a special case of no DOM component

      $$.fragment = create_fragment ? create_fragment($$.ctx) : false;

      if (options.target) {
        if (options.hydrate) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          $$.fragment && $$.fragment.l(children(options.target));
        } else {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          $$.fragment && $$.fragment.c();
        }

        if (options.intro) transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
      }

      set_current_component(parent_component);
    }

    class SvelteComponent {
      $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
      }

      $on(type, callback) {
        var callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
        callbacks.push(callback);
        return () => {
          var index = callbacks.indexOf(callback);
          if (index !== -1) callbacks.splice(index, 1);
        };
      }

      $set() {// overridden by instance, if it has props
      }

    }

    function dispatch_dev(type, detail) {
      document.dispatchEvent(custom_event(type, detail));
    }

    function append_dev(target, node) {
      dispatch_dev("SvelteDOMInsert", {
        target,
        node
      });
      append(target, node);
    }

    function insert_dev(target, node, anchor) {
      dispatch_dev("SvelteDOMInsert", {
        target,
        node,
        anchor
      });
      insert(target, node, anchor);
    }

    function detach_dev(node) {
      dispatch_dev("SvelteDOMRemove", {
        node
      });
      detach(node);
    }

    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
      var modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
      if (has_prevent_default) modifiers.push('preventDefault');
      if (has_stop_propagation) modifiers.push('stopPropagation');
      dispatch_dev("SvelteDOMAddEventListener", {
        node,
        event,
        handler,
        modifiers
      });
      var dispose = listen(node, event, handler, options);
      return () => {
        dispatch_dev("SvelteDOMRemoveEventListener", {
          node,
          event,
          handler,
          modifiers
        });
        dispose();
      };
    }

    function attr_dev(node, attribute, value) {
      attr(node, attribute, value);
      if (value == null) dispatch_dev("SvelteDOMRemoveAttribute", {
        node,
        attribute
      });else dispatch_dev("SvelteDOMSetAttribute", {
        node,
        attribute,
        value
      });
    }

    class SvelteComponentDev extends SvelteComponent {
      constructor(options) {
        if (!options || !options.target && !options.$$inline) {
          throw new Error("'target' is a required option");
        }

        super();
      }

      $destroy() {
        super.$destroy();

        this.$destroy = () => {
          console.warn("Component was already destroyed"); // eslint-disable-line no-console
        };
      }

    }

    /* node_modules\svelte-swipe\src\Swipe.svelte generated by Svelte v3.15.0 */
    var file = "node_modules\\svelte-swipe\\src\\Swipe.svelte";

    function get_each_context(ctx, list, i) {
      var child_ctx = Object.create(ctx);
      child_ctx.x = list[i];
      child_ctx.i = i;
      return child_ctx;
    } // (243:3) {#if showIndicators}


    function create_if_block(ctx) {
      var div;
      var each_value = ctx.indicators;
      var each_blocks = [];

      for (var i = 0; i < each_value.length; i += 1) {
        each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
      }

      var block = {
        c: function create() {
          div = element("div");

          for (var _i = 0; _i < each_blocks.length; _i += 1) {
            each_blocks[_i].c();
          }

          attr_dev(div, "class", "swipe-indicator swipe-indicator-inside svelte-mkioyx");
          add_location(div, file, 243, 5, 5737);
        },
        m: function mount(target, anchor) {
          insert_dev(target, div, anchor);

          for (var _i2 = 0; _i2 < each_blocks.length; _i2 += 1) {
            each_blocks[_i2].m(div, null);
          }
        },
        p: function update(changed, ctx) {
          if (changed.activeIndicator || changed.changeItem || changed.indicators) {
            each_value = ctx.indicators;

            var _i3;

            for (_i3 = 0; _i3 < each_value.length; _i3 += 1) {
              var child_ctx = get_each_context(ctx, each_value, _i3);

              if (each_blocks[_i3]) {
                each_blocks[_i3].p(changed, child_ctx);
              } else {
                each_blocks[_i3] = create_each_block(child_ctx);

                each_blocks[_i3].c();

                each_blocks[_i3].m(div, null);
              }
            }

            for (; _i3 < each_blocks.length; _i3 += 1) {
              each_blocks[_i3].d(1);
            }

            each_blocks.length = each_value.length;
          }
        },
        d: function destroy(detaching) {
          if (detaching) detach_dev(div);
          destroy_each(each_blocks, detaching);
        }
      };
      dispatch_dev("SvelteRegisterBlock", {
        block,
        id: create_if_block.name,
        type: "if",
        source: "(243:3) {#if showIndicators}",
        ctx
      });
      return block;
    } // (245:8) {#each indicators as x, i }


    function create_each_block(ctx) {
      var span;
      var span_class_value;
      var dispose;

      function click_handler() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return ctx.click_handler(ctx, ...args);
      }

      var block = {
        c: function create() {
          span = element("span");
          attr_dev(span, "class", span_class_value = "dot " + (ctx.activeIndicator == ctx.i ? "is-active" : "") + " svelte-mkioyx");
          add_location(span, file, 245, 10, 5838);
          dispose = listen_dev(span, "click", click_handler, false, false, false);
        },
        m: function mount(target, anchor) {
          insert_dev(target, span, anchor);
        },
        p: function update(changed, new_ctx) {
          ctx = new_ctx;

          if (changed.activeIndicator && span_class_value !== (span_class_value = "dot " + (ctx.activeIndicator == ctx.i ? "is-active" : "") + " svelte-mkioyx")) {
            attr_dev(span, "class", span_class_value);
          }
        },
        d: function destroy(detaching) {
          if (detaching) detach_dev(span);
          dispose();
        }
      };
      dispatch_dev("SvelteRegisterBlock", {
        block,
        id: create_each_block.name,
        type: "each",
        source: "(245:8) {#each indicators as x, i }",
        ctx
      });
      return block;
    }

    function create_fragment(ctx) {
      var div4;
      var div2;
      var div1;
      var div0;
      var t0;
      var div3;
      var t1;
      var current;
      var dispose;
      var default_slot_template = ctx.$$slots.default;
      var default_slot = create_slot(default_slot_template, ctx, null);
      var if_block = ctx.showIndicators && create_if_block(ctx);
      var block = {
        c: function create() {
          div4 = element("div");
          div2 = element("div");
          div1 = element("div");
          div0 = element("div");
          if (default_slot) default_slot.c();
          t0 = space();
          div3 = element("div");
          t1 = space();
          if (if_block) if_block.c();
          attr_dev(div0, "class", "swipeable-slot-wrapper svelte-mkioyx");
          add_location(div0, file, 236, 6, 5502);
          attr_dev(div1, "class", "swipeable-items svelte-mkioyx");
          add_location(div1, file, 235, 4, 5465);
          attr_dev(div2, "class", "swipe-item-wrapper svelte-mkioyx");
          add_location(div2, file, 234, 2, 5402);
          attr_dev(div3, "class", "swipe-handler svelte-mkioyx");
          add_location(div3, file, 241, 2, 5596);
          attr_dev(div4, "class", "swipe-panel svelte-mkioyx");
          add_location(div4, file, 233, 0, 5373);
          dispose = [listen_dev(div3, "touchstart", ctx.moveStart, false, false, false), listen_dev(div3, "mousedown", ctx.moveStart, false, false, false)];
        },
        l: function claim(nodes) {
          throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
        },
        m: function mount(target, anchor) {
          insert_dev(target, div4, anchor);
          append_dev(div4, div2);
          append_dev(div2, div1);
          append_dev(div1, div0);

          if (default_slot) {
            default_slot.m(div0, null);
          }

          ctx.div2_binding(div2);
          append_dev(div4, t0);
          append_dev(div4, div3);
          ctx.div3_binding(div3);
          append_dev(div4, t1);
          if (if_block) if_block.m(div4, null);
          current = true;
        },
        p: function update(changed, ctx) {
          if (default_slot && default_slot.p && changed.$$scope) {
            default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
          }

          if (ctx.showIndicators) {
            if (if_block) {
              if_block.p(changed, ctx);
            } else {
              if_block = create_if_block(ctx);
              if_block.c();
              if_block.m(div4, null);
            }
          } else if (if_block) {
            if_block.d(1);
            if_block = null;
          }
        },
        i: function intro(local) {
          if (current) return;
          transition_in(default_slot, local);
          current = true;
        },
        o: function outro(local) {
          transition_out(default_slot, local);
          current = false;
        },
        d: function destroy(detaching) {
          if (detaching) detach_dev(div4);
          if (default_slot) default_slot.d(detaching);
          ctx.div2_binding(null);
          ctx.div3_binding(null);
          if (if_block) if_block.d();
          run_all(dispose);
        }
      };
      dispatch_dev("SvelteRegisterBlock", {
        block,
        id: create_fragment.name,
        type: "component",
        source: "",
        ctx
      });
      return block;
    }

    var topClearence = 0;
    var min = 0;
    var dir = 0;

    function instance($$self, $$props, $$invalidate) {
      var {
        transitionDuration = 200
      } = $$props;
      var {
        showIndicators = false
      } = $$props;
      var {
        autoplay = false
      } = $$props;
      var {
        delay = 1000
      } = $$props;
      var activeIndicator = 0;
      var indicators;
      var items = 0;
      var availableWidth = 0;
      var elems;
      var diff = 0;
      var swipeWrapper;
      var swipeHandler;
      var touchingTpl = "\n    -webkit-transition-duration: 0s;\n    transition-duration: 0s;\n    -webkit-transform: translate3d(-{{val}}px, 0, 0);\n    -ms-transform: translate3d(-{{val}}px, 0, 0);";
      var non_touchingTpl = "\n    -webkit-transition-duration: ".concat(transitionDuration, "ms;\n    transition-duration: ").concat(transitionDuration, "ms;\n    -webkit-transform: translate3d(-{{val}}px, 0, 0);\n    -ms-transform: translate3d(-{{val}}px, 0, 0);");
      var touching = false;
      var posX = 0;
      var x;
      var played = 0;
      var run_interval = false;

      function update() {
        $$invalidate("swipeHandler", swipeHandler.style.top = topClearence + "px", swipeHandler);
        availableWidth = swipeWrapper.querySelector(".swipeable-items").offsetWidth;

        for (var i = 0; i < items; i++) {
          elems[i].style.transform = "translate3d(" + availableWidth * i + "px, 0, 0)";
        }

        diff = 0;
      }

      function init() {
        elems = swipeWrapper.querySelectorAll(".swipeable-item");
        $$invalidate("items", items = elems.length);
        update();
      }

      onMount(() => {
        init();
        window.addEventListener("resize", update);
      });
      onDestroy(() => {
        window.removeEventListener("resize", update);
      });

      function moveHandler(e) {
        if (touching) {
          e.stopImmediatePropagation();
          e.stopPropagation();
          var max = availableWidth;

          var _x = e.touches ? e.touches[0].pageX : e.pageX;

          var _diff = x - _x + posX;

          var _dir = _x > x ? 0 : 1;

          if (!_dir) {
            _diff = posX - (_x - x);
          }

          if (_diff <= max * (items - 1) && _diff >= min) {
            for (var i = 0; i < items; i++) {
              var template = i < 0 ? "{{val}}" : "-{{val}}";

              var _value = max * i - _diff;

              elems[i].style.cssText = touchingTpl.replace(template, _value).replace(template, _value);
            }

            diff = _diff;
          }
        }
      }

      function endHandler(e) {
        e && e.stopImmediatePropagation();
        e && e.stopPropagation();
        e && e.preventDefault();
        var max = availableWidth;
        touching = false;
        x = null;
        var swipe_threshold = 0.85;
        var d_max = diff / max;

        var _target = Math.round(d_max);

        if (Math.abs(_target - d_max) < swipe_threshold) {
          diff = _target * max;
        } else {
          diff = (dir ? _target - 1 : _target + 1) * max;
        }

        posX = diff;
        $$invalidate("activeIndicator", activeIndicator = diff / max);

        for (var i = 0; i < items; i++) {
          var template = i < 0 ? "{{val}}" : "-{{val}}";

          var _value = max * i - posX;

          elems[i].style.cssText = non_touchingTpl.replace(template, _value).replace(template, _value);
        }

        window.removeEventListener("mousemove", moveHandler);
        window.removeEventListener("mouseup", endHandler);
        window.removeEventListener("touchmove", moveHandler);
        window.removeEventListener("touchend", endHandler);
      }

      function moveStart(e) {
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
        touching = true;
        x = e.touches ? e.touches[0].pageX : e.pageX;
        window.addEventListener("mousemove", moveHandler);
        window.addEventListener("mouseup", endHandler);
        window.addEventListener("touchmove", moveHandler);
        window.addEventListener("touchend", endHandler);
      }

      function changeItem(item) {
        var max = availableWidth;
        diff = max * item;
        $$invalidate("activeIndicator", activeIndicator = item);
        endHandler();
      }

      function changeView() {
        changeItem(played);
        played = played < items - 1 ? ++played : 0;
      }

      var writable_props = ["transitionDuration", "showIndicators", "autoplay", "delay"];
      Object.keys($$props).forEach(key => {
        if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn("<Swipe> was created with unknown prop '".concat(key, "'"));
      });
      var {
        $$slots = {},
        $$scope
      } = $$props;

      function div2_binding($$value) {
        binding_callbacks[$$value ? "unshift" : "push"](() => {
          $$invalidate("swipeWrapper", swipeWrapper = $$value);
        });
      }

      function div3_binding($$value) {
        binding_callbacks[$$value ? "unshift" : "push"](() => {
          $$invalidate("swipeHandler", swipeHandler = $$value);
        });
      }

      var click_handler = (_ref) => {
        var {
          i
        } = _ref;
        changeItem(i);
      };

      $$self.$set = $$props => {
        if ("transitionDuration" in $$props) $$invalidate("transitionDuration", transitionDuration = $$props.transitionDuration);
        if ("showIndicators" in $$props) $$invalidate("showIndicators", showIndicators = $$props.showIndicators);
        if ("autoplay" in $$props) $$invalidate("autoplay", autoplay = $$props.autoplay);
        if ("delay" in $$props) $$invalidate("delay", delay = $$props.delay);
        if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
      };

      $$self.$capture_state = () => {
        return {
          transitionDuration,
          showIndicators,
          autoplay,
          delay,
          activeIndicator,
          indicators,
          items,
          availableWidth,
          topClearence,
          elems,
          diff,
          swipeWrapper,
          swipeHandler,
          min,
          touchingTpl,
          non_touchingTpl,
          touching,
          posX,
          dir,
          x,
          played,
          run_interval
        };
      };

      $$self.$inject_state = $$props => {
        if ("transitionDuration" in $$props) $$invalidate("transitionDuration", transitionDuration = $$props.transitionDuration);
        if ("showIndicators" in $$props) $$invalidate("showIndicators", showIndicators = $$props.showIndicators);
        if ("autoplay" in $$props) $$invalidate("autoplay", autoplay = $$props.autoplay);
        if ("delay" in $$props) $$invalidate("delay", delay = $$props.delay);
        if ("activeIndicator" in $$props) $$invalidate("activeIndicator", activeIndicator = $$props.activeIndicator);
        if ("indicators" in $$props) $$invalidate("indicators", indicators = $$props.indicators);
        if ("items" in $$props) $$invalidate("items", items = $$props.items);
        if ("availableWidth" in $$props) availableWidth = $$props.availableWidth;
        if ("topClearence" in $$props) topClearence = $$props.topClearence;
        if ("elems" in $$props) elems = $$props.elems;
        if ("diff" in $$props) diff = $$props.diff;
        if ("swipeWrapper" in $$props) $$invalidate("swipeWrapper", swipeWrapper = $$props.swipeWrapper);
        if ("swipeHandler" in $$props) $$invalidate("swipeHandler", swipeHandler = $$props.swipeHandler);
        if ("min" in $$props) min = $$props.min;
        if ("touchingTpl" in $$props) touchingTpl = $$props.touchingTpl;
        if ("non_touchingTpl" in $$props) non_touchingTpl = $$props.non_touchingTpl;
        if ("touching" in $$props) touching = $$props.touching;
        if ("posX" in $$props) posX = $$props.posX;
        if ("dir" in $$props) dir = $$props.dir;
        if ("x" in $$props) x = $$props.x;
        if ("played" in $$props) played = $$props.played;
        if ("run_interval" in $$props) $$invalidate("run_interval", run_interval = $$props.run_interval);
      };

      $$self.$$.update = function () {
        var changed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
          items: 1,
          autoplay: 1,
          run_interval: 1,
          delay: 1
        };

        if (changed.items) {
           $$invalidate("indicators", indicators = Array(items));
        }

        if (changed.autoplay || changed.run_interval || changed.delay) {
           {
            if (autoplay && !run_interval) {
              $$invalidate("run_interval", run_interval = setInterval(changeView, delay));
            }

            if (!autoplay && run_interval) {
              clearInterval(run_interval);
              $$invalidate("run_interval", run_interval = false);
            }
          }
        }
      };

      return {
        transitionDuration,
        showIndicators,
        autoplay,
        delay,
        activeIndicator,
        indicators,
        swipeWrapper,
        swipeHandler,
        moveStart,
        changeItem,
        div2_binding,
        div3_binding,
        click_handler,
        $$slots,
        $$scope
      };
    }

    class Swipe extends SvelteComponentDev {
      constructor(options) {
        super(options);
        init(this, options, instance, create_fragment, safe_not_equal, {
          transitionDuration: 0,
          showIndicators: 0,
          autoplay: 0,
          delay: 0
        });
        dispatch_dev("SvelteRegisterComponent", {
          component: this,
          tagName: "Swipe",
          options,
          id: create_fragment.name
        });
      }

      get transitionDuration() {
        throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
      }

      set transitionDuration(value) {
        throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
      }

      get showIndicators() {
        throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
      }

      set showIndicators(value) {
        throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
      }

      get autoplay() {
        throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
      }

      set autoplay(value) {
        throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
      }

      get delay() {
        throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
      }

      set delay(value) {
        throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
      }

    }

    /* node_modules\svelte-swipe\src\SwipeItem.svelte generated by Svelte v3.15.0 */
    var file$1 = "node_modules\\svelte-swipe\\src\\SwipeItem.svelte";

    function create_fragment$1(ctx) {
      var div;
      var div_class_value;
      var current;
      var default_slot_template = ctx.$$slots.default;
      var default_slot = create_slot(default_slot_template, ctx, null);
      var block = {
        c: function create() {
          div = element("div");
          if (default_slot) default_slot.c();
          attr_dev(div, "class", div_class_value = "swipeable-item " + ctx.classes + " svelte-exn8e7");
          add_location(div, file$1, 15, 0, 224);
        },
        l: function claim(nodes) {
          throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
        },
        m: function mount(target, anchor) {
          insert_dev(target, div, anchor);

          if (default_slot) {
            default_slot.m(div, null);
          }

          current = true;
        },
        p: function update(changed, ctx) {
          if (default_slot && default_slot.p && changed.$$scope) {
            default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
          }

          if (!current || changed.classes && div_class_value !== (div_class_value = "swipeable-item " + ctx.classes + " svelte-exn8e7")) {
            attr_dev(div, "class", div_class_value);
          }
        },
        i: function intro(local) {
          if (current) return;
          transition_in(default_slot, local);
          current = true;
        },
        o: function outro(local) {
          transition_out(default_slot, local);
          current = false;
        },
        d: function destroy(detaching) {
          if (detaching) detach_dev(div);
          if (default_slot) default_slot.d(detaching);
        }
      };
      dispatch_dev("SvelteRegisterBlock", {
        block,
        id: create_fragment$1.name,
        type: "component",
        source: "",
        ctx
      });
      return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
      var {
        classes = ""
      } = $$props;
      var writable_props = ["classes"];
      Object.keys($$props).forEach(key => {
        if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn("<SwipeItem> was created with unknown prop '".concat(key, "'"));
      });
      var {
        $$slots = {},
        $$scope
      } = $$props;

      $$self.$set = $$props => {
        if ("classes" in $$props) $$invalidate("classes", classes = $$props.classes);
        if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
      };

      $$self.$capture_state = () => {
        return {
          classes
        };
      };

      $$self.$inject_state = $$props => {
        if ("classes" in $$props) $$invalidate("classes", classes = $$props.classes);
      };

      return {
        classes,
        $$slots,
        $$scope
      };
    }

    class SwipeItem extends SvelteComponentDev {
      constructor(options) {
        super(options);
        init(this, options, instance$1, create_fragment$1, safe_not_equal, {
          classes: 0
        });
        dispatch_dev("SvelteRegisterComponent", {
          component: this,
          tagName: "SwipeItem",
          options,
          id: create_fragment$1.name
        });
      }

      get classes() {
        throw new Error("<SwipeItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
      }

      set classes(value) {
        throw new Error("<SwipeItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
      }

    }

    function cubicOut(t) {
      var f = t - 1.0;
      return f * f * f + 1.0;
    }

    function fade(node, _ref2) {
      var {
        delay = 0,
        duration = 400,
        easing = identity
      } = _ref2;
      var o = +getComputedStyle(node).opacity;
      return {
        delay,
        duration,
        easing,
        css: t => "opacity: ".concat(t * o)
      };
    }

    function slide(node, _ref4) {
      var {
        delay = 0,
        duration = 400,
        easing = cubicOut
      } = _ref4;
      var style = getComputedStyle(node);
      var opacity = +style.opacity;
      var height = parseFloat(style.height);
      var padding_top = parseFloat(style.paddingTop);
      var padding_bottom = parseFloat(style.paddingBottom);
      var margin_top = parseFloat(style.marginTop);
      var margin_bottom = parseFloat(style.marginBottom);
      var border_top_width = parseFloat(style.borderTopWidth);
      var border_bottom_width = parseFloat(style.borderBottomWidth);
      return {
        delay,
        duration,
        easing,
        css: t => "overflow: hidden;" + "opacity: ".concat(Math.min(t * 20, 1) * opacity, ";") + "height: ".concat(t * height, "px;") + "padding-top: ".concat(t * padding_top, "px;") + "padding-bottom: ".concat(t * padding_bottom, "px;") + "margin-top: ".concat(t * margin_top, "px;") + "margin-bottom: ".concat(t * margin_bottom, "px;") + "border-top-width: ".concat(t * border_top_width, "px;") + "border-bottom-width: ".concat(t * border_bottom_width, "px;")
      };
    }

    /* src\Modal.svelte generated by Svelte v3.15.0 */
    var file$2 = "src\\Modal.svelte";

    var get_header_slot_changes = () => ({});

    var get_header_slot_context = () => ({});

    function create_fragment$2(ctx) {
      var div0;
      var t0;
      var div1;
      var t1;
      var t2;
      var hr;
      var div1_transition;
      var current;
      var dispose;
      var header_slot_template = ctx.$$slots.header;
      var header_slot = create_slot(header_slot_template, ctx, get_header_slot_context);
      var default_slot_template = ctx.$$slots.default;
      var default_slot = create_slot(default_slot_template, ctx, null);
      var block = {
        c: function create() {
          div0 = element("div");
          t0 = space();
          div1 = element("div");
          if (header_slot) header_slot.c();
          t1 = space();
          if (default_slot) default_slot.c();
          t2 = space();
          hr = element("hr");
          attr_dev(div0, "class", "modal-background svelte-1607ezm");
          add_location(div0, file$2, 42, 0, 980);
          add_location(hr, file$2, 48, 1, 1175);
          attr_dev(div1, "class", "modal svelte-1607ezm");
          attr_dev(div1, "role", "dialog");
          attr_dev(div1, "aria-modal", "true");
          add_location(div1, file$2, 44, 0, 1037);
          dispose = [listen_dev(window, "keydown", ctx.handle_keydown, false, false, false), listen_dev(div0, "click", ctx.close, false, false, false)];
        },
        l: function claim(nodes) {
          throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
        },
        m: function mount(target, anchor) {
          insert_dev(target, div0, anchor);
          insert_dev(target, t0, anchor);
          insert_dev(target, div1, anchor);

          if (header_slot) {
            header_slot.m(div1, null);
          }

          append_dev(div1, t1);

          if (default_slot) {
            default_slot.m(div1, null);
          }

          append_dev(div1, t2);
          append_dev(div1, hr);
          ctx.div1_binding(div1);
          current = true;
        },
        p: function update(changed, ctx) {
          if (header_slot && header_slot.p && changed.$$scope) {
            header_slot.p(get_slot_changes(header_slot_template, ctx, changed, get_header_slot_changes), get_slot_context(header_slot_template, ctx, get_header_slot_context));
          }

          if (default_slot && default_slot.p && changed.$$scope) {
            default_slot.p(get_slot_changes(default_slot_template, ctx, changed, null), get_slot_context(default_slot_template, ctx, null));
          }
        },
        i: function intro(local) {
          if (current) return;
          transition_in(header_slot, local);
          transition_in(default_slot, local);
          add_render_callback(() => {
            if (!div1_transition) div1_transition = create_bidirectional_transition(div1, slide, {}, true);
            div1_transition.run(1);
          });
          current = true;
        },
        o: function outro(local) {
          transition_out(header_slot, local);
          transition_out(default_slot, local);
          if (!div1_transition) div1_transition = create_bidirectional_transition(div1, slide, {}, false);
          div1_transition.run(0);
          current = false;
        },
        d: function destroy(detaching) {
          if (detaching) detach_dev(div0);
          if (detaching) detach_dev(t0);
          if (detaching) detach_dev(div1);
          if (header_slot) header_slot.d(detaching);
          if (default_slot) default_slot.d(detaching);
          ctx.div1_binding(null);
          if (detaching && div1_transition) div1_transition.end();
          run_all(dispose);
        }
      };
      dispatch_dev("SvelteRegisterBlock", {
        block,
        id: create_fragment$2.name,
        type: "component",
        source: "",
        ctx
      });
      return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
      var dispatch = createEventDispatcher();

      var close = () => dispatch("close");

      var modal;

      var handle_keydown = e => {
        if (e.key === "Escape") {
          close();
          return;
        }

        if (e.key === "Tab") {
          var nodes = modal.querySelectorAll("*");
          var tabbable = Array.from(nodes).filter(n => n.tabIndex >= 0);
          var index = tabbable.indexOf(document.activeElement);
          if (index === -1 && e.shiftKey) index = 0;
          index += tabbable.length + (e.shiftKey ? -1 : 1);
          index %= tabbable.length;
          tabbable[index].focus();
          e.preventDefault();
        }
      };

      var previously_focused = typeof document !== "undefined" && document.activeElement;

      if (previously_focused) {
        onDestroy(() => {
          previously_focused.focus();
        });
      }

      var {
        $$slots = {},
        $$scope
      } = $$props;

      function div1_binding($$value) {
        binding_callbacks[$$value ? "unshift" : "push"](() => {
          $$invalidate("modal", modal = $$value);
        });
      }

      $$self.$set = $$props => {
        if ("$$scope" in $$props) $$invalidate("$$scope", $$scope = $$props.$$scope);
      };

      $$self.$capture_state = () => {
        return {};
      };

      $$self.$inject_state = $$props => {
        if ("modal" in $$props) $$invalidate("modal", modal = $$props.modal);
      };

      return {
        close,
        modal,
        handle_keydown,
        div1_binding,
        $$slots,
        $$scope
      };
    }

    class Modal extends SvelteComponentDev {
      constructor(options) {
        super(options);
        init(this, options, instance$2, create_fragment$2, safe_not_equal, {});
        dispatch_dev("SvelteRegisterComponent", {
          component: this,
          tagName: "Modal",
          options,
          id: create_fragment$2.name
        });
      }

    }

    /* src\App.svelte generated by Svelte v3.15.0 */
    var file$3 = "src\\App.svelte"; // (149:0) {:else}

    function create_else_block(ctx) {
      var div0;
      var img0;
      var img0_src_value;
      var div0_transition;
      var t0;
      var img1;
      var img1_src_value;
      var img1_transition;
      var t1;
      var h1;
      var h1_transition;
      var t3;
      var p;
      var p_transition;
      var t5;
      var div1;
      var button;
      var div1_transition;
      var t7;
      var div4;
      var div2;
      var h20;
      var t8;
      var a;
      var span;
      var div2_transition;
      var t10;
      var div3;
      var h21;
      var div3_transition;
      var div4_transition;
      var current;
      var dispose;
      var block = {
        c: function create() {
          div0 = element("div");
          img0 = element("img");
          t0 = space();
          img1 = element("img");
          t1 = space();
          h1 = element("h1");
          h1.textContent = "Enable NFC reader";
          t3 = space();
          p = element("p");
          p.textContent = "Open the NFC reader on your iPhone to read the tag.";
          t5 = space();
          div1 = element("div");
          button = element("button");
          button.textContent = "Open Reader";
          t7 = space();
          div4 = element("div");
          div2 = element("div");
          h20 = element("h2");
          t8 = text("Already a user? ");
          a = element("a");
          span = element("span");
          span.textContent = "Login";
          t10 = space();
          div3 = element("div");
          h21 = element("h2");
          h21.textContent = "About Smart Access";
          if (img0.src !== (img0_src_value = "./images/color.png")) attr_dev(img0, "src", img0_src_value);
          attr_dev(img0, "alt", "");
          attr_dev(img0, "class", "svelte-ezhayv");
          add_location(img0, file$3, 150, 64, 2854);
          attr_dev(div0, "class", "header svelte-ezhayv");
          set_style(div0, "background", "white");
          add_location(div0, file$3, 150, 0, 2790);
          set_style(img1, "margin-left", "auto");
          set_style(img1, "margin-right", "auto");
          set_style(img1, "display", "block");
          if (img1.src !== (img1_src_value = "./images/no_nfc.png")) attr_dev(img1, "src", img1_src_value);
          attr_dev(img1, "alt", "");
          attr_dev(img1, "class", "svelte-ezhayv");
          add_location(img1, file$3, 151, 1, 2899);
          set_style(h1, "color", "black");
          attr_dev(h1, "class", "svelte-ezhayv");
          add_location(h1, file$3, 153, 2, 3015);
          set_style(p, "color", "black");
          attr_dev(p, "class", "svelte-ezhayv");
          add_location(p, file$3, 154, 2, 3083);
          attr_dev(button, "class", "has-pointer-event svelte-ezhayv");
          add_location(button, file$3, 156, 3, 3226);
          attr_dev(div1, "class", "button svelte-ezhayv");
          add_location(div1, file$3, 155, 2, 3185);
          attr_dev(span, "class", "svelte-ezhayv");
          add_location(span, file$3, 164, 108, 3530);
          attr_dev(a, "href", "");
          attr_dev(a, "class", "svelte-ezhayv");
          add_location(a, file$3, 164, 97, 3519);
          attr_dev(h20, "class", "login svelte-ezhayv");
          set_style(h20, "color", "black");
          set_style(h20, "position", "absolute");
          set_style(h20, "bottom", "5%");
          set_style(h20, "left", "34%");
          add_location(h20, file$3, 164, 1, 3423);
          attr_dev(div2, "class", "svelte-ezhayv");
          add_location(div2, file$3, 163, 0, 3399);
          attr_dev(h21, "class", "svelte-ezhayv");
          add_location(h21, file$3, 168, 72, 3644);
          set_style(div3, "position", "absolute");
          set_style(div3, "bottom", "0px");
          set_style(div3, "left", "34%");
          attr_dev(div3, "class", "svelte-ezhayv");
          add_location(div3, file$3, 168, 1, 3573);
          attr_dev(div4, "class", "bottom svelte-ezhayv");
          set_style(div4, "background", "white");
          add_location(div4, file$3, 160, 0, 3329);
          dispose = listen_dev(button, "click", ctx.click_handler_1, false, false, false);
        },
        m: function mount(target, anchor) {
          insert_dev(target, div0, anchor);
          append_dev(div0, img0);
          insert_dev(target, t0, anchor);
          insert_dev(target, img1, anchor);
          insert_dev(target, t1, anchor);
          insert_dev(target, h1, anchor);
          insert_dev(target, t3, anchor);
          insert_dev(target, p, anchor);
          insert_dev(target, t5, anchor);
          insert_dev(target, div1, anchor);
          append_dev(div1, button);
          insert_dev(target, t7, anchor);
          insert_dev(target, div4, anchor);
          append_dev(div4, div2);
          append_dev(div2, h20);
          append_dev(h20, t8);
          append_dev(h20, a);
          append_dev(a, span);
          append_dev(div4, t10);
          append_dev(div4, div3);
          append_dev(div3, h21);
          current = true;
        },
        p: noop,
        i: function intro(local) {
          if (current) return;
          add_render_callback(() => {
            if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, {}, true);
            div0_transition.run(1);
          });
          add_render_callback(() => {
            if (!img1_transition) img1_transition = create_bidirectional_transition(img1, fade, {}, true);
            img1_transition.run(1);
          });
          add_render_callback(() => {
            if (!h1_transition) h1_transition = create_bidirectional_transition(h1, fade, {}, true);
            h1_transition.run(1);
          });
          add_render_callback(() => {
            if (!p_transition) p_transition = create_bidirectional_transition(p, fade, {}, true);
            p_transition.run(1);
          });
          add_render_callback(() => {
            if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
            div1_transition.run(1);
          });
          add_render_callback(() => {
            if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, true);
            div2_transition.run(1);
          });
          add_render_callback(() => {
            if (!div3_transition) div3_transition = create_bidirectional_transition(div3, fade, {}, true);
            div3_transition.run(1);
          });
          add_render_callback(() => {
            if (!div4_transition) div4_transition = create_bidirectional_transition(div4, fade, {}, true);
            div4_transition.run(1);
          });
          current = true;
        },
        o: function outro(local) {
          if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, {}, false);
          div0_transition.run(0);
          if (!img1_transition) img1_transition = create_bidirectional_transition(img1, fade, {}, false);
          img1_transition.run(0);
          if (!h1_transition) h1_transition = create_bidirectional_transition(h1, fade, {}, false);
          h1_transition.run(0);
          if (!p_transition) p_transition = create_bidirectional_transition(p, fade, {}, false);
          p_transition.run(0);
          if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
          div1_transition.run(0);
          if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, false);
          div2_transition.run(0);
          if (!div3_transition) div3_transition = create_bidirectional_transition(div3, fade, {}, false);
          div3_transition.run(0);
          if (!div4_transition) div4_transition = create_bidirectional_transition(div4, fade, {}, false);
          div4_transition.run(0);
          current = false;
        },
        d: function destroy(detaching) {
          if (detaching) detach_dev(div0);
          if (detaching && div0_transition) div0_transition.end();
          if (detaching) detach_dev(t0);
          if (detaching) detach_dev(img1);
          if (detaching && img1_transition) img1_transition.end();
          if (detaching) detach_dev(t1);
          if (detaching) detach_dev(h1);
          if (detaching && h1_transition) h1_transition.end();
          if (detaching) detach_dev(t3);
          if (detaching) detach_dev(p);
          if (detaching && p_transition) p_transition.end();
          if (detaching) detach_dev(t5);
          if (detaching) detach_dev(div1);
          if (detaching && div1_transition) div1_transition.end();
          if (detaching) detach_dev(t7);
          if (detaching) detach_dev(div4);
          if (detaching && div2_transition) div2_transition.end();
          if (detaching && div3_transition) div3_transition.end();
          if (detaching && div4_transition) div4_transition.end();
          dispose();
        }
      };
      dispatch_dev("SvelteRegisterBlock", {
        block,
        id: create_else_block.name,
        type: "else",
        source: "(149:0) {:else}",
        ctx
      });
      return block;
    } // (99:1) {#if nfc}


    function create_if_block_1(ctx) {
      var div0;
      var img;
      var img_src_value;
      var t0;
      var div1;
      var t1;
      var div4;
      var div2;
      var h20;
      var t3;
      var div3;
      var h21;
      var t4;
      var a;
      var span;
      var current;
      var swipe = new Swipe({
        props: {
          showIndicators,
          transitionDuration,
          $$slots: {
            default: [create_default_slot_1]
          },
          $$scope: {
            ctx
          }
        },
        $$inline: true
      });
      var block = {
        c: function create() {
          div0 = element("div");
          img = element("img");
          t0 = space();
          div1 = element("div");
          create_component(swipe.$$.fragment);
          t1 = space();
          div4 = element("div");
          div2 = element("div");
          h20 = element("h2");
          h20.textContent = "Skip tour";
          t3 = space();
          div3 = element("div");
          h21 = element("h2");
          t4 = text("Already a user? ");
          a = element("a");
          span = element("span");
          span.textContent = "Login";
          if (img.src !== (img_src_value = "./images/white.png")) attr_dev(img, "src", img_src_value);
          attr_dev(img, "alt", "");
          attr_dev(img, "class", "svelte-ezhayv");
          add_location(img, file$3, 100, 23, 1705);
          attr_dev(div0, "class", "header svelte-ezhayv");
          add_location(div0, file$3, 100, 1, 1683);
          attr_dev(div1, "class", "swipe-holder svelte-ezhayv");
          add_location(div1, file$3, 104, 0, 1753);
          attr_dev(h20, "class", "svelte-ezhayv");
          add_location(h20, file$3, 138, 2, 2599);
          attr_dev(div2, "class", "svelte-ezhayv");
          add_location(div2, file$3, 137, 1, 2591);
          attr_dev(span, "class", "svelte-ezhayv");
          add_location(span, file$3, 141, 67, 2699);
          attr_dev(a, "href", "");
          attr_dev(a, "class", "svelte-ezhayv");
          add_location(a, file$3, 141, 56, 2688);
          attr_dev(h21, "class", "login svelte-ezhayv");
          set_style(h21, "color", "white");
          add_location(h21, file$3, 141, 1, 2633);
          attr_dev(div3, "class", "svelte-ezhayv");
          add_location(div3, file$3, 140, 0, 2626);
          attr_dev(div4, "class", "bottom svelte-ezhayv");
          add_location(div4, file$3, 135, 0, 2567);
        },
        m: function mount(target, anchor) {
          insert_dev(target, div0, anchor);
          append_dev(div0, img);
          insert_dev(target, t0, anchor);
          insert_dev(target, div1, anchor);
          mount_component(swipe, div1, null);
          insert_dev(target, t1, anchor);
          insert_dev(target, div4, anchor);
          append_dev(div4, div2);
          append_dev(div2, h20);
          append_dev(div4, t3);
          append_dev(div4, div3);
          append_dev(div3, h21);
          append_dev(h21, t4);
          append_dev(h21, a);
          append_dev(a, span);
          current = true;
        },
        p: function update(changed, ctx) {
          var swipe_changes = {};

          if (changed.$$scope || changed.nfc) {
            swipe_changes.$$scope = {
              changed,
              ctx
            };
          }

          swipe.$set(swipe_changes);
        },
        i: function intro(local) {
          if (current) return;
          transition_in(swipe.$$.fragment, local);
          current = true;
        },
        o: function outro(local) {
          transition_out(swipe.$$.fragment, local);
          current = false;
        },
        d: function destroy(detaching) {
          if (detaching) detach_dev(div0);
          if (detaching) detach_dev(t0);
          if (detaching) detach_dev(div1);
          destroy_component(swipe);
          if (detaching) detach_dev(t1);
          if (detaching) detach_dev(div4);
        }
      };
      dispatch_dev("SvelteRegisterBlock", {
        block,
        id: create_if_block_1.name,
        type: "if",
        source: "(99:1) {#if nfc}",
        ctx
      });
      return block;
    } // (107:4) <SwipeItem>


    function create_default_slot_4(ctx) {
      var img;
      var img_src_value;
      var t0;
      var h1;
      var t2;
      var p;
      var block = {
        c: function create() {
          img = element("img");
          t0 = space();
          h1 = element("h1");
          h1.textContent = "Educate";
          t2 = space();
          p = element("p");
          p.textContent = "Assist at the point of activity with process knowledge and product information.";
          if (img.src !== (img_src_value = "./images/educate.png")) attr_dev(img, "src", img_src_value);
          attr_dev(img, "alt", "");
          attr_dev(img, "class", "svelte-ezhayv");
          add_location(img, file$3, 107, 6, 1851);
          attr_dev(h1, "class", "svelte-ezhayv");
          add_location(h1, file$3, 108, 3, 1898);
          attr_dev(p, "class", "svelte-ezhayv");
          add_location(p, file$3, 109, 3, 1918);
        },
        m: function mount(target, anchor) {
          insert_dev(target, img, anchor);
          insert_dev(target, t0, anchor);
          insert_dev(target, h1, anchor);
          insert_dev(target, t2, anchor);
          insert_dev(target, p, anchor);
        },
        d: function destroy(detaching) {
          if (detaching) detach_dev(img);
          if (detaching) detach_dev(t0);
          if (detaching) detach_dev(h1);
          if (detaching) detach_dev(t2);
          if (detaching) detach_dev(p);
        }
      };
      dispatch_dev("SvelteRegisterBlock", {
        block,
        id: create_default_slot_4.name,
        type: "slot",
        source: "(107:4) <SwipeItem>",
        ctx
      });
      return block;
    } // (113:4) <SwipeItem>


    function create_default_slot_3(ctx) {
      var img;
      var img_src_value;
      var t0;
      var h1;
      var t2;
      var p;
      var block = {
        c: function create() {
          img = element("img");
          t0 = space();
          h1 = element("h1");
          h1.textContent = "Assess";
          t2 = space();
          p = element("p");
          p.textContent = "References and training checklists provide real-time assesment and employmee support.";
          if (img.src !== (img_src_value = "./images/assess.png")) attr_dev(img, "src", img_src_value);
          attr_dev(img, "alt", "");
          attr_dev(img, "class", "svelte-ezhayv");
          add_location(img, file$3, 113, 6, 2047);
          attr_dev(h1, "class", "svelte-ezhayv");
          add_location(h1, file$3, 114, 3, 2089);
          attr_dev(p, "class", "svelte-ezhayv");
          add_location(p, file$3, 115, 3, 2108);
        },
        m: function mount(target, anchor) {
          insert_dev(target, img, anchor);
          insert_dev(target, t0, anchor);
          insert_dev(target, h1, anchor);
          insert_dev(target, t2, anchor);
          insert_dev(target, p, anchor);
        },
        d: function destroy(detaching) {
          if (detaching) detach_dev(img);
          if (detaching) detach_dev(t0);
          if (detaching) detach_dev(h1);
          if (detaching) detach_dev(t2);
          if (detaching) detach_dev(p);
        }
      };
      dispatch_dev("SvelteRegisterBlock", {
        block,
        id: create_default_slot_3.name,
        type: "slot",
        source: "(113:4) <SwipeItem>",
        ctx
      });
      return block;
    } // (120:4) <SwipeItem>


    function create_default_slot_2(ctx) {
      var img;
      var img_src_value;
      var t0;
      var h1;
      var t2;
      var p;
      var t4;
      var div;
      var button;
      var dispose;
      var block = {
        c: function create() {
          img = element("img");
          t0 = space();
          h1 = element("h1");
          h1.textContent = "Assess";
          t2 = space();
          p = element("p");
          p.textContent = "References and training checklists provide real-time assesment and employmee support.";
          t4 = space();
          div = element("div");
          button = element("button");
          button.textContent = "Finish";
          if (img.src !== (img_src_value = "./images/empower.png")) attr_dev(img, "src", img_src_value);
          attr_dev(img, "alt", "");
          attr_dev(img, "class", "svelte-ezhayv");
          add_location(img, file$3, 120, 7, 2245);
          attr_dev(h1, "class", "svelte-ezhayv");
          add_location(h1, file$3, 122, 3, 2289);
          attr_dev(p, "class", "svelte-ezhayv");
          add_location(p, file$3, 123, 3, 2308);
          attr_dev(button, "class", "has-pointer-event svelte-ezhayv");
          add_location(button, file$3, 125, 4, 2430);
          attr_dev(div, "class", "button svelte-ezhayv");
          add_location(div, file$3, 124, 3, 2405);
          dispose = listen_dev(button, "click", ctx.click_handler, false, false, false);
        },
        m: function mount(target, anchor) {
          insert_dev(target, img, anchor);
          insert_dev(target, t0, anchor);
          insert_dev(target, h1, anchor);
          insert_dev(target, t2, anchor);
          insert_dev(target, p, anchor);
          insert_dev(target, t4, anchor);
          insert_dev(target, div, anchor);
          append_dev(div, button);
        },
        p: noop,
        d: function destroy(detaching) {
          if (detaching) detach_dev(img);
          if (detaching) detach_dev(t0);
          if (detaching) detach_dev(h1);
          if (detaching) detach_dev(t2);
          if (detaching) detach_dev(p);
          if (detaching) detach_dev(t4);
          if (detaching) detach_dev(div);
          dispose();
        }
      };
      dispatch_dev("SvelteRegisterBlock", {
        block,
        id: create_default_slot_2.name,
        type: "slot",
        source: "(120:4) <SwipeItem>",
        ctx
      });
      return block;
    } // (106:2) <Swipe {showIndicators}  {transitionDuration}>


    function create_default_slot_1(ctx) {
      var t0;
      var t1;
      var current;
      var swipeitem0 = new SwipeItem({
        props: {
          $$slots: {
            default: [create_default_slot_4]
          },
          $$scope: {
            ctx
          }
        },
        $$inline: true
      });
      var swipeitem1 = new SwipeItem({
        props: {
          $$slots: {
            default: [create_default_slot_3]
          },
          $$scope: {
            ctx
          }
        },
        $$inline: true
      });
      var swipeitem2 = new SwipeItem({
        props: {
          $$slots: {
            default: [create_default_slot_2]
          },
          $$scope: {
            ctx
          }
        },
        $$inline: true
      });
      var block = {
        c: function create() {
          create_component(swipeitem0.$$.fragment);
          t0 = space();
          create_component(swipeitem1.$$.fragment);
          t1 = space();
          create_component(swipeitem2.$$.fragment);
        },
        m: function mount(target, anchor) {
          mount_component(swipeitem0, target, anchor);
          insert_dev(target, t0, anchor);
          mount_component(swipeitem1, target, anchor);
          insert_dev(target, t1, anchor);
          mount_component(swipeitem2, target, anchor);
          current = true;
        },
        p: function update(changed, ctx) {
          var swipeitem0_changes = {};

          if (changed.$$scope) {
            swipeitem0_changes.$$scope = {
              changed,
              ctx
            };
          }

          swipeitem0.$set(swipeitem0_changes);
          var swipeitem1_changes = {};

          if (changed.$$scope) {
            swipeitem1_changes.$$scope = {
              changed,
              ctx
            };
          }

          swipeitem1.$set(swipeitem1_changes);
          var swipeitem2_changes = {};

          if (changed.$$scope || changed.nfc) {
            swipeitem2_changes.$$scope = {
              changed,
              ctx
            };
          }

          swipeitem2.$set(swipeitem2_changes);
        },
        i: function intro(local) {
          if (current) return;
          transition_in(swipeitem0.$$.fragment, local);
          transition_in(swipeitem1.$$.fragment, local);
          transition_in(swipeitem2.$$.fragment, local);
          current = true;
        },
        o: function outro(local) {
          transition_out(swipeitem0.$$.fragment, local);
          transition_out(swipeitem1.$$.fragment, local);
          transition_out(swipeitem2.$$.fragment, local);
          current = false;
        },
        d: function destroy(detaching) {
          destroy_component(swipeitem0, detaching);
          if (detaching) detach_dev(t0);
          destroy_component(swipeitem1, detaching);
          if (detaching) detach_dev(t1);
          destroy_component(swipeitem2, detaching);
        }
      };
      dispatch_dev("SvelteRegisterBlock", {
        block,
        id: create_default_slot_1.name,
        type: "slot",
        source: "(106:2) <Swipe {showIndicators}  {transitionDuration}>",
        ctx
      });
      return block;
    } // (176:0) {#if showModal}


    function create_if_block$1(ctx) {
      var current;
      var modal = new Modal({
        props: {
          $$slots: {
            default: [create_default_slot],
            header: [create_header_slot]
          },
          $$scope: {
            ctx
          }
        },
        $$inline: true
      });
      modal.$on("close", ctx.close_handler);
      var block = {
        c: function create() {
          create_component(modal.$$.fragment);
        },
        m: function mount(target, anchor) {
          mount_component(modal, target, anchor);
          current = true;
        },
        p: function update(changed, ctx) {
          var modal_changes = {};

          if (changed.$$scope || changed.showModal) {
            modal_changes.$$scope = {
              changed,
              ctx
            };
          }

          modal.$set(modal_changes);
        },
        i: function intro(local) {
          if (current) return;
          transition_in(modal.$$.fragment, local);
          current = true;
        },
        o: function outro(local) {
          transition_out(modal.$$.fragment, local);
          current = false;
        },
        d: function destroy(detaching) {
          destroy_component(modal, detaching);
        }
      };
      dispatch_dev("SvelteRegisterBlock", {
        block,
        id: create_if_block$1.name,
        type: "if",
        source: "(176:0) {#if showModal}",
        ctx
      });
      return block;
    } // (178:2) <h2 slot="header" style="text-align:center;margin-top: 0px;margin-bottom: 0px;">


    function create_header_slot(ctx) {
      var h2;
      var block = {
        c: function create() {
          h2 = element("h2");
          h2.textContent = "Ready to Scan";
          attr_dev(h2, "slot", "header");
          set_style(h2, "text-align", "center");
          set_style(h2, "margin-top", "0px");
          set_style(h2, "margin-bottom", "0px");
          attr_dev(h2, "class", "svelte-ezhayv");
          add_location(h2, file$3, 177, 2, 3796);
        },
        m: function mount(target, anchor) {
          insert_dev(target, h2, anchor);
        },
        d: function destroy(detaching) {
          if (detaching) detach_dev(h2);
        }
      };
      dispatch_dev("SvelteRegisterBlock", {
        block,
        id: create_header_slot.name,
        type: "slot",
        source: "(178:2) <h2 slot=\\\"header\\\" style=\\\"text-align:center;margin-top: 0px;margin-bottom: 0px;\\\">",
        ctx
      });
      return block;
    } // (177:1) <Modal  on:close="{() => showModal = false}">


    function create_default_slot(ctx) {
      var t0;
      var img;
      var img_src_value;
      var img_transition;
      var t1;
      var p;
      var p_transition;
      var t3;
      var div;
      var button;
      var div_transition;
      var current;
      var dispose;
      var block = {
        c: function create() {
          t0 = space();
          img = element("img");
          t1 = space();
          p = element("p");
          p.textContent = "Hold your device near the tag to scan it.";
          t3 = space();
          div = element("div");
          button = element("button");
          button.textContent = "Cancel";
          set_style(img, "margin-left", "auto");
          set_style(img, "margin-right", "auto");
          set_style(img, "display", "block");
          set_style(img, "max-height", "5%");
          if (img.src !== (img_src_value = "./images/no_nfc.png")) attr_dev(img, "src", img_src_value);
          attr_dev(img, "alt", "");
          attr_dev(img, "class", "svelte-ezhayv");
          add_location(img, file$3, 180, 0, 3902);
          set_style(p, "color", "black");
          set_style(p, "padding-left", "0");
          set_style(p, "padding-right", "0");
          attr_dev(p, "class", "svelte-ezhayv");
          add_location(p, file$3, 183, 2, 4036);
          attr_dev(button, "class", "has-pointer-event svelte-ezhayv");
          add_location(button, file$3, 185, 3, 4200);
          attr_dev(div, "class", "button svelte-ezhayv");
          add_location(div, file$3, 184, 2, 4159);
          dispose = listen_dev(button, "click", ctx.click_handler_2, false, false, false);
        },
        m: function mount(target, anchor) {
          insert_dev(target, t0, anchor);
          insert_dev(target, img, anchor);
          insert_dev(target, t1, anchor);
          insert_dev(target, p, anchor);
          insert_dev(target, t3, anchor);
          insert_dev(target, div, anchor);
          append_dev(div, button);
          current = true;
        },
        p: noop,
        i: function intro(local) {
          if (current) return;
          add_render_callback(() => {
            if (!img_transition) img_transition = create_bidirectional_transition(img, fade, {}, true);
            img_transition.run(1);
          });
          add_render_callback(() => {
            if (!p_transition) p_transition = create_bidirectional_transition(p, fade, {}, true);
            p_transition.run(1);
          });
          add_render_callback(() => {
            if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, true);
            div_transition.run(1);
          });
          current = true;
        },
        o: function outro(local) {
          if (!img_transition) img_transition = create_bidirectional_transition(img, fade, {}, false);
          img_transition.run(0);
          if (!p_transition) p_transition = create_bidirectional_transition(p, fade, {}, false);
          p_transition.run(0);
          if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, false);
          div_transition.run(0);
          current = false;
        },
        d: function destroy(detaching) {
          if (detaching) detach_dev(t0);
          if (detaching) detach_dev(img);
          if (detaching && img_transition) img_transition.end();
          if (detaching) detach_dev(t1);
          if (detaching) detach_dev(p);
          if (detaching && p_transition) p_transition.end();
          if (detaching) detach_dev(t3);
          if (detaching) detach_dev(div);
          if (detaching && div_transition) div_transition.end();
          dispose();
        }
      };
      dispatch_dev("SvelteRegisterBlock", {
        block,
        id: create_default_slot.name,
        type: "slot",
        source: "(177:1) <Modal  on:close=\\\"{() => showModal = false}\\\">",
        ctx
      });
      return block;
    }

    function create_fragment$3(ctx) {
      var current_block_type_index;
      var if_block0;
      var t;
      var if_block1_anchor;
      var current;
      var if_block_creators = [create_if_block_1, create_else_block];
      var if_blocks = [];

      function select_block_type(changed, ctx) {
        if (ctx.nfc) return 0;
        return 1;
      }

      current_block_type_index = select_block_type(null, ctx);
      if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
      var if_block1 = ctx.showModal && create_if_block$1(ctx);
      var block = {
        c: function create() {
          if_block0.c();
          t = space();
          if (if_block1) if_block1.c();
          if_block1_anchor = empty();
        },
        l: function claim(nodes) {
          throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
        },
        m: function mount(target, anchor) {
          if_blocks[current_block_type_index].m(target, anchor);
          insert_dev(target, t, anchor);
          if (if_block1) if_block1.m(target, anchor);
          insert_dev(target, if_block1_anchor, anchor);
          current = true;
        },
        p: function update(changed, ctx) {
          var previous_block_index = current_block_type_index;
          current_block_type_index = select_block_type(changed, ctx);

          if (current_block_type_index === previous_block_index) {
            if_blocks[current_block_type_index].p(changed, ctx);
          } else {
            group_outros();
            transition_out(if_blocks[previous_block_index], 1, 1, () => {
              if_blocks[previous_block_index] = null;
            });
            check_outros();
            if_block0 = if_blocks[current_block_type_index];

            if (!if_block0) {
              if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
              if_block0.c();
            }

            transition_in(if_block0, 1);
            if_block0.m(t.parentNode, t);
          }

          if (ctx.showModal) {
            if (if_block1) {
              if_block1.p(changed, ctx);
              transition_in(if_block1, 1);
            } else {
              if_block1 = create_if_block$1(ctx);
              if_block1.c();
              transition_in(if_block1, 1);
              if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
            }
          } else if (if_block1) {
            group_outros();
            transition_out(if_block1, 1, 1, () => {
              if_block1 = null;
            });
            check_outros();
          }
        },
        i: function intro(local) {
          if (current) return;
          transition_in(if_block0);
          transition_in(if_block1);
          current = true;
        },
        o: function outro(local) {
          transition_out(if_block0);
          transition_out(if_block1);
          current = false;
        },
        d: function destroy(detaching) {
          if_blocks[current_block_type_index].d(detaching);
          if (detaching) detach_dev(t);
          if (if_block1) if_block1.d(detaching);
          if (detaching) detach_dev(if_block1_anchor);
        }
      };
      dispatch_dev("SvelteRegisterBlock", {
        block,
        id: create_fragment$3.name,
        type: "component",
        source: "",
        ctx
      });
      return block;
    }

    var showIndicators = true;
    var transitionDuration = 1000;

    function instance$3($$self, $$props, $$invalidate) {
      var showModal = false;
      var nfc = true;

      var click_handler = () => $$invalidate("nfc", nfc = false);

      var click_handler_1 = () => $$invalidate("showModal", showModal = true);

      var click_handler_2 = () => $$invalidate("showModal", showModal = false);

      var close_handler = () => $$invalidate("showModal", showModal = false);

      $$self.$capture_state = () => {
        return {};
      };

      $$self.$inject_state = $$props => {
        if ("showModal" in $$props) $$invalidate("showModal", showModal = $$props.showModal);
        if ("nfc" in $$props) $$invalidate("nfc", nfc = $$props.nfc);
        if ("showIndicators" in $$props) $$invalidate("showIndicators", showIndicators = $$props.showIndicators);
        if ("transitionDuration" in $$props) $$invalidate("transitionDuration", transitionDuration = $$props.transitionDuration);
      };

      return {
        showModal,
        nfc,
        click_handler,
        click_handler_1,
        click_handler_2,
        close_handler
      };
    }

    class App extends SvelteComponentDev {
      constructor(options) {
        super(options);
        init(this, options, instance$3, create_fragment$3, safe_not_equal, {});
        dispatch_dev("SvelteRegisterComponent", {
          component: this,
          tagName: "App",
          options,
          id: create_fragment$3.name
        });
      }

    }

    var app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
