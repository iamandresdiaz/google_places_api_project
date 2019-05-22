(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
'use strict';

var _PlacesSearchBarView = require('./views/PlacesSearchBarView');

var _PlacesSearchBarView2 = _interopRequireDefault(_PlacesSearchBarView);

var _PlacesSearchResultsView = require('./views/PlacesSearchResultsView');

var _PlacesSearchResultsView2 = _interopRequireDefault(_PlacesSearchResultsView);

var _PlaceDetailsView = require('./views/PlaceDetailsView');

var _PlaceDetailsView2 = _interopRequireDefault(_PlaceDetailsView);

var _PlacesSearchByCategoryView = require('./views/PlacesSearchByCategoryView');

var _PlacesSearchByCategoryView2 = _interopRequireDefault(_PlacesSearchByCategoryView);

var _PlacesController = require('./controllers/PlacesController');

var _PlacesController2 = _interopRequireDefault(_PlacesController);

var _PlacesModel = require('./models/PlacesModel');

var _PlacesModel2 = _interopRequireDefault(_PlacesModel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var searchBar = document.getElementById('search-bar-form');
var placesSearchBarView = new _PlacesSearchBarView2.default({ element: searchBar });

var resultsSection = document.getElementById('results-section');
var placesSearchResultsView = new _PlacesSearchResultsView2.default({ element: resultsSection });

var placeDetailsSection = document.getElementById('place-details-section');
var placeDetailsView = new _PlaceDetailsView2.default({ element: placeDetailsSection });

var searchCategories = document.getElementById('search-categories');
var placesSearchByCategoryView = new _PlacesSearchByCategoryView2.default({ element: searchCategories });

var placesModel = new _PlacesModel2.default();

var placesController = new _PlacesController2.default({
    placesSearchBarView: placesSearchBarView,
    placesSearchResultsView: placesSearchResultsView,
    placeDetailsView: placeDetailsView,
    placesSearchByCategoryView: placesSearchByCategoryView,
    placesModel: placesModel
});

placesController.start();

},{"./controllers/PlacesController":3,"./models/PlacesModel":4,"./views/PlaceDetailsView":9,"./views/PlacesSearchBarView":10,"./views/PlacesSearchByCategoryView":11,"./views/PlacesSearchResultsView":12}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PlacesController = function () {
    function PlacesController(_ref) {
        var placesSearchBarView = _ref.placesSearchBarView,
            placesSearchResultsView = _ref.placesSearchResultsView,
            placeDetailsView = _ref.placeDetailsView,
            placesSearchByCategoryView = _ref.placesSearchByCategoryView,
            placesModel = _ref.placesModel;

        _classCallCheck(this, PlacesController);

        this._placesSearchBarView = placesSearchBarView;
        this._placesSearchResultsView = placesSearchResultsView;
        this._placeDetailsView = placeDetailsView;
        this._placesSearchByCategoryView = placesSearchByCategoryView;
        this._placesModel = placesModel;
    }

    _createClass(PlacesController, [{
        key: 'start',
        value: function start() {
            this._setupPlacesSearchBarView();
            this._setupPlacesSearchResultsView();
            this._setupPlaceDetailsView();
            this._setupPlacesSearchByCategoryView();
        }
    }, {
        key: '_setupPlacesSearchBarView',
        value: function _setupPlacesSearchBarView() {
            var _this = this;

            this._placesSearchBarView.reset();
            this._placesSearchBarView.on('search', function (searchInputText) {
                return _this._onSearchPlace(searchInputText);
            });
            this._placesSearchBarView.start();
        }
    }, {
        key: '_setupPlacesSearchResultsView',
        value: function _setupPlacesSearchResultsView() {
            var _this2 = this;

            this._placesSearchResultsView.reset();
            this._placesSearchResultsView.on('placeSelected', function (placeId) {
                return _this2._onClickPlaceTitle(placeId);
            });
        }
    }, {
        key: '_setupPlaceDetailsView',
        value: function _setupPlaceDetailsView() {
            this._placeDetailsView.reset();
        }
    }, {
        key: '_setupPlacesSearchByCategoryView',
        value: function _setupPlacesSearchByCategoryView() {
            var _this3 = this;

            this._placesSearchByCategoryView.start();
            this._placesSearchByCategoryView.on('categorySelected', function (categoryId) {
                return _this3._onCategorySelected(categoryId);
            });
        }
    }, {
        key: '_onSearchPlace',
        value: function _onSearchPlace(searchInputText) {
            var _this4 = this;

            if (!searchInputText.trim()) {
                return;
            }

            this._placesModel.searchByText(searchInputText, function (error, apiPlacesResponse) {
                if (error) {
                    console.log(error);
                    return alert("The search couldn't be found");
                }

                _this4._placesSearchBarView.reset();
                _this4._placesSearchResultsView.reset(apiPlacesResponse);
                _this4._placesSearchResultsView.start();
            });
        }
    }, {
        key: '_onClickPlaceTitle',
        value: function _onClickPlaceTitle(placeId) {
            var _this5 = this;

            this._placesModel.showPlaceInformation(placeId, function (error, apiPlacesResponse) {
                if (error) {
                    console.log(error);
                    return alert("Place couldn't be found");
                }

                _this5._placeDetailsView.reset(apiPlacesResponse);
            });
        }
    }, {
        key: '_onCategorySelected',
        value: function _onCategorySelected(categoryId) {
            var _this6 = this;

            this._placesModel.searchByCategory(categoryId, function (error, apiPlacesResponse) {
                if (error) {
                    console.log(error);
                    return alert("The search couldn't be found by category");
                }

                _this6._placesSearchResultsView.reset(apiPlacesResponse);
                _this6._placesSearchResultsView.start();
            });
        }
    }]);

    return PlacesController;
}();

exports.default = PlacesController;

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _request = require('../utils/request');

var _request2 = _interopRequireDefault(_request);

var _googlekey = require('../utils/googlekey');

var _googlekey2 = _interopRequireDefault(_googlekey);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//host to resolve problem with CORS
var DEV_ENV = 'https://cors.io/?';
//const PROD_ENV  = '';

var PlacesModel = function () {
    function PlacesModel() {
        _classCallCheck(this, PlacesModel);

        this._KEY = _googlekey2.default;
        this._BASE_URL = DEV_ENV + 'https://maps.googleapis.com/maps/api/place';
    }

    _createClass(PlacesModel, [{
        key: 'searchByText',
        value: function searchByText(searchText, callback) {
            (0, _request2.default)({
                url: this._searchByPlace(searchText),
                callback: callback
            });
        }
    }, {
        key: 'searchByCategory',
        value: function searchByCategory(searchCategory, callback) {
            (0, _request2.default)({
                url: this._searchByCategory(searchCategory),
                callback: callback
            });
        }
    }, {
        key: 'showPlaceInformation',
        value: function showPlaceInformation(placeId, callback) {
            (0, _request2.default)({
                url: this._searchByPlaceId(placeId),
                callback: callback
            });
        }
    }, {
        key: '_searchByPlace',
        value: function _searchByPlace(place) {
            return this._BASE_URL + '/nearbysearch/json?location=41.390205,2.154007&radius=15000&keyword=' + place + '&key=' + this._KEY;
        }
    }, {
        key: '_searchByCategory',
        value: function _searchByCategory(category) {
            return this._BASE_URL + '/nearbysearch/json?location=41.390205,2.154007&radius=15000&type=' + category + '&key=' + this._KEY;
        }
    }, {
        key: '_searchByPlaceId',
        value: function _searchByPlaceId(placeId) {
            return this._BASE_URL + '/details/json?placeid=' + placeId + '&key=' + this._KEY;
        }
    }]);

    return PlacesModel;
}();

exports.default = PlacesModel;

},{"../utils/googlekey":5,"../utils/request":8}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var GOOGLE_KEY = 'AIzaSyCTeRlsZhfWmdV4O_ipSPOhKGJ5EZMmQXI';

exports.default = GOOGLE_KEY;

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
function htmlToElement(html) {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    var element = wrapper.firstElementChild;
    return element;
}

exports.default = htmlToElement;

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
function ratingToStars(rating) {
    var truncRating = Math.trunc(rating);
    var starsTemplate = ['&#9734;', '&#9734;', '&#9734;', '&#9734;', '&#9734;'];

    if (truncRating > 0) {
        for (var index = 0; index < truncRating; index++) {
            starsTemplate[index] = '&#9733;';
        }
    }

    return starsTemplate.join(' ');
}

exports.default = ratingToStars;

},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function request(_ref) {
  var _ref$method = _ref.method,
      method = _ref$method === undefined ? 'GET' : _ref$method,
      url = _ref.url,
      callback = _ref.callback;

  var request = new XMLHttpRequest();
  request.onreadystatechange = onStateChange;
  request.open(method, url);
  request.setRequestHeader('accept', 'application/json');
  request.send();

  function onStateChange() {
    if (request.readyState < 4) {
      return;
    }

    if (request.status < 200 || request.status >= 300) {
      callback('Request error');
      return;
    }
    callback(null, JSON.parse(request.responseText));
  };
}
exports.default = request;

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _htmlToElement = require('../utils/htmlToElement');

var _htmlToElement2 = _interopRequireDefault(_htmlToElement);

var _ratingToStars = require('../utils/ratingToStars');

var _ratingToStars2 = _interopRequireDefault(_ratingToStars);

var _googlekey = require('../utils/googlekey');

var _googlekey2 = _interopRequireDefault(_googlekey);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PlaceDetailsView = function (_EventEmitter) {
    _inherits(PlaceDetailsView, _EventEmitter);

    function PlaceDetailsView(_ref) {
        var element = _ref.element;

        _classCallCheck(this, PlaceDetailsView);

        var _this = _possibleConstructorReturn(this, (PlaceDetailsView.__proto__ || Object.getPrototypeOf(PlaceDetailsView)).call(this));

        _this._element = element;
        _this._KEY = _googlekey2.default;
        return _this;
    }

    _createClass(PlaceDetailsView, [{
        key: 'reset',
        value: function reset(placeInformation) {
            if (typeof placeInformation === "undefined") {
                this._element.innerHTML = '';
            } else {
                this._element.innerHTML = '';
                placeInformation = this._transformPlacesApiResults(placeInformation);
                this._element.appendChild(renderDetails(placeInformation));
            }
        }
    }, {
        key: '_transformPlacesApiResults',
        value: function _transformPlacesApiResults(placeInformation) {

            var placeInfo = placeInformation.result;

            return {
                photoUrl: this._extractPhotoUrl(placeInfo.photos),
                name: placeInfo.name,
                address: placeInfo.formatted_address,
                rating: placeInfo.rating,
                phoneNumber: placeInfo.formatted_phone_number,
                website: placeInfo.website,
                status: placeInfo.opening_hours.open_now,
                reviews: placeInfo.reviews
            };
        }
    }, {
        key: '_extractPhotoUrl',
        value: function _extractPhotoUrl(photos) {
            var photoUrl = '';

            if (photos === undefined) {
                photoUrl = 'http://placehold.it/900x400';
                return photoUrl;
            } else {
                photoUrl = 'https://maps.googleapis.com/maps/api/place/photo?maxheight=400&photoreference=' + photos[0].photo_reference + '&key=' + this._KEY;
                return photoUrl;
            }
        }
    }]);

    return PlaceDetailsView;
}(_events.EventEmitter);

function renderStars(placeRating) {
    return (0, _ratingToStars2.default)(placeRating);
}

function renderDate(time) {
    var date = new Date(1970, 0, 1);
    date.setSeconds(time);

    return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
}

function renderReviews() {
    var reviews = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    var reviewsInHtml = '';

    reviews.forEach(function (review) {
        reviewsInHtml = reviewsInHtml + ('\n            <span class="text-warning">' + renderStars(review.rating) + '</span> ' + review.rating + ' stars\n            <p>' + review.text + '</p>\n            <small class="text-muted">Posted by ' + review.author_name + ' on ' + renderDate(review.time) + '</small>\n            <hr>\n        ');
    });

    return reviewsInHtml;
}

function renderDetails(placeDetails) {
    return (0, _htmlToElement2.default)('\n        <div>\n            <h2 class="my-4">Place details</h2>\n            <div class="card mt-4">\n              <img class="card-img-top img-fluid" src="' + placeDetails.photoUrl + '" alt="">\n              <div class="card-body">\n                <div><h3 class="card-title">' + placeDetails.name + '</h3> \n                <span class="text-warning" style="float:right;">' + renderStars(placeDetails.rating) + '</span>\n            </div>\n                <p>\n                  <strong>' + (typeof placeDetails.address === "undefined" ? 'address not available' : placeDetails.address) + '</strong>\n                </p>\n                  <ul>\n                    <li>' + (typeof placeDetails.phoneNumber === "undefined" ? 'phone not available' : placeDetails.phoneNumber) + '</li>\n                    <li>' + (placeDetails.status ? "<span class='text-success'>Open</span>" : "<span class='text-danger'>Closed</span>") + '</li>\n                    <li><a href="' + placeDetails.website + '">' + (typeof placeDetails.website === "undefined" ? 'website not available' : placeDetails.website) + '</a></li>\n                  </ul>\n                \n              </div>\n            </div>\n    \n            <div class="card card-outline-secondary my-4">\n              <div class="card-header">\n                Place Reviews\n              </div>\n              <div class="card-body">\n                ' + renderReviews(placeDetails.reviews) + '\n              </div>\n            </div>\n        </div>\n    ');
}

exports.default = PlaceDetailsView;

},{"../utils/googlekey":5,"../utils/htmlToElement":6,"../utils/ratingToStars":7,"events":1}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PlacesSearchBarView = function (_EventEmitter) {
    _inherits(PlacesSearchBarView, _EventEmitter);

    function PlacesSearchBarView(_ref) {
        var element = _ref.element;

        _classCallCheck(this, PlacesSearchBarView);

        var _this = _possibleConstructorReturn(this, (PlacesSearchBarView.__proto__ || Object.getPrototypeOf(PlacesSearchBarView)).call(this));

        _this._element = element;
        return _this;
    }

    _createClass(PlacesSearchBarView, [{
        key: 'start',
        value: function start() {
            this._setupPlacesSearch();
        }
    }, {
        key: 'reset',
        value: function reset() {
            var input = this._element.querySelector('[type="search"]');
            input.value = '';
        }
    }, {
        key: '_setupPlacesSearch',
        value: function _setupPlacesSearch() {
            var _this2 = this;

            this._element.addEventListener('submit', function (event) {
                event.preventDefault();

                var input = _this2._element.querySelector('[type="search"]');
                var searchInputText = input.value;

                _this2.emit('search', searchInputText);
            });
        }
    }]);

    return PlacesSearchBarView;
}(_events.EventEmitter);

exports.default = PlacesSearchBarView;

},{"events":1}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PlacesSearchByCategoryView = function (_EventEmitter) {
    _inherits(PlacesSearchByCategoryView, _EventEmitter);

    function PlacesSearchByCategoryView(_ref) {
        var element = _ref.element;

        _classCallCheck(this, PlacesSearchByCategoryView);

        var _this = _possibleConstructorReturn(this, (PlacesSearchByCategoryView.__proto__ || Object.getPrototypeOf(PlacesSearchByCategoryView)).call(this));

        _this._element = element;
        return _this;
    }

    _createClass(PlacesSearchByCategoryView, [{
        key: 'start',
        value: function start() {
            this._setupPlacesSearch();
        }
    }, {
        key: '_setupPlacesSearch',
        value: function _setupPlacesSearch() {
            var _this2 = this;

            var searchCategories = this._element.getElementsByClassName('list-group-item');
            Array.from(searchCategories).forEach(function (category) {
                category.addEventListener('click', function (event) {
                    event.preventDefault();
                    var categoryId = event.currentTarget.getAttribute('category-id');
                    _this2.emit('categorySelected', categoryId);
                });
            });
        }
    }]);

    return PlacesSearchByCategoryView;
}(_events.EventEmitter);

exports.default = PlacesSearchByCategoryView;

},{"events":1}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _htmlToElement = require('../utils/htmlToElement');

var _htmlToElement2 = _interopRequireDefault(_htmlToElement);

var _ratingToStars = require('../utils/ratingToStars');

var _ratingToStars2 = _interopRequireDefault(_ratingToStars);

var _googlekey = require('../utils/googlekey');

var _googlekey2 = _interopRequireDefault(_googlekey);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PlacesSearchResultsView = function (_EventEmitter) {
    _inherits(PlacesSearchResultsView, _EventEmitter);

    function PlacesSearchResultsView(_ref) {
        var element = _ref.element;

        _classCallCheck(this, PlacesSearchResultsView);

        var _this = _possibleConstructorReturn(this, (PlacesSearchResultsView.__proto__ || Object.getPrototypeOf(PlacesSearchResultsView)).call(this));

        _this._element = element;
        _this._KEY = _googlekey2.default;
        return _this;
    }

    _createClass(PlacesSearchResultsView, [{
        key: 'start',
        value: function start() {
            this._setupTitleLinks();
        }
    }, {
        key: 'reset',
        value: function reset(placesResults) {
            var _this2 = this;

            if (typeof placesResults === "undefined") {
                this._element.innerHTML = '';
            } else {
                this._element.innerHTML = '';
                placesResults = this._transformPlacesApiResults(placesResults);
                placesResults.forEach(function (placeResult) {
                    return _this2._element.appendChild(renderResults(placeResult));
                });
            }
        }
    }, {
        key: '_setupTitleLinks',
        value: function _setupTitleLinks() {
            var _this3 = this;

            var placeResultsContainers = this._element.getElementsByClassName('result');
            Array.from(placeResultsContainers).forEach(function (placeResult) {
                var placeTitle = placeResult.querySelector('h4.card-title a');
                placeTitle.addEventListener('click', function (event) {
                    event.preventDefault();
                    var placeId = placeResult.id;
                    _this3.emit('placeSelected', placeId);
                });
            });
        }
    }, {
        key: '_transformPlacesApiResults',
        value: function _transformPlacesApiResults(apiPlacesResponse) {
            var placesResults = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = apiPlacesResponse.results[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var placeResult = _step.value;

                    placesResults.push({
                        placeId: placeResult.place_id,
                        photoUrl: this._extractPhotoUrl(placeResult.photos),
                        name: placeResult.name,
                        address: placeResult.vicinity,
                        rating: placeResult.rating
                    });
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

            return placesResults;
        }
    }, {
        key: '_extractPhotoUrl',
        value: function _extractPhotoUrl(photos) {
            var photoUrl = '';

            if (photos === undefined) {
                photoUrl = 'http://placehold.it/700x400';
                return photoUrl;
            } else {
                photoUrl = 'https://maps.googleapis.com/maps/api/place/photo?maxheight=700&photoreference=' + photos[0].photo_reference + '&key=' + this._KEY;
                return photoUrl;
            }
        }
    }]);

    return PlacesSearchResultsView;
}(_events.EventEmitter);

function renderStars(placeRating) {
    return (0, _ratingToStars2.default)(placeRating);
}

function renderResults(placesResults) {
    return (0, _htmlToElement2.default)('\n        <div class="result col-lg-4 col-md-6 mb-4" id="' + placesResults.placeId + '">\n            <div class="card h-100">\n                <a href="#"><img class="card-img-top" src="' + placesResults.photoUrl + '" alt=""></a>\n                <div class="card-body">\n                    <h4 class="card-title">\n                        <a href="#">' + placesResults.name + '</a>\n                    </h4>\n                    <p><strong>' + placesResults.address + '</strong></p>\n                </div>\n                <div class="card-footer">\n                    <small class="text-warning">' + renderStars(placesResults.rating) + '</small>\n                </div>\n            </div>\n        </div>\n    ');
}

exports.default = PlacesSearchResultsView;

},{"../utils/googlekey":5,"../utils/htmlToElement":6,"../utils/ratingToStars":7,"events":1}]},{},[2]);
