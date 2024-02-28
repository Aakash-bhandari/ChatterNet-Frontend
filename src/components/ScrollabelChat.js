import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import ScrollableFeed from "react-scrollable-feed";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/chatLogic";
import { ChatState } from "../Context/ChatProvider";
import { AUDIO, IMAGE, PDF, VIDEO } from "./MessageComponents";
const Message = ({ message }) => {
  return (<>
    {
      message.includes('.png') || message.includes('.jpg') || message.includes('.jpeg') ?
        <IMAGE message={message} />
        : message.includes('.mp3') || message.includes('.wav') ?
          <AUDIO message={message} />
          : message.includes('.mp4') || message.includes('.avi') || message.includes('.mov') ?
            <VIDEO message={message} />
            : message.includes('.pdf') ?
              <PDF message={message} />
              : <>{message}</>
    }
  </>
  )
}

const ScrollabelChat = ({ messages }) => {
  const { user } = ChatState();
  return (
    <ScrollableFeed>
      {messages &&
        messages.map((m, i) => (
          <div style={{ display: "flex" }} key={m._id}>
            {(m && m.sender && isSameSender(messages, m, i, user._id) ||
              isLastMessage(messages, i, user._id)) && (
                <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
                  <Avatar
                    mt="7px"
                    mr={1}
                    size="sm"
                    cursor="pointer"
                    name={m.sender.name}
                    src={m.sender.pic}
                  />
                </Tooltip>
              )}
            <span
              style={{
                backgroundColor: `${m.sender._id === user._id ? "#B9F5D0" : "white"
                  }`,
                marginLeft: isSameSenderMargin(messages, m, i, user._id),
                marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
                borderRadius: "20px",
                padding: "5px 15px",
                maxWidth: "75%",
              }}
            >

              <Message message={m.content} />
            </span>
          </div>
        ))}
    </ScrollableFeed>
  );
};

export default ScrollabelChat;