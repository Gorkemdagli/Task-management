const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { auth, adminOnly } = require('../middleware/auth');
const mongoose = require('mongoose');
const User = require('../models/User');

// Çift gönderimi önlemek için son istekleri tutan cache
const recentTaskRequests = new Map();

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Yeni görev oluştur
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       201:
 *         description: Görev başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkilendirme hatası
 */
router.post('/', auth, async (req, res, next) => {
    try {
        const { title, description, status, priority, teamId, assignees, assigneeId, dueDate } = req.body;
        
        // Zorunlu alanları kontrol et
        if (!title || !teamId) {
            const error = new Error('Başlık ve takım ID\'si zorunludur');
            error.statusCode = 400;
            throw error;
        }
        
        // Çift gönderimi önleme - aynı kullanıcının aynı özelliklere sahip görevi 5 saniye içinde oluşturmasını engelle
        const requestKey = `${req.user._id}-${title}-${teamId}`;
        const now = Date.now();
        
        // Son 5 saniye içinde aynı istek yapıldıysa, işlemi engelle
        if (recentTaskRequests.has(requestKey)) {
            const lastRequestTime = recentTaskRequests.get(requestKey);
            if (now - lastRequestTime < 5000) { // 5 saniye
                return res.status(200).json({ 
                    message: 'Bu görev zaten oluşturuldu',
                    isDuplicate: true
                });
            }
        }
        
        // İsteği kaydet
        recentTaskRequests.set(requestKey, now);
        
        // 5 dakika sonra cache'ten temizle
        setTimeout(() => {
            recentTaskRequests.delete(requestKey);
        }, 300000); // 5 dakika
        
        // Kullanıcının takım üyesi olup olmadığını kontrol et
        const user = await User.findById(req.user._id);
        if (!user.teams.includes(teamId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bu takıma görev oluşturma yetkiniz yok' });
        }
        
        // Yeni görev oluştur
        const task = new Task({
            title,
            description: description || '',
            status: status || 'todo',
            priority: priority || 'medium',
            team: teamId,
            creator: req.user._id,
            assignees: [] // Başlangıçta boş bir atanmış kişiler dizisi
        });
        
        // Atanan kişileri ekle (assignees dizisinden gelen)
        if (assignees && Array.isArray(assignees) && assignees.length > 0) {
            task.assignees = [...new Set(assignees)]; // Tekrarları önle
        }
        // Eski yöntem uyumluluğu için assigneeId kontrolü
        else if (assigneeId) {
            task.assignees = [assigneeId];
        }
        
        // Eğer hiç atanan kişi yoksa, uyarı ver
        if (task.assignees.length === 0) {
            // Konsol log kaydını kaldırdım
        }
        
        // Son tarih belirtilmişse ekle
        if (dueDate) {
            task.dueDate = dueDate;
        }
        
        await task.save();
        
        // Görev bilgilerini tam olarak döndür
        const populatedTask = await Task.findById(task._id).populate(['assignees', 'creator']);
        res.status(201).json(populatedTask);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Görevleri listele
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *         required: false
 *         description: Takım ID'si (opsiyonel)
 *     responses:
 *       200:
 *         description: Görevler başarıyla listelendi
 */
router.get('/', auth, async (req, res, next) => {
    try {
        let query = {};
        
        // Admin kullanıcılar için filtre seçenekleri
        if (req.user.role === 'admin') {
            // Takım filtresini kontrol et
            if (req.query.teamId) {
                query.team = req.query.teamId;
            }
        } else {
            // Normal kullanıcılar sadece kendilerine atanmış görevleri görebilir
            query.assignees = req.user._id;
            
            // Ek olarak takım filtresi varsa ekleyelim
            if (req.query.teamId) {
                query.team = req.query.teamId;
            }
        }
        
        const tasks = await Task.find(query)
            .populate(['assignees', 'creator'])
            .sort({ createdAt: -1 });
            
        res.json(tasks);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Belirli bir görevi getir
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Görev ID'si
 *     responses:
 *       200:
 *         description: Görev başarıyla getirildi
 *       404:
 *         description: Görev bulunamadı
 */
router.get('/:id', auth, async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate(['assignees', 'creator']);
        if (!task) {
            const error = new Error('Görev bulunamadı');
            error.statusCode = 404;
            throw error;
        }
        await task.incrementViews();
        res.json(task);
    } catch (error) {
        if (error.name === 'CastError') {
            error.message = 'Görev bulunamadı';
            error.statusCode = 404;
        }
        next(error);
    }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Görevi güncelle
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Görev ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       200:
 *         description: Görev başarıyla güncellendi
 *       404:
 *         description: Görev bulunamadı
 */
router.put('/:id', auth, adminOnly, async (req, res) => {
    try {
        const updates = {};
        const allowedUpdates = ['title', 'description', 'priority', 'dueDate'];
        
        allowedUpdates.forEach(update => {
            if (req.body[update] !== undefined) {
                updates[update] = req.body[update];
            }
        });
        
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).populate(['assignees', 'creator']);
        
        if (!task) {
            return res.status(404).json({ message: 'Görev bulunamadı' });
        }
        
        res.json(task);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(404).json({ message: 'Görev bulunamadı' });
        }
        res.status(400).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   put:
 *     summary: Görev durumunu güncelle
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Görev ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [todo, doing, done]
 *     responses:
 *       200:
 *         description: Görev durumu başarıyla güncellendi
 *       404:
 *         description: Görev bulunamadı
 */
router.put('/:id/status', auth, async (req, res) => {
    try {
        if (!['todo', 'doing', 'done'].includes(req.body.status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        // Önce görevi bul
        const task = await Task.findById(req.params.id).populate(['assignees', 'creator']);
        
        if (!task) {
            return res.status(404).json({ message: 'Görev bulunamadı' });
        }
        
        // Kullanıcı admin değilse ve göreve atanmamışsa erişimi reddet
        const isAssigned = task.assignees.some(assignee => assignee._id.toString() === req.user._id.toString());
        
        if (req.user.role !== 'admin' && !isAssigned) {
            return res.status(403).json({ message: 'Bu görevi güncelleme yetkiniz yok. Sadece atanmış kullanıcılar ve admin kullanıcılar görev durumunu değiştirebilir.' });
        }

        // Durumu güncelle
        task.status = req.body.status;
        await task.save();
        
        res.json(task);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(404).json({ message: 'Görev bulunamadı' });
        }
        res.status(400).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/tasks/{id}/assignees:
 *   put:
 *     summary: Görev atamalarını güncelle
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Görev ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [add, remove, set]
 *                 description: Yapılacak işlem. 'add' yeni görevli ekler, 'remove' görevliyi çıkarır, 'set' görevli listesini tamamen değiştirir
 *               assigneeId:
 *                 type: string
 *                 description: Eklenecek/çıkarılacak görevli ID'si (action=add veya action=remove için)
 *               email:
 *                 type: string
 *                 description: Eklenecek görevlinin e-posta adresi (action=add için)
 *               assignees:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Görev atanacak kullanıcı ID'leri dizisi (action=set için)
 *     responses:
 *       200:
 *         description: Görev atamaları başarıyla güncellendi
 *       404:
 *         description: Görev veya kullanıcı bulunamadı
 */
router.put('/:id/assignees', auth, adminOnly, async (req, res) => {
    try {
        // Konsol log kaydını kaldırdım
        
        // Önce görevi bul
        const task = await Task.findById(req.params.id).populate(['assignees', 'creator']);
        
        if (!task) {
            return res.status(404).json({ message: 'Görev bulunamadı' });
        }
        
        // İşlem türüne göre farklı işlemler yap
        if (req.body.action === 'add') {
            // E-posta ile kullanıcı ekleme
            if (req.body.email) {
                // E-posta adresini küçük harfe çevir ve büyük/küçük harf duyarsız ara
                const email = req.body.email.toLowerCase();
                const user = await User.findOne({ 
                    email: { $regex: new RegExp('^' + email + '$', 'i') } 
                });
                
                if (!user) {
                    return res.status(404).json({ message: 'Bu e-posta adresine sahip kullanıcı bulunamadı' });
                }
                
                // Kullanıcı zaten atanmışsa ekleme
                if (!task.assignees.some(assignee => assignee._id.toString() === user._id.toString())) {
                    task.assignees.push(user._id);
                } else {
                    return res.status(400).json({ message: 'Bu kullanıcı zaten göreve atanmış' });
                }
            } 
            // ID ile kullanıcı ekleme
            else if (req.body.assigneeId) {
                const user = await User.findById(req.body.assigneeId);
                if (!user) {
                    return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
                }
                
                // Kullanıcı zaten atanmışsa ekleme
                if (!task.assignees.some(assignee => assignee._id.toString() === user._id.toString())) {
                    task.assignees.push(user._id);
                } else {
                    return res.status(400).json({ message: 'Bu kullanıcı zaten göreve atanmış' });
                }
            }
            else {
                return res.status(400).json({ message: 'Kullanıcı ID\'si veya e-posta adresi gerekli' });
            }
        } 
        // Kullanıcı çıkarma
        else if (req.body.action === 'remove') {
            if (!req.body.assigneeId) {
                return res.status(400).json({ message: 'Çıkarılacak kullanıcı ID\'si gerekli' });
            }
            
            // Görevin oluşturucusu çıkarılamaz
            if (task.creator._id.toString() === req.body.assigneeId) {
                return res.status(400).json({ message: 'Görevin oluşturucusu görevden çıkarılamaz' });
            }
            
            task.assignees = task.assignees.filter(assignee => 
                assignee._id.toString() !== req.body.assigneeId
            );
        } 
        // Atanan kullanıcıları tamamen değiştirme (set)
        else if (req.body.action === 'set') {
            if (!req.body.assignees || !Array.isArray(req.body.assignees)) {
                return res.status(400).json({ message: 'Atanacak kullanıcı ID\'leri dizisi gerekli' });
            }
            
            // Görevli listesinde mutlaka görevin oluşturucusu bulunmalı
            if (!req.body.assignees.includes(task.creator._id.toString())) {
                req.body.assignees.push(task.creator._id.toString());
            }
            
            // Tüm kullanıcı ID'leri geçerli mi kontrol et
            for (const userId of req.body.assignees) {
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    return res.status(400).json({ message: `Geçersiz kullanıcı ID formatı: ${userId}` });
                }
                
                // Kullanıcının var olduğunu kontrol et
                const userExists = await User.exists({ _id: userId });
                if (!userExists) {
                    return res.status(404).json({ message: `ID'si ${userId} olan kullanıcı bulunamadı` });
                }
            }
            
            task.assignees = req.body.assignees;
        } else {
            return res.status(400).json({ message: 'Geçersiz işlem. add, remove veya set olmalı' });
        }
        
        // Değişiklikleri kaydet
        await task.save();
        
        // Güncellenmiş görevi döndür
        await task.populate(['assignees', 'creator']);
        res.json(task);
    } catch (error) {
        console.error("Görev atama güncelleme hatası:", error);
        if (error.name === 'CastError') {
            return res.status(404).json({ message: 'Görev bulunamadı' });
        }
        res.status(400).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Görevi sil
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Görev ID'si
 *     responses:
 *       200:
 *         description: Görev başarıyla silindi
 *       404:
 *         description: Görev bulunamadı
 */
router.delete('/:id', auth, adminOnly, async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Görev bulunamadı' });
        }
        res.json({ message: 'Görev başarıyla silindi' });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(404).json({ message: 'Görev bulunamadı' });
        }
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 