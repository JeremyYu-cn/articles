const net = require('net');
    
const server = net.createServer((socket) => {
  socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nhello world`);
  socket.pipe(socket);
  socket.end(); // 关闭连接
})

server.listen(9999, () => {
  console.log('tcp server running at 9999');
})