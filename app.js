const express = require('express');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Statik dosyalar için 'public' klasörü

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Multer Setup for File Upload
const upload = multer({ dest: 'uploads/' });

// Function to Parse CSV Files
const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const data = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                data.push(row);
            })
            .on('end', () => {
                resolve(data);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

// Routes
app.get('/', (req, res) => {
    res.render('index', {
        message: null,
        nonFollowers: null,
        notFollowingBack: null,
    });
});

app.post('/upload', upload.fields([{ name: 'following' }, { name: 'followers' }]), async (req, res) => {
    if (!req.files || !req.files.following || !req.files.followers) {
        return res.render('index', {
            message: { type: 'error', text: 'Lütfen her iki dosyayı da yükleyin!' },
            nonFollowers: null
        });
    }

    try {
        // Dosyaları işle
        const followingFile = req.files.following[0].path;
        const followersFile = req.files.followers[0].path;

        const followingData = await parseCSV(followingFile);
        const followersData = await parseCSV(followersFile);

        // Kullanıcıları analiz et
        const followingList = followingData.map((row) => row['Username']);
        const followersList = followersData.map((row) => row['Username']);
        const nonFollowers = followingList.filter((user) => !followersList.includes(user));

        res.render('index', {
            message: { type: 'success', text: 'Analiz başarılı! Takip etmeyen kullanıcılar listelendi.' },
            nonFollowers
        });
    } catch (error) {
        console.error('Error processing files:', error);
        res.render('index', {
            message: { type: 'error', text: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
            nonFollowers: null
        });
    }
});



// Server Listener
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
