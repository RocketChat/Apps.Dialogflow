import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { IDialogflowMessage } from '../enum/Dialogflow';
import { Headers } from '../enum/Http';
import { Dialogflow } from '../lib/Dialogflow';
import { createHttpResponse } from '../lib/Http';
import { createDialogflowMessage } from '../lib/Message';

export class FulfillmentsEndpoint extends ApiEndpoint {
    public path = 'fulfillments-endpoint';

    public async post(request: IApiRequest,
                      endpoint: IApiEndpointInfo,
                      read: IRead,
                      modify: IModify,
                      http: IHttp,
                      persis: IPersistence): Promise<IApiResponse> {
        this.app.getLogger().info('Endpoint recieved an request');

        try {
            await this.processRequest(read, modify, persis, request);
            return createHttpResponse(
                HttpStatusCode.OK,
                { 'Content-Type': Headers.CONTENT_TYPE_JSON },
                { fulfillmentMessages: [] });
        } catch (error) {
            this.app.getLogger().error('Error occured while processing the request. Details:- ', error);
            return createHttpResponse(HttpStatusCode.INTERNAL_SERVER_ERROR, { 'Content-Type': Headers.CONTENT_TYPE_JSON }, { error: error.message });
        }
    }

    private async processRequest(read: IRead, modify: IModify, persis: IPersistence, request: IApiRequest) {
        const message: IDialogflowMessage = Dialogflow.parseRequest(request.content);
        if (!message) { throw new Error('Error! Request content not valid'); }
        if (!message.sessionId) { throw new Error('Error! Session Id not present in request'); }

        await createDialogflowMessage(message.sessionId, read, modify, message);
    }
}
