/**
 * Client Controller
 * Handles client management operations
 */

const Client = require('../models/Client');
const Communication = require('../models/Communication');
const Task = require('../models/Task');

class ClientController {
    /**
     * Get all clients with pagination and filtering
     */
    async getClients(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                status = '',
                type = '',
                sortBy = 'created_at',
                sortOrder = 'desc'
            } = req.query;

            // Build query
            const query = {};
            
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ];
            }
            
            if (status) {
                query.status = status;
            }
            
            if (type) {
                query.type = type;
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Execute query with pagination
            const clients = await Client.find(query)
                .sort(sort)
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .populate('assigned_manager', 'username')
                .populate('assigned_executive', 'username');

            const total = await Client.countDocuments(query);

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
                message: 'Internal server error while fetching clients'
            });
        }
    }

    /**
     * Get client by ID
     */
    async getClientById(req, res) {
        try {
            const { id } = req.params;

            const client = await Client.findById(id)
                .populate('assigned_manager', 'username email')
                .populate('assigned_executive', 'username email');

            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
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
                message: 'Internal server error while fetching client'
            });
        }
    }

    /**
     * Create new client
     */
    async createClient(req, res) {
        try {
            const clientData = req.body;

            // Validate required fields
            if (!clientData.name || !clientData.email || !clientData.phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, email, and phone are required'
                });
            }

            // Check if client already exists
            const existingClient = await Client.findOne({
                $or: [
                    { email: clientData.email },
                    { phone: clientData.phone }
                ]
            });

            if (existingClient) {
                return res.status(400).json({
                    success: false,
                    message: 'Client already exists with this email or phone'
                });
            }

            // Set default values
            clientData.status = clientData.status || 'Active';
            clientData.client_since = clientData.client_since || new Date();
            clientData.risk_category = clientData.risk_category || 'Low';

            const client = new Client(clientData);
            await client.save();

            res.status(201).json({
                success: true,
                message: 'Client created successfully',
                data: { client }
            });

        } catch (error) {
            console.error('Create client error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while creating client'
            });
        }
    }

    /**
     * Update client
     */
    async updateClient(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const client = await Client.findById(id);
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            // Update client data
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    client[key] = updateData[key];
                }
            });

            client.updated_at = new Date();
            await client.save();

            res.json({
                success: true,
                message: 'Client updated successfully',
                data: { client }
            });

        } catch (error) {
            console.error('Update client error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while updating client'
            });
        }
    }

    /**
     * Delete client
     */
    async deleteClient(req, res) {
        try {
            const { id } = req.params;

            const client = await Client.findById(id);
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            // Check if client has associated data
            const hasCommunications = await Communication.countDocuments({ client_id: id });
            const hasTasks = await Task.countDocuments({ client: id });

            if (hasCommunications > 0 || hasTasks > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete client with associated communications or tasks'
                });
            }

            await Client.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Client deleted successfully'
            });

        } catch (error) {
            console.error('Delete client error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while deleting client'
            });
        }
    }

    /**
     * Get client communications
     */
    async getClientCommunications(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const communications = await Communication.find({ client_id: id })
                .populate('staff_id', 'username')
                .sort({ date: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Communication.countDocuments({ client_id: id });

            res.json({
                success: true,
                data: {
                    communications,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get client communications error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching client communications'
            });
        }
    }

    /**
     * Get client tasks
     */
    async getClientTasks(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const tasks = await Task.find({ client: id })
                .populate('assigned_to', 'username')
                .sort({ created_at: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Task.countDocuments({ client: id });

            res.json({
                success: true,
                data: {
                    tasks,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get client tasks error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching client tasks'
            });
        }
    }

    /**
     * Get client documents
     */
    async getClientDocuments(req, res) {
        try {
            const { id } = req.params;

            const client = await Client.findById(id).select('documents');
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            res.json({
                success: true,
                data: { documents: client.documents || [] }
            });

        } catch (error) {
            console.error('Get client documents error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching client documents'
            });
        }
    }

    /**
     * Add document to client
     */
    async addClientDocument(req, res) {
        try {
            const { id } = req.params;
            const documentData = req.body;

            const client = await Client.findById(id);
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            // Add document to client's documents array
            if (!client.documents) {
                client.documents = [];
            }

            client.documents.push({
                ...documentData,
                uploaded_date: new Date()
            });

            client.updated_at = new Date();
            await client.save();

            res.json({
                success: true,
                message: 'Document added successfully',
                data: { document: documentData }
            });

        } catch (error) {
            console.error('Add client document error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while adding document'
            });
        }
    }

    /**
     * Update client document
     */
    async updateClientDocument(req, res) {
        try {
            const { id, docId } = req.params;
            const updateData = req.body;

            const client = await Client.findById(id);
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            const document = client.documents.id(docId);
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Update document
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    document[key] = updateData[key];
                }
            });

            client.updated_at = new Date();
            await client.save();

            res.json({
                success: true,
                message: 'Document updated successfully',
                data: { document }
            });

        } catch (error) {
            console.error('Update client document error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while updating document'
            });
        }
    }

    /**
     * Delete client document
     */
    async deleteClientDocument(req, res) {
        try {
            const { id, docId } = req.params;

            const client = await Client.findById(id);
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            const document = client.documents.id(docId);
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            document.remove();
            client.updated_at = new Date();
            await client.save();

            res.json({
                success: true,
                message: 'Document deleted successfully'
            });

        } catch (error) {
            console.error('Delete client document error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while deleting document'
            });
        }
    }

    /**
     * Get client compliance calendar
     */
    async getClientCompliance(req, res) {
        try {
            const { id } = req.params;

            const client = await Client.findById(id).select('compliance_calendar');
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            res.json({
                success: true,
                data: { compliance: client.compliance_calendar || [] }
            });

        } catch (error) {
            console.error('Get client compliance error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching compliance data'
            });
        }
    }

    /**
     * Update client compliance
     */
    async updateClientCompliance(req, res) {
        try {
            const { id } = req.params;
            const complianceData = req.body;

            const client = await Client.findById(id);
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            // Update compliance calendar
            if (complianceData.compliance_calendar) {
                client.compliance_calendar = complianceData.compliance_calendar;
            }

            client.updated_at = new Date();
            await client.save();

            res.json({
                success: true,
                message: 'Compliance data updated successfully',
                data: { compliance: client.compliance_calendar }
            });

        } catch (error) {
            console.error('Update client compliance error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while updating compliance data'
            });
        }
    }

    /**
     * Get client statistics
     */
    async getClientStats(req, res) {
        try {
            const { id } = req.params;

            const [
                totalCommunications,
                totalTasks,
                completedTasks,
                client
            ] = await Promise.all([
                Communication.countDocuments({ client_id: id }),
                Task.countDocuments({ client: id }),
                Task.countDocuments({ client: id, status: 'Completed' }),
                Client.findById(id).select('satisfaction_rating risk_category status')
            ]);

            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            res.json({
                success: true,
                data: {
                    totalCommunications,
                    totalTasks,
                    completedTasks,
                    taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                    satisfactionRating: client.satisfaction_rating,
                    riskCategory: client.risk_category,
                    status: client.status
                }
            });

        } catch (error) {
            console.error('Get client stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching client statistics'
            });
        }
    }

    /**
     * Search clients
     */
    async searchClients(req, res) {
        try {
            const { q } = req.query;

            if (!q || q.length < 2) {
                return res.json({
                    success: true,
                    data: { clients: [] }
                });
            }

            const clients = await Client.find({
                $or: [
                    { name: { $regex: q, $options: 'i' } },
                    { email: { $regex: q, $options: 'i' } },
                    { phone: { $regex: q, $options: 'i' } }
                ]
            })
            .select('name email phone status')
            .limit(10);

            res.json({
                success: true,
                data: { clients }
            });

        } catch (error) {
            console.error('Search clients error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while searching clients'
            });
        }
    }
}

module.exports = new ClientController();