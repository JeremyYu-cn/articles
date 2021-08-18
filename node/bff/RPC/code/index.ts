//@ts-nocheck
import http from 'http';
import { createService, createClient, encodeBuf, decodeBuf } from './network';

createService(4444, (data) => {
  const result = handleOrderInput(data.body);
  return result;
});
createService(4445, (data) => {
  const result = handleDataInput(data.body);
  return result;
});

function handleOrderInput(data: Record<string, any>) {
  switch (data.method) {
    case '/order/add':
      return { code: 200, msg: 'success', data: '' };
    default:
      return { code: 500, msg: 'route not found', data: '' };
  }
}

function handleDataInput(data: Record<string, any>) {
  switch (data.method) {
    case '/data/add':
      return { code: 200, msg: 'success', data: '' };
    default:
      return { code: 500, msg: 'route not found', data: '' };
  }
}

const BFF = http.createServer((req, res) => {
  handleBFF(req, res);
});

BFF.listen(8080, () => {
  console.log('BFF Server is running at 8080 port');
});

function handleBFF(req: http.IncomingMessage, res: http.ServerResponse) {
  switch (req.url) {
    case '/order/add':
      addOrder(req, res);
      break;
    default:
      res.end('{ code: 500, msg: "route not found", data: "" }');
      break;
  }
}

// 处理添加订单方法
function addOrder(req: http.IncomingMessage, res: http.ServerResponse) {
  if (req.method !== 'POST') {
    res.end('{ code: 500, msg: "route not found", data: "" }');
    return;
  }

  let data = '';
  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', async () => {
    const orderResult = await publicRequest(4444, '/order/add', data);
    const dataResult = await publicRequest(4445, '/data/add', data);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ orderResult, dataResult }));
  });
}

// 公共请求方法
async function publicRequest(port: number, method: string, data: string) {
  return new Promise((resolve) => {
    const json = { method, ...JSON.parse(data) };
    const buf = encodeBuf(0, 1001, json);
    const client = createClient(port);
    client.write(buf);
    client.on('data', (data) => {
      const result = decodeBuf(data);
      console.log('client receive data', result);
      resolve(result);
    });
  });
}
