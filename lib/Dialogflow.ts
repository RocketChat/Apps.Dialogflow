import { IHttp, IHttpRequest, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { createSign } from 'crypto';
import { AppSetting } from '../config/Settings';
import { DialogflowJWT, DialogflowRequestType, DialogflowUrl, IDialogflowAccessToken, IDialogflowCustomFields, IDialogflowEvent, IDialogflowMessage, IDialogflowPayload, IDialogflowQuickReplies, LanguageCode } from '../enum/Dialogflow';
import { Headers } from '../enum/Http';
import { Logs } from '../enum/Logs';
import { base64urlEncode } from './Helper';
import { createHttpRequest } from './Http';
import { updateRoomCustomFields } from './Room';
import { getAppSettingValue } from './Settings';

class DialogflowClass {
    private jwtExpiration: Date;
    public async sendRequest(http: IHttp,
                             read: IRead,
                             modify: IModify,
                             sessionId: string,
                             request: IDialogflowEvent | string,
                             requestType: DialogflowRequestType): Promise<IDialogflowMessage> {
        const serverURL = await this.getServerURL(read, modify, http, sessionId);

        const queryInput = {
            ...requestType === DialogflowRequestType.EVENT && { event: request },
            ...requestType === DialogflowRequestType.MESSAGE && { text: { languageCode: LanguageCode.EN, text: request } },
        };

        const httpRequestContent: IHttpRequest = createHttpRequest(
            { 'Content-Type': Headers.CONTENT_TYPE_JSON, 'Accept': Headers.ACCEPT_JSON },
            { queryInput },
        );

        try {
            const response = await http.post(serverURL, httpRequestContent);
            return this.parseRequest(response.data);
        } catch (error) {
            throw new Error(`${ Logs.HTTP_REQUEST_ERROR }`);
        }
    }

    public async generateNewAccessToken(http: IHttp, clientEmail: string, privateKey: string): Promise<IDialogflowAccessToken> {
        const authUrl = DialogflowUrl.AUTHENTICATION_SERVER_URL;
        const jwt = this.getJWT(clientEmail, privateKey);

        const httpRequestContent: IHttpRequest = {
            headers: {
                'Content-Type': Headers.CONTENT_TYPE_X_FORM_URL_ENCODED,
            },
            content: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
        };

        try {
            const response = await http.post(authUrl, httpRequestContent);

            if (!response.content) { throw new Error(Logs.INVALID_RESPONSE_FROM_DIALOGFLOW); }
            const responseJSON = JSON.parse(response.content);

            const { access_token } = responseJSON;
            if (access_token) {
                const accessToken: IDialogflowAccessToken = {
                    token: access_token,
                    expiration: this.jwtExpiration,
                };
                return accessToken;
            } else {
                const { error, error_description } = responseJSON;
                if (error) {
                    throw Error(`\
                    ---------------------Error with Google Credentials-------------------\
                    Details:- \
                        Error Message:- ${error} \
                        Error Description:- ${error_description}`);
                }
                throw Error(Logs.ACCESS_TOKEN_ERROR);
            }
        } catch (error) {
            throw new Error(Logs.HTTP_REQUEST_ERROR);
        }
    }

    public parseRequest(response: any): IDialogflowMessage {
        if (!response) { throw new Error(Logs.INVALID_RESPONSE_FROM_DIALOGFLOW_CONTENT_UNDEFINED); }

        const { session, queryResult } = response;
        if (queryResult) {
            const { fulfillmentMessages, intent: { isFallback } } = queryResult;
            const parsedMessage: IDialogflowMessage = {
                isFallback: isFallback ? isFallback : false,
            };

            const messages: Array<string | IDialogflowQuickReplies | IDialogflowPayload> = [];
            // customFields should be sent as the response of last message on client side
            const msgCustomFields: IDialogflowCustomFields = {};

            fulfillmentMessages.forEach((message) => {
                const { text, payload: { quickReplies = null, customFields = null, action = null } = {} } = message;
                if (text) {
                    const { text: textMessageArray } = text;
                    messages.push({ text: textMessageArray[0] });
                }
                if (quickReplies) {
                    const { options, imagecards } = quickReplies;
                    if (options || imagecards) {
                        messages.push(quickReplies);
                    }
                }
                if (customFields) {
                    msgCustomFields.disableInput = !!customFields.disableInput;
                    msgCustomFields.disableInputMessage = customFields.disableInputMessage;
                }
                if (action) {
                    messages.push({action});
                }
            });

            if (Object.keys(msgCustomFields).length > 0) {
                if (messages.length > 0) {
                    let lastObj = messages[messages.length - 1];
                    lastObj = Object.assign(lastObj, { customFields: msgCustomFields });
                    messages[messages.length - 1] = lastObj;
                } else {
                    messages.push({ customFields: msgCustomFields });
                }
            }

            if (messages.length > 0) {
                parsedMessage.messages = messages;
            }

            if (session) {
                // "session" format -> projects/project-id/agent/sessions/session-id
                const splittedText: Array<string> = session.split('/');
                const sessionId: string = splittedText[splittedText.length - 1];
                if (sessionId) {
                    parsedMessage.sessionId = sessionId;
                }
            }

            return parsedMessage;
        } else {
            // some error occurred. Dialogflow's response has a error field containing more info abt error
            throw Error(`An Error occurred while connecting to Dialogflow's REST API\
            Error Details:-
                message:- ${response.error.message}\
                status:- ${response.error.message}\
            Try checking the google credentials in App Setting and your internet connection`);
        }
    }

    private async getServerURL(read: IRead, modify: IModify, http: IHttp, sessionId: string) {
        const botId = await getAppSettingValue(read, AppSetting.DialogflowBotId);
        const projectIds = (await getAppSettingValue(read, AppSetting.DialogflowProjectId)).split(',');
        const projectId = projectIds.length >= botId ? projectIds[botId - 1] : projectIds[0];
        const environments = (await getAppSettingValue(read, AppSetting.DialogflowEnvironment)).split(',');
        const environment = environments.length >= botId ? environments[botId - 1] : environments[0];

        const accessToken = await this.getAccessToken(read, modify, http, sessionId);
        if (!accessToken) { throw Error(Logs.ACCESS_TOKEN_ERROR); }

        return `https://dialogflow.googleapis.com/v2/projects/${projectId}/agent/environments/${environment || 'draft'}/users/-/sessions/${sessionId}:detectIntent?access_token=${accessToken}`;
    }

    private async getAccessToken(read: IRead, modify: IModify, http: IHttp, sessionId: string) {

        const botId = await getAppSettingValue(read, AppSetting.DialogflowBotId);
        const clientEmails = (await getAppSettingValue(read, AppSetting.DialogflowClientEmail)).split(',');
        const privateKeys = (await getAppSettingValue(read, AppSetting.DialogFlowPrivateKey)).split(',');
        const privateKey = privateKeys.length >= botId ? privateKeys[botId - 1] : privateKeys[0];
        const clientEmail = clientEmails.length >= botId ? clientEmails[botId - 1] : clientEmails[0];

        if (!privateKey || !clientEmail) { throw new Error(Logs.EMPTY_CLIENT_EMAIL_OR_PRIVATE_KEY_SETTING); }

        const room: IRoom = await read.getRoomReader().getById(sessionId) as IRoom;
        if (!room) { throw new Error(Logs.INVALID_ROOM_ID); }

        // check is there is a valid access token already present
        const { customFields } = room;
        if (customFields) {
            const { accessToken: oldAccessToken } = customFields as any;
            if (oldAccessToken) {
                // check expiration
                if (!this.hasExpired(oldAccessToken.expiration)) {
                    return oldAccessToken.token;
                }
            }
        }

        try {
            // get a new access token
            const accessToken: IDialogflowAccessToken =  await this.generateNewAccessToken(http, clientEmail, privateKey);

            // save this access Token for future use
            await updateRoomCustomFields(sessionId, { accessToken }, read, modify);

            return accessToken.token;
        } catch (error) {
            throw Error(Logs.ACCESS_TOKEN_ERROR + error);
        }
    }

    private hasExpired(expiration: Date): boolean {
        if (!expiration) { return true; }
        return Date.now() >= expiration.getTime();
    }

    private getJWT(clientEmail, privateKey) {
        // request format
        // {Base64url encoded header}.{Base64url encoded claim set}.{Base64url encoded signature}

        const header = this.getJWTHeader();
        const claimSet = this.getClaimSet(clientEmail);
        const signature = this.getSignature(header, claimSet, privateKey);
        // combining all together to form jwt
        return `${ header }.${ claimSet }.${ signature }`;
    }

    // Forming the JWT header
    private getJWTHeader() {
        return base64urlEncode(DialogflowJWT.JWT_HEADER);
    }

    // Forming the jwt claim set
    private getClaimSet(clientEmail) {

        let currentUnixTime = Date.now();
        const hourInc = 1000 * 60 * 30; // an hour
        let oneHourInFuture = currentUnixTime + hourInc;
        // record the expiration date-time
        this.jwtExpiration = new Date(oneHourInFuture);

        // convert milliseconds to seconds
        currentUnixTime = Math.round(currentUnixTime / 1000);
        oneHourInFuture = Math.round(oneHourInFuture / 1000);

        const jwtClaimSet = {
            iss: clientEmail,
            scope: DialogflowJWT.SCOPE_URL,
            aud: DialogflowJWT.AUD_URL,
            exp: oneHourInFuture,
            iat: currentUnixTime,
        };

        return base64urlEncode(JSON.stringify(jwtClaimSet));
    }

    private getSignature(b64uHeader: string, b64uClaimSetClaimSet: string, privateKey) {
        const signatureInput = `${b64uHeader}.${b64uClaimSetClaimSet}`;
        const sign = createSign(DialogflowJWT.SHA_256);
        sign.update(signatureInput);
        // replace \\n by \n in private key
        privateKey = privateKey.trim().replace(/\\n/gm, '\n');
        // sign the signature then in the result replace + with -    |    / with _
        return sign.sign(privateKey, DialogflowJWT.BASE_64).replace(/\+/g, '-').replace(/\//g, '_');
    }
}

export const Dialogflow = new DialogflowClass();
