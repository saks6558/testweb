const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve frontend files

// Configure Multer for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'public/uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Database File Path
const DB_FILE = path.join(__dirname, 'data', 'products.json');

// Ensure DB file exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, '[]');
}

// Helper to read/write DB(mock)
const readDB = () => JSON.parse(fs.readFileSync(DB_FILE));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));


// --- API Routes ---

// GET All Products
app.get('/api/products', (req, res) => {
    try {
        const products = readDB();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read database' });
    }
});

// POST New Product (with Image)
app.post('/api/products', upload.single('image'), (req, res) => {
    try {
        const products = readDB();
        const { name, category, description } = req.body;

        let imagePath = '';
        if (req.file) {
            imagePath = 'uploads/' + req.file.filename;
        }

        const newProduct = {
            id: Date.now(),
            name,
            category,
            description,
            image: imagePath || 'https://via.placeholder.com/300'
        };

        products.push(newProduct);
        writeDB(products);

        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: 'Failed to save product' });
    }
});

// DELETE Product
app.delete('/api/products/:id', (req, res) => {
    try {
        let products = readDB();
        const id = parseInt(req.params.id);

        // Optional: Delete image file if exists (skipped for simplicity)

        products = products.filter(p => p.id !== id);
        writeDB(products);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
