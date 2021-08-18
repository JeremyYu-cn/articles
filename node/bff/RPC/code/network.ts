//@ts-nocheck

import { createServer, createConnection, Socket } from 'net';

export function createService(
  port: number,
  callback: (data: Record<string, any>, socket: Socket) => Record<string, any>
) {
  const service = createServer((socket) => {
    socket.on('connect', () => {
      console.log('connect server');
    });

    socket.on('data', (data) => {
      const result = decodeBuf(data);
      if (result.body.method === 'jump') return;
      else {
        console.log('server receive data', result);
        const returnData = callback(result, socket);
        socket.write(encodeBuf(1, result.requestId, returnData));
      }
    });

    socket.on('end', () => {
      console.log('disconnect server');
    });
  });

  service.listen(port, () => {
    console.log(`service running at ${port}`);
  });
}

export function createClient(port: number) {
  const client = createConnection({
    port,
  });

  client.on('close', () => {
    console.log('client connect close');
  });

  return client;
}

export function encodeBuf(
  type: 0 | 1,
  order: number,
  data: Record<string, any>
) {
  // 请求报文
  const bodyLength = JSON.stringify(data).length;
  const bodyBuf = Buffer.alloc(bodyLength, JSON.stringify(data));
  const bufHeader = Buffer.alloc(10);
  bufHeader[0] = type; // 代表request
  bufHeader.writeInt32BE(order, 1); // 写入4字节数据 代表订单号为1
  bufHeader.writeInt32BE(bodyLength, 5);
  bufHeader[9] = 60;
  const buf = Buffer.concat([bufHeader, bodyBuf]);
  return buf;
}

export function decodeBuf(buf: any) {
  const type = buf[0];
  const requestId = buf.readInt32BE(1);
  const length = buf.readInt32BE(5);
  const timeout = buf[9];

  const body = buf.slice(10, 10 + length);

  return {
    type,
    requestId,
    length,
    timeout,
    body: JSON.parse(body),
  };
}
