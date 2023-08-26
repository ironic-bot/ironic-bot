import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Got from 'got';
import { CookieJar } from 'tough-cookie';
import WebSocket from 'ws';

// WebSocket delimiter (magic character)
const delimiter = '\x1e';

// Headers used for the WebSocket
const headers = {
    'accept': 'application/json',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
    'sec-ch-ua': '"Not_A Brand";v="99", "Microsoft Edge";v="110", "Chromium";v="110"',
    'sec-ch-ua-arch': '"x86"',
    'sec-ch-ua-bitness': '"64"',
    'sec-ch-ua-full-version': '"109.0.1518.78"',
    'sec-ch-ua-full-version-list': '"Chromium";v="110.0.5481.192", "Not A(Brand";v="24.0.0.0", "Microsoft Edge";v="110.0.1587.69"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-model': '',
    'sec-ch-ua-platform': '"Windows"',
    'sec-ch-ua-platform-version': '"15.0.0"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'x-ms-client-request-id': uuidv4(),
    'x-ms-useragent': 'azsdk-js-api-client-factory/1.0.0-beta.1 core-rest-pipeline/1.10.0 OS/Win32',
    'Referer': 'https://www.bing.com/search?q=Bing+AI&showconv=1&FORM=hpcodx',
    'Referrer-Policy': 'origin-when-cross-origin',
}

// Headers used for the initial HTTP request
const headersInitConver = {
    'authority': 'edgeservices.bing.com',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    "accept-language": "en-US,en;q=0.9",
    'cache-control': 'max-age=0',
    'sec-ch-ua': '"Chromium";v="110", "Not A(Brand";v="24", "Microsoft Edge";v="110"',
    'sec-ch-ua-arch': '"x86"',
    'sec-ch-ua-bitness': '"64"',
    'sec-ch-ua-full-version': '"110.0.1587.69"',
    'sec-ch-ua-full-version-list': '"Chromium";v="110.0.5481.192", "Not A(Brand";v="24.0.0.0", "Microsoft Edge";v="110.0.1587.69"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-model': '""',
    'sec-ch-ua-platform': '"Windows"',
    'sec-ch-ua-platform-version': '"15.0.0"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.69',
    'x-edge-shopping-flag': '1',
}

// Conversation styles
export enum ConversationStyle {
    creative = "h3imaginative",
    balanced = "harmonyv3",
    precise = "h3precise"
}
type ConversationStyleType = ConversationStyle | "creative" | "balanced" | "precise" | undefined | null;

// Adds the delimiter to a JSON object to prepare it for sending
function appendIdentifier(msg: any): string {
    return JSON.stringify(msg) + delimiter;
}

// Welcome to the Wild West

interface ChatHubRequestStruct {
    arguments: Array<{
        source: string;
        optionsSets: (ConversationStyleType | string)[];
        isStartOfSession: boolean;
        message: {
            author: string;
            inputMethod: string;
            text: string;
            messageType: string;
        };
        conversationSignature: string;
        participant: {
            id: string;
        };
        conversationId: string;
    }>;
    invocationId: string;
    target: string;
    type: number;
}

class ChatHubRequest {
    struct: ChatHubRequestStruct;
    invocationId = -1;

    constructor(
        public conversationId: string,
        public conversationSignature: string,
        public clientId: string,
    ) {
        this.struct = {
            arguments: [],
            invocationId: this.invocationId.toString(),
            target: "chat",
            type: 4,
        };
    }

    update(
        prompt: string,
        conversationStyle: ConversationStyleType | string,
        options: (ConversationStyleType | string)[] | null = null,
    ): void {
        if (!options) {
            options = [
                "deepleo",
                "enable_debug_commands",
                "disable_emoji_spoken_text",
                "enablemm",
            ];
        }
        if (conversationStyle) {
            if (conversationStyle?.valueOf) {
                conversationStyle = conversationStyle.valueOf();
            }
            options.push(conversationStyle);
        }
        this.struct.arguments = [{
            source: "cib",
            optionsSets: options,
            isStartOfSession: this.invocationId === -1,
            message: {
                author: "user",
                inputMethod: "Keyboard",
                text: prompt,
                messageType: "Chat",
            },
            conversationSignature: this.conversationSignature,
            participant: {
                id: this.clientId,
            },
            conversationId: this.conversationId,
        }];
        this.invocationId++;
        this.struct.invocationId = this.invocationId.toString();
    }
}

class Conversation {
    struct: {
        conversationId: string;
        clientId: string;
        conversationSignature: string;
        result: { value: string; message: string | null };
    };

    constructor(cookiePath = "", cookies?: Record<string, string>[]) {
        this.struct = {
            conversationId: "",
            clientId: "",
            conversationSignature: "",
            result: { value: "Success", message: null },
        };

        const cookieJar = new CookieJar();

        if (cookies) {
            for (const cookie of cookies) {
                cookieJar.setCookie(`${cookie.name}=${cookie.value}`, "https://edgeservices.bing.com");
            }
        } else {
            const cookieFile =
                cookiePath ||
                (process.env.COOKIE_FILE && process.env.COOKIE_FILE.trim());
            if (cookieFile) {
                const cookiesJSON = JSON.parse(fs.readFileSync(cookieFile, "utf8"));
                for (const cookie of cookiesJSON) {
                    cookieJar.setCookie(`${cookie.name}=${cookie.value}`, "https://edgeservices.bing.com");
                }
            }
        }
        const url = "https://edgeservices.bing.com/edgesvc/turing/conversation/create";
        Got
            .get(url, {
                responseType: "json",
                timeout: {
                    request: 30000
                },
                headers: headersInitConver,
                cookieJar
            })
            .json<{ conversationId: string; clientId: string; conversationSignature: string; result: { value: string; message: string | null; }; }>()
            .then(data => {
                this.struct = data;
                if (this.struct.result.value === "UnauthorizedRequest") {
                    throw this.struct.result.message;
                }
            })
            .catch(() => {
                throw "Authentication failed";
            });
    }

    getStruct() {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (this.struct.conversationId !== "") {
                    clearInterval(interval);
                    resolve(this.struct);
                }
            }, 100);
        });
    }
}

class ChatHub {
    wss: WebSocket | null;
    request: ChatHubRequest;

    constructor(conversation: Conversation) {
        this.wss = null;
        this.request = new ChatHubRequest(
            conversation.struct.conversationId,
            conversation.struct.conversationSignature,
            conversation.struct.clientId
        );
    }

    async askStream(
        prompt: string,
        conversationStyle?: ConversationStyleType
    ): Promise<string> {
        if (!this.wss) {
            this.wss = new WebSocket(
                'wss://sydney.bing.com/sydney/ChatHub',
                [],
                {
                    headers: headers
                }
            );

            this.wss.once('open', () => {
                this.wss!.send(appendIdentifier({ protocol: 'json', version: 1 }))

                this.request.update(prompt, conversationStyle);
                this.wss!.send(appendIdentifier(this.request.struct));
            });
        } else {
            this.request.update(prompt, conversationStyle);
            this.wss!.send(appendIdentifier(this.request.struct));
        }

        return await new Promise(resolve => {
            this.wss!.on('message', data => {
                const objects = data.toString().split(delimiter);
                for (const obj of objects) {
                    if (obj === '' || obj === undefined) {
                        continue;
                    }
                    const response = JSON.parse(obj);
                    if (response.type === 2) {
                        resolve(response.item.messages[1].text);
                    }
                }
            });
        });
    }

    async close() {
        if (this.wss && this.wss.readyState === WebSocket.OPEN) {
            this.wss.close();
        }
    }
}

class Chatbot {
    private cookiePath: string;
    private cookies?: Record<string, string>[];
    private chatHub!: ChatHub;

    constructor(cookiePath = "", cookies?: Record<string, string>[]) {
        this.cookiePath = cookiePath;
        this.cookies = cookies;
        (async () => {
            // @ts-ignore
            const conversation = new Conversation(this.cookiePath, this.cookies);
            await conversation.getStruct();
            this.chatHub = new ChatHub(conversation);
        })();
    }

    async ask(prompt: string, conversationStyle?: ConversationStyleType): Promise<any> {
        return await this.chatHub.askStream(prompt, conversationStyle);
    }

    async close(): Promise<void> {
        await this.chatHub.close();
    }

    async reset(): Promise<void> {
        await this.close();
        (async () => {
            const conversation = new Conversation(this.cookiePath, this.cookies);
            await conversation.getStruct();
            this.chatHub = new ChatHub(conversation);
        })();
    }

    getChatHub() {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (typeof this.chatHub?.askStream !== 'undefined') {
                    clearInterval(interval);
                    resolve(this.chatHub);
                }
            }, 100);
        });
    }
}

// Exports

export async function initialize() {
    const chatBot = new Chatbot();
    await chatBot.getChatHub();
    return chatBot;
}

export async function ask(chatBot: Chatbot, prompt: string, conversationStyle?: ConversationStyle) {
    return await chatBot.ask(prompt, conversationStyle);
}
