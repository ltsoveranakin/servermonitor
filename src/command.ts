import { EmbedBuilder, Message } from "discord.js";
import { bot, ping } from "./inst";
import { serverData } from "./inst";
import { getServer, envIp } from "./ping";
import { embedHelper, getChannels } from "./utils";
import { data, writeData } from "./botdata";


type ArgCB = (m: Message, args: string[]) => void | Promise<void>;

class Arg {
    constructor(public readonly name: string, public readonly desc: string, private readonly cb: ArgCB) {

    }

    input(m: Message, args: string[]) {
        return this.cb(m, args);
    }
}

// class EnumArg extends Arg {
//     constructor(name: string, desc: string, cb: ArgCB) {
//         super(name, desc, cb);
//     }

//     override input(m: Message<boolean>, args: string[]): void {

//     }
// }

class ListArg extends Arg {
    args: Arg[] = [];

    arg(arg: Arg) {
        this.args.push(arg);
        return this;
    }

    getArg(name: string) {
        for (const arg of this.args) {
            if (arg.name == name) {
                return arg;
            }
        }
        return null;
    }

    override input(m: Message<boolean>, args: string[]): void {
        const arg = this.getArg(args[0]);

        if (arg && args.length > 1) {
            args.shift()
            try {
                arg.input(m, args);
            } catch (ex) {
                m.channel.send("Ran into error: " + (ex as any).message)
            }
        } else {
            m.channel.send("Try using help");
        }
    }
}

export abstract class Command {
    arg: Arg | null = null;
    constructor(public readonly name: string, public readonly desc: string) {

    }

    embed() {
        return embedHelper()
            .setTitle(this.name.toUpperCase())
            .setDescription(this.desc);
    }

    /**
     * Called when no arguments were provided
     * @param m 
     */
    abstract input(m: Message): Promise<void> | void;
}

export const commands: Command[] = [];

function addCmd(command: Command) {
    commands.push(command);
}

export function getCommand(commandName: string) {
    for (const command of commands) {
        // console.log(command.name, commandName, command.name == commandName);
        if (command.name == commandName) return command;
    }
    return null;
}

function sendLongStr(m: Message<boolean>, str: string) {
    if (str.length > 2000) {
            m.channel.send("Content is above 200 chars, uploading file...");
            m.channel.send({
                files: [{
                    name: "content.json",
                    attachment: Buffer.from(str)
                }]
            });
        } else
            m.channel.send("```" + str + "```");
}

class HelpCommand extends Command {
    constructor() {
        super("help", "helps with commands");

        this.arg = new Arg("command", "gets help with the specified command", (m, args) => {
            const cmd = getCommand(args[0]);
            const embed = this.embed();

            if (cmd) {
                embed
                    .setTitle(cmd.name)
                    .setDescription(cmd.desc);

                if (cmd.arg) {
                    if (cmd.arg instanceof ListArg) {
                        embed.addFields({
                            name: "Arguments:",
                            value: "possible args:"
                        });

                        for (const arg of cmd.arg.args) {
                            embed.addFields({
                                name: arg.name,
                                value: arg.desc
                            });
                        }
                    } else {
                        embed.addFields(
                            {
                                name: "Argument:",
                                value: "-"
                            },
                            {
                                name: cmd.arg.name,
                                value: cmd.arg.desc,
                                inline: true
                            },
                            {
                                name: "Usage:",
                                value: `${cmd.name} <${cmd.arg.name}>`,
                                inline: true
                            });
                    }
                }

            } else {
                embed
                    .addFields({
                        name: "Error",
                        value: `No command named "${args[0]}"`
                    });
            }

            m.channel.send({
                embeds: [
                    embed
                ]
            })
        });
    }

    input(m: Message) {
        const embed = this.embed();

        for (const commandIndex of commands) {
            embed.addFields({
                name: commandIndex.name,
                value: commandIndex.desc
            });
        }

        m.channel.send({
            embeds: [embed]
        });
    }
}

class StatusCommand extends Command {
    constructor() {
        super("status", "gets the server status");
    }

    input(m: Message<boolean>): void {
        m.channel.send({
            embeds: [
                this.embed()
                    // .setTitle("Server Status")
                    // .setDescription(`Server is ${serverData ? "online" : "offline"}`)
                    .addFields({
                        name: "Status:",
                        value: serverData ? "Online" : "Offline"
                    })
            ]
        })
    }

}

class PingCommand extends Command {
    constructor() {
        super("ping", "pings the server");
    }

    async input(m: Message<boolean>) {
        m.channel.send("Pinging...");
        getServer()
            .then(() => {
                m.channel.send("Just pinged the server, and it's online.");
            })
            .catch((e) => {
                m.channel.send("Ran into an issue pinging the server... ```" + e.message + "```");
            });


    }
}

class IPCommand extends Command {
    constructor() {
        super("ip", "gets the ip of the server");
    }

    input(m: Message<boolean>) {
        m.channel.send({
            embeds: [
                this.embed()
                    // .setTitle("Server IP:")
                    // .setDescription(serverIp)
                    .addFields({
                        name: "IP:",
                        value: data?.ip || envIp
                    })
            ]
        })
    }
}

class KillCommand extends Command {
    constructor() {
        super("kill", "stops the bot immediately");
    }

    async input(m: Message<boolean>) {
        data.killed = true;
        await writeData();
        await m.channel.send("Exiting node process");
        bot.destroy();

        process.exit(1);
    }
}

class JSONCommand extends Command {
    constructor() {
        super("json", "returns the raw json from the server");
    }

    input(m: Message<boolean>): void {
        sendLongStr(m, JSON.stringify(serverData));
    }
}

class SetCommand extends Command {
    input(m: Message<boolean>): void {
        m.channel.send({
            embeds: [this.embed().addFields(
                {
                    name: "Error",
                    value: "Set type must be specified"
                })]
        });
    }

    constructor() {
        super("set", "set attributes about the bot");



        this.arg = new ListArg("val", "the value to set", (_m, args) => {
            console.log("ls arg", args)
        }).arg(new Arg("ip", "set the ip of the server", async (m, args) => {
            data.ip = args[0];
            await writeData();
            m.channel.send(`Set the IP to ${args[0]}`);
        }))
            .arg(new Arg("port", "set the port of the server", async (m, args) => {
                const parsed = isNaN(parseInt(args[0])) ? 25565 : parseInt(args[0]);
                data.port = parsed;
                await writeData();
                m.channel.send(`Set the port to ${parsed}`);
            }))
            .arg(new Arg("ping_interval", "set the interval on how often the bot should ping the server (minutes)", async (m, args) => {
                const parsed = isNaN(parseInt(args[0])) ? 25565 : parseInt(args[0]);
                data.pingInt = parsed;
                await writeData();
                m.channel.send(`Set the ping interval to ${parsed}, restart the bot to take effect`);
            }))
            .arg(new Arg("chat_integration", "adds integration to minecraft in game chat", async (_m, _args) => {
                // const enabled = args[0] == "on" ? true : args[0] == "off" :
            }));
    }
}

class PortCommand extends Command {
    input(m: Message<boolean>): void {
        // console.log(data);
        m.channel.send({
            embeds: [this.embed().addFields(
                {
                    name: "Port:",
                    value: (data.port || 25565
                    ).toString(),
                })]
        });
    }
    constructor() {
        super("port", "port of the server");
    }
}

class PollCommand extends Command {
    constructor() {
        super("poll", "creates a poll");

        this.arg = new Arg("name", "name of the poll", async (m, args) => {
            const pollMsg = args.join(" ");
            for (const channel of getChannels("server-poll")) {
                const msg = await channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Poll")
                            .setFields({
                                name: "Poll by " + m.author.tag,
                                value: pollMsg,
                            })
                    ]
                });

                msg.react("👍");
                msg.react("👎")
            }
        });
    }

    input(m: Message<boolean>): void {
        // console.log(data);
        m.channel.send({
            embeds: [this.embed().addFields(
                {
                    name: "Error",
                    value: "unhandled error",
                })]
        });
    }
}

class InviteCommand extends Command {
    constructor() {
        super("invite", "returns an invite for the bot");
    }

    override input(m: Message<boolean>): void {
        m.channel.send({
            embeds: [this.embed().addFields(
                {
                    name: "Invite",
                    value: "https://discord.com/api/oauth2/authorize?client_id=1006573017494736988&permissions=93248&scope=bot",
                })]
        });
    }
}

class RefreshCommand extends Command {
    constructor() {
        super("refresh", "runs the ping function, and updates the bot");
    }

    override input(m: Message<boolean>): void {
        m.channel.send("refreshing...");
        ping();
    }
}

// class GetCommand extends Command {
//     constructor() {
//         super("get", "gets atributes from data");

//         this.arg = new ListArg("val", "the value to set", (_m, args) => {
//             console.log("ls arg", args)
//         }).arg(new Arg("ip", "set the ip of the server", async (m) => {
//             m.channel.send(`The ip is ${data.ip}`);
//         }))
//         .arg(new Arg("port", "set the port of the server",async (m) => {
//             m.channel.send(`The port is ${data.port}`);
//         }))
//         .arg(new Arg("pinginterval", "set the interval on how often the bot should ping the server (sec.)",async (m) => {
//             m.channel.send(`The ping interval is ${data.pingInt}`);
//         }));
//     }

//     input(m: Message<boolean>): void {
//         m.channel.send("error handling command");
//     }
// }

class VersionCommand extends Command {
    constructor() {
        super("version", "gets the server version");
    }

    override input(m: Message<boolean>): void {
        if (serverData != null) {
            m.channel.send({
                embeds: [this.embed().addFields(
                    {
                        name: "Version",
                        value: serverData.version.name,
                    })]
            });
        } else {
            m.channel.send(`Server is offline, but the last time the server was online the version was ${data.lastValidData ? data.lastValidData.version : "unkown"}`);
        }
    }
}

class PlayersCommand extends Command {
    constructor() {
        super("players", "gets the players on the server");
    }

    override input(m: Message<boolean>): void {
        if (serverData != null) {
            m.channel.send({
                embeds: [this.embed().addFields(
                    {
                        name: "Players",
                        value: serverData.players.sample!.map(pl => pl.name).join(", "),
                    })]
            });
        } else {
            m.channel.send("Server is offline");
        }
    }
}

class DataCommand extends Command {
    constructor() {
        super("data", "sends config data");
    }

    override input(m: Message<boolean>): void | Promise<void> {
        sendLongStr(m, JSON.stringify(data));
    }
}

addCmd(new SetCommand());
addCmd(new JSONCommand());
addCmd(new KillCommand());
addCmd(new IPCommand());
addCmd(new PingCommand());
addCmd(new StatusCommand());
addCmd(new HelpCommand());
addCmd(new PortCommand());
addCmd(new DataCommand());
addCmd(new PollCommand());
addCmd(new InviteCommand());
addCmd(new RefreshCommand());
addCmd(new VersionCommand());
addCmd(new PlayersCommand());
// addCmd(new GetCommand());

commands.sort((a, b) => {
    if (a.name < b.name) {
        return -1;
    } else if (a.name > b.name) {
        return 1;
    } else {
        return 0;
    }
});