---
theme: smartblue
highlight: a11y-dark
---

## 前言

[上一篇文章](https://github.com/IchliebedichZhu/articles/tree/master/node/bff/server)介绍了 BFF 的概念和应用场景，并且做了一个简单的 BFFdemo。接下来可以讨论一下如何优化 BFF 层

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/563f83afd454423ab86899e0d0e2dd63~tplv-k3u1fbpfcp-watermark.image)

## 协议设计

上文提到，`RPC`通过传输层协议传输数据，传输层传输的是二进制数据，发送端需要将请求的方法名和数据**序列化**后发送，接收端接收到二进制数据后则需要**反序列化**并处理数据。所以，RPC 调用的流程大致如下：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/244608650881449f8c63e71db6fec2c2~tplv-k3u1fbpfcp-watermark.image)

所谓协议，通俗的就是用固定的格式封装成报文数据，双方按照这一固定格式对数据进行发送和接收。例如以前讲过的[利用 TCP 实现一个 HTTP 服务](https://juejin.cn/post/6969222179456024584)。  
根据上图的流程，实现设计一个**简单的通信通信协议**并且实现它，利用这个协议进行通信。这个协议由**报文头**和**报文主体**组成  
报文头主要有的信息:  
| --- type --- | ------- requestId ------- | ---- length ---- | --- timeout --- |  
| ------------------------------------------------------------------------ |

| ---------------------------------- body -------------------------------- |

| ------------------------------------------------------------------------ |

- 报文头的**长度是固定**的
- `type`是请求的类型，占`1`个字节: 规定 `0 - REQUEST` `1 - RESPONSE`
- `requestId`请求的 ID，占`4`个字节：范围 0 ~ 4 \* 2^8
- `length`报文主体长度，占`4`个字节
- `timeout`响应超时事件，规则报文双文，占`1`个字节

到这里，一个简单的报文已经设计完成，其中，header 一共占`10个字节`，接下来就是要在代码中描述它。

### 用 node.js 描述报文

```javascript
// 需要发送的信息
const body = {
  method: 'addOrder',
  data: {
    productId: '1',
    num: 1,
  },
};

// 请求报文
const bodyLength = JSON.stringify(body).length;
const bodyBuf = Buffer.alloc(bodyLength, JSON.stringify(body));
const bufHeader = Buffer.alloc(10);
bufHeader[0] = 0; // 代表request
bufHeader.writeInt32BE(1, 1); // 写入4字节数据 代表订单号为1
bufHeader.writeInt32BE(bodyLength, 5);
bufHeader[9] = 60;
console.log(bufHeader); // <Buffer 00 00 00 00 01 00 00 00 36 3c>

// 组合报文
const buf = Buffer.concat([bufHeader, bodyBuf]);

console.log(buf); // <Buffer 00 00 00 00 01 00 00 00 36 3c 7b 22 6d 65 74 68 6f 64 22 3a 22 61 64 64 4f 72 64 65 72 22 2c 22 64 61 74 61 22 3a 7b 22 70 72 6f 64 75 63 74 49 64 22 ... 14 more bytes>
```

一个发送的报文就描述出来了。当报文被发送出去被接收后，需要将报文数据进行解码，继续来实现一下解码的过程~

```javascript
// 反序列化方法
function decodeBuf(buf) {
  const type = buf[0];
  const requestId = buf.readInt32BE(1);
  const length = buf.readInt32BE(5);
  const timeout = buf[9];

  const body = buf.split(10, 10 + length);

  return {
    type,
    requestId,
    length,
    timeout,
    body: json.parse(body),
  };
}

console.log(decodeBuf(buf));
```

将报文数据传输进去之后输出
![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9e00a4603c7149bb88855946e3f483a6~tplv-k3u1fbpfcp-watermark.image)

到这里，我们已经实现了 RPC 通信报文的`序列化`和`反序列化`，接下来就是实现一个`传输层服务`。

## 用 node 实现 RPC 框架

在 node 中创建 TCP 连接需要使用`net`的库，不熟悉的可以看一下官方关于 net 的[文档](https://nodejs.org/dist/latest-v14.x/docs/api/net.html#net_net_createserver_options_connectionlistener)

```typescript
import { createServer, createConnection } from 'net';

// 创建服务方法
export function createService() {
  const service = createServer((socket) => {
    socket.on('connect', () => {
      console.log('connect server');
    });

    socket.on('data', (data) => {
      const result = decodeBuf(data);
      // 如果是心跳包，直接跳过
      if (result.body.method === 'jump') return;
      else {
        // 否则处理方法
        console.log('server receive data', result);
        socket.write(
          encodeBuf(1, result.requestId, { code: 200, msg: 'success' })
        );
      }
    });

    socket.on('end', () => {
      console.log('disconnect server');
    });
  });

  service.listen(4444, () => {
    console.log(`service running at 4444`);
  });
}

// 创建一个客户端
export function createClient() {
  const client = createConnection({
    port: 4444,
  });
  client.write(
    encodeBuf(0, 1000, {
      method: 'addOrder',
      data: { productId: 1000, num: 1 },
    })
  );
  // 接收信息
  client.on('data', (data) => {
    console.log('client receive data', decodeBuf(data));
  });

  client.on('close', () => {
    console.log('client connect close');
  });
}

// 序列化报文
function encodeBuf(type, order, data) {
  const bodyLength = JSON.stringify(data).length;
  const bodyBuf = Buffer.alloc(bodyLength, JSON.stringify(data));
  const bufHeader = Buffer.alloc(10);
  bufHeader[0] = type;
  bufHeader.writeInt32BE(order, 1);
  bufHeader.writeInt32BE(bodyLength, 5);
  bufHeader[9] = 60;
  const buf = Buffer.concat([bufHeader, bodyBuf]);
  return buf;
}

// 反序列化报文
function decodeBuf(buf: any) {
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

// 调用测试
createService();
// 一秒后发送请求
setTimeout(() => {
  createClient();
}, 1000);
```

调用后返回。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/872dd8ec65d443949c74e14defd00928~tplv-k3u1fbpfcp-watermark.image)

成功~ 我们已经成功实现了一个 TCP 通信`service`和`client`。最后，把通信接入到 BFF 层。

## 优化 BFF 层

1. 修改一下网络层方法，对外暴露处理数据的接口

```javascript
export function createService(port, callback) {
  const service = createServer((socket) => {
    socket.on('connect', () => {
      console.log('connect server');
    });

    socket.on('data', (data) => {
      const result = decodeBuf(data);
      if (result.body.method === 'jump') return;
      else {
        console.log('server receive data', result);
        // 处理钩子
        const returnData = callback(result, socket);
        socket.write(encodeBuf(1, result.requestId, returnData));
      }
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
  return client;
}
```

2. 第二步，将微服务中的 HTTP 服务改为刚刚创建的网络服务

```javascript
// 订单服务
createService(4444, (data) => {
  const result = handleOrderInput(data.body);
  return result;
});

// 数据服务
createService(4445, (data) => {
  const result = handleDataInput(data.body);
  return result;
});
```

3. 最后，修改一下公共请求方法

```javascript
// 公共请求方法
async function publicRequest(port, method, data) {
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
```

测试一下

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/df801d67161644c6b05a66fafc05fe39~tplv-k3u1fbpfcp-watermark.image)

执行后返回

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/70064ababf3d4cd989b4283efcad814d~tplv-k3u1fbpfcp-watermark.image)

## 小结

本文主要介绍了 RPC 协议的设计和使用 node 实现协议。  
将实现好的 RPC 应用到 BFF 层与微服务之间调用。

## 参考

- [什么是 RPC？](https://link.juejin.cn/?target=https%3A%2F%2Fwww.jianshu.com%2Fp%2F7d6853140e13)

- [聊聊 Node.js RPC（一）— 协议](https://www.yuque.com/egg/nodejs/dklip5)

- [Node.js](https://nodejs.org/dist/latest-v14.x/docs/api/net.html#net_ipc_support)
