const express = require('express');
const { body, validationResult, query } = require('express-validator');
const auth = require('../middleware/auth');
const Client = require('../models/Client');

const router = express.Router();

// @route   GET /api/clients
// @desc    Get all clients with pagination and search
// @access  Private
router.get('/', [
    auth,
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isLength({ min: 1 }).withMessage('Search query must not be empty'),
    query('status').optional().isIn(['Active', 'Inactive', 'Prospect', 'Suspended']).withMessage('Invalid status'),
    query('type').optional().isIn(['Individual', 'Sole Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Public Limited', 'Trust', 'Society']).withMessage('Invalid type'),
    query('risk_category').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid risk category'),
    query('sortBy').optional().isIn(['name', 'email', 'phone', 'client_since', 'satisfaction_rating']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
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
            status,
            type,
            risk_category,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Build search query
        const searchQuery = {};
        
        if (search) {
            searchQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { pan: { $regex: search, $options: 'i' } },
                { gstin: { $regex: search, $options: 'i' } }
            ];
        }

        // Add filters
        if (status) searchQuery.status = status;
        if (type) searchQuery.type = type;
        if (risk_category) searchQuery.risk_category = risk_category;

        // Role-based filtering
        const userRole = req.user.role;
        if (userRole === 'manager') {
            searchQuery.assigned_manager = req.user.id;
        } else if (userRole === 'executive') {
            searchQuery.assigned_executive = req.user.id;
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query
        const clients = await Client.find(searchQuery)
            .populate('assigned_manager', 'fullName email phone')
            .populate('assigned_executive', 'fullName email phone')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Client.countDocuments(searchQuery);

        res.json({
            success: true,
            data: {
                clients,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching clients'
        });
    }
});

// @route   GET /api/clients/:id
// @desc    Get client by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const client = await Client.findById(req.params.id)
            .populate('assigned_manager', 'fullName email phone designation')
            .populate('assigned_executive', 'fullName email phone designation')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email');

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Check access permissions
        const userRole = req.user.role;
        if (userRole === 'manager' && client.assigned_manager?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        if (userRole === 'executive' && client.assigned_executive?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: { client }
        });

    } catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching client'
        });
    }
});

// @route   POST /api/clients
// @desc    Create new client
// @access  Private
router.post('/', [
    auth,
    body('name').notEmpty().withMessage('Client name is required'),
    body('type').isIn(['Individual', 'Sole Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Public Limited', 'Trust', 'Society']).withMessage('Invalid client type'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid phone number is required'),
    body('pan').optional().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN format'),
    body('gstin').optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[Z]{1}[0-9A-Z]{1}$/).withMessage('Invalid GSTIN format'),
    body('aadhaar').optional().matches(/^[2-9]{1}[0-9]{11}$/).withMessage('Invalid Aadhaar format')
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

        const clientData = {
            ...req.body,
            createdBy: req.user.id
        };

        // Check for duplicate email
        const existingClient = await Client.findOne({ email: clientData.email });
        if (existingClient) {
            return res.status(400).json({
                success: false,
                message: 'Client with this email already exists'
            });
        }

        const client = new Client(clientData);
        await client.save();

        // Populate the created client
        await client.populate([
            { path: 'assigned_manager', select: 'fullName email phone' },
            { path: 'assigned_executive', select: 'fullName email phone' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Client created successfully',
            data: { client }
        });

    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating client'
        });
    }
});

// @route   PUT /api/clients/:id
// @desc    Update client
// @access  Private
router.put('/:id', [
    auth,
    body('name').optional().notEmpty().withMessage('Client name cannot be empty'),
    body('type').optional().isIn(['Individual', 'Sole Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Public Limited', 'Trust', 'Society']).withMessage('Invalid client type'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Valid phone number is required'),
    body('pan').optional().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN format'),
    body('gstin').optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[Z]{1}[0-9A-Z]{1}$/).withMessage('Invalid GSTIN format'),
    body('aadhaar').optional().matches(/^[2-9]{1}[0-9]{11}$/).withMessage('Invalid Aadhaar format')
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

        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Check access permissions
        const userRole = req.user.role;
        if (userRole === 'manager' && client.assigned_manager?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        if (userRole === 'executive' && client.assigned_executive?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check for duplicate email if email is being updated
        if (req.body.email && req.body.email !== client.email) {
            const existingClient = await Client.findOne({ email: req.body.email });
            if (existingClient) {
                return res.status(400).json({
                    success: false,
                    message: 'Client with this email already exists'
                });
            }
        }

        // Update client
        Object.assign(client, req.body);
        client.updatedBy = req.user.id;
        await client.save();

        // Populate the updated client
        await client.populate([
            { path: 'assigned_manager', select: 'fullName email phone' },
            { path: 'assigned_executive', select: 'fullName email phone' },
            { path: 'updatedBy', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Client updated successfully',
            data: { client }
        });

    } catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating client'
        });
    }
});

// @route   DELETE /api/clients/:id
// @desc    Delete client
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        await Client.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Client deleted successfully'
        });

    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting client'
        });
    }
});

// @route   POST /api/clients/:id/services
// @desc    Add service to client
// @access  Private
router.post('/:id/services', [
    auth,
    body('service_name').notEmpty().withMessage('Service name is required'),
    body('fee_structure').notEmpty().withMessage('Fee structure is required'),
    body('start_date').isISO8601().withMessage('Valid start date is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Check access permissions
        const userRole = req.user.role;
        if (userRole === 'manager' && client.assigned_manager?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        if (userRole === 'executive' && client.assigned_executive?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const serviceData = {
            service_id: require('crypto').randomUUID(),
            ...req.body
        };

        await client.addService(serviceData);

        res.json({
            success: true,
            message: 'Service added successfully',
            data: { service: serviceData }
        });

    } catch (error) {
        console.error('Add service error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while adding service'
        });
    }
});

// @route   PUT /api/clients/:id/services/:serviceId
// @desc    Update client service
// @access  Private
router.put('/:id/services/:serviceId', [
    auth,
    body('service_name').optional().notEmpty().withMessage('Service name cannot be empty'),
    body('fee_structure').optional().notEmpty().withMessage('Fee structure cannot be empty'),
    body('status').optional().isIn(['Active', 'Inactive', 'Suspended']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Check access permissions
        const userRole = req.user.role;
        if (userRole === 'manager' && client.assigned_manager?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        if (userRole === 'executive' && client.assigned_executive?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await client.updateService(req.params.serviceId, req.body);

        res.json({
            success: true,
            message: 'Service updated successfully'
        });

    } catch (error) {
        console.error('Update service error:', error);
        if (error.message === 'Service not found') {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error while updating service'
        });
    }
});

// @route   DELETE /api/clients/:id/services/:serviceId
// @desc    Remove service from client
// @access  Private
router.delete('/:id/services/:serviceId', auth, async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Check access permissions
        const userRole = req.user.role;
        if (userRole === 'manager' && client.assigned_manager?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        if (userRole === 'executive' && client.assigned_executive?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await client.removeService(req.params.serviceId);

        res.json({
            success: true,
            message: 'Service removed successfully'
        });

    } catch (error) {
        console.error('Remove service error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while removing service'
        });
    }
});

// @route   GET /api/clients/stats/overview
// @desc    Get client statistics overview
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
    try {
        const stats = await Client.getClientStats();
        const byType = await Client.getClientsByType();
        const byRisk = await Client.getClientsByRisk();

        res.json({
            success: true,
            data: {
                overview: stats,
                byType,
                byRisk
            }
        });

    } catch (error) {
        console.error('Client stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching client statistics'
        });
    }
});

module.exports = router;