import WebSocket from 'ws';
import { spawn } from 'child_process';
import { ArgumentParser } from 'argparse';

interface Config {
  engine: string;
  host: string;
  port: number;
};

const getConfig = (): Config => {
  const parser = new ArgumentParser();
  parser.add_argument('engine', { type: String });
  parser.add_argument('--host', { type: String, default: 'localhost' });
  parser.add_argument('--port', { type: Number, default: 9670 });
  return parser.parse_args();
};

class App {
  private clientCounter = 0;

  constructor(private config: Config) {
    const { host, port } = config;
    const url = `http://${host}:${port}`;

    console.log(`:: Starting server (${url})`);
    const wss = new WebSocket.Server({ host, port });
    wss.on('connection', this.handleClient.bind(this));
  }

  handleClient(ws: WebSocket) {
    const id = this.clientCounter++;
    console.log(`:: Client connected (id = ${id})`);

    const command = this.config.engine;
    const engine = spawn(command);
    engine.on('spawn', () => {
      console.log(`:: Engine spawn (${command})`);
    });

    engine.on('exit', (code) => {
      console.log(`:: Engine exit`);
    });

    ws.on('close', (code) => {
      console.log(`:: Client closed (id = ${id})`);
      engine.kill();
    });

    ws.on('message', (data) => {
      engine.stdin.write(data);
    });

    const buffer = new LineBuffer();
    engine.stdout.on('data', (data) => {
      buffer.put(data.toString());
      for (const line of buffer.get()) {
        ws.send(line + '\n');
      }
    });
  }
};

class LineBuffer {
  private data: string = '';

  put(newData: string): void {
    this.data += newData;
  }

  *get(): Generator<string> {
    while (true) {
      const i = this.data.indexOf('\n');
      if (i == -1) { break; }
      yield this.data.substr(0, i);
      this.data = this.data.substr(i + 1);
    }
  }
}

const main = () => {
  const config = getConfig();
  const app = new App(config);
};

main();
