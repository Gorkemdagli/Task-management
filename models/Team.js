const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Takım adı zorunludur'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    avatar: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Takım oluşturulduğunda otomatik olarak sahibini de üye olarak ekler
teamSchema.pre('save', function(next) {
    // Eğer bu yeni bir takımsa (ilk kez oluşturuluyorsa)
    if (this.isNew) {
        const ownerId = this.owner.toString();
        
        // Eğer sahip henüz üyeler arasında yoksa
        if (!this.members.some(member => member.toString() === ownerId)) {
            this.members.push(this.owner);
        }
    }
    next();
});

// Üye ekleme metodu
teamSchema.methods.addMember = async function(userId) {
    const userIdStr = userId.toString();
    
    if (!this.members.some(member => member.toString() === userIdStr)) {
        this.members.push(userId);
        await this.save();
        return true;
    }
    return false;
};

// Üye çıkarma metodu
teamSchema.methods.removeMember = async function(userId) {
    const userIdStr = userId.toString();
    const initialLength = this.members.length;
    
    this.members = this.members.filter(member => member.toString() !== userIdStr);
    
    if (initialLength !== this.members.length) {
        await this.save();
        return true;
    }
    return false;
};

// Sahibini değiştirme metodu
teamSchema.methods.changeOwner = async function(newOwnerId) {
    this.owner = newOwnerId;
    
    // Yeni sahibi üye değilse, üye olarak ekle
    if (!this.members.some(member => member.toString() === newOwnerId.toString())) {
        this.members.push(newOwnerId);
    }
    
    await this.save();
    return this;
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Team:
 *       type: object
 *       required:
 *         - name
 *         - owner
 *       properties:
 *         _id:
 *           type: string
 *           description: Takım ID
 *         name:
 *           type: string
 *           description: Takım adı
 *         description:
 *           type: string
 *           description: Takım açıklaması
 *         owner:
 *           type: string
 *           description: Takım sahibinin kullanıcı ID'si
 *         members:
 *           type: array
 *           items:
 *             type: string
 *           description: Takım üyelerinin kullanıcı ID'leri
 *         avatar:
 *           type: string
 *           description: Takım profil fotoğrafı URL'si
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         name: "Geliştirme Takımı"
 *         description: "Proje geliştirme ekibi"
 *         owner: "60d0fe4f5311236168a109ca"
 *         members: ["60d0fe4f5311236168a109ca", "60d0fe4f5311236168a109cb"]
 *         avatar: "https://example.com/team-avatar.jpg"
 */

module.exports = mongoose.model('Team', teamSchema); 