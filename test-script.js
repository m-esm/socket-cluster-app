const ws = require('ws');
const port = 3001;
const socket = new ws(`ws://localhost:${port}`, {
  headers: { Cookie: 'token=user1' },
});

socket.on('message', data => {
  console.log(`Received message`, data);
});
socket.on('open', data => {
  console.log(`Connected to port ${port}`);
});
socket.on('close', data => {
  console.log(`Disconnected from port ${port}`);
});
