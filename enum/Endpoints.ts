export interface IEndpointContent {
    action: EndpointActionNames;
    actionData: IMessagePayload | ICloseRoomPayload | IForwardRoomPayload;
}

export interface ICloseRoomPayload {
    sessionId: string;
}

export interface IForwardRoomPayload {
    sessionId: string;
    targetDepartment?: string;
}

export interface IMessagePayload {
    sessionId: string;
    messages: Array<string>;
    quickReplies: Array<QuickReplyContentType>;
}

export declare enum EndpointActionNames {
    CLOSE_CHAT = 'close-chat',
    PERFORM_HANDOVER = 'perform-handover',
    SEND_MESSAGE = 'send-message',
}

export declare enum QuickReplyContentType {
    TEXT = 'text',
}
