import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { ILivechatMessage, ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AppSettings } from './AppSettings';
import { DialogflowWrapper } from './DialogflowWrapper';

export class AppsDialogflowApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async initialize(configurationExtend: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await this.extendConfiguration(configurationExtend);
        this.getLogger().log('Apps.Dialogflow App Initialized');
    }

    public async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        AppSettings.forEach((setting) => configuration.settings.provideSetting(setting));
    }

    public async executePostMessageSent(message: IMessage,
                                        read: IRead,
                                        http: IHttp,
                                        persistence: IPersistence,
                                        modify: IModify): Promise<void> {

        const SettingBotUsername: string = await this.getAppSetting(read, 'Lc-Bot-Username');
        if (message.sender.username === SettingBotUsername) {
            // this msg was sent by the Bot itself, so no need to respond back
            return;
        } else if (message.room.type !== RoomType.LIVE_CHAT) {
            // check whether this is a Livechat message
            return;
        }

        const lmessage: ILivechatMessage = message;
        const lroom: ILivechatRoom = lmessage.room as ILivechatRoom;
        const LcAgent: IUser = lroom.servedBy ? lroom.servedBy : message.sender;

        // check whether the bot is currently handling the Visitor, if not then return back
        if (SettingBotUsername !== LcAgent.username) {
            return;
        }

        const clientEmail = await this.getAppSetting(read, 'Dialogflow-Client-Email');
        const privateKey = await this.getAppSetting(read, 'Dialogflow-Private-Key');

        const dialogflowWrapper: DialogflowWrapper = new DialogflowWrapper(clientEmail, privateKey);

        // get the access token
        const accessToken =  await dialogflowWrapper.getAccessToken(http);

        console.log(accessToken);

        const BotMessage = 'Hello from Bot';

        const builder = modify.getNotifier().getMessageBuilder();
        builder.setRoom(message.room).setText(BotMessage).setSender(LcAgent);
        modify.getCreator().finish(builder);

    }

    public async getAppSetting(read: IRead, id: string): Promise<any> {
        return (await read.getEnvironmentReader().getSettings().getById(id)).value;
    }
}
