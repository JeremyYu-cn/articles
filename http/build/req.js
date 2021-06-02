"use strict";
/**
 * handle request method
 * date 2021-06-02
 * author jeremy Yu
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatRequestMessage = void 0;
/**
 * format request data
 * @param requestMsg user request http header
 */
function formatRequestMessage(requestMsg) {
    var requestArr = requestMsg.split('\r\n');
    var _a = requestArr.splice(0, 1)[0].split(' '), method = _a[0], url = _a[1], version = _a[2];
    var header = {};
    var reqData = '';
    var isHeader = true;
    for (var x in requestArr) {
        if (requestArr[x] !== '' && isHeader) {
            var _b = requestArr[x].split(': '), key = _b[0], value = _b[1];
            header[key] = value;
        }
        else if (isHeader) {
            isHeader = false;
        }
        else {
            reqData += requestArr[x];
        }
    }
    return Object.assign({ method: method, url: url, version: version, reqData: reqData, }, header);
}
exports.formatRequestMessage = formatRequestMessage;
