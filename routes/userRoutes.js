const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Yeni kullanıcı kaydı
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Kullanıcı başarıyla kaydedildi
 *       400:
 *         description: Geçersiz istek
 */
router.post('/register', async (req, res) => {
    try {
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            name: req.body.name
        });
        
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Kullanıcı girişi
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Giriş başarılı
 *       401:
 *         description: Geçersiz kimlik bilgileri
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Gerekli alanların kontrolü
        if (!email || !password) {
            return res.status(400).json({ message: 'E-posta ve şifre gereklidir' });
        }

        // E-posta kontrolü
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'E-posta veya şifre hatalı' });
        }

        // Şifre kontrolü
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'E-posta veya şifre hatalı' });
        }

        // JWT token oluştur
        const token = jwt.sign(
            { _id: user._id, name: user.name, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Token'ı cookie olarak kaydet
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 1 gün
        });

        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Kullanıcı profili görüntüleme
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcı profili başarıyla getirildi
 *       401:
 *         description: Yetkilendirme hatası
 */
router.get('/profile', auth, async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Kullanıcı profili güncelleme
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil başarıyla güncellendi
 *       401:
 *         description: Yetkilendirme hatası
 */
router.put('/profile', auth, async (req, res) => {
    try {
        const updates = {};
        if (req.body.name) {
            if (req.body.name.trim() === '') {
                return res.status(400).json({ message: 'Name cannot be empty' });
            }
            updates.name = req.body.name.trim();
        }
        if (req.body.avatar) {
            if (!req.body.avatar.match(/^https?:\/\/.+/)) {
                return res.status(400).json({ message: 'Invalid avatar URL' });
            }
            updates.avatar = req.body.avatar;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No valid updates provided' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true }
        );
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/users/teams:
 *   get:
 *     summary: Kullanıcının takımlarını listeleme
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcının takımları başarıyla listelendi
 *       401:
 *         description: Yetkilendirme hatası
 */
router.get('/teams', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('teams');
        res.json(user.teams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/users/{id}/make-admin:
 *   put:
 *     summary: Kullanıcıya admin yetkisi ver (sadece admin kullanıcılar için)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Admin yapılacak kullanıcının ID'si
 *     responses:
 *       200:
 *         description: Kullanıcı başarıyla admin yapıldı
 *       401:
 *         description: Yetkilendirme hatası
 *       403:
 *         description: Yetki hatası, bu işlem için admin yetkisi gerekiyor
 *       404:
 *         description: Kullanıcı bulunamadı
 */
router.put('/:id/make-admin', auth, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }
        
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Kullanıcı zaten admin' });
        }
        
        user.role = 'admin';
        await user.save();
        
        res.json({ message: 'Kullanıcı başarıyla admin yapıldı', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Kullanıcıyı sil (sadece admin kullanıcılar için)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Silinecek kullanıcının ID'si
 *     responses:
 *       200:
 *         description: Kullanıcı başarıyla silindi
 *       400:
 *         description: Geçersiz istek, kendi kullanıcınızı silemezsiniz
 *       401:
 *         description: Yetkilendirme hatası
 *       403:
 *         description: Yetki hatası, bu işlem için admin yetkisi gerekiyor
 *       404:
 *         description: Kullanıcı bulunamadı
 */
router.delete('/:id', auth, adminOnly, async (req, res) => {
    try {
        // Kullanıcı kendisini silmeye çalışıyorsa engelle
        if (req.user._id.toString() === req.params.id) {
            return res.status(400).json({ message: 'Kendi kullanıcınızı silemezsiniz' });
        }
        
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }
        
        // Kullanıcıyı sil
        await User.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Kullanıcı başarıyla silindi' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Tüm kullanıcıları listele (sadece admin kullanıcılar için)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcılar başarıyla listelendi
 *       401:
 *         description: Yetkilendirme hatası
 *       403:
 *         description: Yetki hatası, bu işlem için admin yetkisi gerekiyor
 */
router.get('/', auth, adminOnly, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/users/find-by-email:
 *   post:
 *     summary: E-posta adresine göre kullanıcı ara (sadece admin kullanıcılar için)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Kullanıcı başarıyla bulundu
 *       401:
 *         description: Yetkilendirme hatası
 *       403:
 *         description: Yetki hatası, bu işlem için admin yetkisi gerekiyor
 *       404:
 *         description: Kullanıcı bulunamadı
 */
router.post('/find-by-email', auth, adminOnly, async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'E-posta adresi gereklidir' });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: 'Bu e-posta adresine sahip bir kullanıcı bulunamadı' });
        }
        
        // Sadece gerekli bilgileri döndür
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Kullanıcıları ara
 *     description: İsim veya email üzerinden kullanıcı araması yapar. Sadece admin kullanıcılar kullanabilir.
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: term
 *         required: true
 *         schema:
 *           type: string
 *         description: Arama terimi (isim veya email)
 *     responses:
 *       200:
 *         description: Bulunan kullanıcıların listesi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Kullanıcı oturum açmamış
 *       403:
 *         description: Kullanıcı admin değil
 */
router.get('/search', auth, adminOnly, async (req, res) => {
    try {
        const { term } = req.query;
        
        if (!term || term.length < 2) {
            return res.status(400).json({ message: 'Arama terimi en az 2 karakter olmalıdır' });
        }
        
        // İsim veya email ile arama yapılabilir
        const users = await User.find({
            $or: [
                { name: { $regex: term, $options: 'i' } },
                { email: { $regex: term, $options: 'i' } }
            ]
        }).select('name email role');
        
        res.json(users);
    } catch (error) {
        console.error('Kullanıcı arama hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin' });
    }
});

module.exports = router; 