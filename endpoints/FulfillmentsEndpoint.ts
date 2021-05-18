import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { IDialogflowMessage, IDialogflowQuickReplies } from '../enum/Dialogflow';
import { Headers } from '../enum/Http';
import { Logs } from '../enum/Logs';
import { removeBotTypingListener } from '../lib//BotTyping';
import { Dialogflow } from '../lib/Dialogflow';
import { createHttpResponse } from '../lib/Http';
import { createDialogflowMessage } from '../lib/Message';

export class FulfillmentsEndpoint extends ApiEndpoint {
    public path = 'fulfillment';

    public async post(request: IApiRequest,
                      endpoint: IApiEndpointInfo,
                      read: IRead,
                      modify: IModify,
                      http: IHttp,
                      persis: IPersistence): Promise<IApiResponse> {
        this.app.getLogger().info(Logs.ENDPOINT_RECEIVED_REQUEST);

        try {
            await this.processRequest(read, modify, persis, request);
            return createHttpResponse(
                HttpStatusCode.OK,
                { 'Content-Type': Headers.CONTENT_TYPE_JSON },
                { fulfillmentMessages: [] });
        } catch (error) {
            this.app.getLogger().error(Logs.ENDPOINT_REQUEST_PROCESSING_ERROR, error);
            return createHttpResponse(HttpStatusCode.INTERNAL_SERVER_ERROR, { 'Content-Type': Headers.CONTENT_TYPE_JSON }, { error: error.message });
        }
    }

    private async processRequest(read: IRead, modify: IModify, persis: IPersistence, request: IApiRequest) {
        const message: IDialogflowMessage = Dialogflow.parseRequest(request.content);
        if (!message) { throw new Error(Logs.INVALID_REQUEST_CONTENT); }
        if (!message.sessionId) { throw new Error(Logs.INVALID_SESSION_ID); }

        await createDialogflowMessage(message.sessionId, read, modify, message);
        await this.handleBotTyping(message.sessionId, message);
    }

    private async handleBotTyping(rid: string, dialogflowMessage: IDialogflowMessage) {
        const { messages = [] } = dialogflowMessage;

        for (const message of messages) {
            const { customFields = null } = message as IDialogflowQuickReplies;

            if (customFields) {
                const { disableInput, displayTyping } = customFields;
                if (disableInput === true && displayTyping !== true) {
                    await removeBotTypingListener(rid);
                }
            }
        }
    }
}
