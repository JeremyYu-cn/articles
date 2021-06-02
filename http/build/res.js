"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Res = void 0;
var Res = /** @class */ (function () {
    function Res(_a) {
        var version = _a.version, socket = _a.socket;
        this.version = version || 'HTTP/1.1';
        this.socket = socket;
    }
    Res.prototype.formatSendData = function (status, message, header) {
        if (header === void 0) { header = {}; }
        var statusStr = this.getStatusStr(status);
        var resHead = this.version + " " + status + " " + statusStr;
        var headerStr = "";
        for (var x in header) {
            headerStr += x + ": " + header[x] + "\r\n";
        }
        return [resHead, headerStr, message].join('\r\n');
    };
    Res.prototype.getStatusStr = function (status) {
        switch (status) {
            case 200: return 'OK';
            case 400: return 'Bad Request';
            case 401: return 'Unauthorized';
            case 403: return 'Forbidden';
            case 404: return 'Not Found';
            case 500: return 'Internal Server Error';
            case 503: return 'Server Unavailable';
            default: return 'Bad Request';
        }
    };
    // 暴露输出方法
    Res.prototype.end = function (status, message, options) {
        if (options === void 0) { options = { header: {} }; }
        var resFormatMsg = this.formatSendData(status, message, options.header);
        this.socket.write(resFormatMsg);
        this.socket.pipe(this.socket);
        this.socket.end();
    };
    return Res;
}());
exports.Res = Res;
