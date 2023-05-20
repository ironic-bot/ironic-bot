import { ICommand } from '../interfaces/ICommand.js';
import { ChatInputCommandInteraction, Client, SlashCommandBuilder, User } from 'discord.js';
import { db } from '../glob.js';
import { calculateXpNeededForLevel } from '../utils.js';
import canvasPkg from 'canvas';
const { createCanvas, registerFont, loadImage } = canvasPkg;

// Register fonts
registerFont('./assets/fonts/PlusJakartaSans-VariableFont_wght.ttf', {
	family: 'Plus Jakarta Sans',
});

// const rectangleCornerWidth = 50;

export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('rank')
		.setDescription("Shows an user's rank in the server")
		.addUserOption(option => option.setName('target').setDescription('The user to check'));

	async run(_client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		if (interaction.guild == null) return;

		if (interaction.member == null) return;

		let userToCheck = interaction.user as User;

		const askedFor = interaction.options.getUser('target');

		if (askedFor !== null) {
			userToCheck = askedFor;
		}

		if (userToCheck == null) return;

		const data = db
			.prepare(
				'SELECT level, xp FROM levels WHERE user_id = ? AND guild_id = ?',
			)
			.get(userToCheck.id, interaction.guild.id) as { level: number, xp: number };
		if (data) {
			// Canvas
			const canvas = createCanvas(934, 282);
			const ctx = canvas.getContext('2d');

			// Font
			ctx.font = '38px Plus Jakarta Sans';

			// Background
			ctx.fillRect(0, 0, 934, 282);

			// Width of username (used to draw correctly)
			const usernameWidth = ctx.measureText(userToCheck.tag).width;

			// Username container
			ctx.fillStyle = '#32A9E5';
			ctx.fillRect(0, 0, 200 + usernameWidth + 25, 100);

			// User avatar
			const avatar = await loadImage(
				userToCheck.displayAvatarURL({ extension: 'png' }),
			);
			ctx.drawImage(avatar, 0, 0, 100, 100);

			// Username
			ctx.fillStyle = '#FFFFFF';
			ctx.fillText(userToCheck.tag, 125, 65);

			// Level bar background
			ctx.fillStyle = '#CCCCCC';
			ctx.fillRect(0, 232, 934, 50);

			// Level bar fill
			ctx.fillStyle = '#32A9E5';
			ctx.fillRect(
				0,
				232,
				(data.xp / calculateXpNeededForLevel(data.level + 1)) * 934,
				50,
			);

			// Level text
			ctx.fillStyle = '#FFFFFF';
			ctx.fillText('Level ' + data.level, 25, 200);

			// XP width
			const xpLineWidth = ctx.measureText('|').width;
			const xpWidth = ctx.measureText(data.xp.toString()).width;
			const neededXpWidth = ctx.measureText(
				calculateXpNeededForLevel(data.level + 1).toString(),
			).width;

			// XP text
			ctx.fillText(
				data.xp.toString(),
				909 - neededXpWidth - xpLineWidth - xpWidth,
				200,
			);

			// XP line
			ctx.fillStyle = '#32A9E5';
			ctx.fillText('|', 909 - neededXpWidth - xpLineWidth, 200);

			// Needed XP text
			ctx.fillStyle = '#FFFFFF';
			ctx.fillText(
				calculateXpNeededForLevel(data.level + 1).toString(),
				909 - neededXpWidth,
				200,
			);

			await interaction.reply({
				files: [{ attachment: canvas.toBuffer(), name: 'rank.png' }],
			});
		} else await interaction.reply("This user isn't ranked.");
	}
}
