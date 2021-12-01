import {
	HttpStatusCode,
	IModify,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
	ApiEndpoint,
	IApiEndpointInfo,
	IApiRequest,
	IApiResponse,
} from '@rocket.chat/apps-engine/definition/api';
import { IDialogflowMessage } from '../enum/Dialogflow';
import { Headers } from '../enum/Http';
import { Logs } from '../enum/Logs';
import { Dialogflow } from '../lib/Dialogflow';
import { createHttpResponse } from '../lib/Http';
import { createDialogflowMessage } from '../lib/Message';

export class FulfillmentsEndpoint extends ApiEndpoint {
	public path = 'fulfillment';

	public async post(
		request: IApiRequest,
		_endpoint: IApiEndpointInfo,
		read: IRead,
		modify: IModify,
	): Promise<IApiResponse> {
		this.app.getLogger().info(Logs.ENDPOINT_RECEIVED_REQUEST);

		try {
			await this.processRequest(read, modify, request);
			return createHttpResponse(
				HttpStatusCode.OK,
				{ 'Content-Type': Headers.CONTENT_TYPE_JSON },
				{ fulfillmentMessages: [] },
			);
		} catch (error: unknown) {
			this.app
				.getLogger()
				.error(Logs.ENDPOINT_REQUEST_PROCESSING_ERROR, error);
			return createHttpResponse(
				HttpStatusCode.INTERNAL_SERVER_ERROR,
				{ 'Content-Type': Headers.CONTENT_TYPE_JSON },
				{ error: (error as Error).message },
			);
		}
	}

	private async processRequest(
		read: IRead,
		modify: IModify,
		request: IApiRequest,
	) {
		const message: IDialogflowMessage = Dialogflow.parseRequest(
			request.content,
		);
		if (!message) {
			throw new Error(Logs.INVALID_REQUEST_CONTENT);
		}
		if (!message.sessionId) {
			throw new Error(Logs.INVALID_SESSION_ID);
		}

		await createDialogflowMessage(
			this.app,
			message.sessionId,
			read,
			modify,
			message,
		);
	}
}
