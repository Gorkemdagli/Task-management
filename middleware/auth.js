const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Token'ı önce header'dan, yoksa cookie'den al
        let token = req.header('Authorization')?.replace('Bearer ', '');
        
        // Header'da token yoksa cookie'den kontrol et
        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        
        if (!token) {
            // API isteği mi yoksa sayfa isteği mi kontrol et
            const isApiRequest = req.path.startsWith('/api/');
            
            if (isApiRequest) {
                return res.status(401).json({ message: 'Yetkilendirme hatası: Token bulunamadı' });
            } else {
                const error = new Error('Oturum açmanız gerekiyor');
                error.statusCode = 401;
                throw error;
            }
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded._id);

        if (!user) {
            const isApiRequest = req.path.startsWith('/api/');
            
            if (isApiRequest) {
                return res.status(401).json({ message: 'Yetkilendirme hatası: Kullanıcı bulunamadı' });
            } else {
                const error = new Error('Geçersiz kullanıcı oturumu');
                error.statusCode = 401;
                throw error;
            }
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        // API isteği mi yoksa sayfa isteği mi kontrol et
        const isApiRequest = req.path.startsWith('/api/');
        
        if (isApiRequest) {
            res.status(401).json({ message: 'Yetkilendirme hatası: ' + error.message });
        } else {
            error.statusCode = 401;
            next(error);
        }
    }
};

// Sadece admin rolüne sahip kullanıcılar için middleware
const adminOnly = async (req, res, next) => {
    try {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({ 
                message: 'Bu işlem için admin yetkisi gereklidir' 
            });
        }
    } catch (error) {
        res.status(403).json({ message: 'Yetki hatası: ' + error.message });
    }
};

// Swagger dokümantasyonu için özel admin yetki kontrolü
const swaggerAdminOnly = async (req, res, next) => {
    try {
        // Kullanıcı giriş yapmamışsa, login sayfasına yönlendir
        if (!req.user) {
            return res.redirect('/login?redirect=/api-docs');
        }

        // Kullanıcı admin rolüne sahipse, devam et
        if (req.user.role === 'admin') {
            return next();
        } else {
            // Kullanıcı giriş yapmış ama admin değilse, hata sayfası göster
            return res.status(403).render('pages/error', {
                title: 'Erişim Reddedildi',
                message: 'Swagger API dokümantasyonuna erişmek için admin yetkisine sahip olmanız gerekmektedir.',
                error: 'API dokümantasyonuna erişiminiz reddedildi.',
                status: 403,
                stack: process.env.NODE_ENV === 'production' ? '' : new Error().stack
            });
        }
    } catch (error) {
        return res.status(403).render('pages/error', {
            title: 'Hata',
            message: 'Yetkilendirme hatası: ' + error.message,
            error: 'Yetkilendirme işlemi sırasında bir hata oluştu.',
            status: 403,
            stack: process.env.NODE_ENV === 'production' ? '' : error.stack
        });
    }
};

module.exports = { auth, adminOnly, swaggerAdminOnly }; 