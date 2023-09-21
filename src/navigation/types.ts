export type LoggedInStackParamList = {
	Home: undefined;
	ChatSettings: { userId: string };
	Chat: { selectedUserId?: string; chatId?: string; selectedUserIds?: string[]; isGroupChat?: boolean; chatName?: string };
	NewChat: { isGroupChat: boolean };
};

export type LoggedInTabParamList = {
	ChatList: { selectedUserId?: string };
	Settings: { userId: string };
};