import { IDialogflowEvent, IDialogflowQuickReplies } from './Dialogflow';

export interface IActionsEndpointContent {
	action: EndpointActionNames;
	sessionId: string;
	actionData?: {
		targetDepartment?: string;
		event?: IDialogflowEvent;
		messages: Array<string | IDialogflowQuickReplies>;
	};
}

export enum EndpointActionNames {
	CLOSE_CHAT = 'close-chat',
	HANDOVER = 'handover',
	TRIGGER_EVENT = 'trigger-event',
	SEND_MESSAGE = 'send-message',
}
