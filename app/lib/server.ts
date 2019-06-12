import log from 'lib/log';
import constants from './constants';

const { clientId, headers, serverUrl } = constants;

export const handleServerPush = (message: any) => {
  log.info('serverPush', message);
  if (message == 'handshake') {
    getFromServer('ping/json');
  }
}

const pollServerOnce = async () => {
  const route = 'poll';
  const url = serverUrl + route + '?clientId=' + clientId + '&timeout=90000';
  const method = 'GET';
  try {
    const response = await fetch(url, { method, headers });
    const message = await response.json();
    handleServerPush(message);
  } catch(err) {
    log.warn('pollServerOnce', err);
  }
}

export const pollServer = async () => {
  try {
    while (true) { // TODO use caution with this construct
      // TODO back off if the server is not responding or throwing errors
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
    log.info('postToServer', route, message);
    const url = serverUrl + route;
    const method = 'POST';
    const body = JSON.stringify(message);
    const response = await fetch(url, { method, headers, body });
    const serverReply = await response.json();
    log.info('serverReply', serverReply);
  } catch (err) {
    log.warn('postToServer', err);
  }
}