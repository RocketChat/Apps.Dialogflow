import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { AppSetting } from '../config/Settings';
import { getAppSettingValue } from '../lib/Settings';
import { retrieveDataByAssociation } from './retrieveDataByAssociation';

export const handleTimeout = async (app: IApp, message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify ) => {

    if (message.room.type !== RoomType.LIVE_CHAT || (message.customFields && message.customFields.idleTimeoutConfig)) {
        return;
    }

    const dialogflowBotUsername: string = (await getAppSettingValue(read, AppSetting.DialogflowBotUsername));
    const chasitorIdleTimeoutIsEnabled: string = (await getAppSettingValue(read, AppSetting.DialogflowEnableCustomerTimeout));

    if (chasitorIdleTimeoutIsEnabled) {

        /**
         * Sets the amount of time that a customer has to respond to an agent message before a warning appears and a timer begins a countdown.
         * The warning disappears (and the timer stops) each time the customer sends a message.
         * The warning disappears (and the timer resets to 0) each time the agent sends message.
         * The warning value must be shorter than the time-out value (we recommend at least 30 seconds).
         */
        const warningTime: string = (await getAppSettingValue(read, AppSetting.DialogflowCustomerTimeoutWarningTime));

        /**
         * Sets the amount of time that a customer has to respond to an agent message before the session ends.
         * The timer stops when the customer sends a message and starts again from 0 on the next agent's message.
         */
        const timeoutTime: string = (await getAppSettingValue(read, AppSetting.DialogflowCustomerTimeoutTime));

        // ------ When agent sends message -----
        // Send new timeout msg and reset previous timeout

        // ------ When customer sends message -----
        // Send timeout msg to cancel previous timeout

        // On Timeout : Close chat
        // On Warning : Show Countdown Popup in Livechat Widget

        const timeoutWarningMessage: string = (await getAppSettingValue(read, AppSetting.DialogflowCustomerTimeoutWarningMessage));

        if (message.sender.username === dialogflowBotUsername) {
            // Agent sent message
            if (!message.id) {
                return;
            }
            const user = await read.getUserReader().getByUsername(dialogflowBotUsername);
            const msgExtender = modify.getExtender().extendMessage(message.id, user);
            (await msgExtender).addCustomField('idleTimeoutConfig', {
                idleTimeoutAction: 'start',
                idleTimeoutWarningTime: warningTime,
                idleTimeoutTimeoutTime: timeoutTime,
                idleTimeoutMessage: timeoutWarningMessage,
            });
            modify.getExtender().finish(await msgExtender);
        } else {

            // Guest sent message

            if (!message.id) {
                return;
            }
            const user = await read.getUserReader().getByUsername(dialogflowBotUsername);
            const msgExtender = modify.getExtender().extendMessage(message.id, user);
            (await msgExtender).addCustomField('idleTimeoutConfig', {
                idleTimeoutAction: 'stop',
                idleTimeoutWarningTime: warningTime,
                idleTimeoutTimeoutTime: timeoutTime,
                idleTimeoutMessage: timeoutWarningMessage,
            });
            modify.getExtender().finish(await msgExtender);

            console.log('schedule timeout');

            await scheduleTimeOut(message, read, modify, persistence);

        }
    }
};

async function scheduleTimeOut(message: IMessage, read: IRead, modify: IModify, persistence: IPersistence) {
    const idleTimeoutTimeoutTime: string = await getAppSettingValue(read, AppSetting.DialogflowCustomerTimeoutTime);
    const rid = message.room.id;
    const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `SFLAIA-${rid}`);

    if (updateIdleSessionScheduleStatus(read, modify, persistence, rid)) {
            await modify.getScheduler().cancelJob('idle-session-timeout');
    } else {
            await persistence.createWithAssociation({ idleSessionScheduleStarted: true }, assoc);

    }

    const task = {
        id: 'idle-session-timeout',
        when: `${idleTimeoutTimeoutTime} seconds`,
        data: {rid},
    };
    await modify.getScheduler().scheduleOnce(task);
}

export const updateIdleSessionScheduleStatus = async (read: IRead, modify: IModify, persistence: IPersistence, rid: string) => {
    const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `SFLAIA-${rid}`);
    const data = await retrieveDataByAssociation(read, assoc);

    return data && data.idleSessionScheduleStarted === true;
};
