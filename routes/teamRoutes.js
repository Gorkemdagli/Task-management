const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const { auth, adminOnly } = require('../middleware/auth');
const User = require('../models/User');

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Yeni takım oluştur
 *     tags: [Teams]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Team'
 *     responses:
 *       201:
 *         description: Takım başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkilendirme hatası
 */
router.post('/', auth, adminOnly, async (req, res, next) => {
    try {
        const { name, description } = req.body;
        
        // Takım adı kontrolü
        if (!name || name.trim() === '') {
            const error = new Error('Takım adı gereklidir');
            error.statusCode = 400;
            throw error;
        }
        
        // Yeni takım oluştur
        const team = new Team({
            name,
            description,
            owner: req.user._id,
            members: [req.user._id] // Oluşturan kişi otomatik olarak üye olsun
        });
        
        await team.save();
        
        // Takımı oluşturan kullanıcının teams dizisine ekle
        await User.findByIdAndUpdate(
            req.user._id,
            { $addToSet: { teams: team._id } }
        );
        
        res.status(201).json(team);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Tüm takımları listele
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Takımlar başarıyla listelendi
 */
router.get('/', auth, async (req, res, next) => {
    try {
        // Tüm takımları getir
        const teams = await Team.find();
        res.json(teams);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/teams/{id}:
 *   get:
 *     summary: Belirli bir takımı getir
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Takım başarıyla getirildi
 *       404:
 *         description: Takım bulunamadı
 */
router.get('/:id', auth, async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            const error = new Error('Takım bulunamadı');
            error.statusCode = 404;
            throw error;
        }
        res.json(team);
    } catch (error) {
        if (error.name === 'CastError') {
            error.message = 'Geçersiz takım ID format';
            error.statusCode = 400;
        }
        next(error);
    }
});

/**
 * @swagger
 * /api/teams/{id}:
 *   put:
 *     summary: Takım bilgilerini güncelle
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Team'
 *     responses:
 *       200:
 *         description: Takım başarıyla güncellendi
 *       404:
 *         description: Takım bulunamadı
 */
router.put('/:id', auth, adminOnly, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: 'Takım bulunamadı' });
        }
        // Admin herhangi bir takımı düzenleyebilir
        const updates = {};
        if (req.body.name) updates.name = req.body.name;
        if (req.body.description) updates.description = req.body.description;
        if (req.body.avatar) updates.avatar = req.body.avatar;

        const updatedTeam = await Team.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true }
        );
        res.json(updatedTeam);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/teams/{id}/members:
 *   post:
 *     summary: Takıma üye ekle
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Üye başarıyla eklendi
 *       404:
 *         description: Takım veya kullanıcı bulunamadı
 */
router.post('/:id/members', auth, adminOnly, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: 'Takım bulunamadı' });
        }
        
        const userId = req.body.userId;
        if (!userId) {
            return res.status(400).json({ message: 'Kullanıcı ID\'si gereklidir' });
        }
        
        // Kullanıcı mevcut mu kontrol et
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }
        
        // Kullanıcı zaten takımda mı kontrol et
        if (team.members.includes(userId)) {
            return res.status(400).json({ message: 'Kullanıcı zaten bu takımın üyesi' });
        }
        
        // Takıma üye ekle
        team.members.push(userId);
        await team.save();
        
        // Kullanıcının teams bilgisini güncelle
        if (!user.teams) {
            user.teams = [];
        }
        if (!user.teams.includes(team._id)) {
            user.teams.push(team._id);
            await user.save();
        }
        
        res.json(team);
    } catch (error) {
        console.error('Takıma üye ekleme hatası:', error);
        res.status(400).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/teams/{id}/members/{userId}:
 *   delete:
 *     summary: Takımdan üye çıkar
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Üye başarıyla çıkarıldı
 *       404:
 *         description: Takım bulunamadı
 */
router.delete('/:id/members/:userId', auth, adminOnly, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: 'Takım bulunamadı' });
        }
        
        const userId = req.params.userId;
        
        // Takım sahibini çıkarmaya çalışıyorsa engelle
        if (team.owner.toString() === userId) {
            return res.status(400).json({ message: 'Takım sahibi takımdan çıkarılamaz' });
        }
        
        // Kullanıcı takımda mı kontrol et
        if (!team.members.includes(userId)) {
            return res.status(400).json({ message: 'Kullanıcı bu takımın üyesi değil' });
        }
        
        // Takımdan üye çıkar
        team.members = team.members.filter(member => member.toString() !== userId);
        await team.save();
        
        // Kullanıcının teams bilgisini güncelle
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (user && user.teams) {
            user.teams = user.teams.filter(t => t.toString() !== team._id.toString());
            await user.save();
        }
        
        res.json(team);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin' });
    }
});

/**
 * @swagger
 * /api/teams/{id}:
 *   delete:
 *     summary: Takımı sil
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Takım başarıyla silindi
 *       404:
 *         description: Takım bulunamadı
 */
router.delete('/:id', auth, adminOnly, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: 'Takım bulunamadı' });
        }
        // Admin herhangi bir takımı silebilir
        await Team.findByIdAndDelete(req.params.id);
        res.json({ message: 'Takım başarıyla silindi' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id/tasks', async (req, res) => {
  // Takıma ait görevleri listeleme
});

/**
 * @swagger
 * /api/teams/{id}/members/details:
 *   get:
 *     summary: Takım üyelerinin detaylarını getir
 *     tags: [Teams]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Takım üyeleri başarıyla getirildi
 *       404:
 *         description: Takım bulunamadı
 */
router.get('/:id/members/details', auth, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: 'Takım bulunamadı' });
        }
        
        // Üye ID'leri boşsa boş array döndür
        if (!team.members || team.members.length === 0) {
            return res.json([]);
        }
        
        // Üyelerin detaylarını getir
        const User = require('../models/User');
        const members = await User.find({ 
            '_id': { $in: team.members } 
        }).select('_id name email');
        
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin' });
    }
});

module.exports = router; 