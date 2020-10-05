import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessageFile } from '@rocket.chat/apps-engine/definition/messages';
import { DefaultMessage } from '../config/Settings';
import { AUDIO_EXTENSION, Base64, DialogflowRequestType, MIME_TYPE } from '../enum/Dialogflow';
import { Logs } from '../enum/Logs';
import { createMessage } from './Message';

export const base64urlEncode = (str: any) => {
    const utf8str = unescape(encodeURIComponent(str));
    return base64EncodeData(utf8str, utf8str.length, Base64.BASE64_DICTIONARY, Base64.BASE64_PAD);
};

export const base64EncodeData = (data: string, len: number, b64x: string, b64pad: string) => {
    let dst = '';
    let i: number;

    // tslint:disable:no-bitwise
    for (i = 0; i <= len - 3; i += 3) {

        dst += b64x.charAt(data.charCodeAt(i) >>> 2);
        dst += b64x.charAt(((data.charCodeAt(i) & 3) << 4) | (data.charCodeAt(i + 1) >>> 4));
        dst += b64x.charAt(((data.charCodeAt(i + 1) & 15) << 2) | (data.charCodeAt(i + 2) >>> 6));
        dst += b64x.charAt(data.charCodeAt(i + 2) & 63);

    }

    if (len % 3 === 2) {
        dst += b64x.charAt(data.charCodeAt(i) >>> 2);
        dst += b64x.charAt(((data.charCodeAt(i) & 3) << 4) | (data.charCodeAt(i + 1) >>> 4));
        dst += b64x.charAt(((data.charCodeAt(i + 1) & 15) << 2));
        dst += b64pad;
    } else if (len % 3 === 1) {
        dst += b64x.charAt(data.charCodeAt(i) >>> 2);
        dst += b64x.charAt(((data.charCodeAt(i) & 3) << 4));
        dst += b64pad;
        dst += b64pad;
    }
    // tslint:enable:no-bitwise

    return dst;
};

export const defineAudioFile = async (read: IRead, modify: IModify, roomId: string, file: IMessageFile): Promise<{ content: string, contentType: DialogflowRequestType}> => {
    const { name } = await read.getUploadReader().getById(file._id);

    if (!isSupportedAudioFormat(name)) {
        await createMessage(roomId, read, modify, { text: DefaultMessage.DEFAULT_UnsupportedAudioFormatMessage });
    }

    const content = (await read.getUploadReader().getBufferById(file._id)).toString(Base64.BASE64);
    const contentType = file && file.type === MIME_TYPE.AUDIO_OGG ? DialogflowRequestType.AUDIO_OGG : DialogflowRequestType.AUDIO;

    return { content, contentType };
};

export const isSupportedAudioFormat = (fileName: string): boolean => {
    const extension = fileName.split('.')[1];
    if (!extension) {
        throw new Error(Logs.INVALID_AUDIO_FILE_NAME);
    }

    if (extension === AUDIO_EXTENSION.OGA ||
        extension === AUDIO_EXTENSION.WAV ||
        extension === AUDIO_EXTENSION.OPUS) {
        return true;
    }

    return false;
};
  
export const uuid = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
