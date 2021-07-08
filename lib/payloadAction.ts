import { IHttp, IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { AppSetting } from '../config/Settings';
import { ActionIds } from '../enum/ActionIds';
import {  IDialogflowAction, IDialogflowMessage, IDialogflowPayload} from '../enum/Dialogflow';
import { closeChat, performHandover, updateRoomCustomFields } from '../lib/Room';
import { sendWelcomeEventToDialogFlow } from '../lib/sendWelcomeEvent';
import { getAppSettingValue } from '../lib/Settings';

export const  handlePayloadActions = async (read: IRead,  modify: IModify, http: IHttp, rid: string, visitorToken: string, dialogflowMessage: IDialogflowMessage) => {
    const { messages = [] } = dialogflowMessage;
    for (const message of messages) {
        const { action = null } = message as IDialogflowPayload;
        if (action) {
            const { name: actionName, params } = action as IDialogflowAction;
            const targetDepartment: string = await getAppSettingValue(read, AppSetting.FallbackTargetDepartment);

            logActionPayload(rid, action);

            if (actionName) {
                if (actionName === ActionIds.PERFORM_HANDOVER) {
                    if (params) {
                        const customFields: any = {};
                        if (params.salesforceButtonId) {
                            customFields.reqButtonId = params.salesforceButtonId;
                        }
                        if (params.salesforceId) {
                            customFields.salesforceId = params.salesforceId;
                        }
                        if (params.customDetail) {
                            customFields.customDetail = params.customDetail;
                        }
                        if (Object.keys(customFields).length > 0) {
                            await updateRoomCustomFields(rid, customFields, read, modify);
                        }
                    }
                    await performHandover(modify, read, rid, visitorToken, targetDepartment);
                } else if (actionName === ActionIds.CLOSE_CHAT) {
                    await closeChat(modify, read, rid);
                } else if (actionName === ActionIds.NEW_WELCOME_EVENT) {
                    const livechatRoom = await read.getRoomReader().getById(rid) as ILivechatRoom;
                    if (!livechatRoom) { throw new Error(); }
                    const { visitor: { livechatData } } = livechatRoom;
                    await sendWelcomeEventToDialogFlow(read, modify, http, rid, visitorToken, livechatData);
                }
            }
        }
    }
};

const logActionPayload = (rid: string, action: IDialogflowAction) => {
    const logData = {dialogflowSessionID: rid, action: {...action}};
    if (logData.action.params) {
        logData.action.params.customDetail = '';
    }
    console.debug('Dialogflow Action: ', JSON.stringify(logData));
};
