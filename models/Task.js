const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Görev başlığı zorunludur'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['todo', 'doing', 'done'],
        default: 'todo'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    assignees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    dueDate: {
        type: Date
    },
    views: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Görüntülenme sayısını artırma metodu
taskSchema.methods.incrementViews = async function() {
    this.views += 1;
    await this.save();
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - creator
 *         - team
 *       properties:
 *         _id:
 *           type: string
 *           description: Görev ID
 *         title:
 *           type: string
 *           description: Görev başlığı
 *         description:
 *           type: string
 *           description: Görev açıklaması
 *         status:
 *           type: string
 *           enum: [todo, doing, done]
 *           description: Görev durumu
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           description: Görev önceliği
 *         assignees:
 *           type: array
 *           items:
 *             type: string
 *           description: Göreve atanan kullanıcıların ID'leri
 *         creator:
 *           type: string
 *           description: Görevi oluşturan kullanıcının ID'si
 *         team:
 *           type: string
 *           description: Görevin ait olduğu takımın ID'si
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Görevin son teslim tarihi
 *         views:
 *           type: integer
 *           description: Görevin görüntülenme sayısı
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         title: "API Geliştirmesi"
 *         description: "REST API endpoint'lerinin geliştirilmesi"
 *         status: "doing"
 *         priority: "high"
 *         assignees: ["60d0fe4f5311236168a109ca"]
 *         creator: "60d0fe4f5311236168a109ca"
 *         team: "60d0fe4f5311236168a109cb"
 *         dueDate: "2023-12-31T23:59:59Z"
 */

module.exports = mongoose.model('Task', taskSchema); 