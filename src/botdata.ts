import { AES, enc } from "crypto-js";
import { config } from "dotenv";
import fs from "fs/promises";
import { PingResponse } from "mcping-js";

config();

export interface BotDat {
    ip: string,
    port: number,
    pingInt: number,
    killed: boolean,
    botChat: boolean,
    lastValidData: PingResponse | null,
}

export var data: BotDat = {
    ip: "Not Set",
    port: 25565,
    pingInt: 3,
    killed: false,
    botChat: false,
    lastValidData: null,
}

const dataPath = "./data";
const dataFile = `${dataPath}/botdata.txt`;

fs.access(dataFile, fs.constants.F_OK)
.catch(async () => {// file does not exist
    await fs.mkdir(dataPath);
    await fs.writeFile(dataFile, AES.encrypt(JSON.stringify(
        {
            ip: process.env.ip!,
            port: parseInt(process.env.port!),
            pingInt: 3,
            killed: false,
            botChat: false,
            lastValidData: null,
        } satisfies BotDat), process.env.key!).toString())
})
.finally(() => {
    readData();
});

export async function readBotDatEnc() {
    return (await fs.readFile(dataFile)).toString("utf-8");
}

export async function readData() {
    const parsed = JSON.parse(AES.decrypt(await readBotDatEnc(), process.env.key!).toString(enc.Utf8));
    for(let key in parsed) {
        (data as any)[key] = parsed[key];
    }

    if (data.killed) {
        console.log("already killed");
        process.exit(1);
    }
}

export async function writeData() {
    // console.log("writing", data)
    await fs.writeFile(dataFile, AES.encrypt(JSON.stringify(data), process.env.key!).toString());
}