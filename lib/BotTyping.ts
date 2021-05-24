import { IModify } from '@rocket.chat/apps-engine/definition/accessors';

const rooms = {};

export async function botTypingListener(modify: IModify, rid: string, username: string ) {
    await removeBotTypingListener(rid);
    const callback = modify.getNotifier().typing({ id: rid, username });
    rooms[rid] = callback;
}

export async function removeBotTypingListener(rid: string) {
    if (rooms[rid]) {
        (await rooms[rid])();
        delete rooms[rid];
    }
}
