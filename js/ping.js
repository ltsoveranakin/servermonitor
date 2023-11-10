"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServer = exports.envIp = void 0;
const dotenv_1 = require("dotenv");
const mcping_js_1 = require("mcping-js");
const botdata_1 = require("./botdata");
const inst_1 = require("./inst");
const discord_js_1 = require("discord.js");
(0, dotenv_1.config)();
exports.envIp = process.env.IP;
function getServer(ip = (botdata_1.data === null || botdata_1.data === void 0 ? void 0 : botdata_1.data.ip) || exports.envIp, port = (botdata_1.data === null || botdata_1.data === void 0 ? void 0 : botdata_1.data.port) || 25565) {
    return new Promise((resolve, reject) => {
        try {
            new mcping_js_1.MinecraftServer(ip, port).ping(3e3, 757, (er, res) => {
                var _a, _b;
                // console.log("pinged server " + ip, er, res);
                if (er) {
                    (_a = inst_1.bot.user) === null || _a === void 0 ? void 0 : _a.setPresence({
                        status: "dnd",
                        activities: [{
                                name: "the offline server",
                                type: discord_js_1.ActivityType.Watching
                            }]
                    });
                    reject(er);
                }
                else {
                    (_b = inst_1.bot.user) === null || _b === void 0 ? void 0 : _b.setPresence({
                        status: "online",
                        activities: [{
                                name: `on the server with ${res.players.online} other${res.players.online == 1 ? "" : "s"}`,
                                type: discord_js_1.ActivityType.Playing
                            }]
                    });
                    resolve(res);
                }
            });
        }
        catch (e) {
            reject(e);
        }
    });
}
exports.getServer = getServer;
