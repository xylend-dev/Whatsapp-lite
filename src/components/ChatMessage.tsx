import React, { useEffect, useRef } from "react";
import { Image, StyleSheet, Text, TextStyle, TouchableWithoutFeedback, View, ViewStyle } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Menu, MenuTrigger, MenuOptions, MenuOption } from "react-native-popup-menu";
import * as Clipboard from "expo-clipboard";
import { colors } from "../constants";
import { Message, Seen } from "../utils/store/types";
import { deleteMessage, markMessageAsSeen } from "../utils/actions/chatActions";
import { formatAmPm } from "../utils/helperFns";
import { useNavigation } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import { LoggedInStackParamList } from "../navigation/types";

type MenuItemProps = {
	text: string;
	icon: string;
	iconPack?: any;
	onSelect: () => void;
};

const MenuItem = (props: MenuItemProps) => {
	const Icon = props.iconPack ?? Feather;

	return (
		<MenuOption onSelect={props.onSelect}>
			<View style={styles.menuItemContainer}>
				<Text style={styles.menuText}>{props.text}</Text>
				<Icon name={props.icon} size={18} />
			</View>
		</MenuOption>
	);
};

type Props = {
	text: string;
	type: "myMessage" | "theirMessage" | "reply" | "info";
	deleted?: boolean;
	edited?: boolean;
	messageId: string;
	chatId: string;
	userId: string; // loggedInUserId
	sentBy: string;
	date: string;
	setReplyingTo: () => void;
	setEditMessage?: () => void;
	replyTo?: Message;
	replyToUser?: string;
	name?: string;
	imageUrl?: string;
	scrollToRepliedMessage: () => void;
	totalSeens?: Array<Seen>;
	isGroupChat: boolean;
};

type NavigationProps = StackScreenProps<LoggedInStackParamList, "MessageInfo">["navigation"];

const ChatMessage = (props: Props) => {
	const navigation = useNavigation<NavigationProps>();
	const {
		text,
		type,
		messageId,
		date,
		setReplyingTo,
		replyTo,
		name,
		imageUrl,
		replyToUser,
		scrollToRepliedMessage,
		deleted,
		chatId,
		userId,
		sentBy,
		setEditMessage,
		edited,
		totalSeens,
		isGroupChat,
	} = props;

	const messageStyle: ViewStyle = { ...styles.container };
	const textStyle: TextStyle = { ...styles.text };
	const wrapperStyle: ViewStyle = { ...styles.wrapperStyle };

	const dateString = formatAmPm(date);

	const menuRef = useRef<any>(null);

	const copyToClipboard = async (text: string) => {
		try {
			await Clipboard.setStringAsync(text);
		} catch (error) {
			console.log(error);
		}
	};

	const showMessageMenu = () => {
		if (props.type === "reply") return;
		menuRef.current?.props.ctx.menuActions.openMenu(messageId);
	};

	const deleteChatMessage = () => {
		deleteMessage({
			messageId,
			chatId,
			userId,
		});
	};

	switch (type) {
		case "myMessage":
			wrapperStyle.flexDirection = "row";
			wrapperStyle.justifyContent = "flex-end";
			messageStyle.backgroundColor = "#E7FED6";
			messageStyle.maxWidth = "90%";
			break;
		case "theirMessage":
			wrapperStyle.flexDirection = "row";
			wrapperStyle.justifyContent = "flex-start";
			messageStyle.maxWidth = "90%";
			break;
		case "reply":
			messageStyle.backgroundColor = "#F2F2F2";
			wrapperStyle.borderLeftColor = colors.blue;
			wrapperStyle.borderLeftWidth = 4;
			break;
		case "info":
			wrapperStyle.alignItems = "center";
			messageStyle.alignItems = "center";
			messageStyle.backgroundColor = colors.beige;
			textStyle.color = colors.textColor;
			break;
		default:
			break;
	}

	useEffect(() => {
		// user is viewing his/her own message
		if (type === "myMessage") {
			console.log("is my message");
			return;
		}

		// user is viewing other users message
		// mark the other user's message as seen by the currently loggedIn user
		const isAlreadySeen = totalSeens && totalSeens.find((seen) => seen.seenBy === userId);

		if (isAlreadySeen) {
			console.log("Already seen by the user");
			return;
		}

		console.log("seen");
		markMessageAsSeen({
			chatId,
			messageId,
			seenBy: userId,
		});
	}, [chatId]);

	const isSeen = !!(totalSeens && totalSeens.length > 0);

	return (
		<View style={wrapperStyle}>
			<TouchableWithoutFeedback style={{ width: "100%" }} onLongPress={showMessageMenu} onPress={scrollToRepliedMessage}>
				<View style={messageStyle}>
					{type !== "info" && name && <Text style={styles.name}>{name}</Text>}

					{replyTo && replyToUser && (
						<ChatMessage
							type="reply"
							text={replyTo.text}
							name={replyToUser}
							date={replyTo.sentAt}
							messageId={replyTo.messageId}
							setReplyingTo={() => {}}
							scrollToRepliedMessage={scrollToRepliedMessage}
							chatId={chatId}
							userId={userId}
							sentBy={replyTo.sentBy}
							isGroupChat={isGroupChat}
						/>
					)}

					{deleted ? (
						<View style={styles.deletedMessageContainer}>
							<MaterialIcons name="not-interested" size={18} color="black" />
							<Text style={{ ...textStyle, fontFamily: "italic" }}>This message has been deleted</Text>
						</View>
					) : imageUrl ? (
						<Image source={{ uri: imageUrl }} style={styles.image} />
					) : (
						<Text style={textStyle}>{text}</Text>
					)}

					{props.type !== "reply" && (
						<View style={styles.timeContainer}>
							<Text style={styles.time}>
								{`${edited ? "Edited " : ""}`} {dateString}
							</Text>
							{!deleted && type === "myMessage" && (
								<Ionicons name="md-checkmark-done-sharp" size={13} color={isSeen ? colors.blue : colors.gray} />
							)}
						</View>
					)}
				</View>
			</TouchableWithoutFeedback>

			{props.type !== "reply" && !deleted && (
				<Menu ref={menuRef} name={messageId}>
					<MenuTrigger />
					<MenuOptions>
						<MenuItem text="Copy to clipboard" icon="copy" onSelect={() => copyToClipboard(text)} />
						<MenuItem text="Reply" icon="arrow-left-circle" onSelect={setReplyingTo} />
						{type === "myMessage" && (
							<>
								<MenuItem
									text="Info"
									icon="md-information-circle"
									onSelect={() => {
										navigation.navigate("MessageInfo", {
											totalSeens: totalSeens || [],
											messageDetails: {
												messageText: text,
												messageDate: date,
												isGroupChat,
												imageUrl,
												isSeen,
												edited: !!edited,
											},
										});
									}}
									iconPack={Ionicons}
								/>
								{!imageUrl && (
									<MenuItem
										text="Edit"
										icon="pencil"
										onSelect={() => {
											if (setEditMessage) {
												setEditMessage();
											}
										}}
										iconPack={MaterialCommunityIcons}
									/>
								)}
								<MenuItem text="Delete for everyone" icon="delete" onSelect={deleteChatMessage} iconPack={MaterialIcons} />
							</>
						)}
					</MenuOptions>
				</Menu>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	wrapperStyle: {},
	container: {
		backgroundColor: "white",
		borderRadius: 6,
		padding: 5,
		marginBottom: 10,
		borderColor: "#E2DACC",
		borderWidth: 1,
	},
	text: {
		fontFamily: "regular",
		letterSpacing: 0.3,
	},
	menuItemContainer: {
		flexDirection: "row",
		padding: 5,
	},
	menuText: {
		flex: 1,
		fontFamily: "regular",
		letterSpacing: 0.3,
		fontSize: 16,
	},
	timeContainer: {
		flexDirection: "row",
		justifyContent: "flex-end",
		alignItems: "center",
		gap: 1,
		marginTop: 5,
	},
	time: {
		fontFamily: "regular",
		letterSpacing: 0.3,
		color: colors.gray,
		fontSize: 12,
	},
	name: {
		fontFamily: "medium",
		letterSpacing: 0.3,
		marginBottom: 6,
	},
	image: {
		width: 300,
		height: 300,
		marginBottom: 5,
	},
	deletedMessageContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
});

export default ChatMessage;
