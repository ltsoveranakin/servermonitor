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
exports.bot = exports.initInstance = exports.ping = exports.serverData = void 0;
const dotenv_1 = require("dotenv");
const ping_1 = require("./ping");
const utils_1 = require("./utils");
const crypto_js_1 = require("crypto-js");
const botdata_1 = require("./botdata");
const promises_1 = __importDefault(require("fs/promises"));
const fs_1 = __importDefault(require("fs"));
const discord_js_1 = require("discord.js");
const statusPath = "./data/status.txt";
(0, dotenv_1.config)();
exports.serverData = null;
var oldServerData = null;
function ping() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, ping_1.getServer)()
            .then(res => {
            exports.serverData = res;
        })
            .catch(() => {
            exports.serverData = null;
        });
        update();
        promises_1.default.writeFile(statusPath, crypto_js_1.AES.encrypt(JSON.stringify(exports.serverData), process.env.key).toString());
    });
}
exports.ping = ping;
function update() {
    var _a, _b;
    // console.log("updating", serverData, oldServerData)
    // console.log(getStatusChannels());
    if (exports.serverData) {
        botdata_1.data.lastValidData = exports.serverData;
    }
    if (exports.serverData != null || oldServerData != null) {
        const curNames = (_a = exports.serverData === null || exports.serverData === void 0 ? void 0 : exports.serverData.players.sample) === null || _a === void 0 ? void 0 : _a.map(player => player.name);
        const oldNames = (_b = oldServerData === null || oldServerData === void 0 ? void 0 : oldServerData.players.sample) === null || _b === void 0 ? void 0 : _b.map(player => player.name);
        const joinedPlayers = curNames === null || curNames === void 0 ? void 0 : curNames.filter(playerName => !(oldNames === null || oldNames === void 0 ? void 0 : oldNames.includes(playerName)));
        const leftPlayers = oldNames === null || oldNames === void 0 ? void 0 : oldNames.filter(player => !(curNames === null || curNames === void 0 ? void 0 : curNames.includes(player)));
        if (leftPlayers === null || leftPlayers === void 0 ? void 0 : leftPlayers.length) {
            (0, utils_1.getStatusChannels)().forEach(channel => {
                channel.send({
                    embeds: [
                        (0, utils_1.embedHelper)()
                            .setTitle("Player Leave")
                            .setDescription(leftPlayers.join(", ")),
                    ]
                });
            });
        }
        if (exports.serverData) {
            if (joinedPlayers === null || joinedPlayers === void 0 ? void 0 : joinedPlayers.length) {
                (0, utils_1.getStatusChannels)().forEach(channel => {
                    channel.send({
                        embeds: [
                            (0, utils_1.embedHelper)()
                                .setTitle("Player Join")
                                .setDescription(joinedPlayers.join(", ")),
                        ]
                    });
                });
            }
        }
    }
    if (!exports.serverData != !oldServerData) {
        if (exports.serverData) {
            (0, utils_1.getStatusChannels)().forEach(channel => {
                channel.send({
                    embeds: [
                        (0, utils_1.embedHelper)()
                            .setTitle("Server Status")
                            .setDescription("Online")
                    ]
                });
            });
        }
        else {
            (0, utils_1.getStatusChannels)().forEach(channel => {
                channel.send({
                    embeds: [
                        (0, utils_1.embedHelper)()
                            .setTitle("Server Status")
                            .setDescription("Offline")
                    ]
                });
            });
        }
    }
    oldServerData = exports.serverData;
}
function initInstance() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fs_1.default.existsSync(statusPath)) {
            yield promises_1.default.writeFile(statusPath, crypto_js_1.AES.encrypt(JSON.stringify(null), process.env.key).toString(), "utf-8");
        }
        try {
            // console.log(process.env.key)
            // console.log(AES.decrypt(await statusReader.read("utf-8"), process.env.key!).toString(enc.Utf8));
            const encStr = yield promises_1.default.readFile(statusPath);
            oldServerData = JSON.parse(crypto_js_1.AES.decrypt(encStr.toString("utf-8"), process.env.key).toString(crypto_js_1.enc.Utf8));
        }
        catch (e) {
            console.log(e);
            yield promises_1.default.unlink(statusPath);
            return;
        }
        ping();
    });
}
exports.initInstance = initInstance;
exports.bot = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.MessageContent,
    ]
});
// setInterval(ping, 1000 * 60);
setInterval(ping, 1e3 * 60 * botdata_1.data.pingInt);
//          1 sec,60 sec,3 min
