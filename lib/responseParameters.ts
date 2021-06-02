import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { AppSetting, DefaultMessage } from '../config/Settings';
import {  DialogflowRequestType, IDialogflowMessage} from '../enum/Dialogflow';
import { getAppSettingValue } from '../lib/Settings';
import { Dialogflow } from './Dialogflow';
import { createDialogflowMessage, createMessage } from './Message';
import { retrieveDataByAssociation } from './retrieveDataByAssociation';

export const  handleParameters = async (read: IRead,  modify: IModify, persistence: IPersistence, http: IHttp, rid: string, visitorToken: string, dialogflowMessage: IDialogflowMessage) => {
    const { parameters = [] } = dialogflowMessage;

    if (parameters.custom_languagecode) {

        const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `SFLAIA-${rid}`);
        const association = await read.getPersistenceReader().readByAssociation(assoc);

        const data = await retrieveDataByAssociation(read, assoc);

        if (data && data.custom_languageCode) {
            if (data.custom_languageCode !== parameters.custom_languagecode) {
                await persistence.updateByAssociation(assoc, {'custom_languageCode': parameters.custom_languagecode});
                sendChangeLanguageEvent(read, modify, persistence, rid, http, parameters.custom_languagecode);
            }
        }
        else {
            await persistence.createWithAssociation({'custom_languageCode': parameters.custom_languagecode}, assoc);
            sendChangeLanguageEvent(read, modify, persistence, rid, http, parameters.custom_languagecode);
        }

    } 
}

const sendChangeLanguageEvent = async (read: IRead, modify: IModify, persis: IPersistence, rid: string, http: IHttp, languageCode: string) => {
    try {

        const event = { name: 'ChangeLanguage', languageCode: languageCode, parameters:  {} };
        const response: IDialogflowMessage = await Dialogflow.sendRequest(http, read, modify, persis, rid, event, DialogflowRequestType.EVENT);

        await createDialogflowMessage(rid, read, modify, response);
      } catch (error) {

        const serviceUnavailable: string = await getAppSettingValue(read, AppSetting.DialogflowServiceUnavailableMessage);

        await createMessage(rid,
                            read,
                            modify,
                            { text: serviceUnavailable ? serviceUnavailable : DefaultMessage.DEFAULT_DialogflowServiceUnavailableMessage });

        return;
    }
}