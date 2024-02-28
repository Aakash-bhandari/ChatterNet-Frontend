import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text } from "@chakra-ui/layout";
import { useCallback } from "react";
import "./style.css";
import { IconButton, Spinner, useToast } from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/chatLogic";
import { useEffect, useState } from "react";
import ProfileModal from "./miscellanious/ProfileModal";
import VideoCall from "./VideoCall";
import axios from 'axios'
import { ArrowBackIcon, AttachmentIcon, PhoneIcon } from "@chakra-ui/icons";
import { ChatState } from "../Context/ChatProvider";
import ScrollabelChat from "./ScrollabelChat";
import UpdateGroupChatModal from './miscellanious/UpdateGroupChatModal';
import Lottie from 'react-lottie';
import annimations from '../annimations/Animation - 1707797831472.json';
import { GetImage } from "../api";
import peer from "../service/peer";
import { fetchMessagesAPI, sendMessageAPI } from "../api";
import { useSocket } from "../Context/SocketProvider";
import { handleStopCamera } from "./VideoCall";
var socket, selectedChatCompare;
function SingleChat({ fetchAgain, setFetchAgain }) {

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: annimations,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
        },
    };
    const [messages, setMessages] = useState([]);
    const [file, setFile] = useState('');
    const [fileData, setFileData] = useState('');
    const [loading, setLoading] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [socketConnected, setSocketConnected] = useState(false);
    const [myStream, setMyStream] = useState();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [remoteStream, setRemoteStream] = useState();
    const [typing, setTyping] = useState(false);
    const [istyping, setIsTyping] = useState(false);
    const toast = useToast();
    const { selectedChat, setSelectedChat, user, notification,
        setNotification } =
        ChatState();

    const { socketInstance } = useSocket();
    useEffect(() => {
        socket = socketInstance
        socket.emit("setup", user);
        socket.on("connected", () => setSocketConnected(true))
        socket.on("typing", () => {
            setIsTyping(true);
        })
        socket.on("stop typing", () => {
            setIsTyping(false);
        })
        return ()=>{
            socket.off("typing", () => {
                setIsTyping(true);
            })
            socket.off("stop typing", () => {
                setIsTyping(false);
            })
        }
        // return () => {
        //     // Disconnect the WebSocket when the component is unmounted
        //     socket.disconnect();
        // };
    }, [])

    useEffect(() => {
        const getImage = async () => {
            if (file) {
                const data = new FormData();
                data.append("name", file.name);
                data.append("file", file);
                const response = await GetImage(data);
                setNewMessage(response.data);
            }
        }
        getImage();
    }, [file])


    const sendMessage = async (e) => {
        if (e.key === "Enter" && newMessage) {
            socket.emit("stop typing", selectedChat._id);
            setNewMessage("");
            const data = await sendMessageAPI({ newMessage, selectedChat });
            if (!data.isError) {
                socket.emit("new message", data);
                setMessages([...messages, data]);
            } else if (data.isError) {
                toast({
                    title: data.msg,
                    description: "Failed to send the Message",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom",
                });
            }
        }
    }
    const typingHandler = (e) => {
        setNewMessage(e.target.value)
        if (!socketConnected) return;
        if (!typing) {
            setTyping(true);
            socket.emit("typing", selectedChat._id);
        }
        let lastTypingTime = new Date().getTime();
        var timerLength = 3000;
        setTimeout(() => {
            var timeNow = new Date().getTime();
            var timeDiff = timeNow - lastTypingTime;
            if (timeDiff >= timerLength && typing) {
                socket.emit("stop typing", selectedChat._id);
                setTyping(false);
            }
        }, timerLength);
    };

    const fetchMessages = async () => {
        if (!selectedChat) return
        const data = await fetchMessagesAPI(selectedChat);
        if (!data.isError) {
            setMessages(data);
            setLoading(false);
            socket.emit("join chat", selectedChat._id);
        } else if (data.isError) {
            toast({
                title: data.msg,
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
        }
    }

    useEffect(() => {
        fetchMessages();
        selectedChatCompare = selectedChat;
    }, [selectedChat]);

    ///socket
    const handleUserJoined = useCallback(({ id }) => {
        setRemoteSocketId(id);
    }, []);

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        const offer = await peer.getOffer();
        setMyStream(stream);
        socket.emit("user:call", { to: remoteSocketId, offer });
    }, [remoteSocketId, socket]);

    const handleIncommingCall = useCallback(
        async ({ from, offer }) => {
            setRemoteSocketId(from);
            if (window.confirm('Do you want to accept the incoming call?')) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: true,
                    });
                    setMyStream(stream);

                    const ans = await peer.getAnswer(offer);
                    socket.emit("call:accepted", { to: from, ans });
                } catch (error) {
                    console.error('Error accessing media devices:', error);
                    // Handle error condition
                }
            } else {
                socket.emit("call:declined", { to: from });
                // User declined the call
                // You might want to handle this case
            }
        },
        [socket]
    );

    const sendStreams = () => {
        const existingTracks = peer.peer.getSenders().map(sender => sender.track);

        for (const track of myStream.getTracks()) {
            // Check if the track is already added
            if (!existingTracks.includes(track)) {
                peer.peer.addTrack(track, myStream);
            }
        }

        if (existingTracks.length > 0) {
            toast({
                title: "Request Sent",
                description: "Request Sent",
                status: "success",
                duration: 2000,
                isClosable: true,
                position: "top",
            });
            return;
        }
    }
    const handleCallAccepted = useCallback(
        ({ from, ans }) => {
            peer.setLocalDescription(ans);
            sendStreams();
        },
        [sendStreams]
    );
    const handleCallDeclinded = useCallback(
        ({ from, msg }) => {
            if (myStream) {
                myStream.getTracks().forEach(track => {
                    track.stop();
                });
                setMyStream(null);
            }
            toast({
                title: msg,
                description: "Failed to send the Message",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
        },
        []
    );
    const handleNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer();
        socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
    }, [remoteSocketId, socket]);

    useEffect(() => {
        peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
        return () => {
            peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
        };
    }, [handleNegoNeeded]);

    const handleNegoNeedIncomming = useCallback(
        async ({ from, offer }) => {
            const ans = await peer.getAnswer(offer);
            socket.emit("peer:nego:done", { to: from, ans });
        },
        [socket]
    );

    const handleNegoNeedFinal = useCallback(async ({ ans }) => {
        await peer.setLocalDescription(ans);
    }, []);

    useEffect(() => {
        peer.peer.addEventListener("track", async (ev) => {
            const stream = ev.streams;
            setRemoteStream(stream[0]);
        });
    }, []);
    useEffect(() => {
        socket.on("user:joined", handleUserJoined)
        socket.on("incoming:call", handleIncommingCall)
        socket.on("call:accepted", handleCallAccepted);
        socket.on("call:declined", handleCallDeclinded);
        socket.on("peer:nego:needed", handleNegoNeedIncomming)
        socket.on("peer:nego:final", handleNegoNeedFinal)
        return () => {
            socket.off("user:joined", handleUserJoined)
            socket.off("incoming:call", handleIncommingCall)
            socket.off("call:accepted", handleCallAccepted);
            socket.off("call:declined", handleCallDeclinded);
            socket.off("peer:nego:needed", handleNegoNeedIncomming)
            socket.off("peer:nego:final", handleNegoNeedFinal)
        }
    }, [
        socket,
        handleUserJoined,
        handleIncommingCall,
        handleCallAccepted,
        handleNegoNeedIncomming,
        handleNegoNeedFinal,
    ])

    useEffect(() => {
        socket.on("message received", (newMessageReceived) => {
            if (!selectedChatCompare || selectedChatCompare._id != newMessageReceived.chat._id) {
                ////give notification
                if (!notification.includes(newMessageReceived)) {
                    setNotification([...notification, newMessageReceived]);
                    setFetchAgain(!fetchAgain);
                }
            } else {
                setMessages([...messages, newMessageReceived])
            }
        })

    })


    return <>
        {
            selectedChat ? (
                <>
                    <Text
                        fontSize={{ base: "28px", md: "30px" }}
                        pb={3}
                        px={2}
                        width="100%"
                        fontFamily="Work sans"
                        display="flex"
                        justifyContent={{ base: "space-between" }}
                        alignItems="center"
                    >
                        <IconButton
                            display={{ base: "flex", md: "none" }}
                            icon={<ArrowBackIcon />}
                            onClick={() => setSelectedChat("")}
                        />
                        {
                            !selectedChat.isGroupChat ? (
                                <>
                                    <Box style={{ display: "flex" }}>{getSender(user, selectedChat.users)}
                                        {istyping ? (
                                            <div>
                                                <Lottie
                                                    options={defaultOptions}
                                                    width={70}
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                            </div>
                                        )}</Box>

                                    <div style={{ display: 'flex' }}>
                                        <IconButton icon={<PhoneIcon />} style={{ marginRight: '15px' }} onClick={handleCallUser} />
                                        <ProfileModal user={getSenderFull(user, selectedChat.users)}></ProfileModal>
                                    </div>
                                </>
                            ) : (
                                <> {selectedChat.chatName.toUpperCase()}
                                    <UpdateGroupChatModal fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} fetchMessages={fetchMessages} />
                                </>
                            )
                        }
                    </Text>
                    {
                        myStream ? <VideoCall myStream={myStream} setMyStream={setMyStream} remoteStream={remoteStream} setRemoteStream={setRemoteStream} sendStreams={sendStreams}> </VideoCall> :
                            <>
                                <Box
                                    display="flex"
                                    flexDir="column"
                                    justifyContent="flex-end"
                                    padding={3}
                                    backgroundImage={"https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png"}
                                    width="100%"
                                    height="100%"
                                    borderRadius="lg"
                                    overflowY="hidden"
                                >
                                    {loading ? (
                                        <Spinner
                                            size="xl"
                                            width={20}
                                            height={20}
                                            alignSelf="center"
                                            margin="auto"
                                        />
                                    ) : (
                                        <div className="messages">
                                            <ScrollabelChat messages={messages} />
                                        </div>
                                    )}
                                    <FormControl
                                        onKeyDown={sendMessage}
                                        id="first-name"
                                        isRequired
                                        mt={3}
                                    >

                                        <Box
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="space-between"
                                            padding={3}
                                            overflowY="hidden"
                                        >

                                            <label htmlFor="fileInput" style={{ cursor: 'pointer' }}>
                                                <AttachmentIcon style={{ fontSize: "20px", marginRight: "10px" }} />
                                            </label>
                                            <input
                                                type='file'
                                                id="fileInput"
                                                style={{ display: 'none' }}
                                                onChange={(e) => setFile(e.target.files[0])}
                                            />
                                            <Input
                                                variant="filled"
                                                bg="#E0E0E0"
                                                placeholder="Enter a message.."
                                                value={newMessage}
                                                onChange={typingHandler}
                                            />
                                        </Box>
                                    </FormControl>
                                </Box>
                            </>
                    }

                </>
            ) : (

                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                    <Text fontSize="3xl" pb={3} fontFamily="Work sans">
                        Click on a user to start chatting
                    </Text >
                </Box >
            )
        }
    </>
}

export default SingleChat
