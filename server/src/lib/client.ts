import log, { messageToLog } from 'shared/log';

// import { util } from 'prettier';

// When client initiates polling, server should respond before timeout, either with placeholder timeout response,
// or with an array of queued messages for the app. For now, server uses a simple in-memory queue that does not
// persist across server invocations.

// Use pushToClient to queue a message for the app (which will hopefully be delivered right away)
// If messages are idempotent, server could attempt resending until a client handshake arrives.

type Message = any; // TODO
type ClientMessages = { [key: string]: Message[] }; // key is clientId
let messages: ClientMessages = {};

type ClientPollRequest = {
  clientAlias: string;
  clientId: string;
  index?: number;
  res: any,
  timeout: number;
  timer: NodeJS.Timeout;
}
type ClientPollRequests = { [key: string]: ClientPollRequest[] }; // key is clientId
let polls: ClientPollRequests = {};

type ClientAliases = { [key: string]: string }; // key is clientAlias, value is clientId.
let aliases: ClientAliases = {}; // Thus, any alias maps to no more than one clientId.

// From the server perspective, things start here with a poll request from a client.
// handlePollRequest is the responder for the Express router for /poll.
// Long polling should happen regularly (e.g. with a 90 second timeout) for any/each active/connected client.
export const handlePollRequest = (req: any, res: any, timeout: number) => {
  try {
    const { clientAlias, clientId } = req.query;
    if (!clientId) {
      log.warn('handlePollRequest: clientId not provided');
      res.sendStatus(500); // TODO
      return;
    }
    const timer = setTimeout(() => {
      log.trace(`poll timed out, responding`);
      respond(clientId, 'timeout');
    }, timeout);

    if (!polls[clientId]) { // make sure the array exists
      polls[clientId] = [];
    }
    const clientPollRequest: ClientPollRequest = {
      clientAlias,
      clientId,
      index: req.query.index || 0, // TODO
      res, // so server can respond
      timer, // so it can be cleared if server responds
      timeout, // fyi
    }
    polls[clientId].push(clientPollRequest);

    if (clientAlias && clientAlias.length) {
      // This is where a clientAlias gets associated with a clientId.
      aliases[clientAlias] = clientId; // TODO do we ever need to clean up this array?
    }
    // Respond right away if pushes are pending, else, no immediate response.
    if (messages[clientId] && messages[clientId].length) {
      respond(clientId, 'client poll');
    }
  } catch(err) {
    log.error('handlePollRequest', err);
  }
}

// Server push is the real purpose of all this polling business. Enqueue a message to a client and attempt to send it.
// See handleServerPush in the app for where this comes in.
export const pushToClient = (message: any, clientId: string, clientAlias: string = '') => {
  try {
    if (!messages[clientId]) {
      messages[clientId] = [];
    }
    const countPending = messages[clientId].length;
    log.debug(`push to clientId ${clientId}${countPending ? ', ' + countPending + ' in queue' : ''}`,
      messageToLog(message));
    messages[clientId].push(message);
    respond(clientId, 'server push');
  } catch(err) {
    log.error('pushToClient', err);
  }
}

export const clientIdForAlias = (clientAlias: string): string => {
  return aliases[clientAlias];
}

// Attempt to send pending messages by responding to any open poll request.
// If client is not connected, message sits in a queue.
const respond = (clientId: string, reason: string = 'unspecified reason') => {
  try {
    if (!clientId || !clientId.length) {
      log.warn('push respond: missing clientId');
      return;
    }
    log.debug(`responding to clientId ${clientId} poll due to ${reason}`);
    const pollRequest = polls[clientId] && polls[clientId].pop(); // respond to most recent request (TODO review)
    if (pollRequest) {
      if (pollRequest.timer) {
        clearTimeout(pollRequest.timer); // if already cleared, this is a no-op
      }
      // send all pending messages in one go and hope for the best
      const pendingMessages = messages[clientId] ? [...messages[clientId]] : [];
      log.debug(`pendingMessages ${JSON.stringify(pendingMessages)}`);
      try {
        messages[clientId] = []; // clear all pending messages right away so nothing gets sent twice
        pollRequest.res.send(pendingMessages);
      } catch(err) {
        log.warn('respond exception:', err);
        // put these back since something went wrong when attempting to send
        messages[clientId] = messages[clientId].concat(pendingMessages);
      }
    } else {
      log.warn(`respond: no poll request pending for clientId ${clientId}`);
    }
  } catch(err) {
    log.error('respond', err);
  }
}
