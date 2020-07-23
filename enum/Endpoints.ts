import { IDialogflowQuickReplies } from './Dialogflow';

export interface IActionsEndpointContent {
    action: EndpointActionNames;
    sessionId: string;
    actionData?: {
        targetDepartment?: string;
        messages: Array<string | IDialogflowQuickReplies>;
    };
}

export enum EndpointActionNames {
    CLOSE_CHAT = 'close-chat',
    HANDOVER = 'handover',
    SEND_MESSAGE = 'send-message',
}
