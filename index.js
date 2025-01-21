const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let userSSID = "DefaultSSID"; // SSID الافتراضي
let userPassword = "DefaultPassword"; // Password الافتراضي

// Middleware لتحليل JSON
app.use(bodyParser.json());

// Middleware لتحليل البيانات المرسلة عبر النموذج (Form Data)
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware لتمكين CORS
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'static')));

// مسار لتحديث بيانات Wi-Fi
app.post('/update-wifi', (req, res) => {
    const { ssid, password } = req.body;

    if (ssid && password) {
        if (ssid !== userSSID || password !== userPassword) {
            userSSID = ssid;
            userPassword = password;
            console.log("[SERVER] Updated Wi-Fi settings:", userSSID, userPassword);
            res.status(200).send('Wi-Fi settings updated successfully.');
        } else {
            console.log("[SERVER] No changes detected. Ignoring request.");
            res.status(200).send('No changes detected.');
        }
    } else {
        console.log("[SERVER] No Wi-Fi data received.");
        res.status(400).send('No Wi-Fi data received.');
    }
});

// مسار لإرسال بيانات Wi-Fi إلى ESP32
app.get('/get-wifi', (req, res) => {
    const wifiData = `${userSSID}:${userPassword}`;
    console.log("[SERVER] Sending Wi-Fi data to ESP32:", wifiData);
    res.send(wifiData);
});

// مسار لاستقبال بيانات أجهزة الاستشعار
app.post('/data', (req, res) => {
    const data = req.body;
    if (!data) {
        return res.status(400).send('No data received');
    }
    console.log("Received data:", data);
    io.emit('data', data); // إرسال البيانات إلى جميع العملاء
    res.sendStatus(200);
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A client connected');
    socket.on('disconnect', () => {
        console.log('A client disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});