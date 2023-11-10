
import { getCommand } from "./command";
import { initInstance } from "./inst";
import e from "express";
import { bot } from "./inst";
import { exec } from "child_process"
import { Message } from "discord.js";

const app = e();
let loggedIn = false;

app.all("/", (_req, res) => {
    res.send("Hello");
});

app.all("*", (_req, res) => {
    res.send("404");
});


app.listen(process.env.PORT || 3000, () => {
    console.log("http server up");
})


const prefix = "*";


bot.on("ready", () => {
    console.log(bot.user?.tag + " ready");
    initInstance();
    loggedIn = true;
});

function catchResult(result: any, m: Message<boolean>) {
    if (result instanceof Promise) {
        result.catch((e) => {
            console.log(e);
            m.channel.send("There was an error running that command:" + e.message);
        });
    }
}

bot.on("messageCreate", (m) => {
    try {
        const strMsg = m.content.toLowerCase();

        if(!strMsg.startsWith(prefix)) return;

        const args = strMsg.split(" ");
        const command = args.shift()?.replace(prefix, "")!;

        // console.log(args, command);

        const cmd = getCommand(command);

        if(cmd) {
            if(args.length) {
                if(cmd.arg) {
                    catchResult(cmd.arg.input(m, args),m);
                    return;
                }
            }
            catchResult(cmd.input(m), m);
        }
    } catch(e) {
        m.channel.send("Error handling command");
        console.log(e);
    }
})

bot.login(process.env.TOKEN);

setTimeout(() => {
    if(!loggedIn) {
        console.log("killing");
        exec("kill 1");
    }
}, 2e4);