import Database from 'better-sqlite3';
import { ICommand } from './interfaces/ICommand.js';

export const commands = new Map<string, ICommand>();
export const db = new Database('bot.db');

export function initDb() {
	db.exec(
		'CREATE TABLE IF NOT EXISTS levels (guild_id TINYTEXT, user_id TINYTEXT, xp INT, level INT, total_xp INT, last_message_time BIGINT);',
	);
	db.exec(
		'CREATE TABLE IF NOT EXISTS warns (warn_id TINYTEXT, guild_id TINYTEXT, user_id TINYTEXT, moderator_id TINYTEXT, reason TEXT, time BIGINT);',
	);
	db.exec(
		'CREATE TABLE IF NOT EXISTS words (guild_id TINYTEXT, user_id TINYTEXT, word TEXT, count INT);',
	);
}
