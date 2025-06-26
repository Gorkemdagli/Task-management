const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const Team = require('../models/Team');
const Task = require('../models/Task');

// Middleware to check if user is authenticated
const checkAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Decoded token bilgilerini doğrudan req.user olarak ata
            // Bu sayede view'larda direkt bu değerlere erişebiliriz
            req.user = decoded;
            
            // Eğer role değeri yoksa, veritabanından kullanıcıyı çekmeyi deneyebiliriz
            if (!decoded.role && decoded._id) {
                User.findById(decoded._id)
                    .then(user => {
                        if (user) {
                            req.user.role = user.role;
                        }
                        next();
                    })
                    .catch(err => {
                        next();
                    });
            } else {
                next();
            }
        } catch (err) {
            res.clearCookie('token');
            next();
        }
    } else {
        next();
    }
};

// Ana sayfa
router.get('/', checkAuth, (req, res) => {
    if (req.user) {
        return res.redirect('/main');
    }
    res.render('pages/home', {
        title: 'Ana Sayfa',
        user: req.user,
        script: ''
    });
});

// Main sayfası (giriş yapmış kullanıcılar için)
router.get('/main', checkAuth, (req, res) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }
    res.render('pages/main', {
        title: 'Görev Paneli',
        user: req.user,
        script: 'main.js'
    });
});

// Giriş sayfası
router.get('/auth/login', checkAuth, (req, res) => {
    if (req.user) {
        // Eğer bir redirect parametresi varsa oraya yönlendir
        if (req.query.redirect) {
            return res.redirect(req.query.redirect);
        }
        return res.redirect('/');
    }
    res.render('pages/login', {
        title: 'Giriş Yap',
        user: null,
        registered: req.query.registered === 'true',
        redirect: req.query.redirect || null,
        script: ''
    });
});

// Giriş sayfası alternatif yol
router.get('/login', checkAuth, (req, res) => {
    if (req.user) {
        // Eğer bir redirect parametresi varsa oraya yönlendir
        if (req.query.redirect) {
            return res.redirect(req.query.redirect);
        }
        return res.redirect('/');
    }
    res.render('pages/login', {
        title: 'Giriş Yap',
        user: null,
        registered: req.query.registered === 'true',
        redirect: req.query.redirect || null,
        script: ''
    });
});

// Kayıt sayfası
router.get('/auth/register', checkAuth, (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    res.render('pages/register', {
        title: 'Kayıt Ol',
        user: null,
        script: ''
    });
});

// Kayıt sayfası alternatif yol
router.get('/pages/register', checkAuth, (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    res.render('pages/register', {
        title: 'Kayıt Ol',
        user: null,
        script: ''
    });
});

// Çıkış işlemi
router.post('/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/pages/login');
});

// Login form submit - auth yolu
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password, redirect } = req.body;
        
        // E-posta kontrolü
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('pages/login', {
                title: 'Giriş Yap',
                user: null,
                error: 'E-posta veya şifre hatalı',
                script: ''
            });
        }

        // Şifre kontrolü
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('pages/login', {
                title: 'Giriş Yap',
                user: null,
                error: 'E-posta veya şifre hatalı',
                script: ''
            });
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

        // Eğer bir redirect değeri varsa oraya, yoksa ana sayfaya yönlendir
        if (redirect) {
            return res.redirect(redirect);
        }
        return res.redirect('/main');
    } catch (error) {
        res.render('pages/login', {
            title: 'Giriş Yap',
            user: null,
            error: 'Bir hata oluştu',
            script: ''
        });
    }
});

// Login form submit - pages yolu 
router.post('/pages/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // E-posta kontrolü
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('pages/login', {
                title: 'Giriş Yap',
                user: null,
                error: 'E-posta veya şifre hatalı',
                script: ''
            });
        }

        // Şifre kontrolü
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('pages/login', {
                title: 'Giriş Yap',
                user: null,
                error: 'E-posta veya şifre hatalı',
                script: ''
            });
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

        res.redirect('/main');
    } catch (error) {
        res.render('pages/login', {
            title: 'Giriş Yap',
            user: null,
            error: 'Bir hata oluştu',
            script: ''
        });
    }
});

// Register form submit - auth yolu
router.post('/auth/register', async (req, res) => {
    try {
        const { fullName, username, email, password, confirmPassword } = req.body;
        
        // Parola kontrolü
        if (password !== confirmPassword) {
            return res.render('pages/register', {
                title: 'Kayıt Ol',
                user: null,
                error: 'Parolalar eşleşmiyor',
                script: ''
            });
        }
        
        // Kullanıcı var mı kontrolü
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.render('pages/register', {
                title: 'Kayıt Ol',
                user: null,
                error: 'Bu e-posta veya kullanıcı adı zaten kullanılıyor',
                script: ''
            });
        }
        
        // Yeni kullanıcı oluştur
        const user = new User({
            name: fullName,
            username,
            email,
            password
        });
        
        await user.save();
        
        res.redirect('/pages/login?registered=true');
    } catch (error) {
        res.render('pages/register', {
            title: 'Kayıt Ol',
            user: null,
            error: 'Kayıt olurken bir hata oluştu',
            script: ''
        });
    }
});

// Register form submit - pages yolu
router.post('/pages/register', async (req, res) => {
    try {
        const { fullName, username, email, password, confirmPassword } = req.body;
        
        // Parola kontrolü
        if (password !== confirmPassword) {
            return res.render('pages/register', {
                title: 'Kayıt Ol',
                user: null,
                error: 'Parolalar eşleşmiyor',
                script: ''
            });
        }
        
        // Kullanıcı var mı kontrolü
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.render('pages/register', {
                title: 'Kayıt Ol',
                user: null,
                error: 'Bu e-posta veya kullanıcı adı zaten kullanılıyor',
                script: ''
            });
        }
        
        // Yeni kullanıcı oluştur
        const user = new User({
            name: fullName,
            username,
            email,
            password
        });
        
        await user.save();
        
        res.redirect('/pages/login?registered=true');
    } catch (error) {
        res.render('pages/register', {
            title: 'Kayıt Ol',
            user: null,
            error: 'Kayıt olurken bir hata oluştu',
            script: ''
        });
    }
});

// Profil sayfası
router.get('/profile', auth, (req, res) => {
    res.render('pages/profile', {
        title: 'Profil',
        user: req.user,
        script: ''
    });
});

// Takımlar sayfası
router.get('/teams', checkAuth, async (req, res, next) => {
    try {
        if (!req.user) {
            return res.redirect('/pages/login');
        }
        
        // Admin kontrolünü kaldırdık, artık tüm kullanıcılar erişebilir
        
        res.render('pages/teams', {
            title: 'Takımlar',
            user: req.user,
            script: 'teams.js'
        });
    } catch (error) {
        next(error);
    }
});

// Takım detay sayfası
router.get('/teams/:id', checkAuth, async (req, res, next) => {
    try {
        if (!req.user) {
            return res.redirect('/pages/login');
        }
        
        const team = await Team.findById(req.params.id).populate('members').populate('owner');
        
        if (!team) {
            const error = new Error('Takım bulunamadı');
            error.statusCode = 404;
            throw error;
        }
        
        res.render('pages/team-detail', {
            title: team.name,
            user: req.user,
            team: team,
            script: ''
        });
    } catch (error) {
        next(error);
    }
});

// Admin kullanıcı yönetimi sayfası
router.get('/admin/users', checkAuth, async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    
    // Sadece admin yetkisine sahip kullanıcıların erişimi
    if (req.user.role !== 'admin') {
        return res.status(403).render('pages/admin-users', {
            title: 'Kullanıcı Yönetimi',
            user: req.user,
            script: ''
        });
    }
    
    res.render('pages/admin-users', {
        title: 'Kullanıcı Yönetimi',
        user: req.user,
        script: ''
    });
});

// Görevler sayfası
router.get('/tasks', checkAuth, async (req, res, next) => {
    try {
        if (!req.user) {
            return res.redirect('/pages/login');
        }

        res.render('pages/tasks', {
            title: 'Görevler',
            user: req.user,
            script: 'tasks.js'
        });
    } catch (error) {
        next(error);
    }
});

// Görev detay sayfası
router.get('/tasks/:id', checkAuth, async (req, res, next) => {
    try {
        if (!req.user) {
            return res.redirect('/pages/login');
        }
        
        const taskId = req.params.id;
        
        // Görevi ve ilişkili verileri getir
        const task = await Task.findById(taskId)
            .populate({
                path: 'assignees',
                select: 'name email avatar _id'
            })
            .populate('creator')
            .populate('team');
        
        if (!task) {
            const error = new Error('Görev bulunamadı');
            error.statusCode = 404;
            throw error;
        }
        
        // Görüntülenme sayısını artır
        await task.incrementViews();
        
        res.render('pages/task-detail', {
            title: task.title,
            user: req.user,
            task,
            script: ''
        });
    } catch (error) {
        next(error);
    }
});

// Yeni giriş sayfası rotası (basitleştirilmiş URL)
router.get('/login', checkAuth, (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    res.render('pages/login', {
        title: 'Giriş Yap',
        user: null,
        registered: req.query.registered === 'true',
        script: ''
    });
});

// Yeni kayıt sayfası rotası (basitleştirilmiş URL)
router.get('/register', checkAuth, (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    res.render('pages/register', {
        title: 'Kayıt Ol',
        user: null,
        script: ''
    });
});

// Yeni çıkış işlemi rotası (basitleştirilmiş URL)
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

// Yeni login form submit işlemi (basitleştirilmiş URL)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // E-posta kontrolü
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('pages/login', {
                title: 'Giriş Yap',
                user: null,
                error: 'E-posta veya şifre hatalı',
                script: ''
            });
        }

        // Şifre kontrolü
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('pages/login', {
                title: 'Giriş Yap',
                user: null,
                error: 'E-posta veya şifre hatalı',
                script: ''
            });
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

        res.redirect('/main');
    } catch (error) {
        res.render('pages/login', {
            title: 'Giriş Yap',
            user: null,
            error: 'Bir hata oluştu',
            script: ''
        });
    }
});

// Yeni register form submit işlemi (basitleştirilmiş URL)
router.post('/register', async (req, res) => {
    try {
        const { fullName, username, email, password, confirmPassword } = req.body;
        
        // Parola kontrolü
        if (password !== confirmPassword) {
            return res.render('pages/register', {
                title: 'Kayıt Ol',
                user: null,
                error: 'Parolalar eşleşmiyor',
                script: ''
            });
        }
        
        // Kullanıcı var mı kontrolü
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.render('pages/register', {
                title: 'Kayıt Ol',
                user: null,
                error: 'Bu e-posta veya kullanıcı adı zaten kullanılıyor',
                script: ''
            });
        }
        
        // Yeni kullanıcı oluştur
        const user = new User({
            name: fullName,
            username,
            email,
            password
        });
        
        await user.save();
        
        res.redirect('/login?registered=true');
    } catch (error) {
        res.render('pages/register', {
            title: 'Kayıt Ol',
            user: null,
            error: 'Kayıt olurken bir hata oluştu',
            script: ''
        });
    }
});

// Hata sayfası
router.get('/error', (req, res) => {
    res.render('pages/error', {
        title: 'Hata',
        error: req.query.message || 'Bir hata oluştu',
        status: req.query.status || 500,
        user: req.user,
        script: ''
    });
});

module.exports = router; 