import { ICommand } from '../interfaces/ICommand.js';
import { ChatInputCommandInteraction, Client, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { db } from '../glob.js';

export default class implements ICommand {
    data = new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Change your server settings.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('rankmin')
                .setDescription('Minimum XP the bot will give to a player.')
                .addNumberOption(option => option.setName('xp').setDescription('The minimum XP').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('rankmax')
                .setDescription('Maximum XP the bot will give to a player.')
                .addNumberOption(option => option.setName('xp').setDescription('The maximum XP').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('levelrole')
                .setDescription('Configures a role to be automatically added at a certain level. Leave role empty to clear.')
                .addNumberOption(option => option.setName('level').setDescription('The level number').setRequired(true))
                .addRoleOption(option => option.setName('role').setDescription('The role'))
        )

    async run(_client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.options.getSubcommand() === 'rankmin' || interaction.options.getSubcommand() === 'rankmax') {

            const settings = db
                .prepare(
                    'SELECT rank_min_range, rank_max_range FROM settings WHERE guild_id = ?',
                )
                .get(interaction.guild?.id) as { rank_min_range: number; rank_max_range: number };

            const change = settings ?? {
                rank_min_range: 15,
                rank_max_range: 25
            };

            if (interaction.options.getSubcommand() === 'rankmin') {
                change.rank_min_range = interaction.options.getNumber('xp') ?? 15;
            } else if (interaction.options.getSubcommand() === 'rankmax') {
                change.rank_max_range = interaction.options.getNumber('xp') ?? 25;
            }

            if (settings) {
                db.prepare(
                    'UPDATE settings SET rank_min_range = ?, rank_max_range = ? WHERE guild_id = ?',
                ).run(
                    change.rank_min_range,
                    change.rank_max_range,
                    interaction.guild?.id,
                );
            } else {
                db.prepare(
                    'INSERT INTO settings (rank_min_range, rank_max_range, guild_id) VALUES (?, ?, ?)',
                ).run(
                    change.rank_min_range,
                    change.rank_max_range,
                    interaction.guild?.id,
                );
            }

            interaction.reply({ content: "XP range update!", ephemeral: true })
        } else if (interaction.options.getSubcommand() === 'levelrole') {
            const level = interaction.options.getNumber('level');
            const role = interaction.options.getRole('role');

            const roles = db
                .prepare(
                    'SELECT role_id, level FROM rankroles WHERE guild_id = ?',
                )
                .all(interaction.guild?.id) as { role_id: string; level: number }[];

            if (role) {
                if (!roles.find(x => x.level === level)) {
                    db.prepare(
                        'INSERT INTO rankroles (role_id, level, guild_id) VALUES (?, ?, ?)',
                    ).run(
                        role.id,
                        level,
                        interaction.guild?.id,
                    );
                    interaction.reply({ content: "Level configured!", ephemeral: true });
                } else {
                    interaction.reply({ content: "Level already set to a role!", ephemeral: true });
                }
            } else {
                const role = roles.find(x => x.level === level);
                if (role) {
                    db.prepare('DELETE FROM rankroles WHERE role_id = ? AND guild_id = ?').run(role.role_id, interaction.guild?.id);
                    interaction.reply({ content: "Level deconfigured!", ephemeral: true });
                } else {
                    interaction.reply({ content: "Level not configured!", ephemeral: true });
                }
            }
        }

    }
}
