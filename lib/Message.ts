import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import {
	BlockElementType,
	BlockType,
	IActionsBlock,
	IBlock,
	IButtonElement,
	TextObjectType,
} from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AppSetting, ServerSetting } from '../config/Settings';
import { ActionIds } from '../enum/ActionIds';
import {
	IDialogflowMessage,
	IDialogflowQuickReplies,
	IDialogflowQuickReplyOptions,
} from '../enum/Dialogflow';
import { Logs } from '../enum/Logs';
import { IMessageParam } from '../types/misc';
import { escapeRegExp, uuid } from './Helper';
import { getAppSettingValue, getServerSettingValue } from './Settings';

export const createDialogflowMessage = async (
	app: IApp,
	rid: string,
	read: IRead,
	modify: IModify,
	dialogflowMessage: IDialogflowMessage,
): Promise<void> => {
	const { messages = [] } = dialogflowMessage;

	for (const message of messages) {
		const { text, options } = message as IDialogflowQuickReplies;
		if (text && options) {
			const elements: Array<IButtonElement> = options.map(
				(payload: IDialogflowQuickReplyOptions) => {
					const buttonElement: IButtonElement = {
						type: BlockElementType.BUTTON,
						actionId: payload.actionId || uuid(),
						text: {
							text: payload.text,
							type: TextObjectType.PLAINTEXT,
						},
						value: payload.text,
						...(payload.buttonStyle && {
							style: payload.buttonStyle,
						}),
					};

					if (
						payload.actionId &&
						payload.actionId === ActionIds.PERFORM_HANDOVER
					) {
						buttonElement.value =
							payload.data && payload.data.departmentName
								? payload.data.departmentName
								: undefined;
					}

					return buttonElement;
				},
			);

			const blocks = modify.getCreator().getBlockBuilder();

			blocks.addSectionBlock({
				text: blocks.newMarkdownTextObject(text),
			});

			blocks.addActionsBlock({
				elements,
			});

			const blockArray = blocks.getBlocks();

			await createMessage(app, rid, read, modify, { blocks: blockArray });
		} else {
			// message is instanceof string
			if ((message as string).trim().length > 0) {
				await createMessage(app, rid, read, modify, {
					text: message as string,
				});
			}
		}
	}
};

export const createMessage = async (
	app: IApp,
	rid: string,
	read: IRead,
	modify: IModify,
	message: IMessageParam,
): Promise<string | void> => {
	if (!message) {
		return;
	}

	const botUserName = await getAppSettingValue(
		read,
		AppSetting.DialogflowBotUsername,
	);
	if (!botUserName) {
		app.getLogger().error(Logs.EMPTY_BOT_USERNAME_SETTING);
		return;
	}

	const sender = await read.getUserReader().getByUsername(botUserName);
	if (!sender) {
		app.getLogger().error(Logs.INVALID_BOT_USERNAME_SETTING);
		return;
	}

	const room = await read.getRoomReader().getById(rid);
	if (!room) {
		app.getLogger().error(`${Logs.INVALID_ROOM_ID} ${rid}`);
		return;
	}

	const msg = modify
		.getCreator()
		.startMessage()
		.setRoom(room)
		.setSender(sender);

	const { text, blocks, attachment } = message;

	if (text) {
		msg.setText(text);
	}

	if (attachment) {
		msg.addAttachment(attachment);
	}

	if (blocks) {
		msg.addBlocks(blocks);
	}

	return modify.getCreator().finish(msg);
};

export const createLivechatMessage = async (
	app: IApp,
	rid: string,
	read: IRead,
	modify: IModify,
	message: IMessageParam,
	visitor: IVisitor,
): Promise<string | void> => {
	if (!message) {
		return;
	}

	const botUserName = await getAppSettingValue(
		read,
		AppSetting.DialogflowBotUsername,
	);
	if (!botUserName) {
		app.getLogger().error(Logs.EMPTY_BOT_USERNAME_SETTING);
		return;
	}

	const room = await read.getRoomReader().getById(rid);
	if (!room) {
		app.getLogger().error(`${Logs.INVALID_ROOM_ID} ${rid}`);
		return;
	}

	const msg = modify
		.getCreator()
		.startLivechatMessage()
		.setRoom(room)
		.setVisitor(visitor);

	const { text, attachment } = message;

	if (text) {
		msg.setText(text);
	}

	if (attachment) {
		msg.addAttachment(attachment);
	}

	return modify.getCreator().finish(msg);
};

export const deleteAllActionBlocks = async (
	modify: IModify,
	appUser: IUser,
	msgId: string,
): Promise<void> => {
	const msgBuilder = await modify.getUpdater().message(msgId, appUser);

	const withoutActionBlocks: Array<IBlock> = msgBuilder
		.getBlocks()
		.filter(
			(block) =>
				!(
					block.type === BlockType.ACTIONS &&
					(block as IActionsBlock).elements.some(
						(element) => element.type === BlockElementType.BUTTON,
					)
				),
		);

	msgBuilder.setEditor(appUser).setBlocks(withoutActionBlocks);
	return modify.getUpdater().finish(msgBuilder);
};

export const removeQuotedMessage = async (
	read: IRead,
	room: IRoom,
	message: string,
): Promise<string> => {
	if (!message) {
		throw new Error('Error! message text undefined');
	}

	let serverUrl: string | undefined = await getServerSettingValue(
		read,
		ServerSetting.SITE_URL,
	);
	serverUrl = serverUrl && serverUrl.trim();
	if (!serverUrl) {
		throw new Error('Error! Getting server url');
	}

	serverUrl = serverUrl.endsWith('/')
		? serverUrl.substr(0, serverUrl.length - 1)
		: serverUrl;

	const pattern = new RegExp(
		`\\[\\s*\\]\\(${escapeRegExp(serverUrl)}\\/live\\/${escapeRegExp(
			room.id,
		)}\\?msg=.*\\)`,
		'gi',
	);

	if (message.match(pattern)) {
		return message.replace(pattern, '');
	}
	return message;
};
