"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedHelper = exports.getStatusChannels = exports.getChannels = void 0;
const discord_js_1 = require("discord.js");
const inst_1 = require("./inst");
function getChannels(channelName) {
    // const Guilds = bot.guilds.cache.map(guild => guild.id);
    // console.log(Guilds);
    const channels = [];
    inst_1.bot.channels.cache.map((channel) => {
        if (channel instanceof discord_js_1.TextChannel && channel.name == channelName) {
            channels.push(channel);
        }
    });
    return channels;
    // return bot.channels.cache.get(channelName);
}
exports.getChannels = getChannels;
function getStatusChannels() {
    return getChannels("server-status");
}
exports.getStatusChannels = getStatusChannels;
function embedHelper(opts = {}) {
    return new discord_js_1.EmbedBuilder()
        .setAuthor({ name: opts.author || inst_1.bot.application.name })
        .setColor(opts.color || discord_js_1.Colors.DarkGold);
}
exports.embedHelper = embedHelper;
