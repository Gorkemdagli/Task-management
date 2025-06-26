/**
 * Hata yönetimi middleware'i
 * Uygulama genelinde oluşan hataları yakalayıp uygun şekilde göstermek için kullanılır.
 */

// Hata kodlarına göre açıklamalar
const errorMessages = {
    400: 'Geçersiz istek. Lütfen bilgilerinizi kontrol edip tekrar deneyin.',
    401: 'Oturum açmanız gerekiyor. Lütfen giriş yapın.',
    403: 'Bu işlemi gerçekleştirmek için yetkiniz bulunmuyor.',
    404: 'Aradığınız sayfa veya kaynak bulunamadı.',
    422: 'İşlenemeyen varlık. Gönderdiğiniz veriler doğrulanamadı.',
    429: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.',
    500: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
    503: 'Servis şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.'
};

/**
 * Global hata yakalama middleware'i
 */
const errorHandler = (err, req, res, next) => {
    // Sadece gerçek hataları (500 ve bazı özel durumlarda) konsola yaz
    if (err.statusCode === 500 || !err.statusCode) {
        console.error('Ciddi hata oluştu:', err);
    }
    
    // Hata kodunu belirle (varsayılan 500)
    const statusCode = err.statusCode || err.status || 500;
    
    // JSON API yanıtı mı yoksa HTML sayfası mı isteniyor?
    // Content-Type veya accepts header'a bakarak veya URL'e bakarak karar ver
    // Kesin bir şekilde /api/ ile başlayan PATH'ler API isteği olarak değerlendirilir
    const isApiRequest = 
        (req.path.startsWith('/api/')) || 
        (req.get('Accept') && req.accepts('json') && !req.accepts('html')) ||
        (req.xhr);
    
    if (isApiRequest) {
        // API isteği için JSON yanıtı
        return res.status(statusCode).json({
            error: {
                message: err.message || errorMessages[statusCode] || 'Bir hata oluştu',
                status: statusCode,
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
            }
        });
    } else {
        // Normal sayfa isteği için hata sayfasına yönlendir
        return res.status(statusCode).render('pages/error', {
            title: `Hata ${statusCode}`,
            error: err.message || errorMessages[statusCode] || 'Bir hata oluştu',
            status: statusCode,
            stack: process.env.NODE_ENV === 'development' ? err.stack : null,
            user: req.user || null,
            script: ''
        });
    }
};

/**
 * 404 Bulunamadı hatası middleware'i
 * Hiçbir route tarafından işlenmeyen istekleri yakalar
 */
const notFoundHandler = (req, res, next) => {
    const error = new Error(errorMessages[404] || 'Sayfa Bulunamadı');
    error.statusCode = 404;
    next(error);
};

module.exports = { errorHandler, notFoundHandler }; 