/**
 * handle request method
 * date 2021-06-02
 * author jeremy Yu
 */

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
