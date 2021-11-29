import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { AppSetting } from '../config/Settings';
import { Logs } from '../enum/Logs';
import { performHandover, updateRoomCustomFields } from './Room';
import { getAppSettingValue } from './Settings';

export const incFallbackIntent = async (
	app: IApp,
	read: IRead,
	modify: IModify,
	sessionId: string,
) => {
	const fallbackThreshold = (await getAppSettingValue(
		read,
		AppSetting.DialogflowFallbackResponsesLimit,
	)) as number;

	if (!fallbackThreshold || (fallbackThreshold && fallbackThreshold === 0)) {
		return;
	}

	const room: ILivechatRoom = (await read
		.getRoomReader()
		.getById(sessionId)) as ILivechatRoom;
	if (!room) {
		throw new Error(Logs.INVALID_ROOM_ID);
	}

	let newFallbackCount = 0;
	if (room?.customFields) {
		const { fallbackCount: oldFallbackCount } = room.customFields;
		newFallbackCount = oldFallbackCount ? oldFallbackCount + 1 : 1;

		await updateRoomCustomFields(
			sessionId,
			{ fallbackCount: newFallbackCount },
			read,
			modify,
		);
	}

	if (newFallbackCount === fallbackThreshold) {
		// perform handover
		const {
			visitor: { token: visitorToken },
		} = room;
		if (!visitorToken) {
			throw new Error(Logs.INVALID_VISITOR_TOKEN);
		}

		const targetDepartmentName: string | undefined =
			await getAppSettingValue(read, AppSetting.FallbackTargetDepartment);

		// Session Id from Dialogflow will be the same as Room id
		await performHandover(
			app,
			modify,
			read,
			sessionId,
			visitorToken,
			targetDepartmentName,
		);
	}
};

export const resetFallbackIntent = async (
	read: IRead,
	modify: IModify,
	sessionId: string,
) => {
	await updateRoomCustomFields(sessionId, { fallbackCount: 0 }, read, modify);
};
