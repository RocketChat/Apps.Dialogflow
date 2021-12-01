import {
	IHttp,
	IModify,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import {
	ILivechatMessage,
	ILivechatRoom,
} from '@rocket.chat/apps-engine/definition/livechat';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { AppSetting, DefaultMessage } from '../config/Settings';
import { DialogflowRequestType, IDialogflowMessage } from '../enum/Dialogflow';
import { Logs } from '../enum/Logs';
import { Dialogflow } from '../lib/Dialogflow';
import {
	createDialogflowMessage,
	createMessage,
	removeQuotedMessage,
} from '../lib/Message';
import { getAppSettingValue } from '../lib/Settings';
import {
	incFallbackIntent,
	resetFallbackIntent,
} from '../lib/SynchronousHandover';

export class PostMessageSentHandler {
	constructor(
		private readonly app: IApp,
		private readonly message: ILivechatMessage,
		private readonly read: IRead,
		private readonly http: IHttp,
		private readonly modify: IModify,
	) {}

	public async run() {
		const { text, editedAt, room, token, sender } = this.message;
		const livechatRoom = room as ILivechatRoom;

		const { id: rid, type, servedBy, isOpen } = livechatRoom;

		const DialogflowBotUsername: string = await getAppSettingValue(
			this.read,
			AppSetting.DialogflowBotUsername,
		);

		if (!type || type !== RoomType.LIVE_CHAT) {
			return;
		}

		if (!isOpen || !token || editedAt || !text) {
			return;
		}

		if (!servedBy || servedBy.username !== DialogflowBotUsername) {
			return;
		}

		if (sender.username === DialogflowBotUsername) {
			return;
		}

		if (!text || (text && text.trim().length === 0)) {
			return;
		}

		let messageText = text;
		messageText = await removeQuotedMessage(this.read, room, messageText);

		let response: IDialogflowMessage;
		try {
			response = await Dialogflow.sendRequest(
				this.http,
				this.read,
				this.modify,
				rid,
				messageText,
				DialogflowRequestType.MESSAGE,
			);
		} catch (error) {
			this.app
				.getLogger()
				.error(
					`${Logs.DIALOGFLOW_REST_API_ERROR} ${
						(error as Error).message
					}`,
				);

			const serviceUnavailable: string = await getAppSettingValue(
				this.read,
				AppSetting.DialogflowServiceUnavailableMessage,
			);

			await createMessage(this.app, rid, this.read, this.modify, {
				text: serviceUnavailable
					? serviceUnavailable
					: DefaultMessage.DEFAULT_DialogflowServiceUnavailableMessage,
			});

			return;
		}

		await createDialogflowMessage(
			this.app,
			rid,
			this.read,
			this.modify,
			response,
		);

		// synchronous handover check
		const { isFallback } = response;
		if (isFallback) {
			return incFallbackIntent(this.app, this.read, this.modify, rid);
		}
		return resetFallbackIntent(this.read, this.modify, rid);
	}
}
