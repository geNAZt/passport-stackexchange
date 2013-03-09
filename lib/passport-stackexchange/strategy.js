/**
 * Module dependencies.
 */
var util = require('util'),
    OAuth2Strategy = require('passport-oauth').OAuth2Strategy,
    InternalOAuthError = require('passport-oauth').InternalOAuthError,
    zlib = require('zlib'),
    Stream = require('stream'),
    request = require("request");

function Strategy(options, verify) {
    options = options || {};
    options.authorizationURL = options.authorizationURL || 'https://stackexchange.com/oauth';
    options.tokenURL = options.tokenURL || 'https://stackexchange.com/oauth/access_token';
    options.scopeSeparator = options.scopeSeparator || ',';

    if(typeof options.key === "undefined") {
        throw new Error("No Stackexchange API Key");
    }

    this._options = options;

    OAuth2Strategy.call(this, options, verify);

    this.name = 'stackexchange';
}

util.inherits(Strategy, OAuth2Strategy);

Strategy.prototype.userProfile = function(accessToken, done) {
    var url = "https://api.stackexchange.com/2.1/me?site=stackoverflow&key=" + this._options.key + "&access_token=" + accessToken;

    function clearStream() {
        this.writable = true;
        this._data = "";

        this.on('error', function(err) {
            done(err);
        });
    };

    util.inherits(clearStream, Stream);

    clearStream.prototype.write = function(chunk) {
        this._data += chunk.toString();
        return true;
    }

    clearStream.prototype.end = function(data) {
        var json = JSON.parse(this._data);
        json.items[0].provider = "stackexchange";

        done(null, json.items[0]);
    }

    request({ url: url, headers: {'accept-encoding': 'gzip'}})
        .pipe(zlib.createGunzip())
        .pipe(new clearStream());
}

module.exports = Strategy;