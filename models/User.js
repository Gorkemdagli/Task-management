const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Kullanıcı adı zorunludur'],
        unique: true,
        trim: true,
        minlength: [3, 'Kullanıcı adı en az 3 karakter olmalıdır']
    },
    email: {
        type: String,
        required: [true, 'E-posta adresi zorunludur'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Geçerli bir e-posta adresi giriniz']
    },
    password: {
        type: String,
        required: [true, 'Şifre zorunludur'],
        minlength: [6, 'Şifre en az 6 karakter olmalıdır']
    },
    name: {
        type: String,
        required: [true, 'Ad Soyad zorunludur']
    },
    avatar: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    teams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }]
}, {
    timestamps: true
});

// Şifre hashleme middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Şifre karşılaştırma metodu
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// JWT token oluşturma
userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { _id: this._id.toString() },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' }
    );
};

// JSON dönüşümünde şifreyi hariç tut
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: Kullanıcı ID
 *         username:
 *           type: string
 *           description: Kullanıcı adı
 *         email:
 *           type: string
 *           format: email
 *           description: Kullanıcı e-posta adresi
 *         password:
 *           type: string
 *           format: password
 *           description: Kullanıcı şifresi (API yanıtlarında dönmez)
 *         name:
 *           type: string
 *           description: Kullanıcının adı soyadı
 *         avatar:
 *           type: string
 *           description: Kullanıcı profil fotoğrafı URL'si
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: Kullanıcı rolü
 *         teams:
 *           type: array
 *           items:
 *             type: string
 *           description: Kullanıcının üye olduğu takımların ID'leri
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         username: "johndoe"
 *         email: "john@example.com"
 *         name: "John Doe"
 *         role: "user"
 *         teams: ["60d0fe4f5311236168a109cb"]
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *     UserRegister:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - name
 *       properties:
 *         username:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *         name:
 *           type: string
 */

module.exports = mongoose.model('User', userSchema); 