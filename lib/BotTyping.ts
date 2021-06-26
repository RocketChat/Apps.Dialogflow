import { IModify } from '@rocket.chat/apps-engine/definition/accessors';

export async function botTypingListener(modify: IModify, rid: string, username: string ) {
    await modify.getNotifier().typing({ id: rid, username });
}

export async function removeBotTypingListener(modify: IModify, rid: string, username: string) {
    await modify.getNotifier().stopTyping({ id: rid, username });
}
