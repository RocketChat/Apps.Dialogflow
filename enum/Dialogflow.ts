import { ButtonStyle } from '@rocket.chat/apps-engine/definition/uikit';

export interface IDialogflowMessage {
    messages?: Array<string | IDialogflowQuickReplies>;
    isFallback: boolean;
    sessionId?: string;
    audio?: string;
}

export interface IDialogflowQuickReplies {
    text: string;
    options: Array<IDialogflowQuickRepliesOptions>;
}

export interface IDialogflowQuickRepliesOptions {
    text: string;
    actionId?: string;
    buttonStyle?: ButtonStyle;
}

export interface IDialogflowAccessToken {
    token: string;
    expiration: Date;
}

export interface IDialogflowEvent {
    name: string;
    parameters?: any;
    languageCode: string;
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

export enum AudioLanguageCode {
    EN_US = 'en-US',
}

export enum DialogflowRequestType {
    MESSAGE = 'message',
    EVENT = 'event',
    AUDIO = 'audio',
    AUDIO_OGG = 'audio-ogg',
}

export enum DialogflowOutputAudioEncoding {
    LINEAR_16 = 'OUTPUT_AUDIO_ENCODING_LINEAR_16',
}

export enum DialogflowInputAudioEncoding {
    ENCODING_OGG = 'AUDIO_ENCODING_OGG_OPUS',
}
