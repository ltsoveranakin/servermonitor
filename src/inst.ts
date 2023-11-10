import { config } from "dotenv";
import { PingResponse } from "mcping-js";
import { getServer } from "./ping";
import { embedHelper, getStatusChannels } from "./utils";
import { AES, enc } from "crypto-js";
import { data } from "./botdata";
import fs from "fs/promises";
import fsd from "fs";
import { Client, GatewayIntentBits } from "discord.js";

const statusPath = "./data/status.txt";

config();

export var serverData: PingResponse | null = null;
var oldServerData: PingResponse | null = null;

export async function ping() {
    await getServer()
        .then(res => {
            serverData = res;
        })
        .catch(() => {
            serverData = null;
        })
    update();
    
    fs.writeFile(statusPath, AES.encrypt(JSON.stringify(serverData), process.env.key!).toString());
}

function update() {
    // console.log("updating", serverData, oldServerData)
    // console.log(getStatusChannels());
    if (serverData) {
        data.lastValidData = serverData;
    }

    if(serverData != null || oldServerData != null) {
        const curNames = serverData?.players.sample?.map(player => player.name);
        const oldNames = oldServerData?.players.sample?.map(player => player.name);

        const joinedPlayers = curNames?.filter(playerName => !oldNames?.includes(playerName));
        const leftPlayers = oldNames?.filter(player => !curNames?.includes(player));

        if(leftPlayers?.length) {
            getStatusChannels().forEach(channel => {
                    channel.send({
                        embeds: [
                            embedHelper()
                            .setTitle("Player Leave")
                            .setDescription(leftPlayers.join(", ")),
                        ]
                    });
            });
        }

        if(serverData) {
            if(joinedPlayers?.length) {
                getStatusChannels().forEach(channel => {
                        channel.send({
                            embeds: [
                                embedHelper()
                                .setTitle("Player Join")
                                .setDescription(joinedPlayers.join(", ")),
                            ]
                        });
                });
            }
        }
    }
    
    if(!serverData != !oldServerData) {
        if(serverData) {
            
            getStatusChannels().forEach(channel => {
                channel.send({
                    embeds: [
                        embedHelper()
                        .setTitle("Server Status")
                        .setDescription("Online")
                    ]
                })
            });
        } else {
            getStatusChannels().forEach(channel => {
                channel.send({
                    embeds: [
                        embedHelper()
                        .setTitle("Server Status")
                        .setDescription("Offline")
                    ]
                })
            });
        }

    }
    oldServerData = serverData;
}

export async function initInstance() {
    if(!fsd.existsSync(statusPath)){
        await fs.writeFile(statusPath, AES.encrypt(JSON.stringify(null), process.env.key!).toString(), "utf-8");
    }

    try {
        // console.log(process.env.key)
        // console.log(AES.decrypt(await statusReader.read("utf-8"), process.env.key!).toString(enc.Utf8));
        const encStr = await fs.readFile(statusPath);
        oldServerData = JSON.parse(AES.decrypt(encStr.toString("utf-8"), process.env.key!).toString(enc.Utf8));
    } catch(e) {
        console.log(e);
        await fs.unlink(statusPath);
        return;
    }

    ping();
}

export const bot = new Client(
    {
        intents: [
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.Guilds,
            GatewayIntentBits.MessageContent,
        ]
    }
);

// setInterval(ping, 1000 * 60);
setInterval(ping, 1e3 * 60 * data.pingInt);
//          1 sec,60 sec,3 min