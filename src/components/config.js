const config = {
  ANNOTATIONS: [
    {
      tool: "Pencil",
      fields: ["height", "width", "left", "top", "path"],
    },
    {
      tool: "Line",
      fields: ["height", "width", "left", "top", "x1", "x2", "y1", "y2"],
    },
    {
      tool: "Rectangle",
      fields: ["height", "width", "left", "top"],
    },
    {
      tool: "Circle",
      fields: ["height", "width", "left", "top", "radius", "angle"],
    },
  ],
  PEER_CONFIG: {
    iceServers: [
      {
        urls: "stun:stun:ec2-34-232-64-178.compute-1.amazonaws.com:3478",
		
		// urls:"stun:stun.l.google.com:19302"
      },
      // {
      //   urls: "turn:ec2-34-232-64-178.compute-1.amazonaws.com:3478",
		// // urls:"turn:turn.l.google.com:19302",
      //   username: "infovisionlabs",
      //   credential: "infovisionlabs",
      // },
    ],
  },
   //SIGNALING_SERVER: "https://vast-headland-11741.herokuapp.com/",
  SIGNALING_SERVER: "https://remoteassistancega.webrtcdemoapp.com",

  SOCKET_ROOM: "foo",
  SOCKET_TOPICS: {
    CREATE_JOIN_ROOM: "create or join",
    ROOM_CREATED: "created",
    ROOM_FULL: "full",
    JOIN_ROOM: "join",
    JOINED_ROOM: "joined",
    LOG: "log",
    MESSAGE: "message",
  },
};

export default config;
