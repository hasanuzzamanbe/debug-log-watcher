const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

const PORT = 9913;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

app.post('/dump', (req, res) => {
    const dumpData = req.body;
    io.emit('new-dump', dumpData);
    console.log(`Received and broadcasted a new dump at ${dumpData.time}`);
    res.status(200).send('OK');
});

io.on('connection', (socket) => {
    console.log('A viewer connected.');
    socket.on('disconnect', () => {
        console.log('A viewer disconnected.');
    });
});

server.listen(PORT, () => {
    console.log(`WP Dump Server is running on http://localhost:${PORT}`);
    console.log('Waiting for dumps...');
});