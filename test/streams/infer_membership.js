'use strict';

var test = require('prova'),
  concat = require('concat-stream'),
  parse = require('../../streams/parse'),
  flatten = require('../../streams/flatten'),
  inferMembership = require('../../streams/infer_membership');

function evaluate(fn, callback) {
  var stream = parse();

  stream
    .pipe(inferMembership())
    .pipe(flatten())
    .pipe(concat(callback));

  stream.end({
    file: __filename,
    source: '(' + fn.toString() + ')'
  });
}

function Foo() {}

test('inferMembership - explicit', function (t) {
  evaluate(function () {
    /**
     * Test
     * @memberof Bar
     * @static
     */
    Foo.bar = 0;
  }, function (result) {
    t.equal(result[ 0 ].memberof, 'Bar');
    t.equal(result[ 0 ].scope, 'static');
    t.end();
  });
});

test('inferMembership - static', function (t) {
  evaluate(function () {
    /** Test */
    Foo.bar = 0;
  }, function (result) {
    t.equal(result[ 0 ].memberof, 'Foo');
    t.equal(result[ 0 ].scope, 'static');
    t.end();
  });
});

test('inferMembership - instance', function (t) {
  evaluate(function () {
    /** Test */
    Foo.prototype.bar = 0;
  }, function (result) {
    t.equal(result[ 0 ].memberof, 'Foo');
    t.equal(result[ 0 ].scope, 'instance');
    t.end();
  });
});

test('inferMembership - compound', function (t) {
  evaluate(function () {
    /** Test */
    Foo.bar.baz = 0;
  }, function (result) {
    t.equal(result[ 0 ].memberof, 'Foo.bar');
    t.equal(result[ 0 ].scope, 'static');
    t.end();
  });
});

test('inferMembership - unknown', function (t) {
  evaluate(function () {
    /** Test */
    (0).baz = 0;
  }, function (result) {
    t.equal(result[ 0 ].memberof, undefined);
    t.equal(result[ 0 ].scope, undefined);
    t.end();
  });
});

test('inferMembership - static object assignment', function (t) {
  evaluate(function () {
    Foo.bar = {
      /** Test */
      baz: 0
    };
  }, function (result) {
    t.equal(result[ 0 ].memberof, 'Foo.bar');
    t.equal(result[ 0 ].scope, 'static');
    t.end();
  });
});

test('inferMembership - instance object assignment', function (t) {
  evaluate(function () {
    Foo.prototype = {
      /** Test */
      bar: 0
    };
  }, function (result) {
    t.equal(result[ 0 ].memberof, 'Foo');
    t.equal(result[ 0 ].scope, 'instance');
    t.end();
  });
});

test('inferMembership - instance object assignment, function', function (t) {
  evaluate(function () {
    Foo.prototype = {
      /** Test */
      bar: function () {}
    };
  }, function (result) {
    t.equal(result[ 0 ].memberof, 'Foo');
    t.equal(result[ 0 ].scope, 'instance');
    t.end();
  });
});

test('inferMembership - variable object assignment', function (t) {
  evaluate(function () {
    var Foo = {
      /** Test */
      baz: 0
    };
    return Foo;
  }, function (result) {
    t.equal(result[ 0 ].memberof, 'Foo');
    t.equal(result[ 0 ].scope, 'static');
    t.end();
  });
});

test('inferMembership - variable object assignment, function', function (t) {
  evaluate(function () {
    var Foo = {
      /** Test */
      baz: function () {}
    };
    return Foo;
  }, function (result) {
    t.equal(result[ 0 ].memberof, 'Foo');
    t.equal(result[ 0 ].scope, 'static');
    t.end();
  });
});

test('inferMembership - simple', function (t) {
  evaluate(function () {
    /** Test */
    module.exports = function () {};
  }, function (result) {
    t.equal(result[ 0 ].memberof, 'module');
    t.equal(result[ 0 ].scope, 'static');
    t.end();
  });
});
