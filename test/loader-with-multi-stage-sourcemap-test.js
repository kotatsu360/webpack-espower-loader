'use strict';

var assert = require('power-assert');
var sourceMap = require("source-map");
var Consumer = sourceMap.SourceMapConsumer;
var convert = require('convert-source-map');
var espower = require('../index');

/**
 * coffee -> js -> powered-js
 *
 * coffee code
 *   1: zero = 0
 *   2: assert zero, 1
 *
 * js code
 *   1: var zero;
 *   2:
 *   3: zero = 0;
 *   4:
 *   5: assert(zero, 1);
 *
 * powered-js code
 *   1: var zero;
 *   2: zero = 0;
 *   3: assert(assert._expr(assert._capt(zero, 'arguments/0'), {
 *   4:     content: 'assert(zero, 1)',
 *   5:     filepath: '/path/to/original.coffee',
 *   6:     line: 3
 *   7: }), 1);
 */
describe('webpack-espowered-loader with multi stage sourcemap', function() {
  it('should return re-mapped sourcemap', function() {
    var originalCoffeeSource = 'zero = 0\nassert zero, 1';
    var jsSource = 'var zero;\n\nzero = 0;\n\nassert(zero, 1);';
    var inMap = convert.fromObject({
      version: 3,
      sources: ['/path/to/original.coffee'],
      names: [],
      mappings: 'AAAA,IAAA,IAAA;;AAAA,IAAA,GAAO,CAAP,CAAA;;AAAA,MACA,CAAO,IAAP,EAAa,CAAb,CADA,CAAA'
    });

    // set context for webpack loader
    var context = {};
    context.resourcePath = '/path/to/original.coffee';
    context.options = {};
    context.callback = function(err, powered, map) {
      var smc = new Consumer(map);

      /**
       * Check sourcemap generated by coffee-script compiler
       *
       * coffee code
       *   1: zero = 0
       *            ^
       * powered-js code
       *   2: zero = 0;
       *            ^
       */
      var originalPosition = smc.originalPositionFor({
        source: '/path/to/original.coffee',
        line: 2,
        column: 7
      });
      assert.equal(originalPosition.source, '/path/to/original.coffee');
      assert.equal(originalPosition.line, 1);
      assert.equal(originalPosition.column, 7);

      /**
       * Check sourcemap generated by espower
       *
       * coffee code
       *   2: assert zero, 1
       *                  ^
       * powered-js code
       *   7: }), 1);
       *         ^
       */
      originalPosition = smc.originalPositionFor({
        source: '/path/to/original.coffee',
        line: 7,
        column: 4
      });
      assert.equal(originalPosition.source, '/path/to/original.coffee');
      assert.equal(originalPosition.line, 2);
      assert.equal(originalPosition.column, 13);
    };

    espower.call(context, jsSource, inMap.toObject());
  });
});

