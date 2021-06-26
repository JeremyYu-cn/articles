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

createServer((req, res) => {
  console.log(req);
  res.end(200, 'hello world123');
})
