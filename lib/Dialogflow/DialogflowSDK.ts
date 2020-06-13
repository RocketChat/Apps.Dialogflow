import { IHttp, IHttpRequest, IHttpResponse, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { AppSettingId } from '../../AppSettings';
import { getAppSetting } from '../../helper';
import { DialogflowAuth } from './DialogflowAuth';

export class DialogflowSDK {

    constructor(private http: IHttp,
                private read: IRead,
                private sessionId: string,
                private messageText: string) {}

    public async sendMessage() {
        const dialogflowServerURL = await this.getDialogflowURL(this.sessionId);

        const httpRequestContent: IHttpRequest = this.buildDialogflowHTTPRequest(this.messageText);

        // send request to dialogflow
        const response = await this.http.post(dialogflowServerURL, httpRequestContent);

        const parsedMessage = this.parseDialogflowRequest(response);
        return parsedMessage;
    }

    private parseDialogflowRequest(response: IHttpResponse): string {
        if (!response.content) { throw new Error('Error Parsing Dialogflow\'s Response. Content is undefined'); }
        const responseJSON = JSON.parse(response.content);

        if (responseJSON.queryResult) {
            const parsedMessage = responseJSON.queryResult.fulfillmentText;
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
        const projectId = await getAppSetting(this.read, AppSettingId.DialogflowProjectId);

        const accessToken = await this.getAccessToken();
        if (!accessToken) { throw Error('Error getting Access Token. Access token is undefined'); }

        const dialogflowServerURL = `https://dialogflow.googleapis.com/v2/projects/${projectId}/agent/environments/draft/users/-/sessions/${sessionId}:detectIntent?access_token=${accessToken}`;
        return dialogflowServerURL;
    }

    private async getAccessToken() {
        const clientEmail = await getAppSetting(this.read, AppSettingId.DialogflowClientEmail);
        const privateKey = await getAppSetting(this.read, AppSettingId.DialogFlowPrivateKey);
        const dialogflowAuthHellper: DialogflowAuth = new DialogflowAuth(clientEmail, privateKey);
        try {
            // get the access token
            const accessToken =  await dialogflowAuthHellper.getAccessToken(this.http);
            return accessToken;
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

}
