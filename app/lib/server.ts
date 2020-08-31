// This is intended for development use only (not for production.)
// This currently uses long-polling which is reliable but not the most efficient. TODO upgrade to WebSockets.

import { newAction } from 'lib/actions';
import constants from 'lib/constants';
import store from 'lib/store';
import log, { messageToLog } from 'shared/log';

const {
  clientId,
  headers,
  serverUrl
} = constants;

// This handles the server response to /poll, which is a server push.
const handleServerPush = async (data: any) => {
  try {
    // Custom string messages are handled here
    if (data === 'handshake') {
      getFromServer('ping/json');
    }
    // TODO For now, for convenience, assume that any JSON that comes in is an AppAction and just dispatch it with params.
    // TODO Handle other kinds of incoming JSON
    if (typeof data === 'object') {
      // log.info(`serverPush: message count ${data.length}`);
      for (const message of data) {
        log.debug('serverPush message', messageToLog(message));
        const action = message.type;
        const params = message.params;
        if (action) {
          store.dispatch(newAction(action, params || null));
        }
      }
    }
  } catch (err) {
    log.warn('handleServerPush', err);
  }
}

const pollServerOnce = async () => {
  const route = 'poll';
  const clientAlias = store.getState().options.clientAlias;
  const url = `${serverUrl}${route}?clientId=${clientId}&clientAlias=${clientAlias}&timeout=90000`;
  const method = 'GET';
  try {
    const response = await fetch(url, { method, headers });
    const message = await response.json();
    handleServerPush(message);
  } catch (err) {
    log.info('pollServerOnce', url, err);

    // take a brief nap and then try again
    try {
      await new Promise(resolve => setTimeout(resolve, constants.serverDelayAfterFailedRequest));
    } catch (err) {
      log.info('pollServerOnce inner exception', err);
    }
    log.info('...continuing...');
  }
}

export const pollServer = async () => {
  try {
    while (true) { // TODO use caution with this construct
      await pollServerOnce();
    }
  } catch (err) {
    log.warn('pollServer', err);
  }
}

export const getFromServer = async (route: string, message: any = {}) => {
  try {
    log.info('getFromServer', route, message);
    const url = serverUrl + route;
    const method = 'GET';
    const response = await fetch(url, { method, headers });
    const serverReply = await response.json();
    log.info('serverReply', serverReply);
  } catch (err) {
    log.warn('getFromServer', err);
  }
}

export const postToServer = async (route: string, message: any = {}) => {
  try {
    // log.info('postToServer', route, message);
    const url = serverUrl + route;
    const method = 'POST';
    const body = JSON.stringify(message);
    const response = await fetch(url, { method, headers, body });
    const serverReply = await response.json();
    // log.info('serverReply', serverReply);
  } catch (err) {
    log.warn('postToServer', err);
  }
}
