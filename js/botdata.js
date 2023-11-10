"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeData = exports.readData = exports.readBotDatEnc = exports.data = void 0;
const crypto_js_1 = require("crypto-js");
const dotenv_1 = require("dotenv");
const promises_1 = __importDefault(require("fs/promises"));
(0, dotenv_1.config)();
exports.data = {
    ip: "Not Set",
    port: 25565,
    pingInt: 3,
    killed: false,
    botChat: false,
    lastValidData: null,
};
const dataPath = "./data";
const dataFile = `${dataPath}/botdata.txt`;
promises_1.default.access(dataFile, promises_1.default.constants.F_OK)
    .catch(() => __awaiter(void 0, void 0, void 0, function* () {
    yield promises_1.default.mkdir(dataPath);
    yield promises_1.default.writeFile(dataFile, crypto_js_1.AES.encrypt(JSON.stringify({
        ip: process.env.ip,
        port: parseInt(process.env.port),
        pingInt: 3,
        killed: false,
        botChat: false,
        lastValidData: null,
    }), process.env.key).toString());
}))
    .finally(() => {
    readData();
});
function readBotDatEnc() {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield promises_1.default.readFile(dataFile)).toString("utf-8");
    });
}
exports.readBotDatEnc = readBotDatEnc;
function readData() {
    return __awaiter(this, void 0, void 0, function* () {
        const parsed = JSON.parse(crypto_js_1.AES.decrypt(yield readBotDatEnc(), process.env.key).toString(crypto_js_1.enc.Utf8));
        for (let key in parsed) {
            exports.data[key] = parsed[key];
        }
        if (exports.data.killed) {
            console.log("already killed");
            process.exit(1);
        }
    });
}
exports.readData = readData;
function writeData() {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log("writing", data)
        yield promises_1.default.writeFile(dataFile, crypto_js_1.AES.encrypt(JSON.stringify(exports.data), process.env.key).toString());
    });
}
exports.writeData = writeData;
