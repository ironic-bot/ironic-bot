import { ICommand } from '../interfaces/ICommand.js';
import { ChatInputCommandInteraction, Client, PermissionFlagsBits, REST, Routes, SlashCommandBuilder } from 'discord.js';

export default class implements ICommand {
    data = new SlashCommandBuilder()
        .setName('echo')
        .setDescription('Repeats a message.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to repeat.')
                .setRequired(true));

    async run(_client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
        if(process.env.DISCORD_TOKEN && process.env.CLIENT_ID) {
            const emojis = (await new REST().setToken(process.env.DISCORD_TOKEN).get(Routes.applicationEmojis(process.env.CLIENT_ID)) as any).items;
            interaction.reply((interaction.options.getString('message') ?? '').replace(/:(?!<.*?>)(.*?):/g, (_, p1) => {
                return `<:${emojis.find(x => x.name === p1)?.name}:${emojis.find(x => x.name === p1)?.id}>`;
            }));
        } else {
            throw new Error();
        }
    }
}
