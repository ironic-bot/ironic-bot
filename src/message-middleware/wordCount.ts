import { Client, Message } from 'discord.js';
import { db } from '../glob.js';
import { IMiddleware } from '../interfaces/IMiddleware.js';
import got from 'got';

export default class WordCountMiddleware implements IMiddleware {
    async run(_client: Client, message: Message): Promise<void> {
        if (message.guild == null) return;

        const existingWords = (db.prepare('SELECT word from WORDS').all() as { word: string }[]).map(x => x.word);

        const wordData = db
            .prepare(
                'SELECT word, count FROM words WHERE user_id = ? AND guild_id = ?',
            )
            .all(message.author.id, message.guild.id) as { word: string; count: number; }[];

        message.content.split(/ +/g).forEach(async word => {
            const filteredWord = word.replace(/[^a-z]/gi, '').toLowerCase();

            let doesExist = true;

            if (!existingWords.includes(filteredWord)) {
                doesExist = (await got.get('https://api.dictionaryapi.dev/api/v2/entries/en/' + filteredWord, {
                    throwHttpErrors: false
                })).statusCode === 200;
            }

            if (doesExist) {
                let wordDataElement = wordData.find(x => x.word === filteredWord);
                if (wordDataElement) {
                    wordDataElement.count++;

                    db.prepare(
                        'UPDATE words SET count = ? WHERE word = ? AND user_id = ? AND guild_id = ?',
                    ).run(
                        wordDataElement.count,
                        wordDataElement.word,
                        message.author.id,
                        message?.guild?.id,
                    );
                } else {
                    wordDataElement = {
                        word: filteredWord,
                        count: 1
                    };

                    db.prepare(
                        'INSERT INTO words (guild_id, user_id, word, count) VALUES (?, ?, ?, ?)',
                    ).run(
                        message?.guild?.id,
                        message.author.id,
                        wordDataElement.word,
                        wordDataElement.count,
                    );
                }
            }
        });

        return;
    }
}
