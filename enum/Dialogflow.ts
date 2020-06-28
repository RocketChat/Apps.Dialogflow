export interface IDialogflowMessage {
    messages?: Array<string>;
    quickReplies?: IDialogflowQuickReplies;
    isFallback: boolean;
    sessionId?: string;
}

export interface IDialogflowQuickReplies {
    title: string;
    quickReplies: Array<string>;
}

export interface IDialogflowAccessToken {
    token: string;
    expiration: Date;
}

export enum QuickReplyContentType {
    TEXT = 'text',
}

export enum DialogflowUrl {
    AUTHENTICATION_SERVER_URL = 'https://oauth2.googleapis.com/token',
}

export enum DialogflowJWT {
    JWT_HEADER = '{"alg":"RS256","typ":"JWT"}',
    SCOPE_URL = 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/dialogflow',
    AUD_URL = 'https://oauth2.googleapis.com/token',
    SHA_256 = 'SHA256',
    BASE_64 = 'base64',
}

export enum Base64 {
    BASE64_DICTIONARY = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
    BASE64_PAD = '=',
}

export enum LanguageCode {
    EN = 'en',
}
