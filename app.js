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
app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Multer Setup for File Upload
const upload = multer({ dest: 'uploads/' });

// Maksimum dosya boyutu: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Desteklenen dosya formatı
const ALLOWED_FILE_TYPES = ['text/csv'];

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
    res.render('index', { message: null, nonFollowers: null });
});

app.post('/upload', upload.fields([{ name: 'following' }, { name: 'followers' }]), async (req, res) => {
    if (!req.files || !req.files.following || !req.files.followers) {
        return res.render('index', { message: 'Lütfen her iki dosyayı da yükleyin!', nonFollowers: null });
    }

    const followingFile = req.files.following[0];
    const followersFile = req.files.followers[0];

    // Dosya boyutu kontrolü
    if (followingFile.size > MAX_FILE_SIZE || followersFile.size > MAX_FILE_SIZE) {
        return res.render('index', { message: 'Dosya boyutu 5 MB’yi geçemez!', nonFollowers: null });
    }

    // Dosya formatı kontrolü
    if (!ALLOWED_FILE_TYPES.includes(followingFile.mimetype) || !ALLOWED_FILE_TYPES.includes(followersFile.mimetype)) {
        return res.render('index', { message: 'Yalnızca CSV dosyalarını yükleyebilirsiniz!', nonFollowers: null });
    }

    try {
        // Parse the uploaded files
        const followingData = await parseCSV(followingFile.path);
        const followersData = await parseCSV(followersFile.path);

        // Extract usernames
        const followingList = followingData.map((row) => row['Username']);
        const followersList = followersData.map((row) => row['Username']);

        // Find non-followers
        const nonFollowers = followingList.filter((user) => !followersList.includes(user));

        // Yüklenen dosyaları temizle
        fs.unlinkSync(followingFile.path);
        fs.unlinkSync(followersFile.path);

        // Render results
        res.render('index', { message: null, nonFollowers });
    } catch (error) {
        console.error('Error processing files:', error);
        res.render('index', { message: 'Bir hata oluştu. Lütfen tekrar deneyin.', nonFollowers: null });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
