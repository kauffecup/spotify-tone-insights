'use strict';

const Spotify = require('spotify-web-api-node');
const querystring = require('querystring');
const express = require('express');
const watson = require('watson-developer-cloud');
const cfenv = require('cfenv');
const router = new express.Router();

let envVars = {};
try {
  envVars = require('./ENV_VARS.json');
} catch(e) {} // don't do anything, just means JSON file doesnt exist

// configure vcap services
let cfenvOpts = null;
try {
  cfenvOpts = { vcap: { services: require('./VCAP_SERVICES.json') } };
} catch(e) {}; // don't do anything, just means JSON file doesnt exist
const appEnv = cfenv.getAppEnv(cfenvOpts);
const toneCredentials = appEnv.getService(/tone analyzer/ig).credentials;

// configure the spotify credentials
const CLIENT_ID = envVars.CLIENT_ID || process.env.CLIENT_ID;
const CLIENT_SECRET = envVars.CLIENT_SECRET || process.env.CLIENT_SECRET;
const REDIRECT_URI = envVars.REDIRECT_URI || process.env.REDIRECT_URI;
const MAX_OFFSET = 50;
const STATE_KEY = 'spotify_auth_state';
// your application requests authorization
const scopes = ['user-read-private', 'user-library-read'];

// configure watson
const toneAnalyzer = watson.tone_analyzer({
  username: toneCredentials.username,
  password: toneCredentials.password,
  version: 'v3-beta',
  version_date: '2016-02-11'
});

// configure spotify
const spotifyApi = new Spotify({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: REDIRECT_URI
});

/** Generates a random string containing numbers and letters of N characters */
const generateRandomString = N => (Math.random().toString(36)+Array(N).join('0')).slice(2, N+2);

/**
 * The /login endpoint
 * Redirect the client to the spotify authorize url, but first set that user's
 * state in the cookie.
 */
router.get('/login', (_, res) => {
  const state = generateRandomString(16);
  res.cookie(STATE_KEY, state);
  res.redirect(spotifyApi.createAuthorizeURL(scopes, state));
});

/**
 * The /callback endpoint - hit after the user logs in to spotifyApi
 * Verify that the state we put in the cookie matches the state in the query
 * parameter. Then, if all is good, redirect the user to the user page. If all
 * is not good, redirect the user to an error page
 */
router.get('/callback', (req, res) => {
  const { code, state } = req.query;
  const storedState = req.cookies ? req.cookies[STATE_KEY] : null;
  // first do state validation
  if (state === null || state !== storedState) {
    res.redirect('/#/error/state mismatch');
  // if the state is valid, get the authorization code and pass it on to the client
  } else {
    res.clearCookie(STATE_KEY);
    // Retrieve an access token and a refresh token
    spotifyApi.authorizationCodeGrant(code).then(data => {
      const { expires_in, access_token, refresh_token } = data.body;

      // Set the access token on the API object to use it in later calls
      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      // we can also pass the token to the browser to make requests from there
      res.redirect(`/#/user/${access_token}/${refresh_token}`);
    }).catch(err => {
      res.redirect('/#/error/invalid token');
    });
  }
});

/**
 * The tone endpoint
 */
router.get('/tone', (req, res) => {
  const { text } = req.query;
  toneAnalyzer.tone({ text }, (e, tone) => {
    if (e) {
      res.status(500);
      res.json(e);
      console.error(e);
      console.error(e.stack);
    } else {
      res.json(tone);
    }
  });
});

module.exports = router;