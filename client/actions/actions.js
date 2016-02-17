import Spotify from 'spotify-web-api-js';
const spotifyApi = new Spotify();

// our constants
export const SPOTIFY_TOKENS = 'SPOTIFY_TOKENS';
export const SPOTIFY_ME_BEGIN = 'SPOTIFY_ME_BEGIN';
export const SPOTIFY_ME_SUCCESS = 'SPOTIFY_ME_SUCCESS';
export const SPOTIFY_ME_FAILURE = 'SPOTIFY_ME_FAILURE';
export const PLAYLIST_LOAD_BEGIN = 'PLAYLIST_LOAD_BEGIN';
export const PLAYLIST_LOAD_SUCCESS = 'PLAYLIST_LOAD_SUCCESS';
export const PLAYLIST_LOAD_FAILURE = 'PLAYLIST_LOAD_FAILURE';
export const TRACK_LIST_BEGIN = 'TRACK_LIST_BEGIN';
export const TRACK_LIST_SUCCESS = 'TRACK_LIST_SUCCESS';
export const TRACK_LIST_FAILURE = 'TRACK_LIST_FAILURE';

/** set the app's access and refresh tokens */
export function setTokens({accessToken, refreshToken}) {
  if (accessToken) {
    spotifyApi.setAccessToken(accessToken);
  }
  return { type: SPOTIFY_TOKENS, accessToken, refreshToken };
}

/* get the user's info from the /me api */
export function getMyInfo() {
  return dispatch => {
    dispatch({ type: SPOTIFY_ME_BEGIN});
    spotifyApi.getMe().then(data => {
      dispatch({ type: SPOTIFY_ME_SUCCESS, data });
    }).catch(error => {
      dispatch({ type: SPOTIFY_ME_FAILURE, error });
    });
  };
}

/* load the user's playlists */
export function loadPlaylists() {
  return (dispatch, getState) => {
    const { user } = getState();
    dispatch({ type: PLAYLIST_LOAD_BEGIN });
    spotifyApi.getUserPlaylists(user.id, {limit: 50}).then(data => {
      dispatch({ type: PLAYLIST_LOAD_SUCCESS, data });
    }).catch(error => {
      dispatch({ type: PLAYLIST_LOAD_FAILURE, error });
    });
  }
}

/* load a single playlist */
export function loadPlaylist(playlistID) {
  return (dispatch, getState) => {
    const { user } = getState();
    dispatch({ type: TRACK_LIST_BEGIN });
    spotifyApi.getPlaylist(user.id, playlistID).then(data => {
      dispatch({ type: TRACK_LIST_SUCCESS, data });
    }).catch(error => {
      dispatch({ type: TRACK_LIST_FAILURE, error });
    })
  }
}