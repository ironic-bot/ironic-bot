import { ICommand } from '../interfaces/ICommand.js';
import { db } from '../glob.js';
import {
    Client,
    EmbedBuilder,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
} from 'discord.js';

export default class implements ICommand {
    data = new SlashCommandBuilder()
        .setName('words')
        .setDescription("Shows an user's (or the server's) top 10 words")
        .addUserOption(option => option.setName('target').setDescription('The user to check'));

    async run(client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
        if (!interaction.member) return;
        if (!interaction.guild) return;
        if (!client.user) return; // TypeScript "fix"
        // Get the member
        const user = interaction.options.getUser('target');
        if (!user) {
            const data = db
                .prepare('SELECT * FROM words WHERE guild_id = ?')
                .all(interaction.guild.id) as { guild_id: string, user_id: string, word: string, count: number }[];
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${interaction.guild.name}'s top 10 words`)
                .setDescription(
                    data.length > 0 ? data.sort((a, b) => b.count - a.count).slice(0, 10)
                        .map(
                            (word, i) =>
                                `#${i + 1} \`${word.word}\`: ${word.count}`,
                        )
                        .join('\n') : "No words found!",
                );
            interaction.reply({
                embeds: [embed],
            });
        } else {
            const data = db
                .prepare('SELECT * FROM words WHERE user_id = ? AND guild_id = ?')
                .all(user.id, interaction.guild.id) as { guild_id: string, user_id: string, word: string, count: number }[];
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`@${user.tag}'s top 10 words`)
                .setDescription(
                    data.length > 0 ? data.sort((a, b) => b.count - a.count).slice(0, 10)
                        .map(
                            (word, i) =>
                                `#${i + 1} \`${word.word}\`: ${word.count}`,
                        )
                        .join('\n') : "No words found!",
                );
            interaction.reply({
                embeds: [embed],
            });
        }
    }
}
