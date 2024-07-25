import { Client, Message } from 'discord.js';
import { db } from '../glob.js';
import { IMiddleware } from '../interfaces/IMiddleware.js';
import { getRandomNumberBetween, calculateXpNeededForLevel } from '../utils.js';

export default class XPMiddleware implements IMiddleware {
	async run(_client: Client, message: Message): Promise<void> {
		if (message.guild == null) return;

		const xpData = db
			.prepare(
				'SELECT xp, level, last_message_time FROM levels WHERE user_id = ? AND guild_id = ?',
			)
			.get(message.author.id, message.guild.id) as { xp: number; level: number; last_message_time: number };

			const settings = db
			.prepare(
				'SELECT rank_min_range, rank_max_range FROM settings WHERE guild_id = ?',
			)
			.get(message.guild.id) as { rank_min_range: number; rank_max_range: number };

			const roles = db
                .prepare(
                    'SELECT role_id, level FROM rankroles WHERE guild_id = ?',
                )
                .all(message.guild.id) as { role_id: string; level: number }[];

		const addXpAmount = getRandomNumberBetween(settings?.rank_min_range ?? 15, settings?.rank_max_range ?? 25);

		if (xpData) {
			if (Date.now() - xpData.last_message_time > 60000) {
				let neededXpForNextLevel = calculateXpNeededForLevel(
					xpData.level + 1,
				);
				let addedXp = xpData.xp + addXpAmount;
				const leveledUp = addedXp >= neededXpForNextLevel;
				let level = xpData.level;

				if (addedXp >= neededXpForNextLevel)
                {
                    level++;
                    addedXp -= neededXpForNextLevel;
                    while (addedXp >= neededXpForNextLevel)
                    {
                        level++;
                        addedXp -= neededXpForNextLevel;
                    }
                    neededXpForNextLevel = calculateXpNeededForLevel(
						level + 1,
					);
                }

				const roleToAdd = [...roles].sort((a, b) => b.level - a.level).find(x => level >= x.level);
				if(roleToAdd) {
					message.member?.roles.add(roleToAdd.role_id);
				}

				db.prepare(
					'UPDATE levels SET username = ?, avatar = ?, total_xp = total_xp + ?, xp = ?, level = ?, last_message_time = ? WHERE user_id = ? AND guild_id = ?',
				).run(
					message.author.username,
					message.author.avatar,
					addXpAmount,
					addedXp,
					level,
					Date.now(),
					message.author.id,
					message.guild.id,
				);
				if (leveledUp)
					await message.reply(
						"Congratulations! You've leveled up to level " + level.toString() + '.',
					);
			}
		} else
			db.prepare(
				'INSERT INTO levels (guild_id, user_id, username, avatar, xp, level, total_xp, last_message_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
			).run(
				message.guild.id,
				message.author.id,
				message.author.username,
				message.author.avatar,
				addXpAmount,
				0,
				addXpAmount,
				Date.now(),
			);

		return;
	}
}
