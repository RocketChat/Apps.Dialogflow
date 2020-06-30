import { IHttp, IHttpRequest, IHttpResponse, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { createSign } from 'crypto';
import { AppSetting } from '../config/Settings';
import { DialogflowJWT, DialogflowUrl, IDialogflowAccessToken, IDialogflowMessage, LanguageCode } from '../enum/Dialogflow';
import { Headers } from '../enum/Http';
import { base64urlEncode } from './Helper';
import { createHttpRequest } from './Http';
import { updateRoomCustomFields } from './Room';
import { getAppSettingValue } from './Settings';

class DialogflowClass {
    private jwtExpiration: Date;
    public async sendMessage(http: IHttp,
                             read: IRead,
                             persis: IPersistence,
                             modify: IModify,
                             sessionId: string,
                             messageText: string): Promise<IDialogflowMessage> {
        const serverURL = await this.getServerURL(read, persis, modify, http, sessionId);

        const httpRequestContent: IHttpRequest = createHttpRequest(
            { 'Content-Type': Headers.CONTENT_TYPE_JSON, 'Accept': Headers.ACCEPT_JSON },
            { queryInput: { text: { languageCode: LanguageCode.EN, text: messageText } } },
        );

        // send request to dialogflow
        const response = await http.post(serverURL, httpRequestContent);

        return this.parseRequest(response);
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

        const response = await http.post(authUrl, httpRequestContent);

        if (!response.content) { throw new Error('Error!! Invalid Response From Dialogflow'); }
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
            throw Error('Error retrieving access token');
        }
    }

    private parseRequest(response: IHttpResponse): IDialogflowMessage {
        if (!response.content) { throw new Error('Error Parsing Dialogflow\'s Response. Content is undefined'); }
        const responseJSON = JSON.parse(response.content);

        const { queryResult } = responseJSON;
        if (queryResult) {
            const { fulfillmentMessages, intent: { isFallback } } = queryResult;
            const parsedMessage: IDialogflowMessage = {
                isFallback: isFallback ? isFallback : false,
            };

            const messages: Array<string> = [];

            fulfillmentMessages.forEach((message) => {
                const { text, payload: { quickReplies = null } = {} } = message;
                if (text) {
                    const { text: textMessageArray } = text;
                    messages.push(textMessageArray[0]);
                }
                if (quickReplies) {
                    const { title, quickReplies: quickRepliesArray } = quickReplies;
                    if (title && quickRepliesArray) {
                        parsedMessage.quickReplies = quickReplies;
                    }
                }
            });
            if (messages.length > 0) {
                parsedMessage.messages = messages;
            }
            return parsedMessage;
        } else {
            // some error occured. Dialogflow's response has a error field containing more info abt error
            throw Error(`An Error occured while connecting to Dialogflows REST API\
            Error Details:-
                message:- ${responseJSON.error.message}\
                status:- ${responseJSON.error.message}\
            Try checking the google credentials in App Setting and your internet connection`);
        }
    }

    private async getServerURL(read: IRead, persis: IPersistence, modify: IModify, http: IHttp, sessionId: string) {
        const projectId = await getAppSettingValue(read, AppSetting.DialogflowProjectId);

        const accessToken = await this.getAccessToken(read, persis, modify, http, sessionId);
        if (!accessToken) { throw Error('Error getting Access Token. Access token is undefined'); }

        return `https://dialogflow.googleapis.com/v2/projects/${projectId}/agent/environments/draft/users/-/sessions/${sessionId}:detectIntent?access_token=${accessToken}`;
    }

    private async getAccessToken(read: IRead, persis: IPersistence, modify: IModify, http: IHttp, sessionId: string) {

        const clientEmail = await getAppSettingValue(read, AppSetting.DialogflowClientEmail);
        if (!clientEmail) { throw new Error('Error! Client email not provided in setting'); }
        const privateKey = await getAppSettingValue(read, AppSetting.DialogFlowPrivateKey);
        if (!privateKey) { throw new Error('Error! Private Key not provided in setting'); }

        const room: IRoom = await read.getRoomReader().getById(sessionId) as IRoom;
        if (!room) { throw new Error('Error! Room Id not valid'); }

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
            throw Error('Error getting Access Token' + error);
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

    private getSignature(b64uHeader: string, b64uClaimSetclaimset: string, privateKey) {
        const signatureInput = `${b64uHeader}.${b64uClaimSetclaimset}`;
        const sign = createSign(DialogflowJWT.SHA_256);
        sign.update(signatureInput);
        // replace \\n by \n in private key
        privateKey = privateKey.trim().replace(/\\n/gm, '\n');
        // sign the signature then in the result replace + with -    |    / with _
        return sign.sign(privateKey, DialogflowJWT.BASE_64).replace(/\+/g, '-').replace(/\//g, '_');
    }
}

export const Dialogflow = new DialogflowClass();
