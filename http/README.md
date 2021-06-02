## 前言

前几天新来了一个前端小姐姐，而且就坐在我旁边，把母胎solo的我激动得说不出话来!!!!!   
今天她突然问我：怎么用TCP编写一个HTTP服务，我懵了一下，心想：这次是我表现的机会了😜，然后我就娓娓道来。

## 什么是HTTP

言归正传，要写一个http服务首先要了解一下HTTP是一个什么样的东西。HTTP(HyperText Transfer Protocol)译为超文本传输协议，它是一种`协议规范`，也就是**双方都要遵循的约定**。   
HTTP协议属于应用层协议，如图1所示，它在传输层之上，且基于传输层TCP和网络层IP协议进行数据传输。

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e43953902722411695afe3c0e1abb627~tplv-k3u1fbpfcp-watermark.image)
<sup>图1 TCP/IP传输通信协议层级</sup>

### HTTP请求报文和响应报文
了解完HTTP的定义，既然HTTP是一种协议规范，那它肯定会遵循一些发送和响应的规范，它们称之为HTTP的请求(响应)报文。那么下面就来了解一下报文里面会有什么。   
![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5f3262d9f50b4bbca57e7a3652a06ad2~tplv-k3u1fbpfcp-watermark.image)   
<sup>图2 http请求报文-1</sup>    
* 如图二所示，HTTP请求报文里面**第一行**会定义`方法`，`URL`，`版本号`，以空格隔开，最后面是一个换行符`\r\n`   
* 第二行开始就是报文首部字段，例如`Host`，`User-Agent`，`Connection`等header信息，每行以换行符`\r\n`隔开，最后用一个空行表示首部字段结束。   
* 首部字段结束后就是报文主体，一般我们POST请求的数据会放在这里。   
来看一个真实的HTTP请求报文头(图3)

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fc2dff13cdad450aa44a0d13e60df3e2~tplv-k3u1fbpfcp-watermark.image)
<sup>图3 http请求报文-2</sup>    

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/63e3e16cbaf24062a2899223fdd36f71~tplv-k3u1fbpfcp-watermark.image)   
<sup>图4 http响应报文</sup>  

同理，HTTP响应报文与请求报文大致相同，只是**第一行**有一些不一样，第一行按顺序填入的是`版本`，`状态码`，`短语`，最后是换行符`\r\n`   
首部字段和报文主体与请求报文大致相同
文章主要讲解的是HTTP协议，如果想了解更多TCP的知识(TCP连接三次握手，断开四次挥手)，请戳[这里](https://juejin.cn/post/6844903625513238541)   

大概的概念了解完了，接下来就是实践的一下了，怎么样用TCP手写一个HTTP服务（node）。

## 用TCP编写一个HTTP服务

### 1. 建立一个TCP连接

首先我们需要创建一个TCP服务，代码如下：
```typescript
    import net from 'net';
    
    const server = net.createServer((socket) => {
        socket.write('hello world');
        socket.pipe(socket);
        socket.end(); // 关闭连接
    })
    
    server.listen(9999, () => {
        console.log('tcp server running at 9999');
    })
```
到这里，一个简易的tcp服务就搭起来，测试的时候使用的是`telnet`命令

可以看到返回的是`hello world`，到这里其实已经成功了一半，现在在浏览器访问的时候，他会报错，意思是：`这是一个错误的响应`，因为我们没有遵循HTTP响应报文去返回值。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bdeea1d1f7c143128b5dd5653036904c~tplv-k3u1fbpfcp-watermark.image)   

### 2.按响应报文格式返回data

知道了问题所在，那我们再看回HTTP响应报文的格式编写返回值，根据报文去构造返回值的格式   
![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/63e3e16cbaf24062a2899223fdd36f71~tplv-k3u1fbpfcp-watermark.image)   

```typescript
    import net from 'net';
    
    const server = net.createServer((socket) => {
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nhello world`);
        socket.pipe(socket);
        socket.end(); // 关闭连接
    })
    
    server.listen(9999, () => {
        console.log('tcp server running at 9999');
    })
```

我们再使用浏览器打开 `http://localhost:9999`，成功了！这时他不会报错了，并且返回的也是我们在内容实体输入的`hello world`

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/112d2f8562a74516976fd1d89fc3f76b~tplv-k3u1fbpfcp-watermark.image)

### 3.最后封装

上面代码其实已经基本上实现了HTTP服务了，但是node中的`http`模块是这样创建服务的
```javascript
    const http = require('http');
    const server = http.createServer((req, res) => {
        res.end('hello world');
    })
    
    server.listen('9999');
```

依照这种创建服务的格式，来将其封装一下（代码可能有点长，源码地址会贴在文章最后小结里）
```typescript
// index.ts 入口文件，对外暴露方法
    import net from 'net';
    import { formatRequestMessage, IRequestData } from './req';
    import { Res, } from './res';

    type handle = (req: IRequestData, res: Res) => void

    /**
     * 创建函数
     * @param handler function
     */
    export const createServer = function(handler: handle) {
      const server = net.createServer((socket) => {
        closeConnection(socket);
        handleError(socket);
        console.log('user connect');
        socket.on('data', (data) => {
          console.log(data.toString());

          const req: IRequestData = formatRequestMessage(data.toString());
          const res = new Res({ socket });
          handler(req, res)
        })
      });

      function closeConnection(socket: net.Socket) {
        socket.on('end',() => {
          console.log('close connection');
        })
      }

      function handleError(socket: net.Socket) {
        socket.on('error', (err) => {
          console.log(err);
        })
      }

      server.listen('9999', () => {
        console.log('tcp server running at 9999');
      }); 
    }
    
```


```typescript
// req.ts 截取请求报文
    export type IRequestData = {
      method: string
      url: string
      version: string
      reqData: string
      [key: string]: any
    }

    /**
     * format request data
     * @param requestMsg user request http header
     */
    export function formatRequestMessage(requestMsg: string): IRequestData {
      const requestArr = requestMsg.split('\r\n');

      const [ method, url, version ] = requestArr.splice(0, 1)[0].split(' ');
      let header: Record<string, any> = {};
      let reqData: string = '';
      let isHeader = true;
      for(let x in requestArr) {
        if (requestArr[x] !== '' && isHeader) {
          const [ key, value ] = requestArr[x].split(': ')
          header[ key ] = value;
        } else if (isHeader) {
          isHeader = false;
        } else {
          reqData += requestArr[x]
        }
      }

      return Object.assign({ method, url, version, reqData, }, header,);

    }
```

```typescript
// res.ts 响应报文处理方法
    import net from 'net';

    type resData = {
      version: string
      socket: net.Socket
    }

    interface IConstructorData {
      version?: string
      socket: net.Socket
    }

    export class Res implements resData {
      public version: string;
      public socket: net.Socket;
      constructor({ version, socket, }: IConstructorData) {
        this.version = version || 'HTTP/1.1';
        this.socket = socket;
      }

      private formatSendData(status: number, message: string | number, header: Record<string, any> = {}): string {
        const statusStr = this.getStatusStr(status);
        const resHead = `${ this.version } ${ status } ${ statusStr }`;
        let headerStr = ``;
        for (let x in header) {
          headerStr += `${ x }: ${ header[x] }\r\n`;
        }
        return [ resHead, headerStr, message ].join('\r\n');
      }

      private getStatusStr(status: number): string {
        switch(status) {
          case 200: return 'OK';
          case 400: return 'Bad Request';
          case 401: return 'Unauthorized';
          case 403: return 'Forbidden';
          case 404: return 'Not Found';
          case 500: return 'Internal Server Error';
          case 503: return 'Server Unavailable';
          default: return 'Bad Request';
        }
      }
        
        // 暴露输出方法
      public end(status: number, message: any, options: { header?: {} } = { header: {} }): void {
        const resFormatMsg = this.formatSendData(status, message, options.header);

        this.socket.write(resFormatMsg);
        this.socket.pipe(this.socket);
        this.socket.end();
      }
    }

```

至此，一个简易的HTTP服务搭建完成，来测试一下
```typescript
    createServer((req, res) => {
      console.log(req);
      res.end(200, 'hello world123');
    })
```

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9601576e32d942ba9894039d862edfbe~tplv-k3u1fbpfcp-watermark.image)
请求报文能够成功截取到，浏览器中输出`hello world123`!

小姐姐听了后，激动的说：太好了，我回去可以教我男朋友了😄。   
我： ？？？心想：RNM退钱!!!

## 小结

本文简单地介绍了HTTP协议的内容，并且使用node利用TCP服务去编写一个HTTP服务，让我们对HTTP服务有一个更为深刻的理解。 

[源码地址](https://github.com/IchliebedichZhu/articles/tree/master/http)

若您觉得文章对你有帮助，可以点一个赞鼓励一下作者，若想了解更多JavaScript或者node知识可以点击[这里](https://github.com/IchliebedichZhu/articles)。    
若文章中有不严谨或出错的地方请在评论区域指出。

## 参考文章

1. [图解HTTP](https://item.jd.com/12837057.html)
2. [MDN HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)