import { IDialogflowEvent } from './Dialogflow';

export interface IActionsEndpointContent {
    action: EndpointActionNames;
    sessionId: string;
    actionData?: {
        targetDepartment?: string;
        event?: IDialogflowEvent;
    };
}

export enum EndpointActionNames {
    CLOSE_CHAT = 'close-chat',
    HANDOVER = 'handover',
    TRIGGER_EVENT = 'trigger-event',
}
