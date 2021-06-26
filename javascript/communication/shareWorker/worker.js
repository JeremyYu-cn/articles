'use strict';

const ports = [];

// 链接时触发
onconnect = (event) => {
    const port = event.ports[0];
    ports.push(port);
    port.onmessage = (e) => {
        ports.filter(p => p !== port) // 广播消息时把自己除掉
        .forEach(p => p.postMessage(e.data)); // 向链接池里的用户发送消息
    };
}
