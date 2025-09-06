/**
 * Document Controller
 * Handles document management operations
 */

const Document = require('../models/Document');
const Client = require('../models/Client');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/documents';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, documents, and archives are allowed.'));
        }
    }
});

class DocumentController {
    /**
     * Get all documents with pagination and filtering
     */
    async getDocuments(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                type = '',
                client_id = '',
                uploaded_by = '',
                start_date = '',
                end_date = '',
                sortBy = 'uploaded_date',
                sortOrder = 'desc'
            } = req.query;

            // Build query
            const query = {};
            
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search, 'i')] } }
                ];
            }
            
            if (type) query.type = type;
            if (client_id) query.client = client_id;
            if (uploaded_by) query.uploaded_by = uploaded_by;

            // Date range filter
            if (start_date || end_date) {
                query.uploaded_date = {};
                if (start_date) query.uploaded_date.$gte = new Date(start_date);
                if (end_date) query.uploaded_date.$lte = new Date(end_date);
            }

            // Role-based filtering
            const userRole = req.user.role;
            if (userRole === 'manager') {
                // Managers can see documents from their team's clients
                const teamMembers = await User.find({ reporting_manager: req.user.userId }).select('_id');
                const teamMemberIds = teamMembers.map(member => member._id);
                query.$or = [
                    { uploaded_by: { $in: teamMemberIds } },
                    { 'access_permissions.user_id': { $in: teamMemberIds } }
                ];
            } else if (userRole === 'executive') {
                // Executives can see documents they uploaded or have access to
                query.$or = [
                    { uploaded_by: req.user.userId },
                    { 'access_permissions.user_id': req.user.userId }
                ];
            } else if (userRole === 'staff') {
                // Staff can see documents they uploaded or have access to
                query.$or = [
                    { uploaded_by: req.user.userId },
                    { 'access_permissions.user_id': req.user.userId }
                ];
            } else if (userRole === 'client') {
                // Clients can see documents related to them
                query.client = req.user.userId;
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Execute query with pagination
            const documents = await Document.find(query)
                .populate('client', 'name email phone')
                .populate('uploaded_by', 'username email')
                .sort(sort)
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Document.countDocuments(query);

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
                message: 'Internal server error while fetching documents'
            });
        }
    }

    /**
     * Get document by ID
     */
    async getDocumentById(req, res) {
        try {
            const { id } = req.params;

            const document = await Document.findById(id)
                .populate('client', 'name email phone')
                .populate('uploaded_by', 'username email')
                .populate('access_permissions.user_id', 'username email');

            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Check access permissions
            const userRole = req.user.role;
            const hasAccess = this.checkDocumentAccess(document, req.user.userId, userRole);
            
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
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
                message: 'Internal server error while fetching document'
            });
        }
    }

    /**
     * Upload document
     */
    async uploadDocument(req, res) {
        try {
            const uploadSingle = upload.single('file');
            
            uploadSingle(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }

                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: 'No file uploaded'
                    });
                }

                const { name, type, client, tags, expiry_date, description } = req.body;

                // Verify client exists if provided
                if (client) {
                    const clientExists = await Client.findById(client);
                    if (!clientExists) {
                        // Delete uploaded file
                        fs.unlinkSync(req.file.path);
                        return res.status(404).json({
                            success: false,
                            message: 'Client not found'
                        });
                    }
                }

                // Create document record
                const document = new Document({
                    name: name || req.file.originalname,
                    type: type || 'Other',
                    url: req.file.path,
                    client: client || null,
                    uploaded_by: req.user.userId,
                    tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
                    expiry_date: expiry_date ? new Date(expiry_date) : null,
                    description: description || '',
                    access_permissions: [{
                        user_id: req.user.userId,
                        role: 'owner'
                    }]
                });

                await document.save();

                // Populate the created document
                await document.populate([
                    { path: 'client', select: 'name email phone' },
                    { path: 'uploaded_by', select: 'username email' }
                ]);

                res.status(201).json({
                    success: true,
                    message: 'Document uploaded successfully',
                    data: { document }
                });
            });

        } catch (error) {
            console.error('Upload document error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while uploading document'
            });
        }
    }

    /**
     * Update document
     */
    async updateDocument(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const document = await Document.findById(id);
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Check access permissions
            const userRole = req.user.role;
            const hasAccess = this.checkDocumentAccess(document, req.user.userId, userRole);
            
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Update document data
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    document[key] = updateData[key];
                }
            });

            document.updated_at = new Date();
            await document.save();

            // Populate the updated document
            await document.populate([
                { path: 'client', select: 'name email phone' },
                { path: 'uploaded_by', select: 'username email' }
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
                message: 'Internal server error while updating document'
            });
        }
    }

    /**
     * Delete document
     */
    async deleteDocument(req, res) {
        try {
            const { id } = req.params;

            const document = await Document.findById(id);
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Check access permissions
            const userRole = req.user.role;
            const hasAccess = this.checkDocumentAccess(document, req.user.userId, userRole);
            
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Delete file from filesystem
            if (fs.existsSync(document.url)) {
                fs.unlinkSync(document.url);
            }

            await Document.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Document deleted successfully'
            });

        } catch (error) {
            console.error('Delete document error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while deleting document'
            });
        }
    }

    /**
     * Download document
     */
    async downloadDocument(req, res) {
        try {
            const { id } = req.params;

            const document = await Document.findById(id);
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Check access permissions
            const userRole = req.user.role;
            const hasAccess = this.checkDocumentAccess(document, req.user.userId, userRole);
            
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Check if file exists
            if (!fs.existsSync(document.url)) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found on server'
                });
            }

            // Set appropriate headers
            res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
            res.setHeader('Content-Type', 'application/octet-stream');

            // Stream the file
            const fileStream = fs.createReadStream(document.url);
            fileStream.pipe(res);

        } catch (error) {
            console.error('Download document error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while downloading document'
            });
        }
    }

    /**
     * Share document
     */
    async shareDocument(req, res) {
        try {
            const { id } = req.params;
            const { user_id, role = 'viewer', expiry_date } = req.body;

            const document = await Document.findById(id);
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Check if user has permission to share
            const userRole = req.user.role;
            const hasAccess = this.checkDocumentAccess(document, req.user.userId, userRole);
            
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Verify user exists
            const user = await User.findById(user_id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Check if permission already exists
            const existingPermission = document.access_permissions.find(
                perm => perm.user_id.toString() === user_id
            );

            if (existingPermission) {
                existingPermission.role = role;
                if (expiry_date) {
                    existingPermission.expiry_date = new Date(expiry_date);
                }
            } else {
                document.access_permissions.push({
                    user_id: user_id,
                    role: role,
                    expiry_date: expiry_date ? new Date(expiry_date) : null
                });
            }

            await document.save();

            res.json({
                success: true,
                message: 'Document shared successfully'
            });

        } catch (error) {
            console.error('Share document error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while sharing document'
            });
        }
    }

    /**
     * Archive document
     */
    async archiveDocument(req, res) {
        try {
            const { id } = req.params;

            const document = await Document.findById(id);
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Check access permissions
            const userRole = req.user.role;
            const hasAccess = this.checkDocumentAccess(document, req.user.userId, userRole);
            
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            document.is_archived = true;
            document.updated_at = new Date();
            await document.save();

            res.json({
                success: true,
                message: 'Document archived successfully'
            });

        } catch (error) {
            console.error('Archive document error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while archiving document'
            });
        }
    }

    /**
     * Get document statistics
     */
    async getDocumentStats(req, res) {
        try {
            const { period = '30' } = req.query;
            const userId = req.user.userId;
            const userRole = req.user.role;

            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(period));

            // Build query based on user role
            let query = { uploaded_date: { $gte: startDate, $lte: endDate } };
            
            if (userRole === 'manager') {
                const teamMembers = await User.find({ reporting_manager: userId }).select('_id');
                const teamMemberIds = teamMembers.map(member => member._id);
                query.$or = [
                    { uploaded_by: { $in: teamMemberIds } },
                    { 'access_permissions.user_id': { $in: teamMemberIds } }
                ];
            } else if (userRole === 'executive' || userRole === 'staff') {
                query.$or = [
                    { uploaded_by: userId },
                    { 'access_permissions.user_id': userId }
                ];
            } else if (userRole === 'client') {
                query.client = userId;
            }

            const [
                totalDocuments,
                documentsByType,
                documentsByClient,
                recentUploads
            ] = await Promise.all([
                Document.countDocuments(query),
                Document.aggregate([
                    { $match: query },
                    { $group: { _id: '$type', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]),
                Document.aggregate([
                    { $match: query },
                    { $group: { _id: '$client', count: { $sum: 1 } } },
                    { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
                    { $unwind: '$client' },
                    { $project: { client: '$client.name', count: 1 } },
                    { $sort: { count: -1 } }
                ]),
                Document.find(query)
                    .populate('client', 'name')
                    .populate('uploaded_by', 'username')
                    .sort({ uploaded_date: -1 })
                    .limit(5)
            ]);

            res.json({
                success: true,
                data: {
                    totalDocuments,
                    documentsByType: documentsByType.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {}),
                    documentsByClient,
                    recentUploads
                }
            });

        } catch (error) {
            console.error('Get document stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching document statistics'
            });
        }
    }

    /**
     * Check document access permissions
     */
    checkDocumentAccess(document, userId, userRole) {
        // Admin has access to all documents
        if (userRole === 'admin') {
            return true;
        }

        // Owner has access
        if (document.uploaded_by.toString() === userId) {
            return true;
        }

        // Check access permissions
        const hasPermission = document.access_permissions.some(perm => 
            perm.user_id.toString() === userId
        );

        return hasPermission;
    }
}

module.exports = new DocumentController();