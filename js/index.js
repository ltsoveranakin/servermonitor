"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("./command");
const inst_1 = require("./inst");
const express_1 = __importDefault(require("express"));
const inst_2 = require("./inst");
const child_process_1 = require("child_process");
const app = (0, express_1.default)();
let loggedIn = false;
app.all("/", (_req, res) => {
    res.send("Hello");
});
app.all("*", (_req, res) => {
    res.send("404");
});
app.listen(process.env.PORT || 3000, () => {
    console.log("http server up");
});
const prefix = "*";
inst_2.bot.on("ready", () => {
    var _a;
    console.log(((_a = inst_2.bot.user) === null || _a === void 0 ? void 0 : _a.tag) + " ready");
    (0, inst_1.initInstance)();
    loggedIn = true;
});
function catchResult(result, m) {
    if (result instanceof Promise) {
        result.catch((e) => {
            console.log(e);
            m.channel.send("There was an error running that command:" + e.message);
        });
    }
}
inst_2.bot.on("messageCreate", (m) => {
    var _a;
    try {
        const strMsg = m.content.toLowerCase();
        if (!strMsg.startsWith(prefix))
            return;
        const args = strMsg.split(" ");
        const command = (_a = args.shift()) === null || _a === void 0 ? void 0 : _a.replace(prefix, "");
        // console.log(args, command);
        const cmd = (0, command_1.getCommand)(command);
        if (cmd) {
            if (args.length) {
                if (cmd.arg) {
                    catchResult(cmd.arg.input(m, args), m);
                    return;
                }
            }
            catchResult(cmd.input(m), m);
        }
    }
    catch (e) {
        m.channel.send("Error handling command");
        console.log(e);
    }
});
inst_2.bot.login(process.env.TOKEN);
setTimeout(() => {
    if (!loggedIn) {
        console.log("killing");
        (0, child_process_1.exec)("kill 1");
    }
}, 2e4);
