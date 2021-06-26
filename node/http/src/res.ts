import net from 'net';
/**
 * handle response method
 * date 2021-06-02
 * author jeremy Yu
 */

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
