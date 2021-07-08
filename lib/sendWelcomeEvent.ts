import { IHttp, IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { AppSetting, DefaultMessage } from '../config/Settings';
import { DialogflowRequestType, IDialogflowCustomFields, IDialogflowMessage } from '../enum/Dialogflow';
import { Logs } from '../enum/Logs';
import { Dialogflow } from './Dialogflow';
import { createDialogflowMessage, createMessage } from './Message';
import { getAppSettingValue } from './Settings';

export const sendWelcomeEventToDialogFlow = async (read: IRead,  modify: IModify, http: IHttp, rid: string, visitorToken: string, livechatData: any) => {
    try {
        const event = { name: 'Welcome', languageCode: 'en', parameters: {...(livechatData || {}), roomId: rid, visitorToken} || {} };
        const disableInput: IDialogflowCustomFields = {
            disableInput: true,
            disableInputMessage: 'Starting chat...',
            displayTyping: true,
        };
        await createMessage(rid, read, modify, { customFields: disableInput });
        const response: IDialogflowMessage = await Dialogflow.sendRequest(http, read, modify, rid, event, DialogflowRequestType.EVENT);
        await createDialogflowMessage(rid, read, modify, response);
    } catch (error) {
        console.error(`${Logs.DIALOGFLOW_REST_API_ERROR} ${error.message}`);
        const serviceUnavailable: string = await getAppSettingValue(read, AppSetting.DialogflowServiceUnavailableMessage);
        await createMessage(rid, read, modify, { text: serviceUnavailable ? serviceUnavailable : DefaultMessage.DEFAULT_DialogflowServiceUnavailableMessage });
        return;
    }
};
