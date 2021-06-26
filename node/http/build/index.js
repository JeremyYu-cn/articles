"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
var net_1 = __importDefault(require("net"));
var req_1 = require("./req");
var res_1 = require("./res");
/**
 * 创建函数
 * @param handler function
 */
var createServer = function (handler) {
    var server = net_1.default.createServer(function (socket) {
        closeConnection(socket);
        handleError(socket);
        console.log('user connect');
        socket.on('data', function (data) {
            console.log(data.toString());
            var req = req_1.formatRequestMessage(data.toString());
            var res = new res_1.Res({ socket: socket });
            handler(req, res);
        });
    });
    function closeConnection(socket) {
        socket.on('end', function () {
            console.log('close connection');
        });
    }
    function handleError(socket) {
        socket.on('error', function (err) {
            console.log(err);
        });
    }
    server.listen('9999', function () {
        console.log('tcp server running at 9999');
    });
};
exports.createServer = createServer;
exports.createServer(function (req, res) {
    console.log(req);
    res.end(200, 'hello world123');
});
