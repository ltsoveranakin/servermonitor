import { Colors, EmbedBuilder, TextChannel } from "discord.js";
import { bot } from "./inst";


export function getChannels(channelName: string) {
    // const Guilds = bot.guilds.cache.map(guild => guild.id);
    // console.log(Guilds);
    const channels: TextChannel[] = [];
    bot.channels.cache.map((channel) => {
        if(channel instanceof TextChannel && channel.name == channelName) {
            channels.push(channel);
        }
    });
    return channels;
    // return bot.channels.cache.get(channelName);
}

export function getStatusChannels() {
    return getChannels("server-status");
}

interface EmbedOpts {
    author?: string,
    color?: number
}

export function embedHelper(opts: EmbedOpts = {}) {
    return new EmbedBuilder()
    .setAuthor({ name: opts.author || bot.application!.name! })
    .setColor(opts.color || Colors.DarkGold)
}