import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import { IBlock } from '@rocket.chat/apps-engine/definition/uikit';

export interface IMessageParam {
	text?: string;
	blocks?: IBlock[];
	attachment?: IMessageAttachment;
}
