## Worker Threads

node 中的多线程是在 node 版本 v10.5.0 引入的一个的一个新特性，在很长一段时间内`Worker Thread`都是实验性质的，到目前为止，node 稳定的版本已经到了 14.17.4，这个特性已经变成**稳定可用**了。

### worker_thread 是什么

先来来看看官网的描述

    The `worker_threads` module enables the use of threads that
    execute JavaScript in parallel.

意思就是：`worker_thread`模块允许使用线程来**并行**执行 JavaScript。

我们以前 Javascript 都是单线程然后利用一个事件循环队列(`event loop`)不断监听`执行栈`是否有函数进入。对于 worker_thread，其实可以理解为一个`event loop`中有多个 javascript 工作线程，创建一个线程相当于创建一个新的 js 执行环境。多线程的运行如下图

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0721547a789d452ca44f222c3b658751~tplv-k3u1fbpfcp-watermark.image)

### 与 child_process 的区别

`child_process`是可以创建一个新的 node 进程，`worker_thread`与它的最大区别就是：**worker_thread 可以共享内存**，公共的数据可以在线程之间公用，而 child_process 只能通过 JSON 去传递数据。

还有就是：因为线程是在一个进程内的，创建一个线程的**开销**会比创建一个进程要**小**

### worker_thread 的适用范围

`worker_thread`在**CPU 密集型的 JS 操作**中非常有用，但是在 IO 密集型操作中性能不会有太多的改善，反而 Node 自带的一步 IO 操作会比工作线程更有用。

## 使用 worker_thread

介绍完 worker_thread 的概念，现在来介绍一下他的用法

### 创建工作线程

```javascript
const { isMainThread, Worker, parentPort } = require('worker_threads');

if (isMainThread) {
  createChildThread();
} else {
  parentPort.on('message', (msg) => {
    console.log('parent thread listen:', msg);
  });
  parentPort.postMessage('hello child thread');
}

// 创建线程方法
function createChildThread() {
  const worker = new Worker(__filename);
  worker.on('message', (val) => {
    console.log('child thread listen:', val);
    worker.postMessage('hello parent thread');
  });
}
```

上面代码在**主线程**的时候调用创建工作线程的方法，创建一个工作线程并且新增一个，而创建工作线程后调用主线程的端口向工作线程发送消息，工作线程接受到消息后再向主线程回应。大概的流程图如下

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9de637732d9e490bacde8c1ee5919f68~tplv-k3u1fbpfcp-watermark.image)

执行后返回

创建线程前
![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7d74d14094c94dc6a962fdaa35e1cc88~tplv-k3u1fbpfcp-watermark.image)

创建线程后，线程数量+1
![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2ff4d25fab214e03aad66df31536a412~tplv-k3u1fbpfcp-watermark.image)

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/43f42225ce9c4bd49917896821af218b~tplv-k3u1fbpfcp-watermark.image)

## 线程间通信

上文提到，`worker_threads`可以通过`ArrayBuffer`或`SharedArrayBuffer`共享内存。接下来看一下，它在代码中是如何实现的.

```javascript
const { isMainThread, Worker, parentPort } = require('worker_threads');

if (isMainThread) {
  createChildThread();
} else {
  // 创建一个长度为4byte的SharedArrayBuffer
  const shareBuf = new SharedArrayBuffer(4);
  // 创建一个8位无符号整型数组
  const bufInt = new Uint8Array(shareBuf);
  parentPort.on('message', () => {
    console.log('parent thread listen:', bufInt);
  });
  // 发送共享内存创建的整型
  parentPort.postMessage({ bufInt });
}

// 创建线程方法
function createChildThread() {
  const worker = new Worker(__filename);
  worker.on('message', ({ bufInt }) => {
    console.log('child thread listen:', bufInt);
    bufInt[0] = 11;
    worker.postMessage('finished');
  });
}
```

运行后返回，可以看到在子线程创建一个`SharedArrayBuffer`，用主线程广播的一个数据，在子线程中接收后赋值，因为是线程间共享的 Buffer，所以主线程这边也可以看到在子线程中修改的数据。  
![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/58653d9b171841b6a75547e1f8c05919~tplv-k3u1fbpfcp-watermark.image)

如图所示，使用`SharedArrayBuffer`创建的值会分配到共享内存中，所有线程都可以共用这块内存。  
![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f5c4febc17c04102b948c7330a434248~tplv-k3u1fbpfcp-watermark.image)

### 线程间通信

我们已经学会**创建线程**和**使用共享内存**了，从上面代码可以看到，线程都是从主线程中发送消息，然后子线程向主线程回复消息，没有办法让两个子线程直接直接通信，如果我想让两个子线程**直接通信**，那就需要用到`MessageChannel`这个类了，`MessageChannel`的具体用法可以点击[这里](https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel)。现在就来实现一下子线程之间的直接通信。

```javascript
const {
  isMainThread,
  Worker,
  parentPort,
  MessageChannel,
  threadId,
} = require('worker_threads');

if (isMainThread) {
  createChildThread();
} else {
  parentPort.on('message', ({ port }) => {
    // 主线程接收到端口后配置通信端口方法
    port.on('message', (msg) => {
      console.log(`port${threadId} listen:`, msg);
    });
    port.postMessage(`hello, im thread ${threadId}`);
  });
  parentPort.postMessage('hello');
}

// 创建线程方法
function createChildThread() {
  const { port1, port2 } = new MessageChannel(); // 创建一个MessageChannel
  const worker1 = new Worker(__filename); // 创建子线程1
  const worker2 = new Worker(__filename); // 创建子线程2
  worker2.postMessage({ port: port1 }, [port1]); // 向主线程发送Channel的端口1
  worker1.postMessage({ port: port2 }, [port2]); // 向主线程发送Channel的端口1
}
```

运行代码后返回
![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/939c747217804f82b241d743e82ceb97~tplv-k3u1fbpfcp-watermark.image)

从代码实现可以看到，最终建立子线程直接通信的步骤还是在**主线程的 message 事件中**。建立通信的流程图如下

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/185044e925fa480a8ac397de3506ee83~tplv-k3u1fbpfcp-watermark.image)

## 实战

了解完线程的概念和用法，现在来实战一下：比如在数组中有 100 万条数据需要 md5 加密，对比一下使用工作线程和不使用工作线程的实现速度怎么样

```javascript
const {
  isMainThread,
  Worker,
  parentPort,
  threadId,
} = require('worker_threads');
const { createHash } = require('crypto');

const ARR_NUM = 1000000; // 数组长度
const WORKER_NUM = 1; // 线程数
const size = Math.ceil(ARR_NUM / WORKER_NUM); // 每个线程需要处理的数据量

if (isMainThread) {
  createChildThread();
} else {
  parentPort.on('message', ({ status, index, startTime }) => {
    if (index === WORKER_NUM) {
      const usedTime = Date.now() - startTime;
      console.log(`finish bussiness time: ${usedTime}ms`);
      process.exit(threadId);
    }
  });
  const data = addHasCode(threadId, size, (threadId - 1) * size);
  // 完成后
  parentPort.postMessage({
    business: 'finish work',
    data,
  });
}

// 创建线程方法
function createChildThread() {
  let finishNumBuf = new SharedArrayBuffer(4);
  let finishNum = new Uint8Array(finishNumBuf);
  const startTime = Date.now();
  for (let x = 0; x < WORKER_NUM; x++) {
    const worker = new Worker(__filename, {});
    worker.on('message', ({ business, data }) => {
      if (business === 'finish work') {
        finishNum[0]++;
        worker.postMessage({
          status: `finish worker ${x}`,
          index: finishNum[0],
          startTime: startTime,
          data,
        });
      }
    });
  }

  console.log(`${WORKER_NUM} thread start working`);
}

// 加密方法
function addHasCode(index, size, limit) {
  const result = [];
  for (let x = limit, num = index * size; x < num; x++) {
    result.push(createHash('md5').update('hello world').digest('base64'));
  }
  return result;
}
```

使用`1`个线程计算，平均需要`2700ms`左右
![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/270bd6ff5f924724ac077b3570c569b6~tplv-k3u1fbpfcp-watermark.image)

使用`5`个线程计算，平均需要`2000ms`左右
![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5c7bb6b4fcd84b76ad179f76439f4da7~tplv-k3u1fbpfcp-watermark.image)

使用`20`个线程计算，平均需要`2500ms`左右
![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/48bbca5d205047c88c37c04b791ebf33~tplv-k3u1fbpfcp-watermark.image)

使用`60`个线程计算，平均需要`3800ms`左右
![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/51505ec57d9e4bc5a0d0d9806e38a6a5~tplv-k3u1fbpfcp-watermark.image)

可见，**线程不是越多越好**，过多的线程可能会增加过多的系统开销，速度也不如单线程时候运行。

## 小结

本文介绍了 nodeJs 中的`worker_threads`的概念，去多进程的区别，和它的优点。  
介绍了`worker_threads`是如何使用，共享内存，还有子线程之间的通信。  
最后用一个测试子进程的效率的例子说明`worker_threads`对比单线程运行。

## 参考

- [Worker Theread](https://nodejs.org/dist/latest-v14.x/docs/api/worker_threads.html#)
