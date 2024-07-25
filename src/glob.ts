import Database from 'better-sqlite3';
import { ICommand } from './interfaces/ICommand.js';

export const commands = new Map<string, ICommand>();
export const db = new Database('bot.db');

export function initDb() {
	db.exec(
		'CREATE TABLE IF NOT EXISTS levels (guild_id TINYTEXT, user_id TINYTEXT, username TEXT, avatar TEXT, xp INT, level INT, total_xp INT, last_message_time BIGINT);',
	);
	db.exec(
		'CREATE TABLE IF NOT EXISTS warns (warn_id TINYTEXT, guild_id TINYTEXT, user_id TINYTEXT, moderator_id TINYTEXT, reason TEXT, time BIGINT);',
	);
	db.exec(
		'CREATE TABLE IF NOT EXISTS words (guild_id TINYTEXT, user_id TINYTEXT, word TEXT, count INT);',
	);
	db.exec(
		'CREATE TABLE IF NOT EXISTS settings (guild_id TINYTEXT, rank_min_range INT, rank_max_range INT);',
	);
	db.exec(
		'CREATE TABLE IF NOT EXISTS rankroles (guild_id TINYTEXT, role_id TINYTEXT, level INT);',
	);
	db.exec(
		'CREATE TABLE IF NOT EXISTS eco (user_id TINYTEXT, money BIGINT)'
	);

	db.exec(
		'CREATE TABLE IF NOT EXISTS spotify (user_id TINYTEXT, access_token TEXT, refresh_token TEXT);'
	);


	db.exec(
		'CREATE TABLE IF NOT EXISTS stocks (name TINYTEXT, price INT, percent_change TINYTEXT)'
	);

	const stocks = db.prepare('SELECT * from stocks').all();

	if(stocks.length < 1) {
		db.exec(
			`INSERT INTO stocks VALUES ('CRL', '1000', '0%'),
			('CHC', '1000', '0%'),
			('BTR', '1000', '0%'),
			('SUG', '1000', '0%'),
			('NUT', '1000', '0%'),
			('SLT', '1000', '0%'),
			('VNL', '1000', '0%'),
			('EGG', '1000', '0%'),
			('CNM', '1000', '0%')`,
		);
	}

	db.exec(
		'CREATE TABLE IF NOT EXISTS owned_stocks (user_id TINYTEXT, crl INT, chc INT, btr INT, sug INT, nut INT, slt INT, vnl INT, egg INT, cnm INT)'
	);
}
