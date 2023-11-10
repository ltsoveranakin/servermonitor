import { config } from "dotenv";
import { MinecraftServer, PingResponse } from "mcping-js";
import { data } from "./botdata";
import { bot } from "./inst";
import { ActivityType } from "discord.js";

config();

export const envIp = process.env.IP!;

export function getServer(ip = data?.ip || envIp, port = data?.port || 25565) {
    return new Promise<PingResponse>((resolve, reject) => {
        try {
            new MinecraftServer(ip, port).ping(3e3, 757, (er, res) => {
                // console.log("pinged server " + ip, er, res);
                if(er) {
                    bot.user?.setPresence({
                        status: "dnd",
                        activities: [{
                            name: "the offline server",
                            type: ActivityType.Watching
                        }]
                    });
                    reject(er);
                } else {
                    bot.user?.setPresence({
                        status: "online",
                        activities: [{
                            name: `on the server with ${res!.players.online} other${res!.players.online == 1 ? "": "s"}`,
                            type: ActivityType.Playing
                        }]
                    });
                    resolve(res!);
                }
            });
        } catch(e) {
            reject(e);
        }
    });
}