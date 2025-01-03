const express = require('express');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');

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

// Routes
app.get('/', (req, res) => {
    res.render('index', { message: null });
});

app.post('/upload', upload.fields([{ name: 'following' }, { name: 'followers' }]), (req, res) => {
    if (!req.files || !req.files.following || !req.files.followers) {
        return res.render('index', { message: 'Lütfen her iki dosyayı da yükleyin!' });
    }

    // Dosya yükleme başarılı olduğunda işleme yönlendirileceğiz.
    res.send('Dosyalar başarıyla yüklendi! İşleme devam edilecek...');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
