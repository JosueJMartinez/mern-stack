import { replace } from 'connected-react-router';
import * as actionTypes from './types';

export const signUp = formValues => (dispatch, getState, { mernApi }) => {
  dispatch({ type: actionTypes.SIGN_UP });
  return mernApi.post('/auth/signup', formValues).then(
    response => {
      dispatch({ type: actionTypes.SIGN_UP_SUCCESS });
    },
    err => {
      dispatch(signUpFail(err.response.data.error));
    }
  );
};

const signUpFail = payload => {
  return {
    type: actionTypes.SIGN_UP_FAIL,
    payload
  };
};

export const signIn = formValues => (dispatch, getState, { mernApi }) => {
  dispatch({ type: actionTypes.SIGN_IN });
  return mernApi.post('/auth/signin', formValues).then(
    response => {
      dispatch(signInSuccess(response.data));
      redirectAfterSignIn(dispatch, getState);
      setAuthInfo(response.data, mernApi);
    },
    err => {
      dispatch(signInFail(err.response.data.error));
    }
  );
};

const signInSuccess = payload => {
  return {
    type: actionTypes.SIGN_IN_SUCCESS,
    payload
  };
};

const signInFail = payload => {
  return {
    type: actionTypes.SIGN_IN_FAIL,
    payload
  };
};

const redirectAfterSignIn = (dispatch, getState) => {
  if (getState().auth.attemptedPath) {
    dispatch(replace(getState().auth.attemptedPath));
    dispatch(setAttemptedPath(null));
  } else {
    dispatch(replace(getState().auth.defaultPath));
  }
};

export const tryLocalSignIn = () => (dispatch, getState, { mernApi }) => {
  dispatch({ type: actionTypes.TRY_LOCAL_SIGN_IN });
  try {
    const token = localStorage.getItem('token');
    const expiresAt = localStorage.getItem('expiresAt');
    const user = JSON.parse(localStorage.getItem('user'));
    if (!token || !expiresAt || !user) {
      dispatch(tryLocalSignInFail());
      return Promise.resolve();
    }
    const now = Math.floor(Date.now() / 1000);
    if (expiresAt <= now) {
      dispatch(tryLocalSignInFail());
      return Promise.resolve();
    }
    // if token age > 30 days, then refresh token
    if (expiresAt <= now + 30 * 24 * 60 * 60) {
      mernApi.setAuthToken(token);
      return mernApi.post('auth/refresh-token').then(
        response => {
          dispatch(
            tryLocalSignInSuccess({
              token: response.data.token,
              expiresAt: response.data.expiresAt,
              user
            })
          );
          redirectAfterSignIn(dispatch, getState);
        },
        err => {
          dispatch(tryLocalSignInFail());
        }
      );
    } else {
      dispatch(tryLocalSignInSuccess({ token, expiresAt, user }));
      redirectAfterSignIn(dispatch, getState);
      return Promise.resolve();
    }
  } catch (err) {
    dispatch(tryLocalSignInFail(err));
  }
};

const tryLocalSignInSuccess = payload => (dispatch, getState, { mernApi }) => {
  setAuthInfo(payload, mernApi);
  dispatch({
    type: actionTypes.TRY_LOCAL_SIGN_IN_SUCCESS,
    payload
  });
};

const tryLocalSignInFail = () => (dispatch, getState, { mernApi }) => {
  clearAuthInfo(mernApi);
  dispatch({ type: actionTypes.TRY_LOCAL_SIGN_IN_FAIL });
};

export const setAttemptedPath = path => {
  return {
    type: actionTypes.SET_ATTEMPTED_PATH,
    payload: path
  };
};

const setAuthInfo = ({ token, expiresAt, user }, mernApi) => {
  mernApi.setAuthToken(token);
  localStorage.setItem('token', token);
  localStorage.setItem('expiresAt', expiresAt);
  localStorage.setItem('user', JSON.stringify(user));
};

const clearAuthInfo = mernApi => {
  mernApi.setAuthToken('');
  localStorage.removeItem('token');
  localStorage.removeItem('expiresAt');
  localStorage.removeItem('user');
};

export const signOut = () => (dispatch, getState, { mernApi }) => {
  dispatch({ type: actionTypes.SIGN_OUT });
  clearAuthInfo(mernApi);
  dispatch({ type: actionTypes.SIGN_OUT_SUCCESS });
};

export const verifyEmail = token => (dispatch, getState, { mernApi }) => {
  dispatch({ type: actionTypes.VERIFY_EMAIL });
  return mernApi.post(`/auth/verify-email/${token}`).then(
    response => {
      dispatch({ type: actionTypes.VERIFY_EMAIL_SUCCESS });
    },
    err => {
      dispatch(verifyEmailFail(err.response.data.error));
    }
  );
};

const verifyEmailFail = payload => {
  return {
    type: actionTypes.VERIFY_EMAIL_FAIL,
    payload
  };
};

export const requestVerificationEmail = formValues => {
  return (dispatch, getState, { mernApi }) => {
    dispatch({ type: actionTypes.REQUEST_VERIFICATION_EMAIL });
    return mernApi.post('/auth/send-token', formValues).then(
      response => {
        dispatch({ type: actionTypes.REQUEST_VERIFICATION_EMAIL_SUCCESS });
      },
      err => {
        dispatch(requestVerificationEmailFail(err.response.data.error));
      }
    );
  };
};

const requestVerificationEmailFail = payload => {
  return {
    type: actionTypes.REQUEST_VERIFICATION_EMAIL_FAIL,
    payload
  };
};

export const requestPasswordReset = formValues => {
  return (dispatch, getState, { mernApi }) => {
    dispatch({ type: actionTypes.REQUEST_PASSWORD_RESET });
    return mernApi.post('/auth/send-token', formValues).then(
      response => {
        dispatch({ type: actionTypes.REQUEST_PASSWORD_RESET_SUCCESS });
      },
      err => {
        dispatch(requestPasswordResetFail(err.response.data.error));
      }
    );
  };
};

const requestPasswordResetFail = payload => {
  return {
    type: actionTypes.REQUEST_PASSWORD_RESET_FAIL,
    payload
  };
};

export const resetPassword = (formValues, token) => {
  return (dispatch, getState, { mernApi }) => {
    dispatch({ type: actionTypes.RESET_PASSWORD });
    return mernApi.post(`/auth/reset-password/${token}`, formValues).then(
      response => {
        dispatch({ type: actionTypes.RESET_PASSWORD_SUCCESS });
      },
      err => dispatch(resetPasswordFail(err.response.data.error))
    );
  };
};

const resetPasswordFail = payload => {
  return {
    type: actionTypes.RESET_PASSWORD_FAIL,
    payload
  };
};

export const unloadAuthPage = () => {
  return {
    type: actionTypes.UNLOAD_AUTH_PAGE
  };
};
