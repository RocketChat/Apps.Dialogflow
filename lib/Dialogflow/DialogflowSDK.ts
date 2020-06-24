import { IHttp, IHttpRequest, IHttpResponse, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IDialogflowAccessToken } from '../../definition/IDialogflowAccessToken';
import { IDialogflowResponse } from '../../definition/IDialogflowResponse';
import { getAppSetting } from '../../helper';
import { AppSetting } from '../../Settings';
import { AppPersistence } from '../persistence';
import { DialogflowAuth } from './DialogflowAuth';

export class DialogflowSDK {

    constructor(private http: IHttp,
                private read: IRead,
                private persis: IPersistence,
                private sessionId: string,
                private messageText: string) {}

    public async sendMessage(): Promise<IDialogflowResponse> {
        const dialogflowServerURL = await this.getDialogflowURL(this.sessionId);

        const httpRequestContent: IHttpRequest = this.buildDialogflowHTTPRequest(this.messageText);

        // send request to dialogflow
        const response = await this.http.post(dialogflowServerURL, httpRequestContent);

        const parsedMessage = this.parseDialogflowRequest(response);
        return parsedMessage;
    }

    private parseDialogflowRequest(response: IHttpResponse): IDialogflowResponse {
        if (!response.content) { throw new Error('Error Parsing Dialogflow\'s Response. Content is undefined'); }
        const responseJSON = JSON.parse(response.content);

        if (responseJSON.queryResult) {
            const parsedMessage: IDialogflowResponse = {
                message: responseJSON.queryResult.fulfillmentText,
                isFallback: responseJSON.queryResult.intent.isFallback ? responseJSON.queryResult.intent.isFallback : false,
            };
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

    private async getDialogflowURL(sessionId: string) {
        const projectId = await getAppSetting(this.read, AppSetting.DialogflowProjectId);

        const accessToken = await this.getAccessToken();
        if (!accessToken) { throw Error('Error getting Access Token. Access token is undefined'); }

        const dialogflowServerURL = `https://dialogflow.googleapis.com/v2/projects/${projectId}/agent/environments/draft/users/-/sessions/${sessionId}:detectIntent?access_token=${accessToken}`;
        return dialogflowServerURL;
    }

    private async getAccessToken() {
        const persistance: AppPersistence = new AppPersistence(this.persis, this.read.getPersistenceReader());

        const clientEmail = await getAppSetting(this.read, AppSetting.DialogflowClientEmail);
        if (!clientEmail) { throw new Error('Error! Client email not provided in setting'); }

        // check is there is a valid access token
        const oldAccessToken: IDialogflowAccessToken = (await persistance.getConnectedAccessToken(this.sessionId)) as IDialogflowAccessToken;
        if (oldAccessToken) {
            // check expiration
            if (!this.hasExpired(oldAccessToken.expiration)) {
                return oldAccessToken.token;
            }
        }

        const privateKey = await getAppSetting(this.read, AppSetting.DialogFlowPrivateKey);
        if (!privateKey) { throw new Error('Error! Private Key not provided in setting'); }
        const dialogflowAuthHelper: DialogflowAuth = new DialogflowAuth(clientEmail, privateKey);
        try {
            // get the access token
            const accessToken: IDialogflowAccessToken =  await dialogflowAuthHelper.getAccessToken(this.http);
            // save this token to persistant storage
            await persistance.connectAccessTokenToSessionId(this.sessionId, accessToken);

            return accessToken.token;
        } catch (error) {
            throw Error('Error getting Access Token' + error);
        }
    }

    private buildDialogflowHTTPRequest(message: string) {
        return {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            data: {
                queryInput: {
                    text: {
                    languageCode: 'en',
                    text: message,
                    },
                },
            },
        };
    }

    private hasExpired(expiration: Date): boolean {
        if (!expiration) { return true; }
        return Date.now() >= expiration.getTime();
    }

}
