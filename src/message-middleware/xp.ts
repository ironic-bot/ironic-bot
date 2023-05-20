import { Client, Message } from 'discord.js';
import { db } from '../glob.js';
import { IMiddleware } from '../interfaces/IMiddleware.js';
import { getRandomNumberBetween, calculateXpNeededForLevel } from '../utils.js';

export default class XPMiddleware implements IMiddleware {
	async run(_client: Client, message: Message): Promise<void> {
		if (message.guild == null) return;

		const xpData = db
			.prepare(
				'SELECT xp, level, last_message_time FROM levels where user_id = ? AND guild_id = ?',
			)
			.get(message.author.id, message.guild.id) as { xp: number; level: number; last_message_time: number };

		const addXpAmount = getRandomNumberBetween(50, 100);

		if (xpData) {
			if (Date.now() - xpData.last_message_time > 60000) {
				const neededXpForNextLevel = calculateXpNeededForLevel(
					xpData.level + 1,
				);
				const addedXp = xpData.xp + addXpAmount;
				const leveledUp = addedXp > neededXpForNextLevel;
				db.prepare(
					'UPDATE levels SET total_xp = total_xp + ?, xp = ?, level = ?, last_message_time = ? WHERE user_id = ? AND guild_id = ?',
				).run(
					addXpAmount,
					leveledUp ? addedXp - neededXpForNextLevel : addedXp,
					leveledUp ? xpData.level + 1 : xpData.level,
					Date.now(),
					message.author.id,
					message.guild.id,
				);
				if (leveledUp)
					await message.reply(
						"Congratulations! You've leveled up to level " + (xpData.level + 1).toString() + '.',
					);
			}
		} else
			db.prepare(
				'INSERT INTO levels (guild_id, user_id, xp, level, total_xp, last_message_time) VALUES (?, ?, ?, ?, ?, ?)',
			).run(
				message.guild.id,
				message.author.id,
				addXpAmount,
				0,
				addXpAmount,
				Date.now(),
			);

		return;
	}
}
