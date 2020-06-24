export interface IDialogflowMessage {
    messages: Array<string>;
    quickReplies: Array<IDialogflowQuickReply>;
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
