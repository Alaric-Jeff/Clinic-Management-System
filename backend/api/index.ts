import type { IncomingMessage, ServerResponse } from 'http';
import { buildApp } from '../src/app.js';

let serverInstance: any;

async function getServer() {
  if (!serverInstance) {
    const app = await buildApp();
    serverInstance = app.server;
  }
  return serverInstance;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const server = await getServer();
  server.emit('request', req, res);
}