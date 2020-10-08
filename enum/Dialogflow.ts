import { ButtonStyle } from '@rocket.chat/apps-engine/definition/uikit';

export interface IDialogflowMessage {
    messages?: Array<string | IDialogflowQuickReplies | IDialogflowPayload |  IDialogflowImageCard>;
    isFallback: boolean;
    sessionId?: string;
}

export interface IDialogflowQuickReplies {
    text?: string;
    options?: Array<IDialogflowQuickReplyOptions>;
    customFields?: IDialogflowCustomFields;
    imagecards?: Array<IDialogflowImageCard>;
}

export interface IDialogflowImageCard {
    subtitle?: string;
    title?: string;
    image_url: string;
    buttons?: Array<IDialogflowQuickReplyOptions>;
}

export interface IDialogflowCustomFields {
    disableInput?: boolean;
    disableInputMessage?: string;
}

export interface IDialogflowPayload {
    action: IDialogflowAction;
}

export interface IDialogflowAction {
    name: string;
    params?: any;
}

export interface IDialogflowQuickReplyOptions {
    text: string;
    actionId?: string;
    buttonStyle?: ButtonStyle;
    salesforceButtonId?: string;
    data?: {
        [prop: string]: any;
    };
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

export enum DialogflowRequestType {
    MESSAGE = 'message',
    EVENT = 'event',
}

export enum Message {
    CLOSED_BY_VISITOR = 'Closed by visitor',
}
