import Message from "./models/messageModel.js";

let users = [];

const SocketServer = (socket) => {
  // Menangani event 'join-user'
  socket.on("join-user", (user) => {
    if (!user || !user._id) return;

    const userIndex = users.findIndex((u) => u.id === user._id);

    if (userIndex !== -1) {
      // Update pengguna yang sudah ada
      users[userIndex] = {
        id: user._id,
        username: user.username,
        socketId: socket.id,
        friends: user.friends,
      };
    } else {
      // Tambahkan pengguna baru jika belum ada
      users.push({
        id: user._id,
        username: user.username,
        socketId: socket.id,
        friends: user.friends,
      });
    }
  });

  // Menangani event 'disconnect'
  socket.on("disconnect", () => {
    const data = users.find((user) => user.socketId === socket.id);
    // Menghapus pengguna yang terputus dari array
    users = users.filter((user) => user.socketId !== socket.id);
  });

  //========================================= Route Friend =====================================================================
  //===========UPDATE RECEIVER SEND REQUEST Friend
  socket.on("update-receiver", (updatedUser) => {
    const user = users.find((user) => user.id === updatedUser._id);
    user &&
      socket
        .to(`${user.socketId}`)
        .emit("update-receiver-toclient", updatedUser);
  });
  //===========UPDATE RECEIVER CANCEL REQUEST Friend
  socket.on("update-receiver-cancel", (updatedUser) => {
    const user = users.find((user) => user.id === updatedUser._id);
    user &&
      socket
        .to(`${user.socketId}`)
        .emit("update-receiver-cancel-toclient", updatedUser);
  });
  //===========UPDATE SENDER ACCEPT REQUEST Friend
  socket.on("update-sender-accept", (updatedUser) => {
    const user = users.find((user) => user.id === updatedUser._id);
    user &&
      socket
        .to(`${user.socketId}`)
        .emit("update-sender-accept-toclient", updatedUser);
  });
  //===========UPDATE SENDER REJECT REQUEST Friend
  socket.on("update-sender-reject", (updatedUser) => {
    const user = users.find((user) => user.id === updatedUser._id);
    user &&
      socket
        .to(`${user.socketId}`)
        .emit("update-sender-reject-toclient", updatedUser);
  });
  //===========UPDATE RECEIVER DELETE  Friend
  socket.on("delete-friend", (updatedUser) => {
    const user = users.find((user) => user.id === updatedUser._id);
    user &&
      socket.to(`${user.socketId}`).emit("delete-friend-toclient", updatedUser);
  });

  //==========================================Route conversation message====================================================================
  //===========add conversation

  //===========Send Message
  socket.on("send-message", (message) => {
    const user = users.find((user) => user.id === message?.message?.recipient);

    user &&
      socket.to(`${user.socketId}`).emit("send-message-toclient", message);
  });
  //===========delete Message
  socket.on("delete-message", ({ messageId, recipient }) => {
    const user = users.find((user) => user.id === recipient);

    user &&
      socket
        .to(`${user.socketId}`)
        .emit("delete-message-toclient", { messageId });
  });
};

export default SocketServer;
