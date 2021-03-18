import WebSocket from 'ws';
import { ArgumentParser } from 'argparse';

interface Config {
  url: string;
};

const getConfig = (): Config => {
  const parser = new ArgumentParser();
  parser.add_argument('--url', { type: String, default: 'ws://localhost:9670' });
  return parser.parse_args();
};

const main = () => {
  const { url } = getConfig();
  const ws = new WebSocket(url);
  const stream = WebSocket.createWebSocketStream(ws, { encoding: 'utf8' });
  stream.pipe(process.stdout);
  process.stdin.pipe(stream);
}

main();
