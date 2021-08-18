---
highlight: a11y-dark
theme: smartblue
---

这是我参与 8 月更文挑战的第`6`天，活动详情查看：**[8 月更文挑战](https://juejin.cn/post/6987962113788493831)**

## 前言

我们开发一个简单的应用的业务架构如下：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8eac7a6cd39c4c4888533d6636fc51b7~tplv-k3u1fbpfcp-watermark.image)

最开始的时候前端只需要调用一个服务就可以完成对应的业务。  
后来，业务逻辑逐渐复杂。后端将复杂的业务分离成一个新的服务出来了：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c2668a79149e400c857b492955cb912e~tplv-k3u1fbpfcp-watermark.image)

这时前端需要调用两个不同的业务接口才可以满足业务的需要。  
随着业务越来越复杂，后端需要拆分的业务也越来越多(**微服务化**)，这时候前端需要满足业务需求，一个功能不得不调用两个或多个微服务接口才能完成业务：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4cb60e9ec6ae4f2984e64e8cf28a54aa~tplv-k3u1fbpfcp-watermark.image)

这样的架构前端的代码实现必然会变得非常臃肿和繁杂，同时过多的请求可能也会导致网络性能瓶颈。所以为了解决这个问题，有人提出了`BFF层`。

## BFF 层

### BFF 层是什么

在构建 BFF 层之前，首先要了解 BFF 层是什么。  
BFF（Backend For FrontEnd），简单地来说 BFF 就是：给前端服务的后端。他并不是技术，而是一种逻辑的分层。它位于后端微服务与前端之间，最直接的作用就是**对接处理前端的请求**。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bdac40bd8e7742febbe6fb7f19ff91b4~tplv-k3u1fbpfcp-watermark.image)

通过 BFF 层，前端在调用接口时，只需要调用业务的 BFF 层接口，BFF 层将业务中需要请求的微服务整合起来。这样，即使我们在后端改动微服务时，也只需改动 BFF 层，无需修改前端代码。

### BFF 能做什么

- 服务聚合  
   上文提到，BFF 层可以将业务中的多个微服务整合起来，对外只暴露一个接口点，前端只需调用一个接口和关注数据的传输，无需关注微服务复杂的调用。

- 缓存数据  
   BFF 层对接的是前端请求，作为业务请求微服务的处理点，它还可以做数据的缓存。

- 访问控制  
   `服务中的权限控制，将所有服务中的权限控制集中在 BFF 层，使下层服务更加纯粹和独立。`

## 使用 Node 构建 BFF 层

了解完 BFF 层是什么，接下来我们使用**Node.js**构建一个用于`服务聚合`的**BFF 层**的 demo。

### 业务场景

后端中有两个微服务：

- 一个是管理大数据系统的微服务，提供记录大数据信息和推送功能。
- 一个则是管理订单信息的微服务，提供订单的增删改查功能。
- 前端在下单的同时也需要调用大数据信息录入的功能。

### 系统类图

后端提供服务的系统类图如下

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/49e1ed749fb54e5485c01ccb2cadcf1c~tplv-k3u1fbpfcp-watermark.image)

### 调用时序图

BFF 层接收到 WEB 请求后，向`Order service`和`Data Service`发送请求，两个服务处理完成后，BFF 层向前端返回消息，时序图如下：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b9b5a9b02ea94cb9981e55fb7d39fa3f~tplv-k3u1fbpfcp-watermark.image)

### 构建一个简单的 BFF 层

系统设计完了，现在开始实现代码，首先实现**订单微服务**和**数据微服务**

```javascript
const http = require('http');

// 订单服务
const orderApp = http.createServer((req, res) => {
  handleOrderInput(req, res);
});

orderApp.listen(8081, () => {
  console.log('Order Server is running at 8081 port');
});

// 数据服务
const dataApp = http.createServer((req, res) => {
  handleDataInput(req, res);
});

dataApp.listen(8082, () => {
  console.log('Data Server is running at 8082 port');
});

function handleOrderInput(req, res) {
  switch (req.url) {
    case '/order/add':
      res.end('{ code: 200, msg: "success", data: "" }');
      break;
    default:
      res.end('{ code: 500, msg: "route not found", data: "" }');
      break;
  }
}

function handleDataInput(req, res) {
  switch (req.url) {
    case '/data/add':
      res.end('{ code: 200, msg: "success", data: "" }');
      break;
    default:
      res.end('{ code: 500, msg: "route not found", data: "" }');
      break;
  }
}
```

上面代码中，我们创建了订单服务和数据服务，分别占用`8081`和`8082`端口。接下来创建 BFF 层

```javascript
const http = require('http');
const BFF = http.createServer((req, res) => {
  handleBFF(req, res);
});

BFF.listen(8080, () => {
  console.log('BFF Server is running at 8080 port');
});

function handleBFF(req, res) {
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
function addOrder(req, res) {
  if (req.method !== 'POST') {
    res.end('{ code: 500, msg: "route not found", data: "" }');
    return;
  }

  let data = '';
  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', async () => {
    const orderResult = await publicRequest(
      'http://localhost:8081/order/add',
      data
    );
    const dataResult = await publicRequest(
      'http://localhost:8082/data/add',
      data
    );
    res.end(JSON.stringify({ orderResult, dataResult }));
  });
}

// 公共请求方法
async function publicRequest(url, data) {
  return new Promise((resolve) => {
    const request = http.request(url, (response) => {
      let resData = '';
      response.on('data', (chunk) => {
        resData += chunk;
      });
      response.on('end', () => {
        resolve(resData.toString());
      });
    });

    request.write(data);
    request.end();
  });
}
```

在 BFF 层中，创建了一个用户请求服务的公共请求方法。请求中将添加订单并且调用数据服务接口添加数据。测试一下：  
运行服务  
![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2815d22ca6c64757af77d274a3546a07~tplv-k3u1fbpfcp-watermark.image)

发起一个 http 请求

```http
POST http://localhost:8080/order/add HTTP/1.1
Content-Type: application-json
{
  "productId": 1,
  "type": "toy"
}
```

返回

```http
HTTP/1.1 200 OK
Date: Mon, 16 Aug 2021 06:20:19 GMT
Connection: close
Content-Length: 120
{"orderResult":"{ code: 200, msg: \"success\", data: \"\" }","dataResult":"{ code: 200, msg: \"success\", data: \"\" }"}
```

到这里，一个最简单的 BFF 层就实现了。  
可以注意到，在 BFF 层中调用其他服务接口时，现在使用的是**HTTP**请求，内网之间相当于做了一次请求的转发，由于是基于 HTTP 协议，所以网络性能上可能也会有不太好的体验。  
有没有一种方法可以在传输层上传输请求信息呢？答案是使用**RPC（远程过程调用）**

### 优化 BFF 层

- RPC 远程过程调用  
   `简单的理解是一个节点请求另一个节点提供的服务`，他是基于 TCP 的数据传输，数据会直接在**传输层**完成传输。服务端与客户端基于**socket**链接。数据传输的图如下：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f17120880142475dadc43a535a5a2bb2~tplv-k3u1fbpfcp-watermark.image)

- node 中的实现

  实现一个 RPC 框架是一个系统的工程，下一节中将使用 node.js 实现一个 RPC。

## 小结

本文介绍了 BFF 的概念以及如何使用 Node.js 构建一个 BFF 层

若文章中有不严谨或出错的地方请在评论区域指出~

## 参考

- [BFF —— Backend For Frontend](https://www.jianshu.com/p/eb1875c62ad3)
- [什么是 RPC？](https://www.jianshu.com/p/7d6853140e13)
