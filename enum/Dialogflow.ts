export interface IDialogflowMessage {
    message: string;
    quickReplies?: Array<IDialogflowQuickReply>;
    isFallback: boolean;
}

export interface IDialogflowQuickReply {
    title: string;
    payload: string;
    contentType: QuickReplyContentType;
}

export declare enum QuickReplyContentType {
    TEXT = 'text',
}

export interface IDialogflowAccessToken {
    token: string;
    expiration: Date;
}
