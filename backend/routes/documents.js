const express = require('express');
const { body, validationResult, query } = require('express-validator');
const auth = require('../middleware/auth');
const Document = require('../models/Document');

const router = express.Router();

// @route   GET /api/documents
// @desc    Get all documents with pagination and search
// @access  Private
router.get('/', [
    auth,
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isLength({ min: 1 }).withMessage('Search query must not be empty'),
    query('type').optional().isLength({ min: 1 }).withMessage('Document type must not be empty'),
    query('category').optional().isLength({ min: 1 }).withMessage('Category must not be empty'),
    query('client_id').optional().isMongoId().withMessage('Invalid client ID'),
    query('uploaded_by').optional().isMongoId().withMessage('Invalid uploader ID'),
    query('date_from').optional().isISO8601().withMessage('Invalid date format'),
    query('date_to').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            page = 1,
            limit = 10,
            search = '',
            type,
            category,
            client_id,
            uploaded_by,
            date_from,
            date_to
        } = req.query;

        // Build search query
        const searchQuery = {};
        
        if (search) {
            searchQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        // Add filters
        if (type) searchQuery.type = type;
        if (category) searchQuery.category = category;
        if (client_id) searchQuery.client_id = client_id;
        if (uploaded_by) searchQuery.uploaded_by = uploaded_by;

        // Date range filter
        if (date_from || date_to) {
            searchQuery.uploaded_at = {};
            if (date_from) searchQuery.uploaded_at.$gte = new Date(date_from);
            if (date_to) searchQuery.uploaded_at.$lte = new Date(date_to);
        }

        // Execute query
        const documents = await Document.find(searchQuery)
            .populate('client_id', 'name email phone')
            .populate('uploaded_by', 'fullName email')
            .populate('updated_by', 'fullName email')
            .sort({ uploaded_at: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Document.countDocuments(searchQuery);

        res.json({
            success: true,
            data: {
                documents,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching documents'
        });
    }
});

// @route   GET /api/documents/:id
// @desc    Get document by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate('client_id', 'name email phone type')
            .populate('uploaded_by', 'fullName email phone')
            .populate('updated_by', 'fullName email');

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        res.json({
            success: true,
            data: { document }
        });

    } catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching document'
        });
    }
});

// @route   POST /api/documents
// @desc    Create new document
// @access  Private
router.post('/', [
    auth,
    body('name').notEmpty().withMessage('Document name is required'),
    body('type').notEmpty().withMessage('Document type is required'),
    body('file_url').notEmpty().withMessage('File URL is required'),
    body('file_size').isNumeric().withMessage('File size must be a number'),
    body('client_id').optional().isMongoId().withMessage('Valid client ID is required'),
    body('category').optional().isLength({ max: 100 }).withMessage('Category must not exceed 100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const documentData = {
            ...req.body,
            uploaded_by: req.user.id,
            updated_by: req.user.id
        };

        const document = new Document(documentData);
        await document.save();

        // Populate the created document
        await document.populate([
            { path: 'client_id', select: 'name email phone type' },
            { path: 'uploaded_by', select: 'fullName email phone' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            data: { document }
        });

    } catch (error) {
        console.error('Create document error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while uploading document'
        });
    }
});

// @route   PUT /api/documents/:id
// @desc    Update document
// @access  Private
router.put('/:id', [
    auth,
    body('name').optional().notEmpty().withMessage('Document name cannot be empty'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('category').optional().isLength({ max: 100 }).withMessage('Category must not exceed 100 characters'),
    body('tags').optional().isArray().withMessage('Tags must be an array')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Update document
        Object.assign(document, req.body);
        document.updated_by = req.user.id;
        await document.save();

        // Populate the updated document
        await document.populate([
            { path: 'client_id', select: 'name email phone type' },
            { path: 'uploaded_by', select: 'fullName email phone' },
            { path: 'updated_by', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Document updated successfully',
            data: { document }
        });

    } catch (error) {
        console.error('Update document error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating document'
        });
    }
});

// @route   DELETE /api/documents/:id
// @desc    Delete document
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Check permissions (only uploader or admin can delete)
        if (document.uploaded_by.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own documents.'
            });
        }

        await Document.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Document deleted successfully'
        });

    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting document'
        });
    }
});

// @route   GET /api/documents/stats/overview
// @desc    Get document statistics overview
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
    try {
        const stats = await Document.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    totalSize: { $sum: '$file_size' },
                    avgSize: { $avg: '$file_size' }
                }
            }
        ]);

        const typeStats = await Document.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$file_size' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const categoryStats = await Document.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$file_size' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.json({
            success: true,
            data: {
                overview: stats[0] || {
                    total: 0,
                    totalSize: 0,
                    avgSize: 0
                },
                byType: typeStats,
                byCategory: categoryStats
            }
        });

    } catch (error) {
        console.error('Document stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching document statistics'
        });
    }
});

module.exports = router;